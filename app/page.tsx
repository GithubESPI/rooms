import { Header } from "@/components/header";
import { PageTransition } from "@/components/page-transition";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { MeetingRoomDashboard } from "@/components/meeting-room-dashboard";
import { WelcomePage } from "@/components/welcome-page";

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <Header />
      <PageTransition>
        <div className="container mx-auto px-4 py-8">
          {session ? (
            // Utilisateur connecté - afficher le dashboard
            <MeetingRoomDashboard />
          ) : (
            // Utilisateur non connecté - afficher la page d'accueil
            <WelcomePage />
          )}
        </div>
      </PageTransition>
    </main>
  );
}
