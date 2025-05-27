"use client";

import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import type { Meeting } from "@/lib/types";
import {
  formatFrenchTime,
  isMeetingActive,
  calculateMeetingProgress,
} from "@/lib/date-utils";
import { MeetingStatusBadge } from "./meeting-status-badge";
import { cn } from "@/lib/utils";

interface MeetingItemEnhancedProps {
  meeting: Meeting;
  index: number;
}

export function MeetingItemEnhanced({
  meeting,
  index,
}: MeetingItemEnhancedProps) {
  const now = new Date();
  const startTime = new Date(meeting.startTime);
  const endTime = new Date(meeting.endTime);

  const isCurrentMeeting = isMeetingActive(meeting.startTime, meeting.endTime);
  const isPastMeeting = endTime < now;
  const progress = isCurrentMeeting
    ? calculateMeetingProgress(meeting.startTime, meeting.endTime)
    : 0;

  const getStatus = () => {
    if (isCurrentMeeting) return "current";
    if (isPastMeeting) return "past";
    return "upcoming";
  };

  const status = getStatus();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: index * 0.1,
        type: "spring",
        stiffness: 100,
      }}
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2 },
      }}
      className={cn(
        "relative p-4 rounded-lg border backdrop-blur-sm transition-all duration-300",
        isCurrentMeeting &&
          "bg-red-50/80 border-red-200 dark:bg-red-950/30 dark:border-red-800/50 shadow-lg shadow-red-500/10",
        isPastMeeting &&
          "bg-purple-50/90 border-purple-200/80 dark:bg-purple-950/40 dark:border-purple-700/60 shadow-md shadow-purple-500/5",
        !isCurrentMeeting &&
          !isPastMeeting &&
          "bg-card/80 border-border hover:border-primary/50 hover:shadow-md"
      )}
    >
      {/* Barre de progression pour les réunions en cours */}
      {isCurrentMeeting && (
        <motion.div
          className="absolute top-0 left-0 h-1 bg-gradient-to-r from-red-500 to-red-600 rounded-t-lg"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      )}

      {/* Barre décorative pour les réunions passées */}
      {isPastMeeting && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-purple-600 rounded-t-lg opacity-60" />
      )}

      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4
              className={cn(
                "font-semibold text-sm truncate",
                isPastMeeting ? "text-purple-800 dark:text-purple-200" : ""
              )}
            >
              {meeting.subject}
            </h4>
            <MeetingStatusBadge status={status} />
          </div>

          <div
            className={cn(
              "flex items-center gap-4 text-xs",
              isPastMeeting
                ? "text-purple-600 dark:text-purple-300"
                : "text-muted-foreground"
            )}
          >
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>
                {formatFrenchTime(meeting.startTime)} -{" "}
                {formatFrenchTime(meeting.endTime)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "text-xs",
          isPastMeeting
            ? "text-purple-600 dark:text-purple-300"
            : "text-muted-foreground"
        )}
      >
        <div className="flex items-center gap-1">
          <span>Organisé par</span>
          <span className="font-medium">{meeting.organizer}</span>
        </div>
      </div>

      {/* Effet de brillance pour les réunions en cours */}
      {isCurrentMeeting && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/10 to-transparent rounded-lg"
          animate={{
            x: ["-100%", "100%"],
          }}
          transition={{
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            repeatDelay: 2,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Effet subtil pour les réunions passées */}
      {isPastMeeting && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/5 to-transparent rounded-lg"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      )}
    </motion.div>
  );
}
