"use client";

import { useState } from "react";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvatarEnhancedProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function AvatarEnhanced({
  src,
  alt,
  name,
  size = "md",
  className,
}: AvatarEnhancedProps) {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-12 w-12 text-sm",
    lg: "h-16 w-16 text-base",
    xl: "h-24 w-24 text-lg",
  };

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

  if (src && !imageError) {
    return (
      <img
        src={src || "/placeholder.svg"}
        alt={alt || name || "Avatar"}
        className={cn(
          "rounded-full object-cover border-2 border-white shadow-lg",
          sizeClasses[size],
          className
        )}
        onError={() => setImageError(true)}
      />
    );
  }

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
