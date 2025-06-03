"use client";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  RotateCw,
  Grid,
} from "lucide-react";

interface KioskControlsProps {
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  autoRotate: boolean;
  setAutoRotate: (value: boolean) => void;
  rotationInterval: number;
  setRotationInterval: (value: number) => void;
  // Intervalles par statut
  occupiedRoomInterval: number;
  setOccupiedRoomInterval: (value: number) => void;
  availableRoomInterval: number;
  setAvailableRoomInterval: (value: number) => void;
  modeChangeInterval: number;
  setModeChangeInterval: (value: number) => void;
  currentDisplayMode: "occupied" | "available";
  occupiedRoomsCount: number;
  availableRoomsCount: number;
  currentPage: number;
  totalPages: number;
  nextPage: () => void;
  prevPage: () => void;
  refreshData: () => void;
  loading: boolean;
  // Nouvelle option pour afficher toutes les salles en grille
  showAllRoomsGrid: boolean;
  setShowAllRoomsGrid: (value: boolean) => void;
}

export function KioskControls({
  isFullscreen,
  toggleFullscreen,
  autoRotate,
  setAutoRotate,
  rotationInterval,
  setRotationInterval,
  occupiedRoomInterval,
  setOccupiedRoomInterval,
  availableRoomInterval,
  setAvailableRoomInterval,
  modeChangeInterval,
  setModeChangeInterval,
  currentDisplayMode,
  occupiedRoomsCount,
  availableRoomsCount,
  currentPage,
  totalPages,
  nextPage,
  prevPage,
  refreshData,
  loading,
  showAllRoomsGrid,
  setShowAllRoomsGrid,
}: KioskControlsProps) {
  return (
    <div className="bg-gray-900 border-t border-gray-800 p-4">
      <div className="container mx-auto space-y-4">
        {/* Ligne 1: Navigation et statut */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={prevPage}
              disabled={totalPages <= 1 || showAllRoomsGrid}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-sm">
              Page {currentPage + 1} / {totalPages}
            </span>

            <Button
              variant="outline"
              size="icon"
              onClick={nextPage}
              disabled={totalPages <= 1 || showAllRoomsGrid}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Indicateur de mode actuel */}
          <div className="flex items-center gap-4">
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                showAllRoomsGrid
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : currentDisplayMode === "occupied"
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "bg-green-500/20 text-green-400 border border-green-500/30"
              }`}
            >
              Mode:{" "}
              {showAllRoomsGrid
                ? "Toutes les salles"
                : currentDisplayMode === "occupied"
                ? "Salles occupées"
                : "Salles libres"}
            </div>

            <div className="text-sm text-gray-400">
              Occupées: {occupiedRoomsCount} | Libres: {availableRoomsCount}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={refreshData}
              disabled={loading}
            >
              <RotateCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>

            <Button variant="outline" size="icon" onClick={toggleFullscreen}>
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Ligne 2: Contrôles de rotation et affichage */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-6">
            {/* Option pour afficher toutes les salles en grille */}
            <div className="flex items-center gap-2">
              <Switch
                id="show-all-rooms"
                checked={showAllRoomsGrid}
                onCheckedChange={setShowAllRoomsGrid}
              />
              <Label
                htmlFor="show-all-rooms"
                className="text-sm flex items-center gap-2"
              >
                <Grid className="h-4 w-4" />
                Afficher toutes les salles
              </Label>
            </div>

            {/* Rotation automatique (désactivée si affichage en grille) */}
            <div className="flex items-center gap-2">
              <Switch
                id="auto-rotate"
                checked={autoRotate}
                onCheckedChange={setAutoRotate}
                disabled={showAllRoomsGrid || totalPages <= 1}
              />
              <Label
                htmlFor="auto-rotate"
                className={`text-sm ${showAllRoomsGrid ? "text-gray-500" : ""}`}
              >
                Rotation automatique
              </Label>
            </div>
          </div>

          {/* Contrôles d'intervalles (désactivés si affichage en grille) */}
          <div className="flex items-center gap-6">
            {/* Intervalle pour salles occupées */}
            <div className="flex items-center gap-2">
              <Label
                className={`text-sm whitespace-nowrap ${
                  showAllRoomsGrid ? "text-gray-500" : "text-red-400"
                }`}
              >
                Salles occupées: {occupiedRoomInterval}s
              </Label>
              <Slider
                min={5}
                max={30}
                step={5}
                value={[occupiedRoomInterval]}
                onValueChange={(value) => setOccupiedRoomInterval(value[0])}
                disabled={!autoRotate || showAllRoomsGrid}
                className="w-24"
              />
            </div>

            {/* Intervalle pour salles libres */}
            <div className="flex items-center gap-2">
              <Label
                className={`text-sm whitespace-nowrap ${
                  showAllRoomsGrid ? "text-gray-500" : "text-green-400"
                }`}
              >
                Salles libres: {availableRoomInterval}s
              </Label>
              <Slider
                min={5}
                max={30}
                step={5}
                value={[availableRoomInterval]}
                onValueChange={(value) => setAvailableRoomInterval(value[0])}
                disabled={!autoRotate || showAllRoomsGrid}
                className="w-24"
              />
            </div>

            {/* Intervalle de changement de mode */}
            <div className="flex items-center gap-2">
              <Label
                className={`text-sm whitespace-nowrap ${
                  showAllRoomsGrid ? "text-gray-500" : "text-blue-400"
                }`}
              >
                Changement mode: {modeChangeInterval}s
              </Label>
              <Slider
                min={15}
                max={120}
                step={15}
                value={[modeChangeInterval]}
                onValueChange={(value) => setModeChangeInterval(value[0])}
                disabled={!autoRotate || showAllRoomsGrid}
                className="w-24"
              />
            </div>
          </div>
        </div>

        {/* Ligne 3: Informations et raccourcis */}
        <div className="flex justify-between items-center text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>
              Raccourcis: F11 (Plein écran) • R (Actualiser) • Espace
              (Pause/Play) • G (Grille)
            </span>
          </div>

          <div className="flex items-center gap-4">
            {!showAllRoomsGrid && autoRotate && (
              <>
                <span>
                  Prochaine rotation dans: {Math.ceil(rotationInterval)}s
                </span>
                <span>•</span>
              </>
            )}
            <span>
              Dernière mise à jour: {new Date().toLocaleTimeString("fr-FR")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
