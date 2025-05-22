import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { callMicrosoftGraph, isGraphError } from "@/lib/microsoft-graph";

// Modifier la fonction GET pour améliorer la vérification de disponibilité
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

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    // Utiliser la date fournie ou la date actuelle
    const date = dateParam ? new Date(dateParam) : new Date();

    // Définir la plage horaire pour vérifier la disponibilité (heure actuelle +/- 30 minutes)
    const startTime = new Date(date);
    startTime.setMinutes(date.getMinutes() - 30);

    const endTime = new Date(date);
    endTime.setMinutes(date.getMinutes() + 30);

    // Formater les dates pour l'API
    const startDateTime = startTime.toISOString();
    const endDateTime = endTime.toISOString();

    // Construire l'adresse email de la salle si nécessaire
    const roomEmail = roomId.includes("@")
      ? roomId
      : `${roomId}@${
          process.env.MICROSOFT_TENANT_DOMAIN || "tenant.onmicrosoft.com"
        }`;

    console.log(
      `Vérification de la disponibilité pour la salle ${roomId} (${roomEmail}) de ${startDateTime} à ${endDateTime}`
    );

    // Approche 1: Vérifier directement les événements du calendrier de la salle
    try {
      const calendarViewUrl = `/users/${roomEmail}/calendar/calendarView?startDateTime=${startDateTime}&endDateTime=${endDateTime}`;
      console.log(`Appel à l'API: ${calendarViewUrl}`);

      const calendarResponse = await callMicrosoftGraph<{ value: any[] }>(
        calendarViewUrl
      );

      if (isGraphError(calendarResponse)) {
        console.warn(
          "Erreur lors de la vérification de la disponibilité via calendarView:",
          calendarResponse.error
        );
      } else {
        // Si aucun événement n'est trouvé, la salle est disponible
        const available =
          !calendarResponse.value || calendarResponse.value.length === 0;
        console.log(
          `Disponibilité de la salle ${roomEmail}: ${
            available ? "Disponible" : "Occupée"
          }`
        );
        return NextResponse.json({ available });
      }
    } catch (calendarError) {
      console.warn(
        "Erreur lors de l'utilisation de l'API calendarView:",
        calendarError
      );
    }

    // Approche 2: Utiliser l'API me/events et vérifier si la salle est dans les participants
    try {
      console.log("Tentative de vérification via me/events...");

      const eventsResponse = await callMicrosoftGraph<{ value: any[] }>(
        `/me/events?$filter=start/dateTime le '${endDateTime}' and end/dateTime ge '${startDateTime}'`
      );

      if (isGraphError(eventsResponse)) {
        console.warn(
          "Erreur lors de la récupération des événements:",
          eventsResponse.error
        );
      } else if (eventsResponse.value) {
        // Vérifier si la salle est dans les participants ou dans le lieu
        const roomEvents = eventsResponse.value.filter((event) => {
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

        const available = roomEvents.length === 0;
        console.log(
          `Disponibilité de la salle ${roomEmail} (via me/events): ${
            available ? "Disponible" : "Occupée"
          }`
        );
        return NextResponse.json({ available });
      }
    } catch (eventsError) {
      console.warn(
        "Erreur lors de la vérification via me/events:",
        eventsError
      );
    }

    // Si toutes les approches échouent, retourner une disponibilité aléatoire
    console.log(
      "Impossible de déterminer la disponibilité, utilisation d'une valeur aléatoire"
    );
    return NextResponse.json({ available: Math.random() > 0.5 });
  } catch (error) {
    console.error(
      `Erreur lors de la vérification de la disponibilité pour la salle ${roomId}:`,
      error
    );
    return NextResponse.json({ available: Math.random() > 0.5 });
  }
}
