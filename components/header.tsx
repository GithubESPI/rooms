"use client";

import { useState, useEffect, useRef } from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { LogIn, Monitor } from "lucide-react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export function Header() {
  const { data: session, status } = useSession();
  const [currentTime, setCurrentTime] = useState<string>("");
  const router = useRouter();
  const [kioskCountdown, setKioskCountdown] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Effet pour démarrer le compte à rebours après l'authentification
  useEffect(() => {
    if (status === "authenticated" && !kioskCountdown) {
      setKioskCountdown(10);
    } else if (status !== "authenticated") {
      setKioskCountdown(null);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [status, kioskCountdown]);

  // Effet pour gérer le compte à rebours
  useEffect(() => {
    if (kioskCountdown !== null) {
      if (kioskCountdown > 0) {
        timerRef.current = setTimeout(() => {
          setKioskCountdown(kioskCountdown - 1);
        }, 1000);
      } else {
        // Rediriger vers le mode kiosque quand le compte à rebours atteint 0
        router.push("/kiosk");
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [kioskCountdown, router]);

  // Fonction pour annuler le compte à rebours
  const cancelKioskMode = () => {
    setKioskCountdown(null);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-xl font-bold">
              O365 Meeting Rooms
            </Link>
            <div className="text-sm text-muted-foreground">{currentTime}</div>
          </div>
          <div className="flex items-center gap-4">
            {status === "authenticated" ? (
              <div className="flex items-center gap-4">
                {kioskCountdown !== null && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Mode kiosque dans {kioskCountdown}s
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={cancelKioskMode}
                    >
                      Annuler
                    </Button>
                  </div>
                )}
                <Button variant="outline" size="sm" asChild>
                  <Link href="/kiosk">
                    <Monitor className="mr-2 h-4 w-4" />
                    Mode Kiosque
                  </Link>
                </Button>
                <div className="text-sm">
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    ●
                  </span>{" "}
                  Connecté en permanence
                  {session?.user?.name && (
                    <span className="ml-2 font-medium">
                      {session.user.name}
                    </span>
                  )}
                </div>
                {/* Suppression du bouton de déconnexion pour maintenir la session permanente */}
              </div>
            ) : (
              <Button onClick={() => signIn("azure-ad")} size="sm">
                <LogIn className="mr-2 h-4 w-4" />
                Connexion
              </Button>
            )}
            <ModeToggle />
          </div>
        </div>
      </header>
    </motion.div>
  );
}
