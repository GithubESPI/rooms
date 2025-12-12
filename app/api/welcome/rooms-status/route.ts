import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { callMicrosoftGraph, isGraphError } from "@/lib/microsoft-graph";
import type { MeetingRoom, Meeting, Attendee } from "@/lib/types";

// Liste des noms de salles autorisés (identique à celle utilisée dans meeting-room-dashboard.tsx)
const ALLOWED_ROOM_NAMES = [
  "Cronstadt-Box-droite",
  "Cronstadt-Box-gauche",
  "Cronstadt-Salle-de-reunion-bas-MTR",
  "Cronstadt-Salle-de-reunion-Haut",
];

/**
 * Récupère les réunions d'aujourd'hui pour une salle donnée
 */
async function fetchTodayMeetings(roomId: string): Promise<Meeting[]> {
  try {
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

    const startDateTime = startOfDay.toISOString();
    const endDateTime = endOfDay.toISOString();

    const roomEmail = roomId.includes("@")
      ? roomId
      : `${roomId}@${
          process.env.MICROSOFT_TENANT_DOMAIN || "tenant.onmicrosoft.com"
        }`;

    const calendarViewUrl = `/users/${roomEmail}/calendar/calendarView?startDateTime=${startDateTime}&endDateTime=${endDateTime}&$select=id,subject,start,end,organizer,attendees,responseStatus,body`;

    const calendarResponse = await callMicrosoftGraph<{ value: any[] }>(
      calendarViewUrl
    );

    if (isGraphError(calendarResponse)) {
      console.warn(
        `Erreur lors de la récupération des réunions pour ${roomEmail}:`,
        calendarResponse.error
      );
      return [];
    }

    if (!calendarResponse.value || calendarResponse.value.length === 0) {
      return [];
    }

    const meetings: Meeting[] = calendarResponse.value.map((event) => {
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

      const organizerDetails = event.organizer?.emailAddress
        ? {
            name:
              event.organizer.emailAddress.name ||
              event.organizer.emailAddress.address?.split("@")[0] ||
              "Organisateur inconnu",
            email: event.organizer.emailAddress.address || "",
          }
        : undefined;

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
      };
    });

    return meetings;
  } catch (error) {
    console.error(
      `Erreur lors de la récupération des réunions pour ${roomId}:`,
      error
    );
    return [];
  }
}

