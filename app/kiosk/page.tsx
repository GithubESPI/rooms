import { KioskView } from "@/components/kiosk/kiosk-view";
import { PageTransition } from "@/components/page-transition";

// Forcer le rendu dynamique pour cette page
export const dynamic = "force-dynamic";

export default function KioskPage() {
  // Ne plus récupérer les salles côté serveur, laisser le composant client s'en charger
  return (
    <PageTransition>
      <div className="min-h-screen bg-black text-white">
        <KioskView />
      </div>
    </PageTransition>
  );
}
