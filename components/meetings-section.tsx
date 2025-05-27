"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, CheckCircle } from "lucide-react";
import { MeetingItemEnhanced } from "./meeting-item-enhanced";
import type { Meeting } from "@/lib/types";
import { isMeetingActive } from "@/lib/date-utils";

interface MeetingsSectionProps {
  meetings: Meeting[];
  loading: boolean;
}

export function MeetingsSection({ meetings, loading }: MeetingsSectionProps) {
  const now = new Date();

  // Séparer les réunions par statut
  const currentMeetings = meetings.filter((meeting) =>
    isMeetingActive(meeting.startTime, meeting.endTime)
  );
  const upcomingMeetings = meetings.filter((meeting) => {
    const startTime = new Date(meeting.startTime);
    return startTime > now;
  });
  const pastMeetings = meetings.filter((meeting) => {
    const endTime = new Date(meeting.endTime);
    return endTime < now;
  });

  // Trier les réunions
  const sortedUpcoming = upcomingMeetings.sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
  const sortedPast = pastMeetings.sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="h-20 bg-muted/50 rounded-lg animate-pulse"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
          />
        ))}
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center py-8 text-muted-foreground"
      >
        <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">Aucune réunion prévue aujourd'hui</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
      <AnimatePresence>
        {/* Réunions en cours */}
        {currentMeetings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400 mb-2">
              <Clock className="h-4 w-4" />
              <span>En cours ({currentMeetings.length})</span>
            </div>
            {currentMeetings.map((meeting, index) => (
              <MeetingItemEnhanced
                key={meeting.id}
                meeting={meeting}
                index={index}
              />
            ))}
          </motion.div>
        )}

        {/* Réunions à venir */}
        {sortedUpcoming.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            {currentMeetings.length > 0 && (
              <div className="border-t border-border/50 pt-3" />
            )}
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">
              <Calendar className="h-4 w-4" />
              <span>À venir ({sortedUpcoming.length})</span>
            </div>
            {sortedUpcoming.map((meeting, index) => (
              <MeetingItemEnhanced
                key={meeting.id}
                meeting={meeting}
                index={index + currentMeetings.length}
              />
            ))}
          </motion.div>
        )}

        {/* Réunions passées - Amélioration de la visibilité */}
        {sortedPast.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            {(currentMeetings.length > 0 || sortedUpcoming.length > 0) && (
              <div className="border-t border-purple-200/50 dark:border-purple-800/50 pt-3" />
            )}
            <motion.div
              className="flex items-center gap-2 text-sm font-bold text-purple-700 dark:text-purple-300 mb-3 p-2 bg-purple-50/50 dark:bg-purple-950/30 rounded-md border border-purple-200/50 dark:border-purple-800/50"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <CheckCircle className="h-4 w-4" />
              <span>Passées ({sortedPast.length})</span>
              <motion.div
                className="ml-auto text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/50 rounded-full"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              >
                Terminées
              </motion.div>
            </motion.div>
            <div className="space-y-2">
              {sortedPast.map((meeting, index) => (
                <MeetingItemEnhanced
                  key={meeting.id}
                  meeting={meeting}
                  index={index + currentMeetings.length + sortedUpcoming.length}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
