"use client";

import { motion } from "framer-motion";
import { Check, X, Clock, Users } from "lucide-react";
import { AvatarEnhanced } from "@/components/ui/avatar-enhanced";
import type { Attendee } from "@/lib/types";

interface ParticipantsListProps {
  attendees: Attendee[];
  maxVisible?: number;
  fullscreen?: boolean;
}

export function ParticipantsList({
  attendees,
  maxVisible = 6,
  fullscreen = false,
}: ParticipantsListProps) {
  const acceptedAttendees = attendees.filter(
    (attendee) => attendee.status === "accepted" && attendee.type !== "resource"
  );

  const visibleAttendees = acceptedAttendees.slice(0, maxVisible);
  const remainingCount = Math.max(0, acceptedAttendees.length - maxVisible);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <Check className="h-3 w-3 text-green-400" />;
      case "declined":
        return <X className="h-3 w-3 text-red-400" />;
      case "tentative":
        return <Clock className="h-3 w-3 text-yellow-400" />;
      default:
        return <Clock className="h-3 w-3 text-gray-400" />;
    }
  };

  if (acceptedAttendees.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="space-y-3"
    >
      <div
        className={`flex items-center gap-2 ${
          fullscreen ? "text-2xl" : "text-lg"
        }`}
      >
        <Users className={fullscreen ? "h-6 w-6" : "h-5 w-5"} />
        <span className="font-semibold">
          Participants ({acceptedAttendees.length})
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {visibleAttendees.map((attendee, index) => (
          <motion.div
            key={attendee.email}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex items-center gap-3 bg-black/20 rounded-lg p-3 backdrop-blur-sm"
          >
            <AvatarEnhanced
              src={attendee.photo}
              name={attendee.name}
              size={fullscreen ? "md" : "sm"}
            />
            <div className="flex-1 min-w-0">
              <div
                className={`font-medium truncate ${
                  fullscreen ? "text-lg" : "text-sm"
                }`}
              >
                {attendee.name}
              </div>
              <div className="flex items-center gap-1">
                {getStatusIcon(attendee.status)}
                <span
                  className={`text-gray-300 ${
                    fullscreen ? "text-sm" : "text-xs"
                  }`}
                >
                  {attendee.status === "accepted"
                    ? "Confirmé"
                    : attendee.status === "declined"
                    ? "Décliné"
                    : attendee.status === "tentative"
                    ? "Provisoire"
                    : "En attente"}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {remainingCount > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className={`text-center text-gray-300 ${
            fullscreen ? "text-lg" : "text-sm"
          }`}
        >
          +{remainingCount} autre{remainingCount > 1 ? "s" : ""} participant
          {remainingCount > 1 ? "s" : ""}
        </motion.div>
      )}
    </motion.div>
  );
}
