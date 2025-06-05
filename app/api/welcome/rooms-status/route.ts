import { NextResponse } from "next/server";

// Données fictives réalistes pour la démonstration
const mockRoomsData = [
  {
    id: "salle-innovation",
    name: "Salle Innovation",
    location: "Bâtiment Principal - 2ème étage",
    capacity: 12,
    features: ["Écran 4K", "Visioconférence", "Tableau blanc", "WiFi Premium"],
    meetings: [
      {
        id: "meeting-1",
        subject: "Réunion équipe Marketing",
        organizer: "Sophie Martin",
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // Dans 2h
        endTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // Dans 3h
        attendees: [
          "sophie.martin@espi.fr",
          "julien.dubois@espi.fr",
          "marie.bernard@espi.fr",
        ],
      },
    ],
  },
  {
    id: "salle-collaboration",
    name: "Salle Collaboration",
    location: "Bâtiment Principal - 1er étage",
    capacity: 8,
    features: [
      "Mobilier modulaire",
      "Écran tactile",
      "Caméra 360°",
      "Système audio",
    ],
    meetings: [
      {
        id: "meeting-2",
        subject: "Formation nouveaux arrivants",
        organizer: "Pierre Durand",
        startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // Commencé il y a 30min
        endTime: new Date(Date.now() + 90 * 60 * 1000).toISOString(), // Finit dans 1h30
        attendees: [
          "pierre.durand@espi.fr",
          "alice.moreau@espi.fr",
          "thomas.petit@espi.fr",
        ],
      },
    ],
  },
  {
    id: "salle-direction",
    name: "Salle de Direction",
    location: "Bâtiment Principal - 3ème étage",
    capacity: 16,
    features: [
      "Table de conférence",
      "Écran LED",
      "Système de vote",
      "Climatisation",
    ],
    meetings: [
      {
        id: "meeting-3",
        subject: "Comité de direction mensuel",
        organizer: "Jean-Claude Directeur",
        startTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // Dans 4h
        endTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // Dans 6h
        attendees: [
          "jc.directeur@espi.fr",
          "marie.rh@espi.fr",
          "paul.finance@espi.fr",
        ],
      },
    ],
  },
  {
    id: "salle-creative",
    name: "Espace Créatif",
    location: "Annexe - Rez-de-chaussée",
    capacity: 6,
    features: ["Mur d'écriture", "Poufs", "Éclairage LED", "Plantes vertes"],
    meetings: [], // Salle libre toute la journée
  },
  {
    id: "salle-formation",
    name: "Salle de Formation",
    location: "Bâtiment Formation - 1er étage",
    capacity: 20,
    features: [
      "Projecteur HD",
      "Micros sans fil",
      "Prises USB",
      "Tables modulaires",
    ],
    meetings: [
      {
        id: "meeting-4",
        subject: "Workshop Design Thinking",
        organizer: "Laura Designer",
        startTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // Commencé il y a 1h
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // Finit dans 2h
        attendees: [
          "laura.designer@espi.fr",
          "marc.dev@espi.fr",
          "julie.ux@espi.fr",
        ],
      },
      {
        id: "meeting-5",
        subject: "Présentation projet étudiant",
        organizer: "Professeur Leclerc",
        startTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // Dans 3h
        endTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // Dans 4h
        attendees: [
          "prof.leclerc@espi.fr",
          "etudiant1@espi.fr",
          "etudiant2@espi.fr",
        ],
      },
    ],
  },
  {
    id: "salle-reunion-a",
    name: "Salle Réunion A",
    location: "Bâtiment Principal - 1er étage",
    capacity: 10,
    features: ["Écran partagé", "Téléphone", "Paperboard", "Machine à café"],
    meetings: [
      {
        id: "meeting-6",
        subject: "Point hebdomadaire équipe Dev",
        organizer: "Alexandre Tech",
        startTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // Dans 30min
        endTime: new Date(Date.now() + 90 * 60 * 1000).toISOString(), // Dans 1h30
        attendees: [
          "alex.tech@espi.fr",
          "sarah.dev@espi.fr",
          "kevin.backend@espi.fr",
        ],
      },
    ],
  },
  {
    id: "salle-reunion-b",
    name: "Salle Réunion B",
    location: "Bâtiment Principal - 2ème étage",
    capacity: 8,
    features: ["Écran TV", "Webcam HD", "Haut-parleurs", "Éclairage naturel"],
    meetings: [], // Salle libre
  },
  {
    id: "salle-brainstorming",
    name: "Salle Brainstorming",
    location: "Annexe - 1er étage",
    capacity: 14,
    features: [
      "Murs blancs",
      "Feutres",
      "Post-it",
      "Canapés",
      "Musique d'ambiance",
    ],
    meetings: [
      {
        id: "meeting-7",
        subject: "Idéation nouveau produit",
        organizer: "Emma Innovation",
        startTime: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(), // Dans 5h
        endTime: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(), // Dans 7h
        attendees: [
          "emma.innovation@espi.fr",
          "lucas.product@espi.fr",
          "chloe.marketing@espi.fr",
        ],
      },
    ],
  },
];

export async function GET() {
  try {
    // Simuler un petit délai pour rendre l'expérience réaliste
    await new Promise((resolve) => setTimeout(resolve, 500));

    return NextResponse.json(mockRoomsData, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error(
      "Erreur lors de la génération des données de démonstration:",
      error
    );
    return NextResponse.json(
      { error: "Erreur lors de la génération des données de démonstration" },
      { status: 500 }
    );
  }
}
