import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { callMicrosoftGraph, isGraphError } from "@/lib/microsoft-graph";
import type { MeetingRoom, Meeting } from "@/lib/types";

// Forcer le rendu dynamique
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Vérifier si l'utilisateur est authentifié
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    // Liste des salles autorisées
    const ALLOWED_ROOM_NAMES = [
      "Cronstadt-Box-droite",
      "Cronstadt-Box-gauche",
      "Cronstadt-Salle-de-reunion-bas-MTR",
      "Cronstadt-Salle-de-reunion-Haut",
    ];

    // Récupérer les salles via l'API Microsoft Graph
    let rooms: MeetingRoom[] = [];

    // Approche 1: Utiliser l'API findRooms
    try {
      const response = await callMicrosoftGraph<{ value: any[] }>(
        "/me/findRooms"
      );

      if (
        !isGraphError(response) &&
        response.value &&
        response.value.length > 0
      ) {
        rooms = response.value.map((room) => ({
          id: room.address,
          name: room.name,
          location: "Non spécifié",
          capacity: 0,
          features: [],
        }));
      }
    } catch (error) {
      console.warn("Erreur lors de l'utilisation de l'API findRooms:", error);
    }

    // Si aucune salle n'a été trouvée, essayer l'API places
    if (rooms.length === 0) {
      try {
        const placesResponse = await callMicrosoftGraph<{ value: any[] }>(
          "/places/microsoft.graph.room"
        );

        if (
          !isGraphError(placesResponse) &&
          placesResponse.value &&
          placesResponse.value.length > 0
        ) {
          rooms = placesResponse.value
            .filter(
              (room) => room.displayName && room.displayName.trim().length > 0
            )
            .map((room) => ({
              id: room.emailAddress || room.id,
              name: room.displayName,
              location: room.address?.city || room.building || "Non spécifié",
              capacity: room.capacity || 0,
              features: [
                ...(room.audioDeviceName ? ["Visioconférence"] : []),
                ...(room.videoDeviceName ? ["Caméra"] : []),
                ...(room.displayDevice ? ["Écran"] : []),
                ...(room.isWheelChairAccessible ? ["Accessible PMR"] : []),
              ],
            }));
        }
      } catch (error) {
        console.warn("Erreur lors de l'utilisation de l'API places:", error);
      }
    }

    // Filtrer les salles autorisées
    const filteredRooms = rooms.filter((room) =>
      ALLOWED_ROOM_NAMES.some((allowedName) => room.name.includes(allowedName))
    );

    // Pour chaque salle, récupérer les réunions du jour
    const roomsWithMeetings = await Promise.all(
      filteredRooms.map(async (room) => {
        try {
          // Définir la plage de temps pour aujourd'hui
          const now = new Date();
          const startOfDay = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          const endOfDay = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            23,
            59,
            59
          );

          // Formater les dates pour l'API
          const startDateTime = startOfDay.toISOString();
          const endDateTime = endOfDay.toISOString();

          // Construire l'adresse email de la salle si nécessaire
          const roomEmail = room.id.includes("@")
            ? room.id
            : `${room.id}@${
                process.env.MICROSOFT_TENANT_DOMAIN || "tenant.onmicrosoft.com"
              }`;

          // Récupérer les réunions de la salle
          const calendarViewUrl = `/users/${roomEmail}/calendar/calendarView?startDateTime=${startDateTime}&endDateTime=${endDateTime}&$select=id,subject,start,end,organizer,responseStatus`;
          const calendarResponse = await callMicrosoftGraph<{ value: any[] }>(
            calendarViewUrl
          );

          let meetings: Meeting[] = [];

          if (!isGraphError(calendarResponse) && calendarResponse.value) {
            meetings = calendarResponse.value.map((event) => {
              // Gérer les différents formats de date
              let startTime: string;
              let endTime: string;

              if (event.start?.dateTime) {
                if (event.start.timeZone && event.start.timeZone !== "UTC") {
                  const startDate = new Date(event.start.dateTime);
                  const endDate = new Date(event.end.dateTime);

                  if (
                    event.start.timeZone.includes("Paris") ||
                    event.start.timeZone.includes("Europe")
                  ) {
                    startTime = startDate.toISOString();
                    endTime = endDate.toISOString();
                  } else {
                    startTime = event.start.dateTime.endsWith("Z")
                      ? event.start.dateTime
                      : event.start.dateTime + "Z";
                    endTime = event.end.dateTime.endsWith("Z")
                      ? event.end.dateTime
                      : event.end.dateTime + "Z";
                  }
                } else {
                  startTime = event.start.dateTime.endsWith("Z")
                    ? event.start.dateTime
                    : event.start.dateTime + "Z";
                  endTime = event.end.dateTime.endsWith("Z")
                    ? event.end.dateTime
                    : event.end.dateTime + "Z";
                }
              } else {
                startTime = new Date(event.start).toISOString();
                endTime = new Date(event.end).toISOString();
              }

              // Informations de l'organisateur
              const organizerDetails = event.organizer?.emailAddress
                ? {
                    name:
                      event.organizer.emailAddress.name ||
                      event.organizer.emailAddress.address?.split("@")[0] ||
                      "Organisateur inconnu",
                    email: event.organizer.emailAddress.address || "",
                  }
                : undefined;

              return {
                id: event.id,
                subject: event.subject || "Réunion sans titre",
                startTime,
                endTime,
                organizer: organizerDetails?.name || "Organisateur inconnu",
                organizerDetails,
                attendeeCount: event.attendees?.length || 0,
                attendees: event.attendees || [],
                roomId: room.id,
              };
            });
          }

          return {
            ...room,
            meetings,
          };
        } catch (error) {
          console.error(
            `Erreur lors de la récupération des réunions pour ${room.name}:`,
            error
          );
          return {
            ...room,
            meetings: [],
          };
        }
      })
    );

    return NextResponse.json(roomsWithMeetings);
  } catch (error) {
    console.error("Erreur lors de la génération des données:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des données" },
      { status: 500 }
    );
  }
}
