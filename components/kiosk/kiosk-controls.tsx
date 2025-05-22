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
} from "lucide-react";

interface KioskControlsProps {
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  autoRotate: boolean;
  setAutoRotate: (value: boolean) => void;
  rotationInterval: number;
  setRotationInterval: (value: number) => void;
  currentPage: number;
  totalPages: number;
  nextPage: () => void;
  prevPage: () => void;
  refreshData: () => void;
  loading: boolean;
}

export function KioskControls({
  isFullscreen,
  toggleFullscreen,
  autoRotate,
  setAutoRotate,
  rotationInterval,
  setRotationInterval,
  currentPage,
  totalPages,
  nextPage,
  prevPage,
  refreshData,
  loading,
}: KioskControlsProps) {
  return (
    <div className="bg-gray-900 border-t border-gray-800 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={prevPage}
            disabled={totalPages <= 1}
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
            disabled={totalPages <= 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Switch
              id="auto-rotate"
              checked={autoRotate}
              onCheckedChange={setAutoRotate}
              disabled={totalPages <= 1}
            />
            <Label htmlFor="auto-rotate" className="text-sm">
              Rotation automatique
            </Label>
          </div>

          <div className="flex items-center gap-2 w-48">
            <Label
              htmlFor="rotation-interval"
              className="text-sm whitespace-nowrap"
            >
              Intervalle: {rotationInterval}s
            </Label>
            <Slider
              id="rotation-interval"
              min={5}
              max={60}
              step={5}
              value={[rotationInterval]}
              onValueChange={(value) => setRotationInterval(value[0])}
              disabled={!autoRotate || totalPages <= 1}
              className="w-24"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={refreshData}
            disabled={loading}
          >
            <RotateCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
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
    </div>
  );
}
