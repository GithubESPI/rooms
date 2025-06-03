"use client";

import { useState, useEffect, useRef } from "react";
import { fetchMeetings } from "@/lib/api";
import { Clock, MapPin, Calendar, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MeetingRoom, Meeting } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { OrganizerAvatar } from "@/components/ui/organizer-avatar";
import { AnimatedProgress } from "./animated-progress";
import { MeetingEndAnimation } from "./meeting-end-animation";
import { InteractiveParticipantsList } from "./interactive-participants-list";
import {
  getCurrentFrenchTime,
  convertUTCToFrenchTime,
  isMeetingActive,
  getTimeUntilStart,
  formatFrenchTime,
  getTimeUntilEnd,
} from "@/lib/date-utils";

interface KioskRoomCardProps {
  room: MeetingRoom;
  fullscreen?: boolean;
}

export function KioskRoomCard({ room, fullscreen = true }: KioskRoomCardProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMeeting, setCurrentMeeting] = useState<Meeting | null>(null);
  const [nextMeeting, setNextMeeting] = useState<Meeting | null>(null);
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [isStartingSoon, setIsStartingSoon] = useState(false);
  const [showEndAnimation, setShowEndAnimation] = useState(false);
  const [wasOccupied, setWasOccupied] = useState(false);
  const [attendanceData, setAttendanceData] = useState<Record<string, boolean>>(
    {}
  );
  const previousMeetingRef = useRef<Meeting | null>(null);

  useEffect(() => {
    const loadMeetings = async () => {
      try {
        setLoading(true);
        const data = await fetchMeetings(room.id);
        console.log(`Réunions récupérées pour ${room.name}:`, data);
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
    const interval = setInterval(loadMeetings, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [room.id, room.name]);

  useEffect(() => {
    const updateCurrentStatus = () => {
      const now = getCurrentFrenchTime();

      const sortedMeetings = [...meetings].sort((a, b) => {
        const startA = convertUTCToFrenchTime(a.startTime);
        const startB = convertUTCToFrenchTime(b.startTime);
        return startA.getTime() - startB.getTime();
      });

      const current = sortedMeetings.find((meeting) =>
        isMeetingActive(meeting.startTime, meeting.endTime)
      );

      // Détecter la fin d'une réunion
      if (previousMeetingRef.current && !current && wasOccupied) {
        console.log(`🎉 Fin de réunion détectée pour ${room.name}`);
        setShowEndAnimation(true);
        setWasOccupied(false);
        setAttendanceData({});
      }

      setCurrentMeeting(current || null);
      previousMeetingRef.current = current || null;

      if (current) {
        setWasOccupied(true);
      }

      // Trouver la prochaine réunion et les réunions à venir
      const futureMeetings = sortedMeetings.filter((meeting) => {
        const start = convertUTCToFrenchTime(meeting.startTime);
        return start > now;
      });

      const next = futureMeetings[0] || null;
      setNextMeeting(next);
      setUpcomingMeetings(futureMeetings.slice(1));

      // Vérifier si la prochaine réunion commence bientôt (dans les 30 minutes)
      if (next) {
        const startTime = convertUTCToFrenchTime(next.startTime);
        const timeUntilStart = startTime.getTime() - now.getTime();
        const thirtyMinutes = 30 * 60 * 1000;
        setIsStartingSoon(
          timeUntilStart <= thirtyMinutes && timeUntilStart > 0
        );
      } else {
        setIsStartingSoon(false);
      }
    };

    updateCurrentStatus();
    const interval = setInterval(updateCurrentStatus, 10 * 1000);
    return () => clearInterval(interval);
  }, [meetings, room.name, wasOccupied]);

  const handleAttendanceChange = (
    attendeeEmail: string,
    isPresent: boolean
  ) => {
    setAttendanceData((prev) => ({
      ...prev,
      [attendeeEmail]: isPresent,
    }));

    console.log(
      `Présence mise à jour pour ${attendeeEmail}: ${
        isPresent ? "Présent" : "Absent"
      }`
    );
  };

  const isOccupied = currentMeeting !== null;

  const containerClasses = cn(
    "rounded-xl p-6 h-full flex flex-col relative overflow-hidden",
    isOccupied
      ? "bg-gradient-to-br from-red-900/40 to-red-800/40"
      : isStartingSoon
      ? "bg-gradient-to-br from-orange-900/40 to-orange-800/40"
      : "bg-gradient-to-br from-green-900/40 to-green-800/40",
    fullscreen ? "justify-center" : ""
  );

  const titleClasses = cn(
    "font-bold text-white",
    fullscreen ? "text-6xl mb-8" : "text-3xl"
  );
  const statusClasses = cn(
    "font-bold px-6 py-3 rounded-full backdrop-blur-sm border-2",
    isOccupied
      ? "bg-red-600/80 text-white border-red-400"
      : isStartingSoon
      ? "bg-orange-600/80 text-white border-orange-400"
      : "bg-green-600/80 text-white border-green-400",
    fullscreen ? "text-3xl" : "text-2xl"
  );

  return (
    <>
      <motion.div
        className={containerClasses}
        animate={{
          borderColor: isOccupied
            ? "rgb(185, 28, 28)"
            : isStartingSoon
            ? "rgb(255, 165, 0)"
            : "rgb(21, 128, 61)",
        }}
        transition={{ duration: 0.5 }}
        whileHover={{ scale: fullscreen ? 1 : 1.02 }}
      >
        {/* Effet de particules en arrière-plan */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute w-2 h-2 rounded-full ${
                isOccupied
                  ? "bg-red-400/20"
                  : isStartingSoon
                  ? "bg-orange-400/20"
                  : "bg-green-400/20"
              }`}
              animate={{
                x: [0, Math.random() * 100 - 50],
                y: [0, Math.random() * 100 - 50],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Number.POSITIVE_INFINITY,
                delay: Math.random() * 2,
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>

        {/* Contenu principal */}
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-between items-start mb-6"
          >
            <div>
              <h2 className={titleClasses}>{room.name}</h2>
              <div
                className={`flex items-center gap-2 text-gray-300 ${
                  fullscreen ? "text-2xl" : "text-xl"
                }`}
              >
                <MapPin className={fullscreen ? "h-6 w-6" : "h-5 w-5"} />
                <span>
                  {room.location} • {room.capacity} personnes
                </span>
              </div>
            </div>

            <motion.div
              className={statusClasses}
              animate={{
                scale: [1, 1.05, 1],
                boxShadow: isOccupied
                  ? [
                      "0 0 0 0 rgba(239, 68, 68, 0.7)",
                      "0 0 0 10px rgba(239, 68, 68, 0)",
                      "0 0 0 0 rgba(239, 68, 68, 0)",
                    ]
                  : isStartingSoon
                  ? [
                      "0 0 0 0 rgba(255, 165, 0, 0.7)",
                      "0 0 0 10px rgba(255, 165, 0, 0)",
                      "0 0 0 0 rgba(255, 165, 0, 0)",
                    ]
                  : [
                      "0 0 0 0 rgba(34, 197, 94, 0.7)",
                      "0 0 0 10px rgba(34, 197, 94, 0)",
                      "0 0 0 0 rgba(34, 197, 94, 0)",
                    ],
              }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            >
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  <Sparkles className={fullscreen ? "h-8 w-8" : "h-6 w-6"} />
                  {isOccupied
                    ? "OCCUPÉE"
                    : isStartingSoon
                    ? "BIENTÔT"
                    : "LIBRE"}
                </div>
                {isOccupied && currentMeeting && (
                  <div
                    className={
                      fullscreen
                        ? "text-2xl font-extrabold text-white drop-shadow-lg mt-2 text-center whitespace-nowrap"
                        : "text-xs font-bold text-white mt-1 text-center whitespace-nowrap"
                    }
                  >
                    Temps restant : {getTimeUntilEnd(currentMeeting.endTime)}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>

          <div className="flex-1 flex flex-col justify-center space-y-8">
            <AnimatePresence mode="wait">
              {isOccupied && currentMeeting ? (
                <motion.div
                  key="occupied"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-8"
                >
                  {/* Titre de la réunion */}
                  <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className={`font-bold text-white ${
                      fullscreen ? "text-5xl" : "text-3xl"
                    }`}
                  >
                    {currentMeeting.subject}
                  </motion.div>

                  {/* Informations de la réunion */}
                  <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="grid grid-cols-1 gap-6"
                  >
                    <div
                      className={`flex items-center gap-4 ${
                        fullscreen ? "text-2xl" : "text-xl"
                      }`}
                    >
                      <Clock className={fullscreen ? "h-8 w-8" : "h-6 w-6"} />
                      <span className="text-gray-200">
                        {formatFrenchTime(currentMeeting.startTime)} -{" "}
                        {formatFrenchTime(currentMeeting.endTime)}
                      </span>
                    </div>

                    {/* Organisateur avec photo */}
                    {currentMeeting.organizerDetails && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="flex items-center gap-4 bg-black/20 rounded-lg p-4 backdrop-blur-sm"
                      >
                        <OrganizerAvatar
                          organizerEmail={currentMeeting.organizerDetails.email}
                          organizerName={currentMeeting.organizerDetails.name}
                          size={fullscreen ? "lg" : "md"}
                        />
                        <div>
                          <div
                            className={`font-semibold text-white ${
                              fullscreen ? "text-2xl" : "text-lg"
                            }`}
                          >
                            Organisateur
                          </div>
                          <div
                            className={`text-gray-300 ${
                              fullscreen ? "text-xl" : "text-base"
                            }`}
                          >
                            {currentMeeting.organizerDetails.name}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Barre de progression animée */}
                  <AnimatedProgress
                    startTime={currentMeeting.startTime}
                    endTime={currentMeeting.endTime}
                    fullscreen={fullscreen}
                  />

                  {/* Liste interactive des participants */}
                  {currentMeeting.attendees &&
                    currentMeeting.attendees.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="bg-black/20 rounded-lg p-4 backdrop-blur-sm"
                      >
                        <InteractiveParticipantsList
                          attendees={currentMeeting.attendees}
                          maxVisible={fullscreen ? 6 : 3}
                          fullscreen={fullscreen}
                          onAttendanceChange={handleAttendanceChange}
                        />
                      </motion.div>
                    )}
                </motion.div>
              ) : nextMeeting ? (
                <motion.div
                  key="next-meeting"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-6 text-center"
                >
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                    }}
                    className={`text-white ${
                      fullscreen ? "text-4xl" : "text-2xl"
                    }`}
                  >
                    <Calendar
                      className={`inline-block mr-3 ${
                        fullscreen ? "h-10 w-10" : "h-8 w-8"
                      }`}
                    />
                    Prochaine réunion
                  </motion.div>

                  <div
                    className={`font-bold text-white ${
                      fullscreen ? "text-5xl" : "text-3xl"
                    }`}
                  >
                    {nextMeeting.subject}
                  </div>

                  <div
                    className={`flex items-center justify-center gap-4 text-gray-300 ${
                      fullscreen ? "text-2xl" : "text-xl"
                    }`}
                  >
                    <Clock className={fullscreen ? "h-8 w-8" : "h-6 w-6"} />
                    <span>
                      {formatFrenchTime(nextMeeting.startTime)} -{" "}
                      {formatFrenchTime(nextMeeting.endTime)}
                    </span>
                  </div>

                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{
                      duration: 1.5,
                      repeat: Number.POSITIVE_INFINITY,
                    }}
                    className={`font-bold text-yellow-400 ${
                      fullscreen ? "text-4xl" : "text-2xl"
                    }`}
                  >
                    Début dans {getTimeUntilStart(nextMeeting.startTime)}
                  </motion.div>

                  {/* Afficher l'organisateur de la prochaine réunion */}
                  {nextMeeting.organizerDetails && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      className="flex items-center justify-center gap-4 bg-black/20 rounded-lg p-4 backdrop-blur-sm"
                    >
                      <OrganizerAvatar
                        organizerEmail={nextMeeting.organizerDetails.email}
                        organizerName={nextMeeting.organizerDetails.name}
                        size={fullscreen ? "md" : "sm"}
                      />
                      <div className="text-center">
                        <div
                          className={`font-semibold text-white ${
                            fullscreen ? "text-xl" : "text-base"
                          }`}
                        >
                          Organisé par
                        </div>
                        <div
                          className={`text-gray-300 ${
                            fullscreen ? "text-lg" : "text-sm"
                          }`}
                        >
                          {nextMeeting.organizerDetails.name}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Liste interactive des participants de la prochaine réunion */}
                  {(() => {
                    const attendees = (nextMeeting as Meeting).attendees;
                    if (attendees && attendees.length > 0) {
                      return (
                        <div className="min-w-[220px] max-w-[320px] w-full bg-black/20 rounded-lg p-4 border border-white/10">
                          <div className="font-bold text-white text-lg mb-2">
                            Participants
                          </div>
                          <InteractiveParticipantsList
                            attendees={attendees}
                            maxVisible={fullscreen ? 4 : 2}
                            fullscreen={fullscreen}
                          />
                        </div>
                      );
                    }
                    return null;
                  })()}
                </motion.div>
              ) : (
                <motion.div
                  key="no-meetings"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5 }}
                  className="text-center space-y-6"
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{
                      duration: 3,
                      repeat: Number.POSITIVE_INFINITY,
                    }}
                    className={`text-green-400 ${
                      fullscreen ? "text-6xl" : "text-4xl"
                    }`}
                  >
                    <Sparkles
                      className={`mx-auto ${
                        fullscreen ? "h-20 w-20" : "h-16 w-16"
                      }`}
                    />
                  </motion.div>
                  <div
                    className={`text-white ${
                      fullscreen ? "text-4xl" : "text-2xl"
                    }`}
                  >
                    Aucune réunion prévue aujourd'hui
                  </div>
                  <div
                    className={`text-gray-300 ${
                      fullscreen ? "text-2xl" : "text-lg"
                    }`}
                  >
                    Salle disponible pour réservation
                  </div>
                  {nextMeeting && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      className="bg-black/20 rounded-lg p-4 backdrop-blur-sm mt-4"
                    >
                      <div className="flex flex-row items-start gap-4">
                        {/* Bloc principale prochaine réunion */}
                        <div className="flex-1 space-y-3">
                          <div
                            className={`font-bold text-white ${
                              fullscreen ? "text-2xl" : "text-xl"
                            }`}
                          >
                            {isStartingSoon
                              ? "Réunion commence bientôt"
                              : "Prochaine réservation"}
                          </div>
                          <div
                            className={`text-white ${
                              fullscreen ? "text-xl" : "text-lg"
                            }`}
                          >
                            {(nextMeeting as Meeting).subject}
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <Clock
                              className={fullscreen ? "h-6 w-6" : "h-5 w-5"}
                            />
                            <span>
                              {formatFrenchTime(
                                (nextMeeting as Meeting).startTime
                              )}{" "}
                              -{" "}
                              {formatFrenchTime(
                                (nextMeeting as Meeting).endTime
                              )}
                            </span>
                          </div>
                          {isStartingSoon && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="bg-orange-500/20 rounded-lg p-3 text-orange-300 text-center"
                            >
                              Début dans{" "}
                              {getTimeUntilStart(
                                (nextMeeting as Meeting).startTime
                              )}
                            </motion.div>
                          )}
                          {/* Ligne Organisé par + Participants */}
                          <div className="flex flex-row items-start gap-3 mt-2 w-full">
                            {/* Bloc Organisé par */}
                            {(nextMeeting as Meeting).organizerDetails && (
                              <div className="flex items-center gap-2 bg-black/20 rounded-lg p-2 border border-white/10 min-w-[120px]">
                                <OrganizerAvatar
                                  organizerEmail={
                                    (nextMeeting as Meeting).organizerDetails!
                                      .email
                                  }
                                  organizerName={
                                    (nextMeeting as Meeting).organizerDetails!
                                      .name
                                  }
                                  size={fullscreen ? "md" : "sm"}
                                />
                                <div className="text-left">
                                  <div
                                    className={`font-semibold text-white ${
                                      fullscreen ? "text-base" : "text-xs"
                                    }`}
                                  >
                                    Organisé par
                                  </div>
                                  <div
                                    className={`text-gray-300 ${
                                      fullscreen ? "text-lg" : "text-xs"
                                    }`}
                                  >
                                    {
                                      (nextMeeting as Meeting).organizerDetails!
                                        .name
                                    }
                                  </div>
                                </div>
                              </div>
                            )}
                            {/* Bloc Participants */}
                            <div className="flex-1 min-w-[120px] max-w-[220px] bg-black/20 rounded-lg p-2 border border-white/10">
                              <div className="font-bold text-white text-xs mb-1">
                                Participants
                              </div>
                              {(() => {
                                const attendees = (nextMeeting as Meeting)
                                  .attendees;
                                if (attendees && attendees.length > 0) {
                                  return (
                                    <ul className="space-y-1">
                                      {attendees.map((att, idx) => (
                                        <li
                                          key={att.email || idx}
                                          className="text-gray-200 text-xs truncate flex items-center gap-2"
                                        >
                                          <span className="inline-block w-2 h-2 rounded-full bg-green-400"></span>
                                          {att.name || att.email}
                                        </li>
                                      ))}
                                    </ul>
                                  );
                                }
                                return (
                                  <div className="text-gray-400 text-xs italic">
                                    Aucun participant
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Liste des réunions à venir */}
                  {upcomingMeetings.length > 0 &&
                    !isOccupied &&
                    !isStartingSoon && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                        className="mt-6 space-y-4"
                      >
                        <div
                          className={`font-bold text-white ${
                            fullscreen ? "text-2xl" : "text-xl"
                          }`}
                        >
                          Réunions à venir
                        </div>
                        <div className="space-y-3">
                          {upcomingMeetings.map((meeting, index) => (
                            <motion.div
                              key={meeting.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.1 }}
                              className="bg-black/20 rounded-lg p-3 backdrop-blur-sm"
                            >
                              <div className="flex justify-between items-center">
                                <div className="space-y-1">
                                  <div className="text-white font-medium">
                                    {meeting.subject}
                                  </div>
                                  <div className="text-gray-300 text-sm flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    {formatFrenchTime(meeting.startTime)} -{" "}
                                    {formatFrenchTime(meeting.endTime)}
                                  </div>
                                </div>
                                {meeting.organizerDetails && (
                                  <OrganizerAvatar
                                    organizerEmail={
                                      meeting.organizerDetails.email
                                    }
                                    organizerName={
                                      meeting.organizerDetails.name
                                    }
                                    size="sm"
                                  />
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Animation de fin de réservation */}
      <MeetingEndAnimation
        isVisible={showEndAnimation}
        roomName={room.name}
        onAnimationComplete={() => setShowEndAnimation(false)}
        fullscreen={fullscreen}
      />
    </>
  );
}
