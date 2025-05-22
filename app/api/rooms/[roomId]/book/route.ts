import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { callMicrosoftGraph, isGraphError } from "@/lib/microsoft-graph";

export async function POST(
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

    // Récupérer les données de la requête
    const { subject, description, startDateTime, endDateTime } =
      await request.json();

    // Vérifier que toutes les données nécessaires sont présentes
    if (!subject || !startDateTime || !endDateTime) {
      return NextResponse.json(
        {
          error: "Missing required fields: subject, startDateTime, endDateTime",
        },
        { status: 400 }
      );
    }

    // Construire l'adresse email de la salle si nécessaire
    const roomEmail = roomId.includes("@")
      ? roomId
      : `${roomId}@${
          process.env.MICROSOFT_TENANT_DOMAIN || "tenant.onmicrosoft.com"
        }`;

    // Créer l'événement dans le calendrier
    const eventData = {
      subject,
      body: {
        contentType: "text",
        content: description || "",
      },
      start: {
        dateTime: new Date(startDateTime).toISOString(),
        timeZone: "UTC",
      },
      end: {
        dateTime: new Date(endDateTime).toISOString(),
        timeZone: "UTC",
      },
      location: {
        displayName: roomEmail,
      },
      attendees: [
        {
          emailAddress: {
            address: roomEmail,
            name: roomEmail.split("@")[0],
          },
          type: "resource",
        },
      ],
    };

    // Appeler l'API Microsoft Graph pour créer l'événement
    const response = await callMicrosoftGraph<any>("/me/events", {
      method: "POST",
      body: JSON.stringify(eventData),
    });

    if (isGraphError(response)) {
      console.error("Error creating event:", response.error);
      return NextResponse.json(
        { error: `Failed to book room: ${response.error.message}` },
        { status: response.error.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Room booked successfully",
      eventId: response.id,
    });
  } catch (error) {
    console.error(`Error booking room ${roomId}:`, error);
    return NextResponse.json(
      { error: "An unexpected error occurred while booking the room" },
      { status: 500 }
    );
  }
}
