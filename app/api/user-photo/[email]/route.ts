import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const resolvedParams = await params;

    if (!resolvedParams || typeof resolvedParams !== "object") {
      return NextResponse.json({ error: "Invalid params" }, { status: 400 });
    }

    const email = decodeURIComponent(resolvedParams.email);

    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    console.log(`🖼️ Récupération de la photo pour: ${email}`);

    // Nettoyer l'email
    const cleanEmail = email.trim().toLowerCase();

    // Essayer plusieurs approches dans l'ordre de priorité
    const approaches = [
      // 1. Si c'est l'utilisateur connecté, utiliser /me/photo
      ...(session.user?.email && session.user.email.toLowerCase() === cleanEmail
        ? [
            `https://graph.microsoft.com/v1.0/me/photo/$value`,
            `https://graph.microsoft.com/v1.0/me/photos/48x48/$value`,
            `https://graph.microsoft.com/v1.0/me/photos/64x64/$value`,
          ]
        : []),

      // 2. Photo par email avec différentes tailles
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
        cleanEmail
      )}/photo/$value`,
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
        cleanEmail
      )}/photos/48x48/$value`,
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
        cleanEmail
      )}/photos/64x64/$value`,
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
        cleanEmail
      )}/photos/96x96/$value`,
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
        cleanEmail
      )}/photos/120x120/$value`,

      // 3. Essayer avec le nom d'utilisateur seulement (sans domaine)
      ...(cleanEmail.includes("@")
        ? [
            `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
              cleanEmail.split("@")[0]
            )}/photo/$value`,
            `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
              cleanEmail.split("@")[0]
            )}/photos/48x48/$value`,
            `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
              cleanEmail.split("@")[0]
            )}/photos/64x64/$value`,
          ]
        : []),

      // 4. Essayer avec différents formats d'email
      ...(cleanEmail.includes("@")
        ? [
            `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
              cleanEmail.replace("@", "_at_")
            )}/photo/$value`,
          ]
        : []),
    ];

    for (const [index, photoUrl] of approaches.entries()) {
      try {
        console.log(`🔍 Tentative ${index + 1}: ${photoUrl}`);

        const photoResponse = await fetch(photoUrl, {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            Accept: "image/jpeg, image/png, image/gif, image/*",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Cache-Control": "no-cache",
          },
          // Timeout plus long pour les photos
          signal: AbortSignal.timeout(15000),
        });

        if (photoResponse.ok) {
          const imageBuffer = await photoResponse.arrayBuffer();

          if (imageBuffer.byteLength > 0) {
            const contentType =
              photoResponse.headers.get("content-type") || "image/jpeg";

            console.log(
              `✅ Photo trouvée pour ${email}: ${imageBuffer.byteLength} bytes, type: ${contentType}`
            );

            return new NextResponse(imageBuffer, {
              status: 200,
              headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=3600", // Cache 1 heure
                "Content-Length": imageBuffer.byteLength.toString(),
                "Access-Control-Allow-Origin": "*",
              },
            });
          }
        }

        console.log(
          `❌ Échec tentative ${index + 1}: ${photoResponse.status} - ${
            photoResponse.statusText
          }`
        );
      } catch (error) {
        console.log(
          `⚠️ Erreur tentative ${index + 1}:`,
          error instanceof Error ? error.message : "Unknown error"
        );
        continue;
      }
    }

    // Si toutes les tentatives échouent, générer un avatar avec les initiales
    console.log(
      `❌ Aucune photo trouvée pour ${email}, génération d'un avatar`
    );

    // Générer un avatar SVG avec les initiales
    const name = cleanEmail.split("@")[0].replace(/[._-]/g, " ");
    const initials =
      name
        .split(" ")
        .map((part) => part.charAt(0))
        .join("")
        .toUpperCase()
        .substring(0, 2) || "?";

    // Couleur basée sur l'email
    const colors = [
      "#4285F4",
      "#EA4335",
      "#FBBC05",
      "#34A853",
      "#5E35B1",
      "#00897B",
      "#C0CA33",
      "#FB8C00",
      "#E91E63",
      "#546E7A",
    ];
    const hash = cleanEmail
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const bgColor = colors[hash % colors.length];

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
        <rect width="96" height="96" fill="${bgColor}" />
        <text x="48" y="48" font-family="Arial, sans-serif" font-size="36" font-weight="bold" 
          fill="white" text-anchor="middle" dominant-baseline="central">${initials}</text>
      </svg>
    `;

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error(`💥 Erreur générale:`, error);
    return NextResponse.json(
      { error: "Failed to fetch photo" },
      { status: 500 }
    );
  }
}
