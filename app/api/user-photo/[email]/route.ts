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

    console.log(`Récupération de la photo pour: ${email}`);

    // Appeler l'API Microsoft Graph pour récupérer la photo
    const photoResponse = await fetch(
      `https://graph.microsoft.com/v1.0/users/${email}/photo/$value`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      }
    );

    if (!photoResponse.ok) {
      console.log(
        `Aucune photo trouvée pour ${email}: ${photoResponse.status}`
      );
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // Récupérer les données binaires de l'image
    const imageBuffer = await photoResponse.arrayBuffer();
    const contentType =
      photoResponse.headers.get("content-type") || "image/jpeg";

    console.log(
      `Photo récupérée pour ${email}: ${imageBuffer.byteLength} bytes, type: ${contentType}`
    );

    // Retourner l'image avec les bons headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600", // Cache pendant 1 heure
        "Content-Length": imageBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error(
      `Erreur lors de la récupération de la photo pour ${email}:`,
      error
    );
    return NextResponse.json(
      { error: "Failed to fetch photo" },
      { status: 500 }
    );
  }
}
