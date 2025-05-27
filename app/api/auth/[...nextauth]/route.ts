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
          scope:
            "openid profile email User.Read Calendars.Read Place.Read.All offline_access",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile, trigger }) {
      // Si c'est une déconnexion manuelle marquée, ne pas rafraîchir le token
      if (token.isManualSignOut) {
        return token;
      }

      // Stocker les informations d'authentification de manière permanente
      if (account) {
        console.log("Nouvelle connexion - stockage des tokens");

        // Stocker le token d'accès et le refresh token
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;

        // Stocker les informations utilisateur
        if (profile) {
          const azureProfile = profile as AzureADProfile;
          token.userId = azureProfile.oid || azureProfile.sub || "";
          token.email = azureProfile.email;
          token.name = azureProfile.name;

          console.log("Profil utilisateur:", {
            userId: token.userId,
            email: token.email,
            name: token.name,
          });
        }

        // Marquer le token comme permanent
        token.isPermanent = true;
        token.isManualSignOut = false;
        console.log("Session permanente établie pour:", token.email);
      }

      // Si c'est une session permanente et pas une déconnexion manuelle, toujours essayer de rafraîchir le token si nécessaire
      if (token.isPermanent && token.refreshToken && !token.isManualSignOut) {
        // Vérifier si le token d'accès a expiré ou va expirer dans les 5 prochaines minutes
        const shouldRefresh =
          !token.expiresAt ||
          Date.now() > (token.expiresAt as number) * 1000 - 5 * 60 * 1000;

        if (shouldRefresh) {
          try {
            console.log("Rafraîchissement préventif du token d'accès...");

            const response = await fetch(
              "https://login.microsoftonline.com/common/oauth2/v2.0/token",
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

            if (response.ok) {
              const refreshedTokens = await response.json();
              console.log("Token rafraîchi avec succès - session maintenue");

              return {
                ...token,
                accessToken: refreshedTokens.access_token,
                refreshToken:
                  refreshedTokens.refresh_token ?? token.refreshToken,
                expiresAt: Math.floor(
                  Date.now() / 1000 + refreshedTokens.expires_in
                ),
                isPermanent: true, // Maintenir le statut permanent
                isManualSignOut: false,
              };
            } else {
              console.warn(
                "Échec du rafraîchissement, mais session maintenue:",
                response.status
              );
              // Même en cas d'échec, on garde la session active
            }
          } catch (error) {
            console.warn(
              "Erreur lors du rafraîchissement, mais session maintenue:",
              error
            );
            // Même en cas d'erreur, on garde la session active
          }
        }
      }

      // Toujours retourner le token pour maintenir la session (sauf si déconnexion manuelle)
      return token;
    },
    async session({ session, token }: any) {
      // Si c'est une déconnexion manuelle, retourner une session vide
      if (token.isManualSignOut) {
        return null;
      }

      // Toujours transmettre les informations de session
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.isPermanent = token.isPermanent;
      session.isManualSignOut = token.isManualSignOut;

      // Ajouter les informations utilisateur
      if (session.user) {
        session.user.id = token.userId;
        session.user.email = token.email;
        session.user.name = token.name;
      }

      return session;
    },
    async signIn({ user, account, profile, email, credentials }) {
      console.log("Tentative de connexion:", {
        user: user?.email,
        provider: account?.provider,
        type: account?.type,
      });

      // Vérifier que nous avons les informations nécessaires
      if (!account?.access_token) {
        console.error("Pas de token d'accès reçu");
        return false;
      }

      return true;
    },
  },
  // Configuration de session pour ne jamais expirer automatiquement
  session: {
    strategy: "jwt",
    maxAge: 365 * 24 * 60 * 60, // 1 an (maximum possible)
    updateAge: 0, // Ne jamais forcer la mise à jour
  },
  // Configuration des cookies pour une durée de vie maximale
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 365 * 24 * 60 * 60, // 1 an
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 365 * 24 * 60 * 60, // 1 an
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 365 * 24 * 60 * 60, // 1 an
      },
    },
  },
  // Activer le débogage pour diagnostiquer le problème
  debug: process.env.NODE_ENV === "development",
  // Pages personnalisées
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  // Événements pour surveiller la session
  events: {
    async signIn({ user, account, profile }) {
      console.log(`Session permanente créée pour: ${user.email}`);
    },
    async signOut({ token }) {
      console.log(`Déconnexion effectuée pour: ${token?.email}`);
    },
    async session({ session, token }) {
      // Log périodique pour confirmer que la session est active
      if (Math.random() < 0.01) {
        // 1% de chance de logger pour éviter le spam
        console.log(`Session permanente active pour: ${session.user?.email}`);
      }
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
