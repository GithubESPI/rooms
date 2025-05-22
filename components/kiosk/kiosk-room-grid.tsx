"use client";

import { useEffect, useState } from "react";
import { KioskRoomCard } from "./kiosk-room-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { MeetingRoom } from "@/lib/types";
import { motion } from "framer-motion";

interface KioskRoomGridProps {
  rooms: MeetingRoom[];
  loading: boolean;
}

export function KioskRoomGrid({ rooms, loading }: KioskRoomGridProps) {
  const [gridCols, setGridCols] = useState("grid-cols-2");

  // Ajuster le nombre de colonnes en fonction du nombre de salles
  useEffect(() => {
    if (rooms.length <= 2) {
      setGridCols("grid-cols-1");
    } else if (rooms.length <= 4) {
      setGridCols("grid-cols-2");
    } else {
      setGridCols("grid-cols-3");
    }
  }, [rooms.length]);

  if (loading && rooms.length === 0) {
    return (
      <div className={`grid ${gridCols} gap-6 h-full`}>
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-full w-full rounded-xl bg-gray-800" />
        ))}
      </div>
    );
  }

  // Trier les salles: d'abord les occupées, puis les autres
  const sortedRooms = [...rooms].sort((a, b) => {
    if ("isOccupied" in a && "isOccupied" in b) {
      if (a.isOccupied && !b.isOccupied) return -1;
      if (!a.isOccupied && b.isOccupied) return 1;
    }
    return 0;
  });

  return (
    <div className={`grid ${gridCols} gap-6 h-full`}>
      {sortedRooms.map((room, index) => (
        <motion.div
          key={room.id}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: index * 0.1,
            type: "spring",
            stiffness: 100,
          }}
        >
          <KioskRoomCard room={room} />
        </motion.div>
      ))}
    </div>
  );
}
