import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { callMicrosoftGraph, isGraphError } from "@/lib/microsoft-graph";
import type { Meeting } from "@/lib/types";

export async function GET(
  request: Request,
  { params }: { params: { roomId: string } }
) {
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

    // Formater les dates pour l'API - IMPORTANT: utiliser le fuseau horaire français
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
      // Essayer d'abord avec le calendrier de la salle - SANS $expand
      const calendarViewUrl = `/users/${roomEmail}/calendar/calendarView?startDateTime=${startDateTime}&endDateTime=${endDateTime}&$select=id,subject,start,end,organizer,attendees`;
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

        // DEBUG: Afficher les données brutes de Microsoft Graph
        console.log("=== DONNÉES BRUTES MICROSOFT GRAPH ===");
        calendarResponse.value.forEach((event, index) => {
          console.log(`Événement ${index + 1}:`);
          console.log("  Sujet:", event.subject);
          console.log("  Organisateur:", event.organizer);
          console.log("  Participants:", event.attendees);
          console.log("  Début brut:", event.start);
          console.log("  Fin brute:", event.end);
        });
        console.log("=====================================");

        // Transformer les données pour correspondre à notre format
        const meetings: Meeting[] = calendarResponse.value.map((event) => {
          // Gérer les différents formats de date que Microsoft Graph peut retourner
          let startTime: string;
          let endTime: string;

          if (event.start?.dateTime) {
            // Si Microsoft Graph retourne un objet avec dateTime et timeZone
            if (event.start.timeZone && event.start.timeZone !== "UTC") {
              // Si le fuseau horaire n'est pas UTC, on doit convertir
              console.log(`Fuseau horaire détecté: ${event.start.timeZone}`);

              // Créer une date en tenant compte du fuseau horaire
              const startDate = new Date(event.start.dateTime);
              const endDate = new Date(event.end.dateTime);

              // Si le fuseau horaire est déjà français, pas besoin de conversion
              if (
                event.start.timeZone.includes("Paris") ||
                event.start.timeZone.includes("Europe")
              ) {
                startTime = startDate.toISOString();
                endTime = endDate.toISOString();
              } else {
                // Sinon, traiter comme UTC
                startTime = event.start.dateTime.endsWith("Z")
                  ? event.start.dateTime
                  : event.start.dateTime + "Z";
                endTime = event.end.dateTime.endsWith("Z")
                  ? event.end.dateTime
                  : event.end.dateTime + "Z";
              }
            } else {
              // Traiter comme UTC si pas de fuseau horaire spécifié
              startTime = event.start.dateTime.endsWith("Z")
                ? event.start.dateTime
                : event.start.dateTime + "Z";
              endTime = event.end.dateTime.endsWith("Z")
                ? event.end.dateTime
                : event.end.dateTime + "Z";
            }
          } else {
            // Format de date simple
            startTime = new Date(event.start).toISOString();
            endTime = new Date(event.end).toISOString();
          }

          // Traiter les participants réels
          const realAttendees = event.attendees
            ? event.attendees
                .filter((attendee: any) => {
                  // Exclure les salles de réunion et ne garder que les vraies personnes
                  const email =
                    attendee.emailAddress?.address?.toLowerCase() || "";
                  const isResource = attendee.type === "resource";
                  const isRoom =
                    email.includes("room") ||
                    email.includes("salle") ||
                    email.includes("mtr");
                  const isSameAsRoomEmail = email === roomEmail.toLowerCase();

                  console.log(
                    `Participant: ${attendee.emailAddress?.name} (${email})`
                  );
                  console.log(`  - Type: ${attendee.type}`);
                  console.log(`  - Est une ressource: ${isResource}`);
                  console.log(`  - Est une salle: ${isRoom}`);
                  console.log(
                    `  - Est la salle actuelle: ${isSameAsRoomEmail}`
                  );
                  console.log(`  - Statut brut:`, attendee.status);
                  console.log(
                    `  - Statut response:`,
                    attendee.status?.response
                  );

                  // Garder seulement les vraies personnes
                  return (
                    !isResource &&
                    !isRoom &&
                    !isSameAsRoomEmail &&
                    email.length > 0
                  );
                })
                .map((attendee: any) => {
                  // Améliorer la gestion du statut
                  let status = "none";
                  if (attendee.status && attendee.status.response) {
                    status = attendee.status.response.toLowerCase();
                  }

                  console.log(
                    `Mapping participant ${attendee.emailAddress?.name}: status final = ${status}`
                  );

                  return {
                    name: attendee.emailAddress?.name || "Participant inconnu",
                    email: attendee.emailAddress?.address || "",
                    status: status, // Utiliser le statut traité
                    type: attendee.type || "required",
                    // Ne pas définir photo ici, elle sera récupérée par le composant AvatarEnhanced
                    photo: undefined,
                  };
                })
            : [];

          // Informations de l'organisateur
          const organizerDetails = event.organizer?.emailAddress
            ? {
                name:
                  event.organizer.emailAddress.name || "Organisateur inconnu",
                email: event.organizer.emailAddress.address || "",
                // Ne pas définir photo ici, elle sera récupérée par le composant AvatarEnhanced
                photo: undefined,
              }
            : undefined;

          console.log(`Conversion pour ${event.subject}:`);
          console.log(`  Original: ${event.start?.dateTime || event.start}`);
          console.log(`  Converti: ${startTime}`);
          console.log(`  Participants réels: ${realAttendees.length}`);
          console.log(`  Organisateur:`, organizerDetails);

          return {
            id: event.id,
            subject: event.subject || "Réunion sans titre",
            startTime,
            endTime,
            organizer:
              event.organizer?.emailAddress?.name || "Organisateur inconnu",
            organizerDetails,
            attendeeCount: realAttendees.length,
            attendees: realAttendees,
            roomId,
          };
        });

        return NextResponse.json(meetings);
      }

      console.log(`Aucune réunion trouvée pour la salle ${roomEmail}`);
      return NextResponse.json([]);
    } catch (error) {
      console.error(
        `Erreur lors de la récupération des réunions pour la salle ${roomId}:`,
        error
      );

      // En cas d'erreur, essayer une approche alternative
      try {
        console.log(
          "Tentative de récupération des événements via me/events..."
        );

        // SANS $expand=attendees car ce n'est pas supporté
        const eventsResponse = await callMicrosoftGraph<{ value: any[] }>(
          `/me/events?$filter=start/dateTime ge '${startDateTime}' and end/dateTime le '${endDateTime}'&$top=100&$select=id,subject,start,end,organizer,attendees,location`
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
            // DEBUG: Afficher les données brutes
            console.log("=== DONNÉES BRUTES ME/EVENTS ===");
            roomEvents.forEach((event, index) => {
              console.log(`Événement ${index + 1}:`);
              console.log("  Sujet:", event.subject);
              console.log("  Organisateur:", event.organizer);
              console.log("  Participants:", event.attendees);
              console.log("  Début brut:", event.start);
              console.log("  Fin brute:", event.end);
            });
            console.log("===============================");

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

              // Traiter les participants réels
              const realAttendees = event.attendees
                ? event.attendees
                    .filter((attendee: any) => {
                      // Exclure les salles de réunion et ne garder que les vraies personnes
                      const email =
                        attendee.emailAddress?.address?.toLowerCase() || "";
                      const isResource = attendee.type === "resource";
                      const isRoom =
                        email.includes("room") ||
                        email.includes("salle") ||
                        email.includes("mtr");
                      const isSameAsRoomEmail =
                        email === roomEmail.toLowerCase();

                      console.log(
                        `Participant (me/events): ${attendee.emailAddress?.name} (${email})`
                      );
                      console.log(`  - Type: ${attendee.type}`);
                      console.log(`  - Est une ressource: ${isResource}`);
                      console.log(`  - Est une salle: ${isRoom}`);
                      console.log(
                        `  - Est la salle actuelle: ${isSameAsRoomEmail}`
                      );
                      console.log(`  - Statut brut:`, attendee.status);
                      console.log(
                        `  - Statut response:`,
                        attendee.status?.response
                      );

                      // Garder seulement les vraies personnes
                      return (
                        !isResource &&
                        !isRoom &&
                        !isSameAsRoomEmail &&
                        email.length > 0
                      );
                    })
                    .map((attendee: any) => {
                      // Améliorer la gestion du statut
                      let status = "none";
                      if (attendee.status && attendee.status.response) {
                        status = attendee.status.response.toLowerCase();
                      }

                      console.log(
                        `Mapping participant (me/events) ${attendee.emailAddress?.name}: status final = ${status}`
                      );

                      return {
                        name:
                          attendee.emailAddress?.name || "Participant inconnu",
                        email: attendee.emailAddress?.address || "",
                        status: status, // Utiliser le statut traité
                        type: attendee.type || "required",
                        // Ne pas définir photo ici, elle sera récupérée par le composant AvatarEnhanced
                        photo: undefined,
                      };
                    })
                : [];

              // Informations de l'organisateur
              const organizerDetails = event.organizer?.emailAddress
                ? {
                    name:
                      event.organizer.emailAddress.name ||
                      "Organisateur inconnu",
                    email: event.organizer.emailAddress.address || "",
                    // Ne pas définir photo ici, elle sera récupérée par le composant AvatarEnhanced
                    photo: undefined,
                  }
                : undefined;

              return {
                id: event.id,
                subject: event.subject || "Réunion sans titre",
                startTime,
                endTime,
                organizer:
                  event.organizer?.emailAddress?.name || "Organisateur inconnu",
                organizerDetails,
                attendeeCount: realAttendees.length,
                attendees: realAttendees,
                roomId,
              };
            });

            return NextResponse.json(meetings);
          }
        }

        console.log(`Aucun événement trouvé pour la salle ${roomEmail}`);
        return NextResponse.json([]);
      } catch (alternativeError) {
        console.error(
          "Erreur lors de l'approche alternative:",
          alternativeError
        );
        return NextResponse.json([]);
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
