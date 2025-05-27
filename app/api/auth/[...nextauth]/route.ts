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
      // Stocker seulement les informations essentielles
      if (account) {
        // Stocker seulement le token d'accès (raccourci si possible)
        token.accessToken = account.access_token;

        // Stocker seulement l'ID utilisateur minimal
        if (profile) {
          const azureProfile = profile as AzureADProfile;
          token.userId = azureProfile.oid || azureProfile.sub || "";
          // Ne pas stocker l'email dans le token pour économiser l'espace
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      // Transmettre seulement le token d'accès
      session.accessToken = token.accessToken;

      // Minimiser les informations utilisateur
      if (session.user) {
        session.user.id = token.userId;
        // Supprimer les propriétés non essentielles
        delete session.user.image;
        // Garder seulement le nom, pas l'email pour économiser l'espace
        if (session.user.email && session.user.email.length > 50) {
          delete session.user.email;
        }
      }

      return session;
    },
  },
  // Réduire drastiquement la durée de vie des cookies
  session: {
    strategy: "jwt",
    maxAge: 60 * 15, // 15 minutes au lieu de 30
  },
  // Optimiser les cookies pour réduire leur taille
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 15, // 15 minutes
      },
    },
    // Supprimer les cookies non essentiels
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 15,
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 15,
      },
    },
  },
  // Réduire le niveau de débogage en production
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