// Données fictives réalistes pour la démonstration (quand l'utilisateur n'est pas connecté)
function getExampleRoomsData() {
  const now = new Date();
  
  return [
    {
      id: "example-cronstadt-box-droite",
      name: "Cronstadt-Box-droite",
      location: "Bâtiment Principal - 1er étage",
      capacity: 6,
      features: ["Écran 4K", "Visioconférence", "Tableau blanc", "WiFi Premium"],
      isExample: true,
      meetings: [
        {
          id: "example-meeting-1",
          subject: "Réunion équipe Marketing",
          organizer: "Sophie Martin",
          startTime: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(), // Dans 2h
          endTime: new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString(), // Dans 3h
          attendees: [
            {
              name: "Sophie Martin",
              email: "sophie.martin@espi.fr",
              status: "accepted",
              type: "required",
            },
            {
              name: "Julien Dubois",
              email: "julien.dubois@espi.fr",
              status: "accepted",
              type: "required",
            },
          ],
          attendeeCount: 2,
          roomId: "example-cronstadt-box-droite",
        },
      ],
    },
    {
      id: "example-cronstadt-box-gauche",
      name: "Cronstadt-Box-gauche",
      location: "Bâtiment Principal - 1er étage",
      capacity: 6,
      features: ["Mobilier modulaire", "Écran tactile", "Caméra 360°", "Système audio"],
      isExample: true,
      meetings: [
        {
          id: "example-meeting-2",
          subject: "Formation nouveaux arrivants",
          organizer: "Pierre Durand",
          startTime: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), // Commencé il y a 30min
          endTime: new Date(now.getTime() + 90 * 60 * 1000).toISOString(), // Finit dans 1h30
          attendees: [
            {
              name: "Pierre Durand",
              email: "pierre.durand@espi.fr",
              status: "accepted",
              type: "required",
            },
            {
              name: "Alice Moreau",
              email: "alice.moreau@espi.fr",
              status: "accepted",
              type: "required",
            },
          ],
          attendeeCount: 2,
          roomId: "example-cronstadt-box-gauche",
        },
      ],
    },
    {
      id: "example-cronstadt-salle-bas-mtr",
      name: "Cronstadt-Salle-de-reunion-bas-MTR",
      location: "Bâtiment Principal - Rez-de-chaussée",
      capacity: 12,
      features: [
        "Table de conférence",
        "Écran LED",
        "Système MTR",
        "Climatisation",
      ],
      isExample: true,
      meetings: [
        {
          id: "example-meeting-3",
          subject: "Comité de direction mensuel",
          organizer: "Jean-Claude Directeur",
          startTime: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(), // Dans 4h
          endTime: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(), // Dans 6h
          attendees: [
            {
              name: "Jean-Claude Directeur",
              email: "jc.directeur@espi.fr",
              status: "accepted",
              type: "required",
            },
          ],
          attendeeCount: 1,
          roomId: "example-cronstadt-salle-bas-mtr",
        },
      ],
    },
    {
      id: "example-cronstadt-salle-haut",
      name: "Cronstadt-Salle-de-reunion-Haut",
      location: "Bâtiment Principal - 2ème étage",
      capacity: 16,
      features: ["Projecteur HD", "Micros sans fil", "Prises USB", "Tables modulaires"],
      isExample: true,
      meetings: [], // Salle libre toute la journée
    },
  ];
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Si pas de session, retourner des données d'exemple avec le flag isExample
    if (!session) {
      // Simuler un petit délai pour rendre l'expérience réaliste
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      return NextResponse.json(getExampleRoomsData(), {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
    }

    console.log(
      "Récupération des vraies données des salles depuis Microsoft Graph API..."
    );

    // Récupérer les salles depuis Microsoft Graph API
    let rooms: MeetingRoom[] = [];

    // Approche 1: Utiliser l'API places
    try {
      console.log("Tentative de récupération des salles via l'API places...");
      const placesResponse = await callMicrosoftGraph<{ value: any[] }>(
        "/places/microsoft.graph.room"
      );

      if (isGraphError(placesResponse)) {
        console.warn(
          "Échec de la récupération des salles via l'API places:",
          placesResponse.error
        );
      } else if (placesResponse.value && placesResponse.value.length > 0) {
        console.log(
          `${placesResponse.value.length} salles trouvées via l'API places`
        );

        rooms = placesResponse.value
          .filter((room) => {
            return room.displayName && room.displayName.trim().length > 0;
          })
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

        console.log(`${rooms.length} salles valides après filtrage`);
      }
    } catch (placesError) {
      console.warn(
        "Erreur lors de l'utilisation de l'API places:",
        placesError
      );
    }

    // Approche 2: Utiliser l'API findRooms si l'approche 1 n'a pas fonctionné
    if (rooms.length === 0) {
      try {
        console.log("Tentative de récupération des salles via findRooms...");
        const response = await callMicrosoftGraph<{ value: any[] }>(
          "/me/findRooms"
        );

        if (isGraphError(response)) {
          console.warn(
            "Échec de la récupération des salles via findRooms:",
            response.error
          );
        } else if (response.value && response.value.length > 0) {
          console.log(
            `${response.value.length} salles trouvées via l'API findRooms`
          );

          rooms = response.value.map((room) => ({
            id: room.address,
            name: room.name,
            location: "Non spécifié",
            capacity: 0,
            features: [],
          }));
        }
      } catch (findRoomsError) {
        console.warn(
          "Erreur lors de l'utilisation de l'API findRooms:",
          findRoomsError
        );
      }
    }

    // Filtrer les salles selon ALLOWED_ROOM_NAMES
    const filteredRooms = rooms.filter((room) =>
      ALLOWED_ROOM_NAMES.some((allowedName) =>
        room.name.includes(allowedName)
      )
    );

    console.log(
      `${filteredRooms.length} salles après filtrage par nom autorisé`
    );

    // Récupérer les réunions pour chaque salle
    const roomsWithMeetings = await Promise.all(
      filteredRooms.map(async (room) => {
        const meetings = await fetchTodayMeetings(room.id);
        return {
          ...room,
          meetings,
        };
      })
    );

    return NextResponse.json(roomsWithMeetings, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des données des salles:",
      error
    );
    return NextResponse.json(
      { error: "Erreur lors de la récupération des données des salles" },
      { status: 500 }
    );
  }
}
