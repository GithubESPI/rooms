"use client";

import { useState, useEffect } from "react";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvatarEnhancedProps {
  src?: string;
  alt?: string;
  name?: string;
  email?: string; // Ajouter l'email pour récupérer la photo
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function AvatarEnhanced({
  src,
  alt,
  name,
  email,
  size = "md",
  className,
}: AvatarEnhancedProps) {
  const [imageError, setImageError] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(src || null);
  const [loading, setLoading] = useState(false);

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-12 w-12 text-sm",
    lg: "h-16 w-16 text-base",
    xl: "h-24 w-24 text-lg",
  };

  // Récupérer la photo depuis Microsoft Graph si on a un email
  useEffect(() => {
    if (email && !src && !imageError) {
      setLoading(true);
      fetch(`/api/user-photo/${encodeURIComponent(email)}`)
        .then((response) => {
          if (response.ok) {
            // Créer une URL blob pour l'image
            return response.blob().then((blob) => {
              const url = URL.createObjectURL(blob);
              setPhotoUrl(url);
              console.log(`Photo chargée pour ${email}`);
            });
          } else {
            console.log(`Aucune photo disponible pour ${email}`);
            setImageError(true);
          }
        })
        .catch((error) => {
          console.error(
            `Erreur lors du chargement de la photo pour ${email}:`,
            error
          );
          setImageError(true);
        })
        .finally(() => {
          setLoading(false);
        });
    }

    // Nettoyer l'URL blob quand le composant est démonté
    return () => {
      if (photoUrl && photoUrl.startsWith("blob:")) {
        URL.revokeObjectURL(photoUrl);
      }
    };
  }, [email, src, imageError]);

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getBackgroundColor = (name?: string) => {
    if (!name) return "bg-gray-500";

    const colors = [
      "bg-red-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
    ];

    const hash = name
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Afficher un spinner pendant le chargement
  if (loading) {
    return (
      <div
        className={cn(
          "rounded-full flex items-center justify-center border-2 border-white shadow-lg animate-pulse bg-gray-300",
          sizeClasses[size],
          className
        )}
      >
        <div className="animate-spin rounded-full h-1/2 w-1/2 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  // Afficher l'image si disponible et pas d'erreur
  if (photoUrl && !imageError) {
    return (
      <img
        src={photoUrl || "/placeholder.svg"}
        alt={alt || name || "Avatar"}
        className={cn(
          "rounded-full object-cover border-2 border-white shadow-lg",
          sizeClasses[size],
          className
        )}
        onError={() => {
          console.log(`Erreur de chargement d'image pour ${name}`);
          setImageError(true);
          // Nettoyer l'URL blob en cas d'erreur
          if (photoUrl.startsWith("blob:")) {
            URL.revokeObjectURL(photoUrl);
          }
        }}
      />
    );
  }

  // Fallback vers les initiales
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center text-white font-semibold border-2 border-white shadow-lg",
        sizeClasses[size],
        getBackgroundColor(name),
        className
      )}
    >
      {name ? getInitials(name) : <User className="h-1/2 w-1/2" />}
    </div>
  );
}
