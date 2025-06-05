"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LogIn,
  Monitor,
  Calendar,
  Users,
  Clock,
  MapPin,
  Building2,
  CheckCircle,
  XCircle,
  ArrowRight,
  Zap,
  Shield,
  BarChart3,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import type { MeetingRoom, Meeting } from "@/lib/types";
import {
  formatFrenchTime,
  isMeetingActive,
  getTimeUntilStart,
} from "@/lib/date-utils";
import { signIn } from "next-auth/react";

// Liste des noms de salles à afficher
const ALLOWED_ROOM_NAMES = [
  "Cronstadt-Box-droite",
  "Cronstadt-Box-gauche",
  "Cronstadt-Salle-de-reunion-bas-MTR",
  "Cronstadt-Salle-de-reunion-Haut",
];

interface RoomWithStatus extends MeetingRoom {
  isOccupied: boolean;
  currentMeeting?: Meeting;
  nextMeeting?: Meeting;
  meetings: Meeting[];
  loading: boolean;
  error?: string;
}

const features = [
  {
    icon: Calendar,
    title: "Gestion en temps réel",
    description: "Consultez la disponibilité des salles instantanément",
  },
  {
    icon: BarChart3,
    title: "Statistiques d'usage",
    description: "Analysez l'utilisation de vos espaces de travail",
  },
  {
    icon: Shield,
    title: "Sécurisé Microsoft",
    description: "Authentification sécurisée avec votre compte Office 365",
  },
  {
    icon: Zap,
    title: "Interface moderne",
    description: "Design responsive et mode kiosque pour affichage mural",
  },
];

