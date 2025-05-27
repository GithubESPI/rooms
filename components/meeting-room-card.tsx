"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "lucide-react";
import { fetchMeetings } from "@/lib/api";
import { MeetingItem } from "@/components/meeting-item";
import { Skeleton } from "@/components/ui/skeleton";
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
  debugTimeAnalysis, // Remplacer debugTimeConversion par debugTimeAnalysis
} from "@/lib/date-utils";

interface MeetingRoomCardProps {
  room: MeetingRoom;
}

export function MeetingRoomCard({ room }: MeetingRoomCardProps) {
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

        // Debug: afficher les heures pour la première réunion
        if (data.length > 0) {
          console.log("=== DEBUG PREMIÈRE RÉUNION ===");
          console.log("Réunion:", data[0].subject);
          debugTimeAnalysis(data[0].startTime, "START");
          debugTimeAnalysis(data[0].endTime, "END");
        }

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
    // Refresh meetings every 2 minutes
    const interval = setInterval(loadMeetings, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [room.id, room.name]);

  useEffect(() => {
    const updateCurrentStatus = () => {
      const now = new Date();

      // Trier les réunions par heure de début UTC (pas besoin de convertir pour le tri)
      const sortedMeetings = [...meetings].sort((a, b) => {
        return (
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
      });

      // Trouver la réunion en cours
      const current = sortedMeetings.find((meeting) =>
        isMeetingActive(meeting.startTime, meeting.endTime)
      );

      setCurrentMeeting(current || null);

      // Trouver la prochaine réunion
      const next = sortedMeetings.find((meeting) => {
        const startUTC = new Date(meeting.startTime);
        return startUTC > now;
      });

      setNextMeeting(next || null);

      // Calculer le pourcentage d'occupation pour la réunion en cours
      if (current) {
        const percentage = calculateMeetingProgress(
          current.startTime,
          current.endTime
        );
        setOccupancyPercentage(percentage);

        // Debug pour la réunion en cours
        console.log("=== RÉUNION EN COURS ===");
        console.log("Sujet:", current.subject);
        console.log("Heure UTC début:", current.startTime);
        console.log("Heure UTC fin:", current.endTime);
        console.log(
          "Heure française début:",
          formatFrenchTime(current.startTime)
        );
        console.log("Heure française fin:", formatFrenchTime(current.endTime));
        console.log("Progression:", percentage + "%");
      } else {
        setOccupancyPercentage(0);
      }
    };

    updateCurrentStatus();
    // Update every 10 seconds for a smoother experience
    const interval = setInterval(updateCurrentStatus, 10 * 1000);
    return () => clearInterval(interval);
  }, [meetings]);

  const isOccupied = currentMeeting !== null;
  const todayMeetings = meetings.filter((meeting) =>
    isToday(meeting.startTime)
  );

  // Trier les réunions par heure de début UTC
  const sortedTodayMeetings = [...todayMeetings].sort((a, b) => {
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  });

  return (
    <Card
      className={cn(
        "transition-all duration-300 hover:shadow-md",
        isOccupied
          ? "border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-900/10"
          : "border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-900/10"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{room.name}</CardTitle>
            <CardDescription>
              {room.location} • Capacité: {room.capacity} personnes
            </CardDescription>
          </div>
          <Badge
            variant={isOccupied ? "destructive" : "success"}
            className="animate-pulse"
          >
            {isOccupied ? "Occupée" : "Disponible"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isOccupied && currentMeeting && (
          <div className="mb-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{currentMeeting.subject}</span>
              <span className="text-muted-foreground">
                {formatFrenchTime(currentMeeting.endTime)}
              </span>
            </div>
            <Progress
              value={occupancyPercentage}
              className="h-2 transition-all duration-300"
            />
            <div className="text-xs text-muted-foreground text-right">
              Temps restant: {getTimeUntilEnd(currentMeeting.endTime)}
            </div>
          </div>
        )}

        {!isOccupied && nextMeeting && (
          <div className="mb-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Prochaine réunion:</span>
              <span className="text-muted-foreground">
                {formatFrenchTime(nextMeeting.startTime)}
              </span>
            </div>
            <div className="text-sm">{nextMeeting.subject}</div>
            <div className="text-xs text-muted-foreground">
              Dans {getTimeUntilStart(nextMeeting.startTime)}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
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

          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : error ? (
            <div className="text-sm text-destructive py-2">{error}</div>
          ) : sortedTodayMeetings.length === 0 ? (
            <div className="text-sm text-muted-foreground py-2">
              Aucune réunion prévue aujourd'hui
            </div>
          ) : (
            <div className="space-y-2">
              {sortedTodayMeetings.map((meeting) => (
                <MeetingItem key={meeting.id} meeting={meeting} />
              ))}
            </div>
          )}

          {lastUpdated && (
            <div className="text-xs text-muted-foreground text-right">
              Mis à jour à {lastUpdated.toLocaleTimeString("fr-FR")}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
