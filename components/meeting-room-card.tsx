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

interface MeetingRoomCardProps {
  room: MeetingRoom;
}

// Modifier la fonction MeetingRoomCard pour améliorer l'affichage des réunions
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
    // Update every 10 seconds for a smoother experience
    const interval = setInterval(updateCurrentStatus, 10 * 1000);
    return () => clearInterval(interval);
  }, [meetings]);

  const isOccupied = currentMeeting !== null;
  const todayMeetings = meetings.filter((meeting) => {
    const meetingDate = new Date(meeting.startTime);
    const today = new Date();
    return (
      meetingDate.getDate() === today.getDate() &&
      meetingDate.getMonth() === today.getMonth() &&
      meetingDate.getFullYear() === today.getFullYear()
    );
  });

  // Trier les réunions par heure de début
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
        {isOccupied && (
          <div className="mb-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{currentMeeting.subject}</span>
              <span className="text-muted-foreground">
                {new Date(currentMeeting.endTime).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <Progress
              value={occupancyPercentage}
              className="h-2 transition-all duration-300"
            />
            <div className="text-xs text-muted-foreground text-right">
              Temps restant:{" "}
              {formatRemainingTime(new Date(currentMeeting.endTime))}
            </div>
          </div>
        )}

        {!isOccupied && nextMeeting && (
          <div className="mb-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Prochaine réunion:</span>
              <span className="text-muted-foreground">
                {new Date(nextMeeting.startTime).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div className="text-sm">{nextMeeting.subject}</div>
            <div className="text-xs text-muted-foreground">
              Dans {formatTimeUntil(new Date(nextMeeting.startTime))}
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

// Fonction pour formater le temps restant
function formatRemainingTime(endTime: Date): string {
  const now = new Date();
  const diff = endTime.getTime() - now.getTime();

  if (diff <= 0) {
    return "Terminé";
  }

  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  if (minutes > 0) {
    return `${minutes} min ${seconds} s`;
  } else {
    return `${seconds} s`;
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
    return `${minutes} minute${minutes > 1 ? "s" : ""}`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours} heure${hours > 1 ? "s" : ""}`;
    } else {
      return `${hours}h${remainingMinutes.toString().padStart(2, "0")}`;
    }
  }
}
