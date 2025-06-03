"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface ManualSignOutProps {
  className?: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
}

export function ManualSignOut({
  className,
  variant = "outline",
}: ManualSignOutProps) {
  const handleManualSignOut = async () => {
    try {
      console.log("Déconnexion manuelle initiée");

      // Marquer la déconnexion comme manuelle
      await fetch("/api/auth/manual-signout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Effectuer la déconnexion
      await signOut({
        callbackUrl: "/auth/signin",
        redirect: true,
      });
    } catch (error) {
      console.error("Erreur lors de la déconnexion manuelle:", error);
      // Forcer la déconnexion même en cas d'erreur
      await signOut({
        callbackUrl: "/auth/signin",
        redirect: true,
      });
    }
  };

  return (
    <Button
      onClick={handleManualSignOut}
      variant={variant}
      className={className}
      size="sm"
    >
      <LogOut className="h-4 w-4 mr-2" />
      Se déconnecter
    </Button>
  );
}
