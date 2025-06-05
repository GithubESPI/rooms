"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Session } from "next-auth";

declare module "next-auth" {
  interface Session {
    isManualSignOut?: boolean;
  }
}

export function SessionMonitor() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [lastCheck, setLastCheck] = useState<number>(Date.now());

  useEffect(() => {
    if (status === "loading") return;

    const checkSession = async () => {
      try {
        // Vérifier si la session a une erreur
        if (session?.error === "RefreshAccessTokenError") {
          console.log("Session error detected, redirecting to home page");
          toast.error("Votre session a expiré. Veuillez vous reconnecter.");
          router.push("/");
          return;
        }

        // Vérifier si l'utilisateur s'est déconnecté manuellement
        const isManualSignOut = session?.isManualSignOut ?? false;
        if (isManualSignOut) {
          console.log("Manual sign out detected");
          return;
        }

        // Vérifier la validité de la session toutes les 5 minutes
        const now = Date.now();
        if (now - lastCheck > 5 * 60 * 1000) {
          // 5 minutes
          console.log("Checking session validity...");
          await update(); // Force session refresh
          setLastCheck(now);
        }
      } catch (error) {
        console.error("Session check error:", error);
      }
    };

    // Vérifier immédiatement si on a une session
    if (session) {
      checkSession();
    }

    // Configurer un intervalle pour vérifier périodiquement
    const interval = setInterval(checkSession, 60000); // Toutes les minutes

    return () => clearInterval(interval);
  }, [session, status, router, update, lastCheck]);

  // Gérer les changements de visibilité de la page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && session && !session.error) {
        console.log("Page became visible, checking session...");
        update(); // Rafraîchir la session quand la page redevient visible
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [session, update]);

  // Ce composant ne rend rien, il surveille juste la session
  return null;
}
