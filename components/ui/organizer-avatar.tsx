"use client";

import { useState, useEffect } from "react";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrganizerAvatarProps {
  organizerEmail: string;
  organizerName: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function OrganizerAvatar({
  organizerEmail,
  organizerName,
  size = "md",
  className,
}: OrganizerAvatarProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-12 w-12 text-sm",
    lg: "h-16 w-16 text-base",
    xl: "h-24 w-24 text-lg",
  };

  // Récupérer la photo de l'organisateur
  useEffect(() => {
    if (!organizerEmail) return;

    const fetchOrganizerPhoto = async () => {
      setLoading(true);
      setError(false);

      try {
        console.log(
          `📸 Récupération photo organisateur: ${organizerName} (${organizerEmail})`
        );

        // Vérifier d'abord si l'utilisateur est connecté
        const sessionResponse = await fetch("/api/auth/session", {
          method: "GET",
          signal: AbortSignal.timeout(2000),
        });

        const isAuthenticated =
          sessionResponse.ok && (await sessionResponse.json())?.user;

        // Choisir l'API appropriée
        const photoApiUrl = isAuthenticated
          ? `/api/user-photo/${encodeURIComponent(organizerEmail)}`
          : `/api/welcome/user-photo/${encodeURIComponent(organizerEmail)}`;

        console.log(
          `🔍 API utilisée: ${photoApiUrl} (authentifié: ${isAuthenticated})`
        );

        const photoResponse = await fetch(photoApiUrl, {
          method: "GET",
          headers: { Accept: "image/*" },
          signal: AbortSignal.timeout(5000),
        });

        if (photoResponse.ok) {
          const blob = await photoResponse.blob();
          if (blob.size > 0) {
            const url = URL.createObjectURL(blob);
            setPhotoUrl(url);
            console.log(`✅ Photo organisateur chargée: ${organizerName}`);
          } else {
            setError(true);
          }
        } else {
          console.log(
            `❌ Erreur ${photoResponse.status} pour ${organizerName}`
          );
          setError(true);
        }
      } catch (err) {
        console.log(`💥 Erreur réseau pour ${organizerName}:`, err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    // Délai pour éviter trop de requêtes simultanées
    const timeoutId = setTimeout(
      fetchOrganizerPhoto,
      Math.random() * 300 + 100
    );

    return () => {
      clearTimeout(timeoutId);
      if (photoUrl && photoUrl.startsWith("blob:")) {
        URL.revokeObjectURL(photoUrl);
      }
    };
  }, [organizerEmail, organizerName, photoUrl]);

  const getInitials = () => {
    return organizerName
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getBackgroundColor = () => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-red-500",
      "bg-yellow-500",
      "bg-indigo-500",
      "bg-pink-500",
      "bg-teal-500",
    ];

    const hash = organizerEmail
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Spinner de chargement
  if (loading) {
    return (
      <div
        className={cn(
          "rounded-full flex items-center justify-center border-2 border-white shadow-lg animate-pulse bg-gray-300 dark:bg-gray-700",
          sizeClasses[size],
          className
        )}
      >
        <div className="animate-spin rounded-full h-1/2 w-1/2 border-b-2 border-white"></div>
      </div>
    );
  }

  // Photo de l'organisateur
  if (photoUrl && !error) {
    return (
      <img
        src={photoUrl || "/placeholder.svg"}
        alt={`Photo de ${organizerName}`}
        className={cn(
          "rounded-full object-cover border-2 border-white shadow-lg",
          sizeClasses[size],
          className
        )}
        onError={() => {
          console.log(`💥 Erreur affichage photo pour ${organizerName}`);
          setError(true);
          if (photoUrl.startsWith("blob:")) {
            URL.revokeObjectURL(photoUrl);
          }
        }}
      />
    );
  }

  // Fallback avec initiales
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center text-white font-semibold border-2 border-white shadow-lg",
        sizeClasses[size],
        getBackgroundColor(),
        className
      )}
      title={`${organizerName} (${organizerEmail})`}
    >
      {organizerName ? getInitials() : <User className="h-1/2 w-1/2" />}
    </div>
  );
}
