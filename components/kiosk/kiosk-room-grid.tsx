"use client";

import { useState, useEffect } from "react";
import { KioskRoomCard } from "./kiosk-room-card";
import type { MeetingRoom } from "@/lib/types";
import { motion } from "framer-motion";

interface KioskRoomGridProps {
  rooms: MeetingRoom[];
  loading?: boolean;
  fullscreen?: boolean;
}

export function KioskRoomGrid({
  rooms,
  loading = false,
  fullscreen = false,
}: KioskRoomGridProps) {
  const [gridConfig, setGridConfig] = useState({ cols: 2, rows: 2 });

  // Calculer la configuration optimale de la grille
  useEffect(() => {
    const updateGridConfig = () => {
      const roomCount = rooms.length;
      if (roomCount === 0) return;

      const width = window.innerWidth;
      const height = window.innerHeight;
      const aspectRatio = width / height;

      let cols: number;
      let rows: number;

      if (fullscreen) {
        // En mode plein écran, optimiser pour l'espace disponible
        if (roomCount === 1) {
          cols = 1;
          rows = 1;
        } else if (roomCount === 2) {
          cols = aspectRatio > 1.5 ? 2 : 1;
          rows = aspectRatio > 1.5 ? 1 : 2;
        } else if (roomCount === 3) {
          cols = aspectRatio > 1.2 ? 3 : 2;
          rows = aspectRatio > 1.2 ? 1 : 2;
        } else if (roomCount === 4) {
          cols = 2;
          rows = 2;
        } else if (roomCount <= 6) {
          cols = aspectRatio > 1.5 ? 3 : 2;
          rows = Math.ceil(roomCount / cols);
        } else if (roomCount <= 9) {
          cols = 3;
          rows = 3;
        } else {
          cols = 4;
          rows = Math.ceil(roomCount / 4);
        }
      } else {
        // Mode normal, plus conservateur
        if (roomCount <= 2) {
          cols = width < 768 ? 1 : 2;
          rows = width < 768 ? roomCount : 1;
        } else if (roomCount <= 4) {
          cols = width < 768 ? 1 : width < 1280 ? 2 : 2;
          rows = Math.ceil(roomCount / cols);
        } else {
          cols = width < 768 ? 1 : width < 1280 ? 2 : 3;
          rows = Math.ceil(roomCount / cols);
        }
      }

      setGridConfig({ cols, rows });
    };

    updateGridConfig();
    window.addEventListener("resize", updateGridConfig);
    return () => window.removeEventListener("resize", updateGridConfig);
  }, [rooms.length, fullscreen]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="text-white text-lg">Chargement des salles...</p>
        </div>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            Aucune salle disponible
          </h2>
          <p className="text-gray-400">
            Vérifiez votre connexion ou les permissions
          </p>
        </div>
      </div>
    );
  }

  // Calculer les dimensions des cartes pour éviter l'overflow
  const containerPadding = fullscreen ? 24 : 48; // padding du container
  const gap = 24; // gap entre les cartes
  const headerHeight = fullscreen ? 80 : 120; // hauteur approximative du header
  const controlsHeight = fullscreen ? 0 : 200; // hauteur approximative des contrôles

  const availableWidth = window.innerWidth - containerPadding;
  const availableHeight =
    window.innerHeight - headerHeight - controlsHeight - containerPadding;

  const cardWidth =
    (availableWidth - gap * (gridConfig.cols - 1)) / gridConfig.cols;
  const cardHeight =
    (availableHeight - gap * (gridConfig.rows - 1)) / gridConfig.rows;

  // S'assurer que les cartes ont une taille minimale raisonnable
  const minCardWidth = fullscreen ? 300 : 250;
  const minCardHeight = fullscreen ? 200 : 180;

  const finalCardWidth = Math.max(cardWidth, minCardWidth);
  const finalCardHeight = Math.max(cardHeight, minCardHeight);

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: `repeat(${gridConfig.cols}, 1fr)`,
    gridTemplateRows: `repeat(${gridConfig.rows}, 1fr)`,
    gap: `${gap}px`,
    width: "100%",
    height: "100%",
    maxWidth: "100vw",
    maxHeight: fullscreen ? "calc(100vh - 120px)" : "calc(100vh - 320px)",
    overflow: "hidden",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={gridStyle}
    >
      {rooms.map((room, index) => (
        <motion.div
          key={room.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          style={{
            width: "100%",
            height: "100%",
            minWidth: `${minCardWidth}px`,
            minHeight: `${minCardHeight}px`,
            maxWidth: "100%",
            maxHeight: "100%",
            overflow: "hidden",
          }}
        >
          <KioskRoomCard room={room} fullscreen={false} />
        </motion.div>
      ))}
    </motion.div>
  );
}
