import { NextResponse } from "next/server";
import type { Meeting } from "@/lib/types";

// Générer des données simulées de réunions pour la page d'accueil
function generateMockMeetingsForRoom(roomId: string): Meeting[] {
  const now = new Date();
  const meetings: Meeting[] = [];

  // Probabilité qu'une salle soit occupée (30%)
  const isOccupied = Math.random() < 0.3;

  if (isOccupied) {
    // Créer une réunion en cours
    const currentStart = new Date(now.getTime() - 30 * 60 * 1000); // Commencée il y a 30 min
    const currentEnd = new Date(now.getTime() + 60 * 60 * 1000); // Se termine dans 1h

    meetings.push({
      id: `current-${roomId}`,
      subject: "Réunion d'équipe",
      startTime: currentStart.toISOString(),
      endTime: currentEnd.toISOString(),
      organizer: "Jean Dupont",
      roomId,
    });
  }

  // Ajouter une réunion future (50% de chance)
  if (Math.random() < 0.5) {
    const futureStart = new Date(now.getTime() + 2 * 60 * 60 * 1000); // Dans 2h
    const futureEnd = new Date(now.getTime() + 3 * 60 * 60 * 1000); // Dans 3h

    meetings.push({
      id: `future-${roomId}`,
      subject: "Présentation client",
      startTime: futureStart.toISOString(),
      endTime: futureEnd.toISOString(),
      organizer: "Marie Martin",
      roomId,
    });
  }

  return meetings;
}

export async function GET() {
  try {
    // Liste des salles avec leurs statuts simulés
    const roomsData = [
      {
        id: "cronstadt-box-droite",
        name: "Cronstadt-Box-droite",
        location: "Bâtiment Cronstadt - Étage 1",
        capacity: 4,
        features: ["Écran", "Visioconférence"],
        meetings: generateMockMeetingsForRoom("cronstadt-box-droite"),
      },
      {
        id: "cronstadt-box-gauche",
        name: "Cronstadt-Box-gauche",
        location: "Bâtiment Cronstadt - Étage 1",
        capacity: 4,
        features: ["Écran", "Tableau blanc"],
        meetings: generateMockMeetingsForRoom("cronstadt-box-gauche"),
      },
      {
        id: "cronstadt-salle-reunion-bas-mtr",
        name: "Cronstadt-Salle-de-reunion-bas-MTR",
        location: "Bâtiment Cronstadt - Rez-de-chaussée",
        capacity: 8,
        features: ["Microsoft Teams Room", "Écran", "Visioconférence"],
        meetings: generateMockMeetingsForRoom(
          "cronstadt-salle-reunion-bas-mtr"
        ),
      },
      {
        id: "cronstadt-salle-reunion-haut",
        name: "Cronstadt-Salle-de-reunion-Haut",
        location: "Bâtiment Cronstadt - Étage 2",
        capacity: 6,
        features: ["Projecteur", "Tableau blanc"],
        meetings: generateMockMeetingsForRoom("cronstadt-salle-reunion-haut"),
      },
    ];

    return NextResponse.json(roomsData);
  } catch (error) {
    console.error(
      "Erreur lors de la génération des données de démonstration:",
      error
    );
    return NextResponse.json(
      { error: "Erreur lors du chargement des données de démonstration" },
      { status: 500 }
    );
  }
}
