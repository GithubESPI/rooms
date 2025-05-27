"use client";

import { motion } from "framer-motion";
import { Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MeetingStatusBadgeProps {
  status: "current" | "upcoming" | "past";
  className?: string;
}

export function MeetingStatusBadge({
  status,
  className,
}: MeetingStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "current":
        return {
          label: "En cours",
          icon: Clock,
          className: "bg-red-500/20 text-red-400 border-red-500/30",
          iconColor: "text-red-400",
        };
      case "upcoming":
        return {
          label: "À venir",
          icon: Clock,
          className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
          iconColor: "text-blue-400",
        };
      case "past":
        return {
          label: "Terminée",
          icon: CheckCircle,
          className:
            "bg-purple-500/30 text-purple-700 dark:text-purple-300 border-purple-500/40 font-semibold",
          iconColor: "text-purple-700 dark:text-purple-300",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, type: "spring" }}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border backdrop-blur-sm",
        config.className,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </motion.div>
  );
}
