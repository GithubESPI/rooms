"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FullscreenPromptProps {
  onRequestFullscreen: () => void;
}

export function FullscreenPrompt({
  onRequestFullscreen,
}: FullscreenPromptProps) {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Afficher le prompt après 3 secondes si pas en plein écran
    const timer = setTimeout(() => {
      if (!document.fullscreenElement) {
        setShowPrompt(true);
      }
    }, 3000);

    // Masquer le prompt si on passe en plein écran
    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        setShowPrompt(false);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const handleFullscreenRequest = () => {
    onRequestFullscreen();
    setShowPrompt(false);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed top-4 right-4 z-50 bg-black/90 text-white p-4 rounded-lg shadow-xl border border-gray-700 max-w-sm"
        >
          <div className="flex items-start gap-3">
            <Maximize className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">Mode plein écran</h3>
              <p className="text-xs text-gray-300 mb-3">
                Pour une meilleure expérience, passez en mode plein écran
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleFullscreenRequest}
                  className="bg-blue-600 hover:bg-blue-700 text-xs"
                >
                  Activer
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowPrompt(false)}
                  className="text-gray-300 hover:text-white text-xs"
                >
                  Plus tard
                </Button>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowPrompt(false)}
              className="p-1 h-auto text-gray-400 hover:text-white"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
