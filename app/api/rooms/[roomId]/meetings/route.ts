import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { callMicrosoftGraph, isGraphError } from "@/lib/microsoft-graph";
import type { Meeting, Attendee } from "@/lib/types";

export async function GET(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  // Await params to fix Next.js error
  const resolvedParams = await params;

  if (!resolvedParams || typeof resolvedParams !== "object") {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const roomId = resolvedParams.roomId;

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
      `📅 Récupération des réunions pour la salle ${roomId} (${roomEmail}) du ${startDateTime} au ${endDateTime}`
    );

    // Utiliser l'endpoint correct pour récupérer les réunions d'une salle avec les participants
    try {
      // CORRECTION: Suppression de isPrivate qui n'est pas supporté par l'API
      const calendarViewUrl = `/users/${roomEmail}/calendar/calendarView?startDateTime=${startDateTime}&endDateTime=${endDateTime}&$select=id,subject,start,end,organizer,attendees,responseStatus,body`;
      console.log(`🔍 Appel à l'API: ${calendarViewUrl}`);

      const calendarResponse = await callMicrosoftGraph<{ value: any[] }>(
        calendarViewUrl
      );

      if (isGraphError(calendarResponse)) {
        console.error(
          "❌ Erreur lors de la récupération des réunions:",
          calendarResponse.error
        );
        throw new Error(
          `Échec de la récupération des réunions: ${calendarResponse.error.message}`
        );
      }

      if (calendarResponse.value && calendarResponse.value.length > 0) {
        console.log(
          `📊 ${calendarResponse.value.length} réunions trouvées pour la salle ${roomEmail}`
        );

        // Transformer les données pour correspondre à notre format
        const meetings: Meeting[] = calendarResponse.value.map((event) => {
          // Gérer les différents formats de date
          let startTime: string;
          let endTime: string;

          if (event.start?.dateTime) {
            if (event.start.timeZone && event.start.timeZone !== "UTC") {
              console.log(`🌍 Fuseau horaire détecté: ${event.start.timeZone}`);

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

          // Traitement des participants
          const attendees: Attendee[] = event.attendees
            ? event.attendees
                .filter((attendee: any) => {
                  // Filtrer les ressources et les salles
                  return (
                    attendee.emailAddress &&
                    attendee.emailAddress.address &&
                    attendee.type !== "resource" &&
                    !attendee.emailAddress.address
                      .toLowerCase()
                      .includes("room") &&
                    !attendee.emailAddress.address
                      .toLowerCase()
                      .includes("salle") &&
                    !attendee.emailAddress.address
                      .toLowerCase()
                      .includes("mtr") &&
                    attendee.emailAddress.address.toLowerCase() !==
                      roomEmail.toLowerCase()
                  );
                })
                .map((attendee: any) => ({
                  name:
                    attendee.emailAddress.name ||
                    attendee.emailAddress.address.split("@")[0] ||
                    "Participant",
                  email: attendee.emailAddress.address,
                  status: attendee.status?.response || "none",
                  type: attendee.type || "required",
                }))
            : [];

          console.log(`📊 Conversion pour ${event.subject}:`);
          console.log(`  🕐 Original: ${event.start?.dateTime || event.start}`);
          console.log(`  🕐 Converti: ${startTime}`);
          console.log(`  👤 Organisateur:`, organizerDetails);
          console.log(`  👥 Participants: ${attendees.length}`);

          return {
            id: event.id,
            subject: event.subject || "Réunion sans titre",
            startTime,
            endTime,
            organizer: organizerDetails?.name || "Organisateur inconnu",
            organizerDetails,
            attendeeCount: attendees.length,
            attendees,
            roomId,
            description: event.body?.content || undefined,
            // Suppression de isPrivate qui n'est pas supporté
          };
        });

        return NextResponse.json(meetings);
      }

      console.log(`📭 Aucune réunion trouvée pour la salle ${roomEmail}`);
      return NextResponse.json([]);
    } catch (error) {
      console.error(
        `💥 Erreur lors de la récupération des réunions pour la salle ${roomId}:`,
        error
      );

      // En cas d'erreur, essayer une approche alternative
      try {
        console.log("🔄 Tentative de récupération via me/events...");

        // CORRECTION: Suppression de isPrivate qui n'est pas supporté par l'API
        const eventsResponse = await callMicrosoftGraph<{ value: any[] }>(
          `/me/events?$filter=start/dateTime ge '${startDateTime}' and end/dateTime le '${endDateTime}'&$top=100&$select=id,subject,start,end,organizer,location,attendees,body`
        );

        if (isGraphError(eventsResponse)) {
          console.error(
            "❌ Erreur lors de la récupération des événements:",
            eventsResponse.error
          );
          throw new Error(
            `Échec de la récupération des événements: ${eventsResponse.error.message}`
          );
        }

        if (eventsResponse.value && eventsResponse.value.length > 0) {
          // Filtrer les événements qui concernent cette salle
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

          console.log(
            `📊 ${roomEvents.length} événements trouvés pour la salle ${roomEmail}`
          );

          if (roomEvents.length > 0) {
            const meetings: Meeting[] = roomEvents.map((event) => {
              let startTime: string;
              let endTime: string;

              if (event.start?.dateTime) {
                startTime = event.start.dateTime.endsWith("Z")
                  ? event.start.dateTime
                  : event.start.dateTime + "Z";
                endTime = event.end.dateTime.endsWith("Z")
                  ? event.end.dateTime
                  : event.end.dateTime + "Z";
              } else {
                startTime = new Date(event.start).toISOString();
                endTime = new Date(event.end).toISOString();
              }

              const organizerDetails = event.organizer?.emailAddress
                ? {
                    name:
                      event.organizer.emailAddress.name ||
                      event.organizer.emailAddress.address?.split("@")[0] ||
                      "Organisateur inconnu",
                    email: event.organizer.emailAddress.address || "",
                  }
                : undefined;

              // Traitement des participants pour l'approche alternative
              const attendees: Attendee[] = event.attendees
                ? event.attendees
                    .filter((attendee: any) => {
                      return (
                        attendee.emailAddress &&
                        attendee.emailAddress.address &&
                        attendee.type !== "resource" &&
                        !attendee.emailAddress.address
                          .toLowerCase()
                          .includes("room") &&
                        !attendee.emailAddress.address
                          .toLowerCase()
                          .includes("salle") &&
                        !attendee.emailAddress.address
                          .toLowerCase()
                          .includes("mtr") &&
                        attendee.emailAddress.address.toLowerCase() !==
                          roomEmail.toLowerCase()
                      );
                    })
                    .map((attendee: any) => ({
                      name:
                        attendee.emailAddress.name ||
                        attendee.emailAddress.address.split("@")[0] ||
                        "Participant",
                      email: attendee.emailAddress.address,
                      status: attendee.status?.response || "none",
                      type: attendee.type || "required",
                    }))
                : [];

              return {
                id: event.id,
                subject: event.subject || "Réunion sans titre",
                startTime,
                endTime,
                organizer: organizerDetails?.name || "Organisateur inconnu",
                organizerDetails,
                attendeeCount: attendees.length,
                attendees,
                roomId,
                description: event.body?.content || undefined,
                // Suppression de isPrivate qui n'est pas supporté
              };
            });

            return NextResponse.json(meetings);
          }
        }

        console.log(`📭 Aucun événement trouvé pour la salle ${roomEmail}`);
        return NextResponse.json([]);
      } catch (alternativeError) {
        console.error(
          "💥 Erreur lors de l'approche alternative:",
          alternativeError
        );
        return NextResponse.json([]);
      }
    }
  } catch (error) {
    console.error(
      `💥 Erreur lors de la récupération des réunions pour la salle ${roomId}:`,
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
