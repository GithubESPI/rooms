import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { callMicrosoftGraph, isGraphError } from "@/lib/microsoft-graph";
import type { MeetingRoom } from "@/lib/types";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Si pas de session, retourner une erreur d'authentification
    if (!session) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    console.log(
      "Récupération des salles de réunion depuis Microsoft Graph API..."
    );

    // Approche 1: Utiliser l'API findRooms
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

        // Transformer les données pour correspondre à notre format
        const rooms: MeetingRoom[] = response.value.map((room) => ({
          id: room.address, // Utiliser l'adresse email comme ID
          name: room.name,
          location: "Non spécifié",
          capacity: 0,
          features: [],
        }));

        return NextResponse.json(rooms);
      }
    } catch (findRoomsError) {
      console.warn(
        "Erreur lors de l'utilisation de l'API findRooms:",
        findRoomsError
      );
    }

    // Approche 2: Utiliser l'API places
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

        // Filtrer et transformer les données
        const rooms: MeetingRoom[] = placesResponse.value
          .filter((room) => {
            // Filtrer les salles qui ont un nom valide
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
        return NextResponse.json(rooms);
      }
    } catch (placesError) {
      console.warn(
        "Erreur lors de l'utilisation de l'API places:",
        placesError
      );
    }

    // Approche 3: Utiliser l'API calendars pour trouver les calendriers de ressources
    try {
      console.log("Tentative de récupération des calendriers de ressources...");
      const calendarsResponse = await callMicrosoftGraph<{ value: any[] }>(
        "/me/calendars"
      );

      if (isGraphError(calendarsResponse)) {
        console.warn(
          "Échec de la récupération des calendriers:",
          calendarsResponse.error
        );
      } else if (
        calendarsResponse.value &&
        calendarsResponse.value.length > 0
      ) {
        // Filtrer pour trouver les calendriers qui pourraient être des salles
        const roomCalendars = calendarsResponse.value.filter(
          (cal) =>
            cal.name.toLowerCase().includes("salle") ||
            cal.name.toLowerCase().includes("room") ||
            cal.name.toLowerCase().includes("conf") ||
            cal.name.toLowerCase().includes("meeting")
        );

        if (roomCalendars.length > 0) {
          console.log(
            `${roomCalendars.length} calendriers de salles potentiels trouvés`
          );

          // Transformer les données pour correspondre à notre format
          const rooms: MeetingRoom[] = roomCalendars.map((cal) => ({
            id: cal.id,
            name: cal.name,
            location: "Calendrier de ressource",
            capacity: 0,
            features: [],
          }));

          return NextResponse.json(rooms);
        }
      }
    } catch (calendarsError) {
      console.warn(
        "Erreur lors de la récupération des calendriers:",
        calendarsError
      );
    }

    // Si aucune salle n'est trouvée, retourner un tableau vide
    return NextResponse.json([]);
  } catch (error) {
    console.error("Erreur lors de la récupération des salles:", error);
    return NextResponse.json(
      { error: "Une erreur s'est produite lors de la récupération des salles" },
      { status: 500 }
    );
  }
}
