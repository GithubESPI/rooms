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

interface KioskViewProps {
  initialRooms: MeetingRoom[];
}

interface RoomWithStatus extends MeetingRoom {
  isOccupied: boolean;
  currentMeeting?: Meeting;
}

export function KioskView({ initialRooms }: KioskViewProps) {
  // Filtrer les salles initiales
  const filteredInitialRooms = initialRooms.filter((room) =>
    ALLOWED_ROOM_NAMES.some((allowedName) => room.name.includes(allowedName))
  );

  const [rooms, setRooms] = useState<MeetingRoom[]>(filteredInitialRooms);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [roomsWithStatus, setRoomsWithStatus] = useState<RoomWithStatus[]>([]);
  const [displayMode, setDisplayMode] = useState<"occupied" | "available">(
    "occupied"
  );
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const modeChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const roomChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Supprimer l'activation automatique du plein écran au chargement
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     if (!document.fullscreenElement) {
  //       document.documentElement.requestFullscreen().catch((err) => {
  //         console.error(
  //           `Erreur lors du passage en plein écran: ${err.message}`
  //         );
  //       });
  //       setIsFullscreen(true);
  //       // Masquer les contrôles après 3 secondes en plein écran
  //       setTimeout(() => {
  //         setShowControls(false);
  //       }, 3000);
  //     }
  //   }, 1000); // Délai d'une seconde pour permettre le chargement complet

  //   return () => clearTimeout(timer);
  // }, []);

  // Ajouter un message d'information pour le plein écran
  useEffect(() => {
    // Afficher un message pour informer l'utilisateur
    const timer = setTimeout(() => {
      if (!document.fullscreenElement) {
        console.log(
          "Pour une meilleure expérience, cliquez sur le bouton plein écran"
        );
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Récupérer le statut d'occupation des salles
  useEffect(() => {
    const fetchOccupancyStatus = async () => {
      try {
        // Récupérer les réunions pour chaque salle
        const roomsWithOccupancyStatus = await Promise.all(
          rooms.map(async (room) => {
            try {
              const meetings = await fetchMeetings(room.id);
              const now = new Date();

              // Trouver la réunion en cours
              const currentMeeting = meetings.find((meeting) => {
                const start = new Date(meeting.startTime);
                const end = new Date(meeting.endTime);
                return start <= now && end >= now;
              });

              // Vérifier si la salle est actuellement occupée
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
              return { ...room, isOccupied: false };
            }
          })
        );

        // Trier les salles: d'abord les occupées, puis les autres
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
    // Rafraîchir le statut toutes les minutes
    const interval = setInterval(fetchOccupancyStatus, 60 * 1000);
    return () => clearInterval(interval);
  }, [rooms]);

  // Fonction pour rafraîchir les données
  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      const allRooms = await fetchMeetingRooms();

      // Filtrer les salles pour n'afficher que celles dans la liste ALLOWED_ROOM_NAMES
      const filteredRooms = allRooms.filter((room) =>
        ALLOWED_ROOM_NAMES.some((allowedName) =>
          room.name.includes(allowedName)
        )
      );

      setRooms(filteredRooms);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Erreur lors du rafraîchissement des données:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fonction pour activer/désactiver le mode plein écran
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
          // Masquer les contrôles après 3 secondes
          if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
          }
          controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
          }, 3000);
        })
        .catch((err) => {
          console.warn(`Plein écran non disponible: ${err.message}`);
          // Ne pas afficher d'erreur à l'utilisateur, juste un avertissement dans la console
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

  // Gérer l'alternance entre salles occupées et libres
  useEffect(() => {
    // Nettoyer les timeouts existants
    if (modeChangeTimeoutRef.current) {
      clearTimeout(modeChangeTimeoutRef.current);
    }

    // Définir un nouveau timeout pour changer de mode
    modeChangeTimeoutRef.current = setTimeout(() => {
      setDisplayMode((prev) =>
        prev === "occupied" ? "available" : "occupied"
      );
      setCurrentRoomIndex(0); // Réinitialiser l'index lors du changement de mode
    }, 30000); // 30 secondes

    return () => {
      if (modeChangeTimeoutRef.current) {
        clearTimeout(modeChangeTimeoutRef.current);
      }
    };
  }, [displayMode]);

  // Gérer la rotation entre les salles du même type (occupées ou libres)
  useEffect(() => {
    const currentModeRooms = roomsWithStatus.filter((room) =>
      displayMode === "occupied" ? room.isOccupied : !room.isOccupied
    );

    if (currentModeRooms.length <= 1) return; // Pas besoin de rotation s'il n'y a qu'une seule salle

    // Nettoyer le timeout existant
    if (roomChangeTimeoutRef.current) {
      clearTimeout(roomChangeTimeoutRef.current);
    }

    // Définir un nouveau timeout pour changer de salle
    roomChangeTimeoutRef.current = setTimeout(() => {
      setCurrentRoomIndex((prev) => (prev + 1) % currentModeRooms.length);
    }, 10000); // 10 secondes par salle

    return () => {
      if (roomChangeTimeoutRef.current) {
        clearTimeout(roomChangeTimeoutRef.current);
      }
    };
  }, [displayMode, roomsWithStatus, currentRoomIndex]);

  // Rafraîchir les données toutes les 2 minutes
  useEffect(() => {
    refreshData();
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
          <AnimatePresence mode="wait">
            {currentRoom ? (
              // Affichage d'une salle en grand
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
              // Affichage de toutes les salles si aucune ne correspond au mode actuel
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
              autoRotate={true}
              setAutoRotate={() => {}}
              rotationInterval={30}
              setRotationInterval={() => {}}
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