export function WelcomePage() {
  const [currentTime, setCurrentTime] = useState<string>("");
  const [rooms, setRooms] = useState<RoomWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fonction pour récupérer les salles et leurs statuts
  const fetchRoomsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Utiliser l'API spécifique pour la page d'accueil qui ne nécessite pas d'authentification
      const response = await fetch("/api/welcome/rooms-status");
      if (!response.ok) {
        throw new Error("Impossible de récupérer les données de démonstration");
      }

      const roomsData = await response.json();

      // Transformer les données pour correspondre au format attendu
      const roomsWithStatus: RoomWithStatus[] = roomsData.map(
        (roomData: any) => {
          const now = new Date();

          // Trouver la réunion en cours
          const currentMeeting = roomData.meetings.find((meeting: Meeting) =>
            isMeetingActive(meeting.startTime, meeting.endTime)
          );

          // Trouver la prochaine réunion
          const upcomingMeetings = roomData.meetings
            .filter((meeting: Meeting) => new Date(meeting.startTime) > now)
            .sort(
              (a: Meeting, b: Meeting) =>
                new Date(a.startTime).getTime() -
                new Date(b.startTime).getTime()
            );

          const nextMeeting = upcomingMeetings[0] || undefined;

          return {
            id: roomData.id,
            name: roomData.name,
            location: roomData.location,
            capacity: roomData.capacity,
            features: roomData.features,
            isOccupied: !!currentMeeting,
            currentMeeting,
            nextMeeting,
            meetings: roomData.meetings,
            loading: false,
          };
        }
      );

      setRooms(roomsWithStatus);
    } catch (err) {
      console.error("Erreur lors du chargement des données:", err);
      setError(
        "Impossible de charger les données de démonstration. Les données réelles nécessitent une connexion."
      );
    } finally {
      setLoading(false);
    }
  };

  // Charger les données au montage et toutes les 2 minutes
  useEffect(() => {
    fetchRoomsData();
    const interval = setInterval(fetchRoomsData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const occupiedRooms = rooms.filter((room) => room.isOccupied).length;
  const availableRooms = rooms.filter((room) => !room.isOccupied).length;

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center space-y-8"
      >
        <div className="space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-2xl"
          >
            <Building2 className="h-10 w-10" />
          </motion.div>

          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
            O365 Meeting Rooms
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Gérez et consultez vos salles de réunion en temps réel avec une
            interface moderne et intuitive
          </p>
        </div>

        {/* Stats en temps réel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center items-center gap-8 text-sm"
        >
          {loading ? (
            <div className="flex gap-4">
              <Skeleton className="h-8 w-32 rounded-full" />
              <Skeleton className="h-8 w-32 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-full" />
            </div>
          ) : error ? (
            <Card className="p-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-blue-500" />
              <h3 className="text-lg font-semibold mb-2">
                Données de démonstration
              </h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  • Les données affichées sont simulées à des fins de
                  démonstration
                </p>
                <p>
                  • Connectez-vous pour accéder aux vraies données de vos salles
                </p>
              </div>
              <Button
                onClick={fetchRoomsData}
                variant="outline"
                className="mt-4"
              >
                Actualiser les données de démonstration
              </Button>
            </Card>
          ) : (
            <>
              <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="font-medium">
                  {availableRooms} salles libres
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="font-medium">
                  {occupiedRooms} salles occupées
                </span>
              </div>
            </>
          )}
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="font-medium">{currentTime}</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Actions principales */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
      >
        <Card className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-blue-200 dark:hover:border-blue-800">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <LogIn className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Tableau de bord complet</CardTitle>
            <CardDescription className="text-base">
              Accédez à toutes les fonctionnalités : gestion des réservations,
              statistiques et vue détaillée
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button
              onClick={() => signIn("azure-ad", { callbackUrl: "/" })}
              size="lg"
              className="w-full h-12 text-lg"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Se connecter avec Microsoft
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-indigo-200 dark:hover:border-indigo-800">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Monitor className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Mode Kiosque</CardTitle>
            <CardDescription className="text-base">
              Affichage plein écran optimisé pour les écrans muraux et la
              consultation rapide
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button
              variant="outline"
              className="w-full h-12 text-lg border-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
              size="lg"
              asChild
            >
              <Link href="/kiosk">
                <Monitor className="mr-2 h-5 w-5" />
                Ouvrir le mode kiosque
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Aperçu des salles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="space-y-8"
      >
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold">Aperçu des salles de réunion</h2>
          <p className="text-muted-foreground text-lg">
            État actuel de vos espaces de travail
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, index) => (
              <Card key={index} className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-8 w-full" />
                  <div className="flex gap-1">
                    <Skeleton className="h-6 w-12 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchRoomsData} variant="outline">
              Réessayer
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {rooms.map((room, index) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + index * 0.1 }}
              >
                <Card
                  className={`h-full transition-all duration-300 hover:shadow-lg ${
                    room.isOccupied
                      ? "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20"
                      : "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20"
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold truncate">
                          {room.name}
                        </CardTitle>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3" />
                          <span>{room.location}</span>
                        </div>
                      </div>
                      <Badge
                        variant={room.isOccupied ? "destructive" : "default"}
                        className={`${
                          room.isOccupied
                            ? "bg-red-500 hover:bg-red-600"
                            : "bg-green-500 hover:bg-green-600"
                        } text-white`}
                      >
                        {room.isOccupied ? "Occupée" : "Libre"}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{room.capacity} personnes</span>
                    </div>

                    {room.error ? (
                      <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-md">
                        <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                          {room.error}
                        </div>
                      </div>
                    ) : (
                      <>
                        {room.currentMeeting && (
                          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-md">
                            <div className="text-sm font-medium text-red-800 dark:text-red-200">
                              En cours: {room.currentMeeting.subject}
                            </div>
                            <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                              Jusqu'à{" "}
                              {formatFrenchTime(room.currentMeeting.endTime)}
                            </div>
                          </div>
                        )}

                        {room.nextMeeting && !room.currentMeeting && (
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                            <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
                              Prochaine: {room.nextMeeting.subject}
                            </div>
                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              Dans{" "}
                              {getTimeUntilStart(room.nextMeeting.startTime)} à{" "}
                              {formatFrenchTime(room.nextMeeting.startTime)}
                            </div>
                          </div>
                        )}

                        {!room.currentMeeting && !room.nextMeeting && (
                          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-md">
                            <div className="text-sm font-medium text-green-800 dark:text-green-200">
                              Aucune réunion prévue aujourd'hui
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    <div className="flex flex-wrap gap-1">
                      {room.features.slice(0, 3).map((feature, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-secondary px-2 py-1 rounded-full"
                        >
                          {feature}
                        </span>
                      ))}
                      {room.features.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{room.features.length - 3}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Fonctionnalités */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="space-y-8"
      >
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold">Fonctionnalités principales</h2>
          <p className="text-muted-foreground text-lg">
            Tout ce dont vous avez besoin pour gérer vos espaces
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 + index * 0.1 }}
            >
              <Card className="h-full text-center hover:shadow-lg transition-all duration-300 group">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Footer info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
        className="text-center py-8 border-t border-border/50"
      >
        <p className="text-sm text-muted-foreground">
          Connectez-vous avec votre compte Microsoft Office 365 pour accéder à
          toutes les fonctionnalités
        </p>
      </motion.div>
    </div>
  );
}
