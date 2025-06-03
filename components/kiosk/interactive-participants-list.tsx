"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrganizerAvatar } from "@/components/ui/organizer-avatar";
import {
  Check,
  X,
  Users,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Attendee } from "@/lib/types";

interface InteractiveParticipantsListProps {
  attendees: Attendee[];
  maxVisible?: number;
  fullscreen?: boolean;
  onAttendanceChange?: (attendeeEmail: string, isPresent: boolean) => void;
}

export function InteractiveParticipantsList({
  attendees,
  maxVisible = 4,
  fullscreen = false,
  onAttendanceChange,
}: InteractiveParticipantsListProps) {
  const [attendanceData, setAttendanceData] = useState<Record<string, boolean>>(
    {}
  );
  const [showAll, setShowAll] = useState(false);
  const [hideParticipants, setHideParticipants] = useState(false);

  const handleAttendanceChange = (
    attendeeEmail: string,
    isPresent: boolean
  ) => {
    setAttendanceData((prev) => ({
      ...prev,
      [attendeeEmail]: isPresent,
    }));
    onAttendanceChange?.(attendeeEmail, isPresent);
  };

  const markAllPresent = () => {
    const newAttendanceData: Record<string, boolean> = {};
    attendees.forEach((attendee) => {
      newAttendanceData[attendee.email] = true;
    });
    setAttendanceData(newAttendanceData);
    attendees.forEach((attendee) => {
      onAttendanceChange?.(attendee.email, true);
    });
  };

  const markAllAbsent = () => {
    const newAttendanceData: Record<string, boolean> = {};
    attendees.forEach((attendee) => {
      newAttendanceData[attendee.email] = false;
    });
    setAttendanceData(newAttendanceData);
    attendees.forEach((attendee) => {
      onAttendanceChange?.(attendee.email, false);
    });
  };

  const clearAllMarks = () => {
    setAttendanceData({});
    attendees.forEach((attendee) => {
      onAttendanceChange?.(attendee.email, false);
    });
  };

  // Statistiques
  const totalParticipants = attendees.length;
  const confirmedCount = attendees.filter(
    (a) => a.status === "accepted"
  ).length;
  const presentCount = Object.values(attendanceData).filter(
    (present) => present === true
  ).length;
  const absentCount = Object.values(attendanceData).filter(
    (present) => present === false
  ).length;
  const unmarkedCount = totalParticipants - presentCount - absentCount;

  const displayedAttendees = showAll
    ? attendees
    : attendees.slice(0, maxVisible);

  return (
    <div className="space-y-4">
      {/* En-tête avec statistiques et contrôles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 ${
              fullscreen ? "text-xl" : "text-lg"
            }`}
          >
            <Users className={fullscreen ? "h-6 w-6" : "h-5 w-5"} />
            <span className="font-semibold text-white">
              Participants ({totalParticipants})
            </span>
          </div>

          {/* Statistiques */}
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-blue-500/20 text-blue-400 border-blue-500/30"
            >
              Confirmés: {confirmedCount}
            </Badge>
            {presentCount > 0 && (
              <Badge
                variant="outline"
                className="bg-green-500/20 text-green-400 border-green-500/30"
              >
                Présents: {presentCount}
              </Badge>
            )}
            {absentCount > 0 && (
              <Badge
                variant="outline"
                className="bg-red-500/20 text-red-400 border-red-500/30"
              >
                Absents: {absentCount}
              </Badge>
            )}
            {unmarkedCount > 0 && (
              <Badge
                variant="outline"
                className="bg-gray-500/20 text-gray-400 border-gray-500/30"
              >
                Non marqués: {unmarkedCount}
              </Badge>
            )}
          </div>
        </div>

        {/* Boutons de contrôle */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHideParticipants(!hideParticipants)}
            className="bg-gray-800/50 border-gray-600 hover:bg-gray-700/50"
          >
            {hideParticipants ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
            {hideParticipants ? "Afficher" : "Masquer"}
          </Button>

          {!hideParticipants && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={markAllPresent}
                className="bg-green-800/50 border-green-600 hover:bg-green-700/50 text-green-400"
              >
                <Check className="h-4 w-4 mr-1" />
                Tous présents
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={markAllAbsent}
                className="bg-red-800/50 border-red-600 hover:bg-red-700/50 text-red-400"
              >
                <X className="h-4 w-4 mr-1" />
                Tous absents
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={clearAllMarks}
                className="bg-gray-800/50 border-gray-600 hover:bg-gray-700/50"
              >
                Effacer
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Liste des participants */}
      <AnimatePresence>
        {!hideParticipants && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            {displayedAttendees.map((attendee, index) => {
              const isPresent = attendanceData[attendee.email];
              const isMarked = attendanceData[attendee.email] !== undefined;

              return (
                <motion.div
                  key={attendee.email}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`flex items-center justify-between p-3 rounded-lg backdrop-blur-sm border transition-all duration-200 ${
                    isPresent === true
                      ? "bg-green-900/30 border-green-500/50"
                      : isPresent === false
                      ? "bg-red-900/30 border-red-500/50"
                      : "bg-gray-900/30 border-gray-600/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <OrganizerAvatar
                        organizerEmail={attendee.email}
                        organizerName={attendee.name}
                        size={fullscreen ? "md" : "sm"}
                      />
                      {/* Indicateur de statut */}
                      {isMarked && (
                        <div
                          className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-900 ${
                            isPresent ? "bg-green-500" : "bg-red-500"
                          }`}
                        />
                      )}
                    </div>

                    <div>
                      <div
                        className={`font-medium text-white ${
                          fullscreen ? "text-lg" : "text-base"
                        }`}
                      >
                        {attendee.name}
                      </div>
                      <div
                        className={`text-gray-400 ${
                          fullscreen ? "text-base" : "text-sm"
                        }`}
                      >
                        {attendee.email}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            attendee.status === "accepted"
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : attendee.status === "declined"
                              ? "bg-red-500/20 text-red-400 border-red-500/30"
                              : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                          }`}
                        >
                          {attendee.status === "accepted"
                            ? "Accepté"
                            : attendee.status === "declined"
                            ? "Décliné"
                            : "En attente"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Boutons de présence */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleAttendanceChange(attendee.email, true)
                      }
                      className={`${
                        isPresent === true
                          ? "bg-green-600 border-green-500 text-white"
                          : "bg-green-800/50 border-green-600 hover:bg-green-700/50 text-green-400"
                      }`}
                    >
                      <Check className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleAttendanceChange(attendee.email, false)
                      }
                      className={`${
                        isPresent === false
                          ? "bg-red-600 border-red-500 text-white"
                          : "bg-red-800/50 border-red-600 hover:bg-red-700/50 text-red-400"
                      }`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}

            {/* Bouton pour afficher plus/moins */}
            {attendees.length > maxVisible && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAll(!showAll)}
                  className="bg-gray-800/50 border-gray-600 hover:bg-gray-700/50"
                >
                  {showAll ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Afficher moins
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Afficher tous ({attendees.length - maxVisible} de plus)
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
