"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";

interface KioskHeaderProps {
  lastUpdated: Date;
}

export function KioskHeader({ lastUpdated }: KioskHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Mettre à jour l'heure toutes les secondes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-black text-white p-4 border-b border-gray-800">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-3xl font-bold">
            <Link href="/">Salles de réunion</Link>
          </h1>
          <div className="ml-4 text-sm text-gray-400">
            Dernière mise à jour:{" "}
            {format(lastUpdated, "HH:mm:ss", { locale: fr })}
          </div>
        </div>
        <div className="text-4xl font-mono">
          {format(currentTime, "HH:mm:ss", { locale: fr })}
        </div>
      </div>
    </header>
  );
}
