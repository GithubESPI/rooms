"use client";

import type React from "react";

import { SessionProvider, useSession } from "next-auth/react";
import { ThemeProvider } from "@/components/theme-provider";
import { useEffect } from "react";

function ClientSessionRefresher() {
  const { data: session, update } = useSession();
  useEffect(() => {
    const interval = setInterval(() => {
      // Ping l'API pour garder la session active et rafraîchir le token
      update();
    }, 3 * 60 * 1000); // toutes les 3 minutes
    return () => clearInterval(interval);
  }, [update]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ClientSessionRefresher />
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
