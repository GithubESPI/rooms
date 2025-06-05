"use client";

import {
  useSession as useNextAuthSession,
  signIn as nextAuthSignIn,
  signOut as nextAuthSignOut,
} from "next-auth/react";

export function useSession() {
  const { data: session, status } = useNextAuthSession();
  return { session, status };
}

export const signIn = () => nextAuthSignIn("azure-ad");

// Fonction de déconnexion manuelle avec confirmation
export const signOut = async (options?: {
  callbackUrl?: string;
  redirect?: boolean;
}) => {
  console.log("Déconnexion manuelle initiée");

  try {
    // Marquer la session pour déconnexion via update
    await nextAuthSignOut({
      callbackUrl: options?.callbackUrl || "/",
      redirect: options?.redirect !== false,
    });

    console.log("Déconnexion manuelle réussie");
  } catch (error) {
    console.error("Erreur lors de la déconnexion:", error);
    throw error;
  }
};

// Fonction pour vérifier si l'utilisateur peut se déconnecter
export const canSignOut = (session: any) => {
  return session && !session.isManualSignOut;
};
