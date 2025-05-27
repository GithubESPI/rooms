"use client";

import { motion } from "framer-motion";
import { Check, X, Clock, Users, UserCheck } from "lucide-react";
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
  // Filtrer pour ne garder que les participants qui ont accepté ou sont en attente
  // Exclure ceux qui ont décliné
  const validAttendees = attendees.filter((attendee) => {
    const isValid =
      attendee.type !== "resource" && // Exclure les ressources (salles)
      attendee.status !== "declined" && // Exclure ceux qui ont décliné
      attendee.email && // S'assurer qu'il y a un email
      attendee.name && // S'assurer qu'il y a un nom
      attendee.name.trim().length > 0; // S'assurer que le nom n'est pas vide

    console.log(
      `Validation participant ${attendee.name}: status=${attendee.status}, valid=${isValid}`
    );
    return isValid;
  });

  // Séparer les participants confirmés des autres
  const confirmedAttendees = validAttendees.filter(
    (attendee) => attendee.status === "accepted"
  );
  const tentativeAttendees = validAttendees.filter(
    (attendee) => attendee.status === "tentative"
  );
  const pendingAttendees = validAttendees.filter(
    (attendee) => attendee.status === "none"
  );

  // Prioriser l'affichage : confirmés d'abord, puis provisoires, puis en attente
  const sortedAttendees = [
    ...confirmedAttendees,
    ...tentativeAttendees,
    ...pendingAttendees,
  ];

  const visibleAttendees = sortedAttendees.slice(0, maxVisible);
  const remainingCount = Math.max(0, sortedAttendees.length - maxVisible);

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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "accepted":
        return "Confirmé";
      case "declined":
        return "Décliné";
      case "tentative":
        return "Provisoire";
      case "none":
      case "notresponded":
        return "En attente";
      default:
        console.log(`Statut inconnu: ${status}`);
        return "En attente";
    }
  };

  // Ne rien afficher s'il n'y a pas de participants valides
  if (sortedAttendees.length === 0) {
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
          } text-gray-400`}
        >
          <Users className={fullscreen ? "h-6 w-6" : "h-5 w-5"} />
          <span className="font-semibold">Aucun participant invité</span>
        </div>
        <div className={`text-gray-500 ${fullscreen ? "text-lg" : "text-sm"}`}>
          Cette réunion n'a pas de participants externes
        </div>
      </motion.div>
    );
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
        <UserCheck className={fullscreen ? "h-6 w-6" : "h-5 w-5"} />
        <span className="font-semibold">
          Participants ({sortedAttendees.length})
          {confirmedAttendees.length > 0 && (
            <span className="text-green-400 ml-2">
              • {confirmedAttendees.length} confirmé
              {confirmedAttendees.length > 1 ? "s" : ""}
            </span>
          )}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {visibleAttendees.map((attendee, index) => (
          <motion.div
            key={attendee.email}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`flex items-center gap-3 rounded-lg p-3 backdrop-blur-sm border ${
              attendee.status === "accepted"
                ? "bg-green-500/10 border-green-500/30"
                : attendee.status === "tentative"
                ? "bg-yellow-500/10 border-yellow-500/30"
                : "bg-gray-500/10 border-gray-500/30"
            }`}
          >
            <AvatarEnhanced
              email={attendee.email}
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
                <span className={`${fullscreen ? "text-sm" : "text-xs"}`}>
                  {getStatusLabel(attendee.status)}
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

      {/* Statistiques des participants */}
      {sortedAttendees.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.6 }}
          className={`flex justify-center gap-4 pt-2 border-t border-gray-600/30 ${
            fullscreen ? "text-sm" : "text-xs"
          }`}
        >
          {confirmedAttendees.length > 0 && (
            <div className="flex items-center gap-1 text-green-400">
              <Check className="h-3 w-3" />
              <span>{confirmedAttendees.length}</span>
            </div>
          )}
          {tentativeAttendees.length > 0 && (
            <div className="flex items-center gap-1 text-yellow-400">
              <Clock className="h-3 w-3" />
              <span>{tentativeAttendees.length}</span>
            </div>
          )}
          {pendingAttendees.length > 0 && (
            <div className="flex items-center gap-1 text-gray-400">
              <Clock className="h-3 w-3" />
              <span>{pendingAttendees.length}</span>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
