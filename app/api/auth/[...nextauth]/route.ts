import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";

// Définir une interface pour le profil Azure AD
interface AzureADProfile {
  oid?: string;
  sub?: string;
  email?: string;
  name?: string;
  preferred_username?: string;
  tid?: string;
  [key: string]: any; // Pour les autres propriétés potentielles
}

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      tenantId: process.env.MICROSOFT_TENANT_ID,
      authorization: {
        params: {
          scope: "openid profile email User.Read Calendars.Read Place.Read.All",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Ne stocker que les informations essentielles dans le token
      if (account) {
        // Stocker uniquement le token d'accès
        token.accessToken = account.access_token;

        // Stocker uniquement les informations essentielles du profil
        if (profile) {
          // Utiliser une assertion de type pour accéder aux propriétés spécifiques d'Azure AD
          const azureProfile = profile as AzureADProfile;

          // Utiliser une approche sûre avec des opérateurs optionnels
          token.userId = azureProfile.oid || azureProfile.sub || "";
          token.email = azureProfile.email || "";
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      // Ne transmettre que les informations essentielles à la session client
      session.accessToken = token.accessToken;

      // S'assurer que les informations utilisateur sont minimales
      if (session.user) {
        session.user.id = token.userId;
        // Ne pas écraser l'email s'il existe déjà
        if (token.email) {
          session.user.email = token.email;
        }
        // Conserver uniquement le nom et l'email, supprimer les autres propriétés
        delete session.user.image;
      }

      return session;
    },
  },
  // Utiliser une stratégie de session basée sur JWT avec une durée de vie courte
  session: {
    strategy: "jwt",
    maxAge: 60 * 30, // 30 minutes
  },
  // Configurer les cookies pour réduire leur taille
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 30, // 30 minutes
      },
    },
  },
  // Réduire le niveau de débogage en production
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
