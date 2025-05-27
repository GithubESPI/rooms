import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(
  request: Request,
  { params }: { params: { email: string } }
) {
  if (!params || typeof params !== "object") {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const email = params.email;

  try {
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
        ? [`https://graph.microsoft.com/v1.0/me/photo/$value`]
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
    ];

    for (const [index, photoUrl] of approaches.entries()) {
      try {
        console.log(`🔍 Tentative ${index + 1}: ${photoUrl}`);

        const photoResponse = await fetch(photoUrl, {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            Accept: "image/*",
          },
          // Ajouter un timeout
          signal: AbortSignal.timeout(5000),
        });

        if (photoResponse.ok) {
          const imageBuffer = await photoResponse.arrayBuffer();

          if (imageBuffer.byteLength > 0) {
            const contentType =
              photoResponse.headers.get("content-type") || "image/jpeg";

            console.log(
              `✅ Photo trouvée pour ${email}: ${imageBuffer.byteLength} bytes`
            );

            return new NextResponse(imageBuffer, {
              status: 200,
              headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=1800", // Cache 30 minutes
                "Content-Length": imageBuffer.byteLength.toString(),
              },
            });
          }
        }

        console.log(`❌ Échec tentative ${index + 1}: ${photoResponse.status}`);
      } catch (error) {
        console.log(
          `⚠️ Erreur tentative ${index + 1}:`,
          error instanceof Error ? error.message : "Unknown error"
        );
        continue;
      }
    }

    // Si toutes les tentatives échouent, retourner 404
    console.log(`❌ Aucune photo trouvée pour ${email}`);
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  } catch (error) {
    console.error(`💥 Erreur générale pour ${email}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch photo" },
      { status: 500 }
    );
  }
}
