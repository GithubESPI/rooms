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

        // Essayer plusieurs approches pour récupérer la photo
        const photoApproaches = [
          // 1. API authentifiée si disponible
          `/api/user-photo/${encodeURIComponent(organizerEmail)}`,
          // 2. API publique en fallback
          `/api/welcome/user-photo/${encodeURIComponent(organizerEmail)}`,
        ];

        for (const [index, apiUrl] of photoApproaches.entries()) {
          try {
            console.log(`🔍 Tentative ${index + 1}: ${apiUrl}`);

            const photoResponse = await fetch(apiUrl, {
              method: "GET",
              headers: { Accept: "image/*" },
              signal: AbortSignal.timeout(8000),
            });

            if (photoResponse.ok) {
              const blob = await photoResponse.blob();
              if (blob.size > 0) {
                const url = URL.createObjectURL(blob);
                setPhotoUrl(url);
                console.log(
                  `✅ Photo organisateur chargée: ${organizerName} (approche ${
                    index + 1
                  })`
                );
                return;
              }
            } else {
              console.log(
                `❌ Erreur ${
                  photoResponse.status
                } pour ${organizerName} (approche ${index + 1})`
              );
            }
          } catch (err) {
            console.log(
              `💥 Erreur approche ${index + 1} pour ${organizerName}:`,
              err
            );
            continue;
          }
        }

        // Si toutes les approches échouent
        console.log(
          `❌ Aucune photo trouvée pour ${organizerName}, utilisation des initiales`
        );
        setError(true);
      } catch (err) {
        console.log(`💥 Erreur générale pour ${organizerName}:`, err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    // Délai pour éviter trop de requêtes simultanées
    const timeoutId = setTimeout(
      fetchOrganizerPhoto,
      Math.random() * 500 + 200
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
