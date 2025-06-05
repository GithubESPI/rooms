import NextAuth from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";
import type { AuthOptions } from "next-auth";
import type { User, Account, Profile } from "next-auth";
import type { AdapterUser } from "next-auth/adapters";

// Interface pour le profil Azure AD
interface AzureADProfile extends Profile {
  oid?: string;
  sub?: string;
  email?: string;
  name?: string;
  preferred_username?: string;
  tid?: string;
  [key: string]: any;
}

export const authOptions: AuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      tenantId: process.env.MICROSOFT_TENANT_ID,
      authorization: {
        params: {
          scope:
            "openid profile email User.Read Calendars.Read Place.Read.All offline_access",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({
      token,
      user,
      account,
      profile,
      trigger,
    }: {
      token: JWT;
      user?: User | AdapterUser;
      account: Account | null;
      profile?: Profile;
      trigger?: "signIn" | "signUp" | "update";
    }) {
      // Connexion initiale - stocker les tokens
      if (account && account.access_token) {
        console.log("Nouvelle connexion - stockage des tokens");

        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;

        // Vérifier que expires_in est un nombre avant de l'utiliser
        const expiresIn =
          typeof account.expires_in === "number" ? account.expires_in : 3600;
        token.expiresAt = Date.now() + expiresIn * 1000;

        // Stocker les informations utilisateur
        if (profile) {
          const azureProfile = profile as AzureADProfile;
          token.userId = azureProfile.oid || azureProfile.sub || "";
          token.email = azureProfile.email;
          token.name = azureProfile.name;
        }

        console.log(
          "Tokens stockés avec succès, expiration:",
          new Date(token.expiresAt)
        );
        return token;
      }

      // Vérifier si le token d'accès a expiré (avec marge de 5 minutes)
      const expiresAt =
        typeof token.expiresAt === "number" ? token.expiresAt : 0;
      const shouldRefresh =
        expiresAt > 0 && Date.now() >= expiresAt - 5 * 60 * 1000;

      if (!shouldRefresh) {
        return token;
      }

      // Rafraîchir le token d'accès
      console.log("Token expiré, tentative de rafraîchissement...");

      try {
        const response = await fetch(
          `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}/oauth2/v2.0/token`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              client_id: process.env.MICROSOFT_CLIENT_ID!,
              client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
              grant_type: "refresh_token",
              refresh_token: token.refreshToken as string,
              scope:
                "openid profile email User.Read Calendars.Read Place.Read.All offline_access",
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Erreur lors du rafraîchissement:", errorData);
          throw new Error(
            `HTTP ${response.status}: ${
              errorData.error_description || errorData.error
            }`
          );
        }

        const refreshedTokens = await response.json();
        console.log("Token rafraîchi avec succès");

        // Vérifier que expires_in est un nombre
        const newExpiresIn =
          typeof refreshedTokens.expires_in === "number"
            ? refreshedTokens.expires_in
            : 3600;

        return {
          ...token,
          accessToken: refreshedTokens.access_token,
          refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
          expiresAt: Date.now() + newExpiresIn * 1000,
          error: undefined,
        };
      } catch (error) {
        console.error("Impossible de rafraîchir le token:", error);

        return {
          ...token,
          error: "RefreshAccessTokenError",
        };
      }
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      // Transmettre les informations à la session
      session.accessToken = token.accessToken;
      session.error = token.error;

      if (session.user) {
        session.user.id = token.userId as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }

      return session;
    },

    async signIn({
      user,
      account,
      profile,
      email,
      credentials,
    }: {
      user: User | AdapterUser;
      account: Account | null;
      profile?: Profile;
      email?: { verificationRequest?: boolean };
      credentials?: Record<string, any>;
    }) {
      console.log("Tentative de connexion:", {
        user: user?.email,
        provider: account?.provider,
      });

      // Toujours autoriser la connexion
      return true;
    },
  },

  // Configuration de session
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 jours
    updateAge: 24 * 60 * 60, // Mise à jour quotidienne
  },

  // Pages personnalisées
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  // Événements pour le débogage
  events: {
    async signIn(message) {
      console.log(`Connexion réussie pour: ${message.user.email}`);
    },
    async signOut(message) {
      console.log(`Déconnexion pour: ${message.token?.email}`);
    },
  },

  // Activer le débogage en développement
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
