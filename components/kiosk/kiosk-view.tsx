"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { KioskHeader } from "./kiosk-header";
import { KioskRoomGrid } from "./kiosk-room-grid";
import { KioskRoomCard } from "./kiosk-room-card";
import { KioskControls } from "./kiosk-controls";
import { fetchMeetingRooms, fetchMeetings } from "@/lib/api";
import type { MeetingRoom, Meeting } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { FullscreenPrompt } from "./fullscreen-prompt";

// Liste des noms de salles à afficher
const ALLOWED_ROOM_NAMES = [
  "Cronstadt-Box-droite",
  "Cronstadt-Box-gauche",
  "Cronstadt-Salle-de-reunion-bas-MTR",
  "Cronstadt-Salle-de-reunion-Haut",
];

interface RoomWithStatus extends MeetingRoom {
  isOccupied: boolean;
  currentMeeting?: Meeting;
}

export function KioskView() {
  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [roomsWithStatus, setRoomsWithStatus] = useState<RoomWithStatus[]>([]);
  const [displayMode, setDisplayMode] = useState<"occupied" | "available">(
    "occupied"
  );
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const modeChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const roomChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Configuration des intervalles
  const [occupiedRoomInterval, setOccupiedRoomInterval] = useState(10);
  const [availableRoomInterval, setAvailableRoomInterval] = useState(15);
  const [modeChangeInterval, setModeChangeInterval] = useState(45);
  const [autoRotate, setAutoRotate] = useState(true);

  // Fonction pour récupérer les salles côté client
  const fetchRoomsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Récupération des salles côté client...");
      const roomsData = await fetchMeetingRooms();
      console.log(`${roomsData.length} salles récupérées via API`);

      // Filtrer les salles autorisées
      const filteredRooms = roomsData.filter((room) =>
        ALLOWED_ROOM_NAMES.some((allowedName) =>
          room.name.includes(allowedName)
        )
      );

      console.log(
        `${filteredRooms.length} salles après filtrage:`,
        filteredRooms
      );
      setRooms(filteredRooms);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Erreur lors de la récupération des salles:", err);
      setError(
        "Impossible de charger les données des salles. Veuillez réessayer."
      );
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les données au montage
  useEffect(() => {
    fetchRoomsData();
  }, [fetchRoomsData]);

  // Récupérer le statut d'occupation des salles
  useEffect(() => {
    const fetchOccupancyStatus = async () => {
      if (rooms.length === 0) return;

      try {
        const roomsWithOccupancyStatus = await Promise.all(
          rooms.map(async (room) => {
            try {
              const meetings = await fetchMeetings(room.id);
              const now = new Date();

              const currentMeeting = meetings.find((meeting) => {
                const start = new Date(meeting.startTime);
                const end = new Date(meeting.endTime);
                return start <= now && end >= now;
              });

              const isOccupied = currentMeeting !== undefined;

              return {
                ...room,
                isOccupied,
                currentMeeting,
              };
            } catch (error) {
              console.error(
                `Erreur lors de la récupération des réunions pour ${room.name}:`,
                error
              );
              return {
                ...room,
                isOccupied: false,
              };
            }
          })
        );

        const sorted = [...roomsWithOccupancyStatus].sort((a, b) => {
          if (a.isOccupied && !b.isOccupied) return -1;
          if (!a.isOccupied && b.isOccupied) return 1;
          return 0;
        });

        setRoomsWithStatus(sorted);
      } catch (error) {
        console.error("Erreur lors du tri des salles:", error);
        setRoomsWithStatus(
          rooms.map((room) => ({ ...room, isOccupied: false }))
        );
      }
    };

    fetchOccupancyStatus();
    const interval = setInterval(fetchOccupancyStatus, 60 * 1000);
    return () => clearInterval(interval);
  }, [rooms]);

  // Fonction pour rafraîchir les données
  const refreshData = useCallback(async () => {
    await fetchRoomsData();
  }, [fetchRoomsData]);

  // Fonction pour activer/désactiver le mode plein écran
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
          if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
          }
          controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
          }, 3000);
        })
        .catch((err) => {
          console.warn(`Plein écran non disponible: ${err.message}`);
        });
    } else {
      if (document.exitFullscreen) {
        document
          .exitFullscreen()
          .then(() => {
            setIsFullscreen(false);
            setShowControls(true);
          })
          .catch((err) => {
            console.warn(
              `Erreur lors de la sortie du plein écran: ${err.message}`
            );
          });
      }
    }
  }, []);

  // Alternance entre modes
  useEffect(() => {
    if (!autoRotate) return;

    if (modeChangeTimeoutRef.current) {
      clearTimeout(modeChangeTimeoutRef.current);
    }

    modeChangeTimeoutRef.current = setTimeout(() => {
      setDisplayMode((prev) =>
        prev === "occupied" ? "available" : "occupied"
      );
      setCurrentRoomIndex(0);
    }, modeChangeInterval * 1000);

    return () => {
      if (modeChangeTimeoutRef.current) {
        clearTimeout(modeChangeTimeoutRef.current);
      }
    };
  }, [displayMode, modeChangeInterval, autoRotate]);

  // Rotation entre salles
  useEffect(() => {
    if (!autoRotate) return;

    const currentModeRooms = roomsWithStatus.filter((room) =>
      displayMode === "occupied" ? room.isOccupied : !room.isOccupied
    );

    if (currentModeRooms.length <= 1) return;

    if (roomChangeTimeoutRef.current) {
      clearTimeout(roomChangeTimeoutRef.current);
    }

    const interval =
      displayMode === "occupied"
        ? occupiedRoomInterval * 1000
        : availableRoomInterval * 1000;

    roomChangeTimeoutRef.current = setTimeout(() => {
      setCurrentRoomIndex((prev) => (prev + 1) % currentModeRooms.length);
    }, interval);

    return () => {
      if (roomChangeTimeoutRef.current) {
        clearTimeout(roomChangeTimeoutRef.current);
      }
    };
  }, [
    displayMode,
    roomsWithStatus,
    currentRoomIndex,
    occupiedRoomInterval,
    availableRoomInterval,
    autoRotate,
  ]);

  // Rafraîchir les données toutes les 2 minutes
  useEffect(() => {
    const interval = setInterval(refreshData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshData]);

  // Afficher les contrôles lorsque la souris bouge
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);

      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }

      if (isFullscreen) {
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isFullscreen]);

  // Filtrer les salles selon le mode d'affichage actuel
  const occupiedRooms = roomsWithStatus.filter((room) => room.isOccupied);
  const availableRooms = roomsWithStatus.filter((room) => !room.isOccupied);

  // Déterminer quelle salle afficher en grand
  const currentModeRooms =
    displayMode === "occupied" ? occupiedRooms : availableRooms;
  const currentRoom = currentModeRooms[currentRoomIndex] || null;

  return (
    <div className="flex flex-col h-screen bg-black">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{ display: "flex", flexDirection: "column", height: "100%" }}
      >
        <KioskHeader lastUpdated={lastUpdated} />

        <div className="flex-1 overflow-hidden p-6">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto"></div>
                <p className="text-white text-xl">Chargement des salles...</p>
              </div>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-4">
                <p className="text-red-400 text-xl">{error}</p>
                <button
                  onClick={refreshData}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Réessayer
                </button>
              </div>
            </div>
          ) : rooms.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-4">
                <p className="text-yellow-400 text-xl">
                  Aucune salle disponible
                </p>
                <p className="text-gray-400">
                  Vérifiez votre connexion ou les permissions
                </p>
                <button
                  onClick={refreshData}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Actualiser
                </button>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {currentRoom ? (
                <motion.div
                  key={`${displayMode}-${currentRoom.id}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.8, type: "spring" }}
                  className="h-full"
                >
                  <KioskRoomCard room={currentRoom} fullscreen={true} />
                </motion.div>
              ) : (
                <motion.div
                  key="all-rooms"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="h-full"
                >
                  <KioskRoomGrid rooms={roomsWithStatus} loading={loading} />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {showControls && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ duration: 0.3 }}
          >
            <KioskControls
              isFullscreen={isFullscreen}
              toggleFullscreen={toggleFullscreen}
              autoRotate={autoRotate}
              setAutoRotate={setAutoRotate}
              rotationInterval={
                displayMode === "occupied"
                  ? occupiedRoomInterval
                  : availableRoomInterval
              }
              setRotationInterval={() => {}}
              occupiedRoomInterval={occupiedRoomInterval}
              setOccupiedRoomInterval={setOccupiedRoomInterval}
              availableRoomInterval={availableRoomInterval}
              setAvailableRoomInterval={setAvailableRoomInterval}
              modeChangeInterval={modeChangeInterval}
              setModeChangeInterval={setModeChangeInterval}
              currentDisplayMode={displayMode}
              occupiedRoomsCount={occupiedRooms.length}
              availableRoomsCount={availableRooms.length}
              currentPage={0}
              totalPages={1}
              nextPage={() => {}}
              prevPage={() => {}}
              refreshData={refreshData}
              loading={loading}
            />
          </motion.div>
        )}
      </motion.div>
      <FullscreenPrompt onRequestFullscreen={toggleFullscreen} />
    </div>
  );
}
