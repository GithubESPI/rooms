import { KioskView } from "@/components/kiosk/kiosk-view";
import { headers } from "next/headers";
import { PageTransition } from "@/components/page-transition";

// Liste des noms de salles à afficher
const ALLOWED_ROOM_NAMES = [
  "Cronstadt-Box-droite",
  "Cronstadt-Box-gauche",
  "Cronstadt-Salle-de-reunion-bas-MTR",
  "Cronstadt-Salle-de-reunion-Haut",
];

// Fonction pour récupérer les salles côté serveur
async function getRooms() {
  try {
    // Récupérer l'URL de base à partir des headers
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    // Appeler l'API pour récupérer toutes les salles
    const response = await fetch(`${baseUrl}/api/rooms`, {
      cache: "no-store",
      headers: {
        // Transmettre les cookies pour l'authentification
        cookie: headersList.get("cookie") || "",
      },
    });

    if (!response.ok) {
      console.error(
        `Erreur lors de la récupération des salles: ${response.status} ${response.statusText}`
      );
      return [];
    }

    const allRooms = await response.json();

    // Filtrer les salles pour n'afficher que celles dans la liste ALLOWED_ROOM_NAMES
    const filteredRooms = allRooms.filter((room: any) =>
      ALLOWED_ROOM_NAMES.some((allowedName) => room.name.includes(allowedName))
    );

    console.log(
      `${filteredRooms.length} salles après filtrage par nom:`,
      filteredRooms
    );
    return filteredRooms;
  } catch (error) {
    console.error("Erreur lors de la récupération des salles:", error);
    return [];
  }
}

export default async function KioskPage() {
  const rooms = await getRooms();

  return (
    <PageTransition>
      <div className="min-h-screen bg-black text-white">
        <KioskView initialRooms={rooms} />
      </div>
    </PageTransition>
  );
}
