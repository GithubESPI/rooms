import { notFound } from "next/navigation";
import { WeeklyCalendar } from "@/components/weekly-calendar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PageTransition } from "@/components/page-transition";

// Forcer le rendu dynamique
export const dynamic = "force-dynamic";

// Liste des noms de salles à afficher
const ALLOWED_ROOM_NAMES = [
  "Cronstadt-Box-droite",
  "Cronstadt-Box-gauche",
  "Cronstadt-Salle-de-reunion-bas-MTR",
  "Cronstadt-Salle-de-reunion-Haut",
];

// Fonction pour récupérer les détails d'une salle côté serveur
async function getRoomDetails(id: string) {
  try {
    // Utiliser l'URL absolue pour les appels côté serveur
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    const response = await fetch(`${baseUrl}/api/rooms`, {
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        `Erreur lors de la récupération des salles: ${response.status}`
      );
      return null;
    }

    const rooms = await response.json();
    const room = rooms.find((room: any) => room.id === id);

    if (
      room &&
      !ALLOWED_ROOM_NAMES.some((allowedName) => room.name.includes(allowedName))
    ) {
      console.log(
        `La salle ${room.name} n'est pas dans la liste des salles autorisées`
      );
      return null;
    }

    return room || null;
  } catch (error) {
    console.error(
      `Erreur lors de la récupération des détails de la salle ${id}:`,
      error
    );
    return null;
  }
}

export default async function RoomPage({ params }: { params: { id: string } }) {
  const room = await getRoomDetails(params.id);

  if (!room) {
    notFound();
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="outline" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux salles
            </Link>
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold">{room.name}</h1>
          <p className="text-muted-foreground">
            {room.location} • Capacité: {room.capacity} personnes
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {room.features.map((feature: string) => (
              <span
                key={feature}
                className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>

        <WeeklyCalendar room={room} />
      </div>
    </PageTransition>
  );
}
