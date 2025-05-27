"use client";

import { useState, useEffect, useRef } from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { LogIn, Monitor, LogOut, AlertTriangle } from "lucide-react";
import { useSession, signIn, signOut, canSignOut } from "@/lib/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";

export function Header() {
  const { session, status } = useSession();
  const [currentTime, setCurrentTime] = useState<string>("");
  const router = useRouter();
  const [kioskCountdown, setKioskCountdown] = useState<number | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
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
      setKioskCountdown(30);
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

  // Fonction pour gérer la déconnexion
  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);

      toast({
        title: "Déconnexion en cours...",
        description: "Veuillez patienter",
      });

      await signOut({
        callbackUrl: "/",
        redirect: true,
      });

      toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté avec succès",
      });
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      toast({
        title: "Erreur de déconnexion",
        description: "Une erreur s'est produite lors de la déconnexion",
        variant: "destructive",
      });
    } finally {
      setIsSigningOut(false);
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
                  Session permanente
                  {session?.user?.name && (
                    <span className="ml-2 font-medium">
                      {session.user.name}
                    </span>
                  )}
                </div>

                {/* Bouton de déconnexion avec confirmation */}
                {canSignOut(session) && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isSigningOut}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        {isSigningOut ? "Déconnexion..." : "Se déconnecter"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-orange-500" />
                          Confirmer la déconnexion
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                          <p>Êtes-vous sûr de vouloir vous déconnecter ?</p>
                          <p className="text-sm text-muted-foreground">
                            Votre session permanente sera interrompue et vous
                            devrez vous reconnecter manuellement pour accéder à
                            l'application.
                          </p>
                          <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-md border border-orange-200 dark:border-orange-800">
                            <p className="text-sm text-orange-800 dark:text-orange-200">
                              <strong>Note :</strong> Cette action est
                              recommandée uniquement si vous utilisez un
                              ordinateur partagé ou si vous souhaitez changer de
                              compte utilisateur.
                            </p>
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleSignOut}
                          className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                          Oui, me déconnecter
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ) : (
              <Button onClick={() => signIn()} size="sm">
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
