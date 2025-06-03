"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, RefreshCw, MapPin, UsersIcon, Sparkles } from "lucide-react";
import { fetchMeetings } from "@/lib/api";
import { MeetingsSection } from "@/components/meetings-section";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MeetingRoom, Meeting } from "@/lib/types";
import Link from "next/link";
import { CalendarIcon } from "lucide-react";
import {
  isMeetingActive,
  calculateMeetingProgress,
  getTimeUntilEnd,
  getTimeUntilStart,
  isToday,
  formatFrenchTime,
} from "@/lib/date-utils";

interface MeetingRoomCardProps {
  room: MeetingRoom;
  index: number;
}

export function MeetingRoomCard({ room, index }: MeetingRoomCardProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMeeting, setCurrentMeeting] = useState<Meeting | null>(null);
  const [occupancyPercentage, setOccupancyPercentage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [nextMeeting, setNextMeeting] = useState<Meeting | null>(null);

  useEffect(() => {
    const loadMeetings = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log(
          `Chargement des réunions pour la salle ${room.name} (${room.id})...`
        );
        const data = await fetchMeetings(room.id);
        console.log(
          `${data.length} réunions récupérées pour ${room.name}:`,
          data
        );

        setMeetings(data);
        setLastUpdated(new Date());
      } catch (err) {
        console.error(
          `Erreur lors du chargement des réunions pour ${room.name}:`,
          err
        );
        setError(`Impossible de charger les réunions pour cette salle.`);
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
      const now = new Date();

      const sortedMeetings = [...meetings].sort((a, b) => {
        return (
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
      });

      const current = sortedMeetings.find((meeting) =>
        isMeetingActive(meeting.startTime, meeting.endTime)
      );
      setCurrentMeeting(current || null);

      const next = sortedMeetings.find((meeting) => {
        const startUTC = new Date(meeting.startTime);
        return startUTC > now;
      });
      setNextMeeting(next || null);

      if (current) {
        const percentage = calculateMeetingProgress(
          current.startTime,
          current.endTime
        );
        setOccupancyPercentage(percentage);
      } else {
        setOccupancyPercentage(0);
      }
    };

    updateCurrentStatus();
    const interval = setInterval(updateCurrentStatus, 10 * 1000);
    return () => clearInterval(interval);
  }, [meetings]);

  const isOccupied = currentMeeting !== null;
  const todayMeetings = meetings.filter((meeting) =>
    isToday(meeting.startTime)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        type: "spring",
        stiffness: 100,
      }}
      whileHover={{
        y: -5,
        transition: { duration: 0.2 },
      }}
      className="h-full"
    >
      <Card
        className={cn(
          "h-[500px] flex flex-col transition-all duration-500 hover:shadow-xl relative overflow-hidden",
          isOccupied
            ? "border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50/50 to-red-100/30 dark:from-red-950/20 dark:to-red-900/10"
            : "border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50/50 to-green-100/30 dark:from-green-950/20 dark:to-green-900/10",
          "backdrop-blur-sm"
        )}
      >
        {/* Effet de brillance en arrière-plan */}
        <motion.div
          className={cn(
            "absolute inset-0 opacity-30",
            isOccupied
              ? "bg-gradient-to-br from-red-500/10 via-transparent to-red-600/10"
              : "bg-gradient-to-br from-green-500/10 via-transparent to-green-600/10"
          )}
          animate={{
            background: isOccupied
              ? [
                  "linear-gradient(45deg, rgba(239,68,68,0.1) 0%, transparent 50%, rgba(220,38,38,0.1) 100%)",
                  "linear-gradient(45deg, rgba(220,38,38,0.1) 0%, transparent 50%, rgba(239,68,68,0.1) 100%)",
                ]
              : [
                  "linear-gradient(45deg, rgba(34,197,94,0.1) 0%, transparent 50%, rgba(22,163,74,0.1) 100%)",
                  "linear-gradient(45deg, rgba(22,163,74,0.1) 0%, transparent 50%, rgba(34,197,94,0.1) 100%)",
                ],
          }}
          transition={{
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
        />

        <CardHeader className="pb-3 relative z-10">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-bold truncate">
                {room.name}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <MapPin className="h-4 w-4" />
                <span>{room.location}</span>
                <span>•</span>
                <UsersIcon className="h-4 w-4" />
                <span>{room.capacity} personnes (capacité max)</span>
              </CardDescription>
            </div>

            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: isOccupied ? [0, 5, -5, 0] : 0,
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              }}
            >
              <Badge
                variant={isOccupied ? "destructive" : "success"}
                className={cn(
                  "font-semibold px-3 py-1 shadow-lg",
                  isOccupied && "animate-pulse"
                )}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                {isOccupied ? "Occupée" : "Disponible"}
              </Badge>
            </motion.div>
          </div>

          {/* Équipements */}
          {room.features.length > 0 && (
            <motion.div
              className="flex flex-wrap gap-1 mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {room.features.slice(0, 3).map((feature, idx) => (
                <motion.span
                  key={feature}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + idx * 0.1 }}
                  className="bg-secondary/80 text-secondary-foreground px-2 py-1 rounded-md text-xs font-medium"
                >
                  {feature}
                </motion.span>
              ))}
              {room.features.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{room.features.length - 3}
                </span>
              )}
            </motion.div>
          )}
        </CardHeader>

        <CardContent className="flex-1 flex flex-col relative z-10">
          {/* Statut actuel */}
          {isOccupied && currentMeeting && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
            >
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="font-semibold text-red-700 dark:text-red-300">
                  {currentMeeting.subject}
                </span>
                <span className="text-red-600 dark:text-red-400 text-xs">
                  {formatFrenchTime(currentMeeting.endTime)}
                </span>
              </div>
              <Progress value={occupancyPercentage} className="h-2 mb-2" />
              <div className="text-xs text-red-600 dark:text-red-400 text-right font-medium">
                Temps restant: {getTimeUntilEnd(currentMeeting.endTime)}
              </div>
              <div className="text-xs text-red-600 dark:text-red-400 text-right font-medium">
                {currentMeeting.organizer}
              </div>
            </motion.div>
          )}

          {!isOccupied && nextMeeting && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20"
            >
              <div className="text-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-blue-700 dark:text-blue-300">
                    Prochaine réunion:
                  </span>
                  <span className="text-blue-600 dark:text-blue-400 text-xs">
                    {formatFrenchTime(nextMeeting.startTime)}
                  </span>
                </div>
                <div className="text-blue-800 dark:text-blue-200 font-medium">
                  {nextMeeting.subject}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Dans {getTimeUntilStart(nextMeeting.startTime)}
                </div>
              </div>
            </motion.div>
          )}

          {/* Section des réunions */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">
                  Réunions aujourd'hui ({todayMeetings.length})
                </span>
              </div>
              <Button variant="outline" size="sm" className="h-8 gap-1" asChild>
                <Link href={`/rooms/${room.id}`}>
                  <CalendarIcon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Planning</span>
                </Link>
              </Button>
            </div>

            {error ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-destructive py-4 text-center"
              >
                {error}
              </motion.div>
            ) : (
              <div className="flex-1">
                <MeetingsSection meetings={todayMeetings} loading={loading} />
              </div>
            )}
          </div>

          {/* Footer avec dernière mise à jour */}
          {lastUpdated && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-xs text-muted-foreground text-right mt-3 pt-2 border-t border-border/50"
            >
              <div className="flex items-center justify-end gap-1">
                <RefreshCw className="h-3 w-3" />
                <span>
                  Mis à jour à {lastUpdated.toLocaleTimeString("fr-FR")}
                </span>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
