"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Sparkles, Calendar } from "lucide-react";

interface MeetingEndAnimationProps {
  isVisible: boolean;
  roomName: string;
  onAnimationComplete: () => void;
  fullscreen?: boolean;
}

export function MeetingEndAnimation({
  isVisible,
  roomName,
  onAnimationComplete,
  fullscreen = false,
}: MeetingEndAnimationProps) {
  const [stage, setStage] = useState<"celebration" | "transition" | "complete">(
    "celebration"
  );

  useEffect(() => {
    if (!isVisible) return;

    const timer1 = setTimeout(() => setStage("transition"), 2000);
    const timer2 = setTimeout(() => setStage("complete"), 3500);
    const timer3 = setTimeout(() => onAnimationComplete(), 4000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isVisible, onAnimationComplete]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      >
        <div className="text-center space-y-8">
          {/* Stage 1: Célébration de fin */}
          {stage === "celebration" && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="space-y-6"
            >
              {/* Icône de fin avec effet de particules */}
              <div className="relative">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{
                    duration: 1,
                    repeat: 2,
                    ease: "easeInOut",
                  }}
                  className={`mx-auto ${
                    fullscreen ? "w-32 h-32" : "w-24 h-24"
                  } bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-2xl`}
                >
                  <CheckCircle
                    className={`${
                      fullscreen ? "h-16 w-16" : "h-12 w-12"
                    } text-white`}
                  />
                </motion.div>

                {/* Particules de célébration */}
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{
                      scale: 0,
                      x: 0,
                      y: 0,
                      opacity: 0,
                    }}
                    animate={{
                      scale: [0, 1, 0],
                      x: Math.cos((i * 30 * Math.PI) / 180) * 100,
                      y: Math.sin((i * 30 * Math.PI) / 180) * 100,
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      delay: 0.5 + i * 0.1,
                      ease: "easeOut",
                    }}
                    className="absolute top-1/2 left-1/2 w-3 h-3 bg-yellow-400 rounded-full"
                  />
                ))}
              </div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="space-y-4"
              >
                <h2
                  className={`font-bold text-white ${
                    fullscreen ? "text-6xl" : "text-4xl"
                  }`}
                >
                  Réunion terminée !
                </h2>
                <p
                  className={`text-green-300 ${
                    fullscreen ? "text-3xl" : "text-xl"
                  }`}
                >
                  {roomName}
                </p>
              </motion.div>
            </motion.div>
          )}

          {/* Stage 2: Transition vers disponible */}
          {stage === "transition" && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ type: "spring", stiffness: 100 }}
              className="space-y-6"
            >
              <motion.div
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 1.5,
                  ease: "easeInOut",
                }}
                className={`mx-auto ${
                  fullscreen ? "w-28 h-28" : "w-20 h-20"
                } bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-2xl`}
              >
                <Calendar
                  className={`${
                    fullscreen ? "h-14 w-14" : "h-10 w-10"
                  } text-white`}
                />
              </motion.div>

              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="space-y-4"
              >
                <h2
                  className={`font-bold text-white ${
                    fullscreen ? "text-5xl" : "text-3xl"
                  }`}
                >
                  Salle en cours de libération...
                </h2>

                {/* Barre de progression */}
                <div
                  className={`mx-auto ${
                    fullscreen ? "w-96 h-3" : "w-64 h-2"
                  } bg-gray-700 rounded-full overflow-hidden`}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    className="h-full bg-gradient-to-r from-blue-400 to-green-400"
                  />
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Stage 3: Salle disponible */}
          {stage === "complete" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              transition={{ type: "spring", stiffness: 150 }}
              className="space-y-6"
            >
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 0.8,
                  repeat: 1,
                }}
                className={`mx-auto ${
                  fullscreen ? "w-32 h-32" : "w-24 h-24"
                } bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl`}
              >
                <Sparkles
                  className={`${
                    fullscreen ? "h-16 w-16" : "h-12 w-12"
                  } text-white`}
                />
              </motion.div>

              <motion.div
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                className="space-y-4"
              >
                <h2
                  className={`font-bold text-green-400 ${
                    fullscreen ? "text-6xl" : "text-4xl"
                  }`}
                >
                  SALLE LIBRE
                </h2>
                <p
                  className={`text-white ${
                    fullscreen ? "text-3xl" : "text-xl"
                  }`}
                >
                  {roomName} est maintenant disponible
                </p>
                <motion.p
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{
                    duration: 1.5,
                    repeat: Number.POSITIVE_INFINITY,
                  }}
                  className={`text-green-300 ${
                    fullscreen ? "text-2xl" : "text-lg"
                  }`}
                >
                  Prête pour votre prochaine réservation
                </motion.p>
              </motion.div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
