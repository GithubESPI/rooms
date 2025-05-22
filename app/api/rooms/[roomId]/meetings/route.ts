import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { callMicrosoftGraph, isGraphError } from "@/lib/microsoft-graph";
import type { Meeting } from "@/lib/types";

// Remplacer tout le contenu de la fonction GET par cette implémentation corrigée
export async function GET(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  // Assurez-vous que params est bien un objet et contient roomId
  if (!params || typeof params !== "object") {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const roomId = params.roomId;

  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

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
    const roomEmail = roomId.includes("@")
      ? roomId
      : `${roomId}@${
          process.env.MICROSOFT_TENANT_DOMAIN || "tenant.onmicrosoft.com"
        }`;

    console.log(
      `Récupération des réunions pour la salle ${roomId} (${roomEmail}) du ${startDateTime} au ${endDateTime}`
    );

    // Utiliser l'endpoint correct pour récupérer les réunions d'une salle
    try {
      const calendarViewUrl = `/users/${roomEmail}/calendar/calendarView?startDateTime=${startDateTime}&endDateTime=${endDateTime}`;
      console.log(`Appel à l'API: ${calendarViewUrl}`);

      const calendarResponse = await callMicrosoftGraph<{ value: any[] }>(
        calendarViewUrl
      );

      if (isGraphError(calendarResponse)) {
        console.error(
          "Erreur lors de la récupération des réunions:",
          calendarResponse.error
        );
        throw new Error(
          `Échec de la récupération des réunions: ${calendarResponse.error.message}`
        );
      }

      if (calendarResponse.value && calendarResponse.value.length > 0) {
        console.log(
          `${calendarResponse.value.length} réunions trouvées pour la salle ${roomEmail}`
        );

        // Transformer les données pour correspondre à notre format
        const meetings: Meeting[] = calendarResponse.value.map((event) => ({
          id: event.id,
          subject: event.subject || "Réunion sans titre",
          startTime: event.start.dateTime,
          endTime: event.end.dateTime,
          organizer:
            event.organizer?.emailAddress?.name || "Organisateur inconnu",
          attendeeCount: event.attendees?.length || 0,
          roomId,
        }));

        return NextResponse.json(meetings);
      }

      console.log(`Aucune réunion trouvée pour la salle ${roomEmail}`);
      return NextResponse.json([]); // Retourner un tableau vide plutôt que des données simulées
    } catch (error) {
      console.error(
        `Erreur lors de la récupération des réunions pour la salle ${roomId}:`,
        error
      );

      // En cas d'erreur, essayer une approche alternative
      try {
        // Essayer de récupérer les événements via l'API me/events et filtrer par salle
        console.log(
          "Tentative de récupération des événements via me/events..."
        );

        const eventsResponse = await callMicrosoftGraph<{ value: any[] }>(
          `/me/events?$filter=start/dateTime ge '${startDateTime}' and end/dateTime le '${endDateTime}'&$top=100`
        );

        if (isGraphError(eventsResponse)) {
          console.error(
            "Erreur lors de la récupération des événements:",
            eventsResponse.error
          );
          throw new Error(
            `Échec de la récupération des événements: ${eventsResponse.error.message}`
          );
        }

        if (eventsResponse.value && eventsResponse.value.length > 0) {
          // Filtrer les événements qui concernent cette salle
          const roomEvents = eventsResponse.value.filter((event) => {
            // Vérifier si la salle est dans les participants ou dans le lieu
            const isInAttendees = event.attendees?.some(
              (attendee: any) =>
                attendee.emailAddress?.address?.toLowerCase() ===
                roomEmail.toLowerCase()
            );

            const isInLocation =
              event.location?.displayName
                ?.toLowerCase()
                .includes(roomEmail.toLowerCase()) ||
              event.location?.displayName
                ?.toLowerCase()
                .includes(roomId.toLowerCase());

            return isInAttendees || isInLocation;
          });

          console.log(
            `${roomEvents.length} événements trouvés pour la salle ${roomEmail}`
          );

          if (roomEvents.length > 0) {
            // Transformer les données pour correspondre à notre format
            const meetings: Meeting[] = roomEvents.map((event) => ({
              id: event.id,
              subject: event.subject || "Réunion sans titre",
              startTime: event.start.dateTime,
              endTime: event.end.dateTime,
              organizer:
                event.organizer?.emailAddress?.name || "Organisateur inconnu",
              attendeeCount: event.attendees?.length || 0,
              roomId,
            }));

            return NextResponse.json(meetings);
          }
        }

        console.log(`Aucun événement trouvé pour la salle ${roomEmail}`);
        return NextResponse.json([]); // Retourner un tableau vide plutôt que des données simulées
      } catch (alternativeError) {
        console.error(
          "Erreur lors de l'approche alternative:",
          alternativeError
        );
        return NextResponse.json([]); // Retourner un tableau vide plutôt que des données simulées
      }
    }
  } catch (error) {
    console.error(
      `Erreur lors de la récupération des réunions pour la salle ${roomId}:`,
      error
    );
    return NextResponse.json(
      {
        error: "Une erreur s'est produite lors de la récupération des réunions",
      },
      { status: 500 }
    );
  }
}
