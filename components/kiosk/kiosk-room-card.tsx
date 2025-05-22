"use client";

import { useState, useEffect } from "react";
import { fetchMeetings } from "@/lib/api";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MeetingRoom, Meeting } from "@/lib/types";
import { motion } from "framer-motion";

interface KioskRoomCardProps {
  room: MeetingRoom;
  fullscreen?: boolean;
}

export function KioskRoomCard({
  room,
  fullscreen = false,
}: KioskRoomCardProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMeeting, setCurrentMeeting] = useState<Meeting | null>(null);
  const [nextMeeting, setNextMeeting] = useState<Meeting | null>(null);
  const [occupancyPercentage, setOccupancyPercentage] = useState(0);

  useEffect(() => {
    const loadMeetings = async () => {
      try {
        setLoading(true);
        const data = await fetchMeetings(room.id);
        setMeetings(data);
      } catch (err) {
        console.error(
          `Erreur lors du chargement des réunions pour ${room.name}:`,
          err
        );
      } finally {
        setLoading(false);
      }
    };

    loadMeetings();
    // Rafraîchir les réunions toutes les 2 minutes
    const interval = setInterval(loadMeetings, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [room.id, room.name]);

  useEffect(() => {
    const updateCurrentStatus = () => {
      const now = new Date();

      // Trier les réunions par heure de début
      const sortedMeetings = [...meetings].sort((a, b) => {
        return (
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
      });

      // Trouver la réunion en cours
      const current = sortedMeetings.find((meeting) => {
        const start = new Date(meeting.startTime);
        const end = new Date(meeting.endTime);
        return start <= now && end >= now;
      });

      setCurrentMeeting(current || null);

      // Trouver la prochaine réunion
      const next = sortedMeetings.find((meeting) => {
        const start = new Date(meeting.startTime);
        return start > now;
      });

      setNextMeeting(next || null);

      // Calculer le pourcentage d'occupation pour la réunion en cours
      if (current) {
        const start = new Date(current.startTime);
        const end = new Date(current.endTime);
        const totalDuration = end.getTime() - start.getTime();
        const elapsedDuration = now.getTime() - start.getTime();
        const percentage = Math.min(
          100,
          Math.max(0, (elapsedDuration / totalDuration) * 100)
        );
        setOccupancyPercentage(percentage);
      } else {
        setOccupancyPercentage(0);
      }
    };

    updateCurrentStatus();
    // Mettre à jour toutes les 10 secondes pour une expérience plus fluide
    const interval = setInterval(updateCurrentStatus, 10 * 1000);
    return () => clearInterval(interval);
  }, [meetings]);

  const isOccupied = currentMeeting !== null;

  // Styles différents pour l'affichage en plein écran
  const containerClasses = cn(
    "rounded-xl p-6 h-full flex flex-col",
    isOccupied
      ? "bg-red-900/30 border-2 border-red-700"
      : "bg-green-900/30 border-2 border-green-700",
    fullscreen ? "justify-center" : ""
  );

  const titleClasses = cn(
    "font-bold",
    fullscreen ? "text-5xl mb-8" : "text-3xl"
  );

  const statusClasses = cn(
    "font-bold px-4 py-2 rounded-full",
    isOccupied ? "bg-red-700 text-white" : "bg-green-700 text-white",
    fullscreen ? "text-3xl" : "text-2xl"
  );

  const infoClasses = cn(fullscreen ? "text-2xl mb-4" : "text-xl mb-2");

  const meetingTitleClasses = cn(
    "font-semibold",
    fullscreen ? "text-5xl mb-6" : "text-3xl"
  );

  const meetingInfoClasses = cn(
    "flex items-center gap-2",
    fullscreen ? "text-3xl mb-4" : "text-xl"
  );

  const progressBarHeight = fullscreen ? "h-8" : "h-6";

  return (
    <motion.div
      className={containerClasses}
      animate={{
        borderColor: isOccupied ? "rgb(185, 28, 28)" : "rgb(21, 128, 61)",
        backgroundColor: isOccupied
          ? "rgba(153, 27, 27, 0.3)"
          : "rgba(20, 83, 45, 0.3)",
      }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: fullscreen ? 1 : 1.02 }}
    >
      <div className="flex justify-between items-start mb-4">
        <h2 className={titleClasses}>{room.name}</h2>
        <div className={statusClasses}>{isOccupied ? "OCCUPÉE" : "LIBRE"}</div>
      </div>

      <div className={infoClasses}>
        {room.location} • {room.capacity} personnes
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {isOccupied ? (
          <div className="space-y-4">
            <div className={meetingTitleClasses}>{currentMeeting.subject}</div>

            <div className={meetingInfoClasses}>
              <Clock className={fullscreen ? "h-8 w-8" : "h-6 w-6"} />
              <span>
                {format(new Date(currentMeeting.startTime), "HH:mm", {
                  locale: fr,
                })}{" "}
                -
                {format(new Date(currentMeeting.endTime), "HH:mm", {
                  locale: fr,
                })}
              </span>
            </div>

            <div className={meetingInfoClasses}>
              <Users className={fullscreen ? "h-8 w-8" : "h-6 w-6"} />
              <span>{currentMeeting.attendeeCount} participants</span>
            </div>

            <div className={fullscreen ? "text-3xl mb-6" : "text-xl"}>
              Organisé par {currentMeeting.organizer}
            </div>

            <div className="space-y-2 mt-4">
              <div className="relative pt-1">
                <div className="flex items-center justify-between mb-2">
                  <div className={fullscreen ? "text-3xl" : "text-xl"}>
                    Progression
                  </div>
                  <div className={fullscreen ? "text-3xl" : "text-xl"}>
                    {Math.round(occupancyPercentage)}%
                  </div>
                </div>
                <div
                  className={`overflow-hidden ${progressBarHeight} text-xs flex rounded-full bg-gray-800`}
                >
                  <div className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-red-600">
                    <motion.div
                      style={{ width: "100%" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${occupancyPercentage}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full"
                    />
                  </div>
                </div>
                <div
                  className={
                    fullscreen
                      ? "text-3xl text-right mt-4"
                      : "text-xl text-right mt-2"
                  }
                >
                  Fin dans{" "}
                  {formatRemainingTime(new Date(currentMeeting.endTime))}
                </div>
              </div>
            </div>
          </div>
        ) : nextMeeting ? (
          <div className="space-y-4">
            <div className={fullscreen ? "text-4xl" : "text-2xl"}>
              Prochaine réunion:
            </div>
            <div className={meetingTitleClasses}>{nextMeeting.subject}</div>

            <div className={meetingInfoClasses}>
              <Clock className={fullscreen ? "h-8 w-8" : "h-6 w-6"} />
              <span>
                {format(new Date(nextMeeting.startTime), "HH:mm", {
                  locale: fr,
                })}{" "}
                -
                {format(new Date(nextMeeting.endTime), "HH:mm", { locale: fr })}
              </span>
            </div>

            <div className={fullscreen ? "text-3xl" : "text-xl"}>
              Organisé par {nextMeeting.organizer}
            </div>

            <div className={fullscreen ? "text-4xl mt-8" : "text-2xl mt-4"}>
              Début dans {formatTimeUntil(new Date(nextMeeting.startTime))}
            </div>
          </div>
        ) : (
          <div
            className={
              fullscreen ? "text-4xl text-center" : "text-2xl text-center"
            }
          >
            Aucune réunion prévue aujourd'hui
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Fonction pour formater le temps restant
function formatRemainingTime(endTime: Date): string {
  const now = new Date();
  const diff = endTime.getTime() - now.getTime();

  if (diff <= 0) {
    return "Terminé";
  }

  const minutes = Math.floor(diff / 60000);

  if (minutes < 60) {
    return `${minutes} min`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h${remainingMinutes.toString().padStart(2, "0")}`;
    }
  }
}

// Fonction pour formater le temps jusqu'à la prochaine réunion
function formatTimeUntil(startTime: Date): string {
  const now = new Date();
  const diff = startTime.getTime() - now.getTime();

  if (diff <= 0) {
    return "Maintenant";
  }

  const minutes = Math.floor(diff / 60000);

  if (minutes < 60) {
    return `${minutes} min`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h${remainingMinutes.toString().padStart(2, "0")}`;
    }
  }
}
