import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  // Vérifier si l'utilisateur est authentifié
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Chemins qui ne nécessitent pas d'authentification
  const publicPaths = ["/auth/signin", "/auth/error", "/api/auth"];

  // Vérifier si le chemin actuel est public
  const isPublicPath = publicPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  // Si l'utilisateur n'est pas authentifié et tente d'accéder à une route protégée
  if (!token && !isPublicPath) {
    // Rediriger vers la page de connexion
    const url = new URL("/auth/signin", request.url);
    url.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Si l'utilisateur est authentifié et tente d'accéder à la page de connexion
  if (token && request.nextUrl.pathname.startsWith("/auth/signin")) {
    // Rediriger vers la page d'accueil
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Continuer normalement pour les autres cas
  return NextResponse.next();
}

// Configurer les chemins sur lesquels le middleware doit s'exécuter
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
