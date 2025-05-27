"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, TrendingUp } from "lucide-react";
import { calculateMeetingProgress, getTimeUntilEnd } from "@/lib/date-utils";

interface AnimatedProgressProps {
  startTime: string;
  endTime: string;
  fullscreen?: boolean;
}

export function AnimatedProgress({
  startTime,
  endTime,
  fullscreen = false,
}: AnimatedProgressProps) {
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState("");

  useEffect(() => {
    const updateProgress = () => {
      const newProgress = calculateMeetingProgress(startTime, endTime);
      const remaining = getTimeUntilEnd(endTime);

      setProgress(newProgress);
      setTimeRemaining(remaining);
    };

    // Mise à jour immédiate
    updateProgress();

    // Mise à jour toutes les secondes pour une animation fluide
    const interval = setInterval(updateProgress, 1000);
    return () => clearInterval(interval);
  }, [startTime, endTime]);

  const getProgressColor = () => {
    if (progress < 25) return "from-green-500 to-green-600";
    if (progress < 50) return "from-yellow-500 to-yellow-600";
    if (progress < 75) return "from-orange-500 to-orange-600";
    return "from-red-500 to-red-600";
  };

  const getProgressIcon = () => {
    if (progress < 75)
      return <TrendingUp className={fullscreen ? "h-6 w-6" : "h-4 w-4"} />;
    return <Clock className={fullscreen ? "h-6 w-6" : "h-4 w-4"} />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div
          className={`flex items-center gap-2 ${
            fullscreen ? "text-2xl" : "text-lg"
          }`}
        >
          {getProgressIcon()}
          <span className="font-semibold">Progression</span>
        </div>
        <div className={`font-bold ${fullscreen ? "text-3xl" : "text-xl"}`}>
          {Math.round(progress)}%
        </div>
      </div>

      <div className="relative">
        <div
          className={`w-full bg-gray-800 rounded-full overflow-hidden ${
            fullscreen ? "h-6" : "h-4"
          }`}
        >
          <motion.div
            className={`h-full bg-gradient-to-r ${getProgressColor()} relative overflow-hidden`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            {/* Effet de brillance animé */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                repeatDelay: 3,
                ease: "easeInOut",
              }}
            />
          </motion.div>
        </div>

        {/* Indicateurs de temps */}
        <div className="flex justify-between mt-2">
          <span
            className={`text-gray-400 ${fullscreen ? "text-lg" : "text-sm"}`}
          >
            Début
          </span>
          <span
            className={`text-gray-400 ${fullscreen ? "text-lg" : "text-sm"}`}
          >
            Fin
          </span>
        </div>
      </div>

      <motion.div
        key={timeRemaining}
        initial={{ scale: 1.1, opacity: 0.8 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={`text-center font-bold ${
          progress > 90
            ? "text-red-400"
            : progress > 75
            ? "text-orange-400"
            : "text-green-400"
        } ${fullscreen ? "text-2xl" : "text-lg"}`}
      >
        Temps restant: {timeRemaining}
      </motion.div>
    </motion.div>
  );
}
