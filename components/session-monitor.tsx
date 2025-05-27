"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { Shield, ShieldCheck, AlertTriangle } from "lucide-react";

export function SessionMonitor() {
  const { data: session, status } = useSession();
  const [sessionHealth, setSessionHealth] = useState<
    "healthy" | "warning" | "error"
  >("healthy");
  const [lastApiCheck, setLastApiCheck] = useState<Date>(new Date());

  // Test périodique de l'API pour vérifier la santé de la session
  useEffect(() => {
    const testApiHealth = async () => {
      if (status === "authenticated") {
        try {
          const response = await fetch("/api/rooms", {
            method: "HEAD", // Juste pour tester la connectivité
          });

          if (response.ok) {
            setSessionHealth("healthy");
            setLastApiCheck(new Date());
          } else if (response.status === 401) {
            setSessionHealth("warning");
            console.warn("API retourne 401 mais session maintenue");
          } else {
            setSessionHealth("warning");
          }
        } catch (error) {
          console.warn("Test API échoué mais session maintenue:", error);
          setSessionHealth("warning");
        }
      }
    };

    // Test initial
    testApiHealth();

    // Test toutes les 2 minutes
    const interval = setInterval(testApiHealth, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [status]);

  // Surveiller l'état de la session sans jamais forcer la déconnexion
  useEffect(() => {
    if (status === "authenticated") {
      console.log("Session permanente confirmée:", session?.user?.email);

      // Afficher une notification de bienvenue seulement une fois
      const hasShownWelcome = sessionStorage.getItem("welcomeShown");
      if (!hasShownWelcome) {
        toast({
          title: "Session permanente activée",
          description: "Vous resterez connecté en permanence",
          duration: 5000,
        });
        sessionStorage.setItem("welcomeShown", "true");
      }
    } else if (status === "unauthenticated") {
      // Ne jamais traiter cela comme une erreur fatale
      console.log("Session non initialisée - en attente de connexion");
    }
  }, [status, session]);

  // Affichage conditionnel de l'indicateur de session
  const getSessionIndicator = () => {
    if (status === "loading") {
      return {
        icon: Shield,
        color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        text: "Initialisation...",
      };
    }

    if (status === "unauthenticated") {
      return {
        icon: AlertTriangle,
        color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        text: "Non connecté",
      };
    }

    // Session authentifiée
    switch (sessionHealth) {
      case "healthy":
        return {
          icon: ShieldCheck,
          color: "bg-green-500/20 text-green-400 border-green-500/30",
          text: "Session active",
        };
      case "warning":
        return {
          icon: Shield,
          color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
          text: "Session active (API limitée)",
        };
      default:
        return {
          icon: Shield,
          color: "bg-green-500/20 text-green-400 border-green-500/30",
          text: "Session active",
        };
    }
  };

  const indicator = getSessionIndicator();
  const Icon = indicator.icon;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 px-3 py-2 rounded-lg backdrop-blur-sm border ${indicator.color}`}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <span className="text-sm">{indicator.text}</span>
        {status === "authenticated" && (
          <div className="text-xs opacity-70">
            {new Date().toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}
      </div>
    </div>
  );
}
