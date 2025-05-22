import { notFound } from "next/navigation";
import { WeeklyCalendar } from "@/components/weekly-calendar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { headers } from "next/headers";
import { PageTransition } from "@/components/page-transition";

// Liste des noms de salles à afficher
const ALLOWED_ROOM_NAMES = [
  "Cronstadt-Box-droite",
  "Cronstadt-Box-gauche",
  "Cronstadt-Salle-de-reunion-bas-MTR",
  "Cronstadt-Salle-de-reunion-Haut",
];

// Fonction pour récupérer les détails d'une salle
async function getRoomDetails(id: string) {
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
        cookie: (await headersList).get("cookie") || "",
      },
    });

    if (!response.ok) {
      console.error(
        `Erreur lors de la récupération des salles: ${response.status} ${response.statusText}`
      );
      return null;
    }

    const rooms = await response.json();

    // Trouver la salle correspondant à l'ID
    const room = rooms.find((room: any) => room.id === id);

    // Vérifier si la salle fait partie des salles autorisées
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
