"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Sparkles,
  Wifi,
  Video,
  Coffee,
  Presentation,
  Star,
  TrendingUp,
  Globe,
  Layers,
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
  isExample?: boolean;
}

const features = [
  {
    icon: Calendar,
    title: "Gestion en temps réel",
    description: "Consultez la disponibilité des salles instantanément",
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-50 to-cyan-50",
  },
  {
    icon: BarChart3,
    title: "Statistiques d'usage",
    description: "Analysez l'utilisation de vos espaces de travail",
    gradient: "from-purple-500 to-pink-500",
    bgGradient: "from-purple-50 to-pink-50",
  },
  {
    icon: Shield,
    title: "Sécurisé Microsoft",
    description: "Authentification sécurisée avec votre compte Office 365",
    gradient: "from-green-500 to-emerald-500",
    bgGradient: "from-green-50 to-emerald-50",
  },
  {
    icon: Zap,
    title: "Interface moderne",
    description: "Design responsive et mode kiosque pour affichage mural",
    gradient: "from-orange-500 to-red-500",
    bgGradient: "from-orange-50 to-red-50",
  },
];

const floatingIcons = [
  { icon: Wifi, delay: 0 },
  { icon: Video, delay: 0.5 },
  { icon: Coffee, delay: 1 },
  { icon: Presentation, delay: 1.5 },
  { icon: Star, delay: 2 },
  { icon: Globe, delay: 2.5 },
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
            isExample: roomData.isExample || false,
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
    <div className="relative min-h-screen overflow-hidden">
      {/* Background avec gradient animé */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-blue-950/30 dark:to-indigo-950/50" />

      {/* Particules flottantes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingIcons.map((item, index) => (
          <motion.div
            key={index}
            className="absolute opacity-10 dark:opacity-5"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              rotate: 0,
              scale: 0.5,
            }}
            animate={{
              y: [null, -20, 20, -20],
              rotate: [0, 360],
              scale: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 20 + Math.random() * 10,
              repeat: Number.POSITIVE_INFINITY,
              delay: item.delay,
              ease: "linear",
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          >
            <item.icon className="h-8 w-8 text-[#1B4B8F]" />
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 space-y-20 px-4 py-16">
        {/* Hero Section avec animations avancées */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-center space-y-12"
        >
          <div className="space-y-8">
            {/* Logo animé avec effets */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                delay: 0.3,
                type: "spring",
                stiffness: 200,
                damping: 15,
              }}
              className="relative inline-flex items-center justify-center"
            >
              <motion.div
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(27, 75, 143, 0.3)",
                    "0 0 40px rgba(27, 75, 143, 0.5)",
                    "0 0 20px rgba(27, 75, 143, 0.3)",
                  ],
                }}
                transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                className="w-32 h-32 rounded-3xl bg-gradient-to-br from-[#1B4B8F] via-[#2563eb] to-[#0D2B5C] text-white shadow-2xl flex items-center justify-center relative overflow-hidden"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 20,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "linear",
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                />
                <Building2 className="h-16 w-16 relative z-10" />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl"
                />
              </motion.div>

              {/* Cercles décoratifs */}
              <motion.div
                animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                transition={{
                  duration: 15,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }}
                className="absolute inset-0 border-2 border-[#1B4B8F]/20 rounded-full w-40 h-40"
              />
              <motion.div
                animate={{ rotate: -360, scale: [1, 0.9, 1] }}
                transition={{
                  duration: 12,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }}
                className="absolute inset-0 border border-[#1B4B8F]/10 rounded-full w-48 h-48"
              />
            </motion.div>

            {/* Titre avec effet de typing */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <motion.h1
                className="text-6xl md:text-8xl font-black bg-gradient-to-r from-[#1B4B8F] via-[#2563eb] to-[#0D2B5C] dark:from-white dark:via-blue-200 dark:to-white bg-clip-text text-transparent"
                initial={{ backgroundPosition: "0% 50%" }}
                animate={{ backgroundPosition: "100% 50%" }}
                transition={{
                  duration: 3,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                }}
                style={{ backgroundSize: "200% 200%" }}
              >
                Groupe ESPI
              </motion.h1>

              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 1.2, duration: 1.5 }}
                className="h-1 bg-gradient-to-r from-[#1B4B8F] to-[#0D2B5C] mx-auto mt-4 rounded-full"
                style={{ maxWidth: "300px" }}
              />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
              className="text-2xl md:text-3xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-light"
            >
              <motion.span
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              >
                Gestion des salles de réunion en temps réel
              </motion.span>
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: 0.5,
                }}
                className="inline-block ml-2"
              >
                ✨
              </motion.span>
            </motion.p>
          </div>

          {/* Stats en temps réel avec animations */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2 }}
            className="flex justify-center items-center gap-8 text-sm flex-wrap"
          >
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex gap-4"
                >
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{
                        duration: 1.5,
                        repeat: Number.POSITIVE_INFINITY,
                        delay: i * 0.2,
                      }}
                    >
                      <Skeleton className="h-12 w-40 rounded-full" />
                    </motion.div>
                  ))}
                </motion.div>
              ) : error ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="max-w-2xl"
                >
                  <Card className="p-8 text-center border-[#1B4B8F]/20 bg-white/80 backdrop-blur-xl shadow-2xl">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                      }}
                    >
                      <AlertCircle className="h-16 w-16 mx-auto mb-6 text-[#1B4B8F]" />
                    </motion.div>
                    <h3 className="text-xl font-bold mb-4 text-[#1B4B8F]">
                      Données de démonstration
                    </h3>
                    <p className="text-muted-foreground mb-6 text-lg">
                      {error}
                    </p>
                    <div className="space-y-3 text-muted-foreground mb-6">
                      <motion.p
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-2"
                      >
                        <Sparkles className="h-4 w-4 text-[#1B4B8F]" />
                        Les données affichées sont simulées à des fins de
                        démonstration
                      </motion.p>
                      <motion.p
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="flex items-center gap-2"
                      >
                        <TrendingUp className="h-4 w-4 text-[#1B4B8F]" />
                        Connectez-vous pour accéder aux vraies données de vos
                        salles
                      </motion.p>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={fetchRoomsData}
                        variant="outline"
                        className="border-2 border-[#1B4B8F] text-[#1B4B8F] hover:bg-[#1B4B8F] hover:text-white transition-all duration-300"
                        size="lg"
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 2,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "linear",
                          }}
                          className="mr-2"
                        >
                          <Layers className="h-4 w-4" />
                        </motion.div>
                        Actualiser les données de démonstration
                      </Button>
                    </motion.div>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="stats"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-6 flex-wrap justify-center"
                >
                  <motion.div
                    whileHover={{ scale: 1.1, y: -5 }}
                    className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-xl rounded-2xl border border-green-200/50 shadow-lg"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                      }}
                    >
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </motion.div>
                    <span className="font-bold text-green-700 text-lg">
                      {availableRooms} salles libres
                    </span>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.1, y: -5 }}
                    className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-red-500/10 to-pink-500/10 backdrop-blur-xl rounded-2xl border border-red-200/50 shadow-lg"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        delay: 0.5,
                      }}
                    >
                      <XCircle className="h-6 w-6 text-red-600" />
                    </motion.div>
                    <span className="font-bold text-red-700 text-lg">
                      {occupiedRooms} salles occupées
                    </span>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              whileHover={{ scale: 1.1, y: -5 }}
              className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-[#1B4B8F]/10 to-[#0D2B5C]/10 backdrop-blur-xl rounded-2xl border border-[#1B4B8F]/20 shadow-lg"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 60,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }}
              >
                <Clock className="h-6 w-6 text-[#1B4B8F]" />
              </motion.div>
              <motion.span
                key={currentTime}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="font-bold text-[#1B4B8F] text-lg font-mono"
              >
                {currentTime}
              </motion.span>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Actions principales avec effets glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto"
        >
          <motion.div
            whileHover={{ y: -10, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Card className="group relative overflow-hidden border-2 hover:border-[#1B4B8F] bg-white/70 backdrop-blur-xl shadow-2xl hover:shadow-3xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-[#1B4B8F]/5 to-[#0D2B5C]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="text-center pb-6 relative z-10">
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                  className="mx-auto w-20 h-20 bg-gradient-to-br from-[#1B4B8F] via-[#2563eb] to-[#0D2B5C] rounded-3xl flex items-center justify-center mb-6 shadow-2xl relative overflow-hidden"
                >
                  <motion.div
                    animate={{
                      background: [
                        "linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 100%)",
                        "linear-gradient(225deg, rgba(255,255,255,0.1) 0%, transparent 100%)",
                        "linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 100%)",
                      ],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Number.POSITIVE_INFINITY,
                    }}
                    className="absolute inset-0"
                  />
                  <LogIn className="h-10 w-10 text-white relative z-10" />
                </motion.div>
                <CardTitle className="text-3xl font-bold text-[#1B4B8F] mb-4">
                  Tableau de bord complet
                </CardTitle>
                <CardDescription className="text-lg leading-relaxed">
                  Accédez à toutes les fonctionnalités : gestion des
                  réservations, statistiques et vue détaillée
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 relative z-10">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={() => signIn("azure-ad", { callbackUrl: "/" })}
                    size="lg"
                    className="w-full h-14 text-lg bg-gradient-to-r from-[#1B4B8F] to-[#0D2B5C] hover:from-[#0D2B5C] hover:to-[#1B4B8F] text-white shadow-xl hover:shadow-2xl transition-all duration-300 group"
                  >
                    <LogIn className="mr-3 h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                    Se connecter avec Microsoft
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{
                        duration: 1.5,
                        repeat: Number.POSITIVE_INFINITY,
                      }}
                    >
                      <ArrowRight className="ml-3 h-5 w-5" />
                    </motion.div>
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            whileHover={{ y: -10, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Card className="group relative overflow-hidden border-2 hover:border-[#0D2B5C] bg-white/70 backdrop-blur-xl shadow-2xl hover:shadow-3xl transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-[#0D2B5C]/5 to-[#1B4B8F]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="text-center pb-6 relative z-10">
                <motion.div
                  whileHover={{ rotate: -360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                  className="mx-auto w-20 h-20 bg-gradient-to-br from-[#0D2B5C] via-[#1e40af] to-[#1B4B8F] rounded-3xl flex items-center justify-center mb-6 shadow-2xl relative overflow-hidden"
                >
                  <motion.div
                    animate={{
                      background: [
                        "linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 100%)",
                        "linear-gradient(225deg, rgba(255,255,255,0.1) 0%, transparent 100%)",
                        "linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 100%)",
                      ],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Number.POSITIVE_INFINITY,
                      delay: 1,
                    }}
                    className="absolute inset-0"
                  />
                  <Monitor className="h-10 w-10 text-white relative z-10" />
                </motion.div>
                <CardTitle className="text-3xl font-bold text-[#0D2B5C] mb-4">
                  Mode Kiosque
                </CardTitle>
                <CardDescription className="text-lg leading-relaxed">
                  Affichage plein écran optimisé pour les écrans muraux et la
                  consultation rapide
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 relative z-10">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    className="w-full h-14 text-lg border-2 border-[#0D2B5C] text-[#0D2B5C] hover:bg-gradient-to-r hover:from-[#0D2B5C] hover:to-[#1B4B8F] hover:text-white shadow-xl hover:shadow-2xl transition-all duration-300 group"
                    size="lg"
                    asChild
                  >
                    <Link href="/kiosk">
                      <Monitor className="mr-3 h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                      Ouvrir le mode kiosque
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{
                          duration: 1.5,
                          repeat: Number.POSITIVE_INFINITY,
                          delay: 0.5,
                        }}
                      >
                        <ArrowRight className="ml-3 h-5 w-5" />
                      </motion.div>
                    </Link>
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Aperçu des salles avec animations staggered */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3 }}
          className="space-y-12"
        >
          <div className="text-center space-y-6">
            <motion.h2
              className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#1B4B8F] to-[#0D2B5C] bg-clip-text text-transparent"
              initial={{ backgroundPosition: "0% 50%" }}
              animate={{ backgroundPosition: "100% 50%" }}
              transition={{
                duration: 4,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              }}
              style={{ backgroundSize: "200% 200%" }}
            >
              Aperçu des salles de réunion
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3.2 }}
              className="text-muted-foreground text-xl"
            >
              État actuel de vos espaces de travail
            </motion.p>
            
            {/* Indicateur pour les données d'exemple */}
            {rooms.length > 0 && rooms[0]?.isExample && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 3.4, type: "spring", stiffness: 200 }}
                className="flex items-center justify-center gap-3"
              >
                <motion.div
                  animate={{
                    boxShadow: [
                      "0 0 20px rgba(251, 191, 36, 0.3)",
                      "0 0 40px rgba(251, 191, 36, 0.5)",
                      "0 0 20px rgba(251, 191, 36, 0.3)",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  className="px-6 py-3 bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-100 dark:from-amber-900/30 dark:via-yellow-900/30 dark:to-amber-900/30 rounded-full border-2 border-amber-300 dark:border-amber-700 shadow-lg backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                      }}
                    >
                      <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </motion.div>
                    <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                      Données d'exemple - Connectez-vous pour voir les vraies données
                    </span>
                    <motion.div
                      animate={{ rotate: [0, -10, 10, 0] }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                        delay: 0.5,
                      }}
                    >
                      <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading-rooms"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
              >
                {[...Array(4)].map((_, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="h-full bg-white/70 backdrop-blur-xl shadow-xl">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 space-y-3">
                            <motion.div
                              animate={{ opacity: [0.5, 1, 0.5] }}
                              transition={{
                                duration: 1.5,
                                repeat: Number.POSITIVE_INFINITY,
                              }}
                            >
                              <Skeleton className="h-6 w-3/4" />
                            </motion.div>
                            <Skeleton className="h-4 w-1/2" />
                          </div>
                          <Skeleton className="h-8 w-20 rounded-full" />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-12 w-full rounded-lg" />
                        <div className="flex gap-2">
                          <Skeleton className="h-6 w-16 rounded-full" />
                          <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            ) : error ? (
              <motion.div
                key="error-rooms"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Card className="p-12 text-center border-[#1B4B8F]/20 bg-white/80 backdrop-blur-xl shadow-2xl">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                    }}
                  >
                    <AlertCircle className="h-20 w-20 mx-auto mb-6 text-[#1B4B8F]" />
                  </motion.div>
                  <h3 className="text-2xl font-bold mb-4 text-[#1B4B8F]">
                    Erreur de chargement
                  </h3>
                  <p className="text-muted-foreground mb-8 text-lg">{error}</p>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={fetchRoomsData}
                      variant="outline"
                      className="border-2 border-[#1B4B8F] text-[#1B4B8F] hover:bg-[#1B4B8F] hover:text-white transition-all duration-300"
                      size="lg"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 2,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "linear",
                        }}
                        className="mr-2"
                      >
                        <Layers className="h-4 w-4" />
                      </motion.div>
                      Réessayer
                    </Button>
                  </motion.div>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="rooms-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
              >
                {rooms.map((room, index) => (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      delay: 3.5 + index * 0.1,
                      type: "spring",
                      stiffness: 200,
                      damping: 20,
                    }}
                    whileHover={{ y: -10, scale: 1.02 }}
                  >
                    <Card
                      className={`h-full transition-all duration-500 hover:shadow-2xl bg-white/80 backdrop-blur-xl border-2 group relative overflow-hidden ${
                        room.isOccupied
                          ? "border-red-200 hover:border-red-400"
                          : "border-green-200 hover:border-green-400"
                      } ${room.isExample ? "border-amber-300/50" : ""}`}
                    >
                      {/* Badge d'exemple avec animation */}
                      {room.isExample && (
                        <motion.div
                          initial={{ opacity: 0, x: -50 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 3.6 + index * 0.1 }}
                          className="absolute top-3 right-3 z-10"
                        >
                          <motion.div
                            animate={{
                              scale: [1, 1.05, 1],
                              rotate: [0, 5, -5, 0],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Number.POSITIVE_INFINITY,
                              ease: "easeInOut",
                            }}
                            className="px-3 py-1 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full shadow-lg border-2 border-amber-500"
                          >
                            <div className="flex items-center gap-1.5">
                              <Sparkles className="h-3.5 w-3.5 text-white" />
                              <span className="text-xs font-bold text-white">
                                EXEMPLE
                              </span>
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                      
                      <CardHeader className="pb-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="text-lg font-bold truncate text-[#1B4B8F] group-hover:text-[#0D2B5C] transition-colors duration-300 pr-20">
                              {room.name}
                            </CardTitle>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                              <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{
                                  duration: 2,
                                  repeat: Number.POSITIVE_INFINITY,
                                  delay: index * 0.2,
                                }}
                              >
                                <MapPin className="h-4 w-4" />
                              </motion.div>
                              <span>{room.location}</span>
                            </div>
                          </div>
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            transition={{ type: "spring", stiffness: 400 }}
                          >
                            <Badge
                              variant={
                                room.isOccupied ? "destructive" : "default"
                              }
                              className={`${
                                room.isOccupied
                                  ? "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                                  : "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                              } text-white shadow-lg`}
                            >
                              {room.isOccupied ? "Occupée" : "Libre"}
                            </Badge>
                          </motion.div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-3 text-sm text-[#1B4B8F]">
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{
                              duration: 1.5,
                              repeat: Number.POSITIVE_INFINITY,
                              delay: index * 0.3,
                            }}
                          >
                            <Users className="h-4 w-4" />
                          </motion.div>
                          <span className="font-medium">
                            {room.capacity} personnes
                          </span>
                        </div>

                        {room.error ? (
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg border border-yellow-200"
                          >
                            <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                              {room.error}
                            </div>
                          </motion.div>
                        ) : (
                          <>
                            <AnimatePresence mode="wait">
                              {room.currentMeeting && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  className="p-3 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 rounded-lg border border-red-200 dark:border-red-800"
                                >
                                  <div className="text-sm font-bold text-red-800 dark:text-red-200 flex items-center gap-2">
                                    <motion.div
                                      animate={{ scale: [1, 1.2, 1] }}
                                      transition={{
                                        duration: 1,
                                        repeat: Number.POSITIVE_INFINITY,
                                      }}
                                    >
                                      🔴
                                    </motion.div>
                                    En cours: {room.currentMeeting.subject}
                                  </div>
                                  <div className="text-xs text-red-600 dark:text-red-300 mt-1">
                                    Jusqu'à{" "}
                                    {formatFrenchTime(
                                      room.currentMeeting.endTime
                                    )}
                                  </div>
                                </motion.div>
                              )}

                              {room.nextMeeting && !room.currentMeeting && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  className="p-3 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20 rounded-lg border border-orange-200 dark:border-orange-800"
                                >
                                  <div className="text-sm font-bold text-orange-800 dark:text-orange-200 flex items-center gap-2">
                                    <motion.div
                                      animate={{ scale: [1, 1.2, 1] }}
                                      transition={{
                                        duration: 1.5,
                                        repeat: Number.POSITIVE_INFINITY,
                                      }}
                                    >
                                      🟡
                                    </motion.div>
                                    Prochaine: {room.nextMeeting.subject}
                                  </div>
                                  <div className="text-xs text-orange-600 dark:text-orange-300 mt-1">
                                    Dans{" "}
                                    {getTimeUntilStart(
                                      room.nextMeeting.startTime
                                    )}{" "}
                                    à{" "}
                                    {formatFrenchTime(
                                      room.nextMeeting.startTime
                                    )}
                                  </div>
                                </motion.div>
                              )}

                              {!room.currentMeeting && !room.nextMeeting && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg border border-green-200 dark:border-green-800"
                                >
                                  <div className="text-sm font-bold text-green-800 dark:text-green-200 flex items-center gap-2">
                                    <motion.div
                                      animate={{ rotate: 360 }}
                                      transition={{
                                        duration: 3,
                                        repeat: Number.POSITIVE_INFINITY,
                                        ease: "linear",
                                      }}
                                    >
                                      🟢
                                    </motion.div>
                                    Aucune réunion prévue aujourd'hui
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </>
                        )}

                        <div className="flex flex-wrap gap-2">
                          {room.features.slice(0, 3).map((feature, idx) => (
                            <motion.span
                              key={idx}
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{
                                delay: 3.8 + index * 0.1 + idx * 0.05,
                              }}
                              whileHover={{ scale: 1.1 }}
                              className="text-xs bg-gradient-to-r from-[#1B4B8F]/10 to-[#0D2B5C]/10 text-[#1B4B8F] px-3 py-1 rounded-full border border-[#1B4B8F]/20 font-medium"
                            >
                              {feature}
                            </motion.span>
                          ))}
                          {room.features.length > 3 && (
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 4 + index * 0.1 }}
                              className="text-xs text-muted-foreground font-medium"
                            >
                              +{room.features.length - 3}
                            </motion.span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Fonctionnalités avec effets avancés */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 4.5 }}
          className="space-y-12"
        >
          <div className="text-center space-y-6">
            <motion.h2
              className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#1B4B8F] to-[#0D2B5C] bg-clip-text text-transparent"
              initial={{ backgroundPosition: "0% 50%" }}
              animate={{ backgroundPosition: "100% 50%" }}
              transition={{
                duration: 5,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              }}
              style={{ backgroundSize: "200% 200%" }}
            >
              Fonctionnalités principales
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 4.7 }}
              className="text-muted-foreground text-xl"
            >
              Tout ce dont vous avez besoin pour gérer vos espaces
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50, rotateY: -90 }}
                animate={{ opacity: 1, y: 0, rotateY: 0 }}
                transition={{
                  delay: 5 + index * 0.2,
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                }}
                whileHover={{ y: -15, rotateY: 5, scale: 1.05 }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <Card
                  className={`h-full text-center hover:shadow-2xl transition-all duration-500 group bg-gradient-to-br ${feature.bgGradient} dark:from-slate-800 dark:to-slate-900 backdrop-blur-xl border-2 border-white/20 hover:border-white/40 relative overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardHeader className="relative z-10">
                    <motion.div
                      whileHover={{
                        rotate: 360,
                        scale: 1.2,
                      }}
                      transition={{ duration: 0.6 }}
                      className={`mx-auto w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-2xl relative overflow-hidden`}
                    >
                      <motion.div
                        animate={{
                          background: [
                            "linear-gradient(45deg, rgba(255,255,255,0.2) 0%, transparent 100%)",
                            "linear-gradient(225deg, rgba(255,255,255,0.2) 0%, transparent 100%)",
                            "linear-gradient(45deg, rgba(255,255,255,0.2) 0%, transparent 100%)",
                          ],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Number.POSITIVE_INFINITY,
                          delay: index * 0.5,
                        }}
                        className="absolute inset-0"
                      />
                      <feature.icon className="h-8 w-8 text-white relative z-10" />
                    </motion.div>
                    <CardTitle className="text-xl font-bold text-[#1B4B8F] group-hover:text-[#0D2B5C] transition-colors duration-300">
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Footer info avec animation finale */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 6 }}
          className="text-center py-12 border-t border-[#1B4B8F]/20 relative"
        >
          <motion.div
            animate={{
              background: [
                "linear-gradient(90deg, transparent 0%, rgba(27, 75, 143, 0.1) 50%, transparent 100%)",
                "linear-gradient(270deg, transparent 0%, rgba(27, 75, 143, 0.1) 50%, transparent 100%)",
              ],
            }}
            transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
            className="absolute inset-0"
          />
          <motion.p
            className="text-muted-foreground text-lg relative z-10"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
          >
            Connectez-vous avec votre compte Microsoft Office 365 pour accéder à
            toutes les fonctionnalités
          </motion.p>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 20,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
            className="inline-block mt-4"
          >
            <Sparkles className="h-6 w-6 text-[#1B4B8F]" />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
