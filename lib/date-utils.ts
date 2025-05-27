import { format } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Fonction de debug pour analyser les dates reçues
 */
export function debugTimeAnalysis(dateString: string, label = ""): void {
  console.log(`=== DEBUG TIME ANALYSIS ${label} ===`);
  console.log("Input string:", dateString);

  const date = new Date(dateString);
  console.log("Date object:", date);
  console.log("UTC string:", date.toISOString());
  console.log(
    "Local string:",
    date.toLocaleString("fr-FR", { timeZone: "Europe/Paris" })
  );
  console.log("getTime():", date.getTime());
  console.log("getTimezoneOffset():", date.getTimezoneOffset());

  // Tester différentes interprétations
  console.log("--- Différentes interprétations ---");
  console.log(
    "Comme UTC:",
    new Date(dateString + (dateString.endsWith("Z") ? "" : "Z")).toLocaleString(
      "fr-FR",
      { timeZone: "Europe/Paris" }
    )
  );
  console.log("Comme local:", new Date(dateString).toLocaleString("fr-FR"));
  console.log("=====================================");
}

/**
 * Fonction pour formater l'heure - version simplifiée pour test
 */
export function formatTime(dateString: string): string {
  try {
    // Debug
    debugTimeAnalysis(dateString, "FORMAT");

    const date = new Date(dateString);

    // Essayer plusieurs approches
    console.log("=== TESTS DE FORMATAGE ===");

    // Approche 1: Traiter comme UTC et convertir
    const asUTC = new Date(
      dateString.endsWith("Z") ? dateString : dateString + "Z"
    );
    const utcToFrench = asUTC.toLocaleString("fr-FR", {
      timeZone: "Europe/Paris",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    console.log("UTC vers français:", utcToFrench);

    // Approche 2: Traiter comme déjà en heure locale
    const asLocal = new Date(dateString);
    const localFormat = asLocal.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    console.log("Comme local:", localFormat);

    // Approche 3: Extraction manuelle
    const manual = dateString.includes("T")
      ? dateString.split("T")[1].substring(0, 5)
      : "";
    console.log("Extraction manuelle:", manual);

    console.log("========================");

    // Pour l'instant, retourner l'approche UTC vers français
    return utcToFrench;
  } catch (error) {
    console.error("Erreur lors du formatage:", error);
    return "Erreur";
  }
}

/**
 * Alias pour la compatibilité
 */
export const formatFrenchTime = formatTime;

/**
 * Alias pour la compatibilité avec l'ancien nom
 */
export const debugTimeConversion = debugTimeAnalysis;

/**
 * Vérifie si une réunion est en cours
 */
export function isMeetingActive(
  startTimeString: string,
  endTimeString: string
): boolean {
  try {
    const now = new Date();
    const start = new Date(startTimeString);
    const end = new Date(endTimeString);

    console.log("=== VÉRIFICATION ACTIVITÉ ===");
    console.log("Maintenant:", now.toISOString());
    console.log("Début:", start.toISOString());
    console.log("Fin:", end.toISOString());
    console.log("Est active:", start <= now && end >= now);
    console.log("============================");

    return start <= now && end >= now;
  } catch (error) {
    console.error("Erreur lors de la vérification de l'activité:", error);
    return false;
  }
}

/**
 * Calcule le pourcentage d'avancement d'une réunion
 */
export function calculateMeetingProgress(
  startTimeString: string,
  endTimeString: string
): number {
  try {
    const now = new Date();
    const start = new Date(startTimeString);
    const end = new Date(endTimeString);

    if (now < start) return 0;
    if (now > end) return 100;

    const totalDuration = end.getTime() - start.getTime();
    const elapsedDuration = now.getTime() - start.getTime();

    return Math.min(100, Math.max(0, (elapsedDuration / totalDuration) * 100));
  } catch (error) {
    console.error("Erreur lors du calcul du progrès:", error);
    return 0;
  }
}

/**
 * Calcule le temps restant jusqu'à la fin d'une réunion
 */
export function getTimeUntilEnd(endTimeString: string): string {
  try {
    const now = new Date();
    const end = new Date(endTimeString);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) {
      return "Terminé";
    }

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    if (minutes > 0) {
      return `${minutes} min ${seconds} s`;
    } else {
      return `${seconds} s`;
    }
  } catch (error) {
    console.error("Erreur lors du calcul du temps restant:", error);
    return "Erreur";
  }
}

/**
 * Calcule le temps jusqu'au début d'une réunion
 */
export function getTimeUntilStart(startTimeString: string): string {
  try {
    const now = new Date();
    const start = new Date(startTimeString);
    const diff = start.getTime() - now.getTime();

    if (diff <= 0) {
      return "Maintenant";
    }

    const minutes = Math.floor(diff / 60000);

    if (minutes < 60) {
      return `${minutes} minute${minutes > 1 ? "s" : ""}`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;

      if (remainingMinutes === 0) {
        return `${hours} heure${hours > 1 ? "s" : ""}`;
      } else {
        return `${hours}h${remainingMinutes.toString().padStart(2, "0")}`;
      }
    }
  } catch (error) {
    console.error("Erreur lors du calcul du temps jusqu'au début:", error);
    return "Erreur";
  }
}

/**
 * Vérifie si une date est aujourd'hui
 */
export function isToday(dateString: string): boolean {
  try {
    const date = new Date(dateString);
    const today = new Date();

    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  } catch (error) {
    console.error("Erreur lors de la vérification de la date:", error);
    return false;
  }
}

/**
 * Formate une date complète
 */
export function formatFrenchDate(
  dateString: string,
  formatString = "dd/MM/yyyy HH:mm"
): string {
  try {
    const date = new Date(dateString);
    return format(date, formatString, { locale: fr });
  } catch (error) {
    console.error("Erreur lors du formatage de la date complète:", error);
    return "Erreur";
  }
}

// Fonctions de compatibilité
export const convertUTCToFrenchTime = (dateString: string) =>
  new Date(dateString);
export const getCurrentFrenchTime = () => new Date();
