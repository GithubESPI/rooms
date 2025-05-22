"use client";

import React from "react";

import { useState, useEffect } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  addWeeks,
  subWeeks,
} from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchMeetings } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import type { Meeting, MeetingRoom } from "@/lib/types";

interface WeeklyCalendarProps {
  room: MeetingRoom;
}

export function WeeklyCalendar({ room }: WeeklyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Calculer les dates de début et de fin de la semaine
  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Semaine commence le lundi
  const endDate = endOfWeek(currentDate, { weekStartsOn: 1 });

  // Générer un tableau de jours pour la semaine
  const weekDays = eachDayOfInterval({ start: startDate, end: endDate });

  // Heures de la journée (de 8h à 19h)
  const hours = Array.from({ length: 12 }, (_, i) => i + 8);

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

  useEffect(() => {
    loadMeetings();
  }, [room.id, room.name, currentDate]);

  const navigateWeek = (direction: "prev" | "next") => {
    setCurrentDate((prev) =>
      direction === "prev" ? subWeeks(prev, 1) : addWeeks(prev, 1)
    );
  };

  // Fonction pour vérifier si une heure donnée a une réunion
  const getMeetingForHour = (day: Date, hour: number) => {
    const hourStart = new Date(day);
    hourStart.setHours(hour, 0, 0, 0);

    const hourEnd = new Date(day);
    hourEnd.setHours(hour + 1, 0, 0, 0);

    return meetings.find((meeting) => {
      const meetingStart = new Date(meeting.startTime);
      const meetingEnd = new Date(meeting.endTime);

      // Vérifier si la réunion chevauche cette heure
      return (
        isSameDay(day, meetingStart) &&
        meetingStart < hourEnd &&
        meetingEnd > hourStart
      );
    });
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Planning hebdomadaire: {room.name}</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateWeek("prev")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            {format(startDate, "dd MMM", { locale: fr })} -{" "}
            {format(endDate, "dd MMM yyyy", { locale: fr })}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateWeek("next")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={loadMeetings}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-[500px] w-full" />
          </div>
        ) : error ? (
          <div className="text-destructive p-4 text-center">{error}</div>
        ) : (
          <>
            <div className="grid grid-cols-8 gap-1 text-sm">
              {/* En-tête avec les jours de la semaine */}
              <div className="col-span-1"></div>
              {weekDays.map((day) => (
                <div
                  key={day.toString()}
                  className={cn(
                    "text-center font-medium py-2",
                    isSameDay(day, new Date()) && "bg-primary/10 rounded-t-md"
                  )}
                >
                  <div>{format(day, "EEE", { locale: fr })}</div>
                  <div>{format(day, "dd", { locale: fr })}</div>
                </div>
              ))}

              {/* Grille des heures et réunions */}
              {hours.map((hour) => (
                <React.Fragment key={hour}>
                  <div className="text-right pr-2 py-2 text-muted-foreground">
                    {hour}:00
                  </div>

                  {weekDays.map((day) => {
                    const meeting = getMeetingForHour(day, hour);
                    return (
                      <div
                        key={`${day}-${hour}`}
                        className={cn(
                          "border border-border min-h-[60px] p-1 transition-colors duration-200",
                          isSameDay(day, new Date()) && "bg-primary/5",
                          meeting && "bg-primary/20 hover:bg-primary/30"
                        )}
                      >
                        {meeting && (
                          <div className="text-xs">
                            <div className="font-medium truncate">
                              {meeting.subject}
                            </div>
                            <div className="text-muted-foreground">
                              {format(new Date(meeting.startTime), "HH:mm")} -{" "}
                              {format(new Date(meeting.endTime), "HH:mm")}
                            </div>
                            <div className="text-muted-foreground truncate">
                              {meeting.organizer}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>

            {lastUpdated && (
              <div className="text-xs text-muted-foreground text-right mt-4">
                Mis à jour à {lastUpdated.toLocaleTimeString("fr-FR")}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
