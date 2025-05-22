import { MeetingRoomDashboard } from "@/components/meeting-room-dashboard";
import { Header } from "@/components/header";
import { PageTransition } from "@/components/page-transition";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <Header />
      <PageTransition>
        <div className="container mx-auto px-4 py-8">
          <MeetingRoomDashboard />
        </div>
      </PageTransition>
    </main>
  );
}
