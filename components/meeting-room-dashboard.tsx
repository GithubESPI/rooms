"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { MeetingRoomCard } from "@/components/meeting-room-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchMeetingRooms } from "@/lib/api";
import {
  RoomFilters,
  type RoomFilters as RoomFiltersType,
} from "@/components/room-filters";
import type { MeetingRoom } from "@/lib/types";

// Liste des noms de salles à afficher
const ALLOWED_ROOM_NAMES = [
  "Cronstadt-Box-droite",
  "Cronstadt-Box-gauche",
  "Cronstadt-Salle-de-reunion-bas-MTR",
  "Cronstadt-Salle-de-reunion-Haut",
];

export function MeetingRoomDashboard() {
  const { data: session, status } = useSession();
  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<MeetingRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Extraire les emplacements et équipements uniques
  const locations = [...new Set(rooms.map((room) => room.location))].filter(
    Boolean
  );
  const features = [...new Set(rooms.flatMap((room) => room.features))].filter(
    Boolean
  );

  const loadRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Chargement des salles de réunion...");
      const data = await fetchMeetingRooms();
      console.log(`${data.length} salles récupérées:`, data);

      // Filtrer les salles pour n'afficher que celles dans la liste ALLOWED_ROOM_NAMES
      const filteredData = data.filter((room) =>
        ALLOWED_ROOM_NAMES.some((allowedName) =>
          room.name.includes(allowedName)
        )
      );

      console.log(
        `${filteredData.length} salles après filtrage par nom:`,
        filteredData
      );
      setRooms(filteredData);
      setFilteredRooms(filteredData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Erreur lors du chargement des salles:", err);
      setError(
        "Impossible de charger les salles de réunion. Veuillez réessayer."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      loadRooms();

      // Refresh data every 5 minutes
      const interval = setInterval(loadRooms, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [status]);

  const handleFilterChange = (filters: RoomFiltersType) => {
    console.log("Application des filtres:", filters);

    const filtered = rooms.filter((room) => {
      // Filtre par emplacement
      if (filters.location && room.location !== filters.location) {
        return false;
      }

      // Filtre par capacité
      if (room.capacity < filters.minCapacity) {
        return false;
      }

      // Filtre par équipements
      if (filters.features.length > 0) {
        const hasAllFeatures = filters.features.every((feature) =>
          room.features.includes(feature)
        );
        if (!hasAllFeatures) {
          return false;
        }
      }

      // Filtre par disponibilité (à implémenter avec l'état actuel des salles)
      if (filters.onlyAvailable) {
        // Cette logique devrait être améliorée pour vérifier la disponibilité réelle
        // Pour l'instant, nous considérons que les salles avec un ID pair sont disponibles
        if (Number.parseInt(room.id.split("-")[1] || "0") % 2 !== 0) {
          return false;
        }
      }

      return true;
    });

    console.log(`${filtered.length} salles après filtrage`);
    setFilteredRooms(filtered);
  };

  if (status === "loading") {
    return <LoadingSkeleton />;
  }

  if (status === "unauthenticated") {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Authentification requise</AlertTitle>
        <AlertDescription>
          Veuillez vous connecter pour accéder aux informations des salles de
          réunion.
        </AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          {error}
          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={loadRooms}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Réessayer
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Salles de réunion</h1>
          {lastUpdated && (
            <p className="text-sm text-muted-foreground">
              Dernière mise à jour: {lastUpdated.toLocaleTimeString("fr-FR")}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <RoomFilters
            locations={locations}
            features={features}
            onFilterChange={handleFilterChange}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={loadRooms}
            disabled={loading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Actualiser
          </Button>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : filteredRooms.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Aucune salle trouvée</AlertTitle>
          <AlertDescription>
            Aucune salle de réunion ne correspond à vos critères. Essayez de
            modifier vos filtres.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRooms.map((room) => (
            <MeetingRoomCard key={room.id} room={room} />
          ))}
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="rounded-lg border bg-card text-card-foreground shadow-sm"
        >
          <div className="p-6 space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
