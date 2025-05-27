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

    console.log(`🖼️ Tentative de récupération de la photo pour: ${email}`);

    // Nettoyer l'email (enlever les espaces, convertir en minuscules)
    const cleanEmail = email.trim().toLowerCase();

    // Essayer plusieurs approches pour récupérer la photo
    const photoApproaches = [
      // Approche 1: Photo directe par email
      {
        url: `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
          cleanEmail
        )}/photo/$value`,
        description: "Photo directe par email",
      },
      // Approche 2: Photo de taille spécifique
      {
        url: `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
          cleanEmail
        )}/photos/48x48/$value`,
        description: "Photo 48x48",
      },
      // Approche 3: Photo de taille différente
      {
        url: `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
          cleanEmail
        )}/photos/64x64/$value`,
        description: "Photo 64x64",
      },
      // Approche 4: Photo de taille plus grande
      {
        url: `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
          cleanEmail
        )}/photos/96x96/$value`,
        description: "Photo 96x96",
      },
    ];

    for (const approach of photoApproaches) {
      try {
        console.log(`🔍 Essai: ${approach.description} - ${approach.url}`);

        const photoResponse = await fetch(approach.url, {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });

        if (photoResponse.ok) {
          // Récupérer les données binaires de l'image
          const imageBuffer = await photoResponse.arrayBuffer();
          const contentType =
            photoResponse.headers.get("content-type") || "image/jpeg";

          console.log(
            `✅ Photo récupérée pour ${email}: ${imageBuffer.byteLength} bytes, type: ${contentType}`
          );

          // Retourner l'image avec les bons headers
          return new NextResponse(imageBuffer, {
            status: 200,
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "public, max-age=3600", // Cache pendant 1 heure
              "Content-Length": imageBuffer.byteLength.toString(),
              "Access-Control-Allow-Origin": "*",
            },
          });
        } else {
          console.log(
            `❌ Échec pour ${approach.description}: ${photoResponse.status} ${photoResponse.statusText}`
          );

          // Si c'est une erreur 403 ou 404, essayer l'approche suivante
          if (photoResponse.status === 403 || photoResponse.status === 404) {
            continue;
          }
        }
      } catch (urlError) {
        console.log(`⚠️ Erreur pour ${approach.description}:`, urlError);
        continue;
      }
    }

    // Si toutes les approches directes échouent, essayer de récupérer les informations utilisateur d'abord
    try {
      console.log(
        `🔍 Tentative de récupération des infos utilisateur pour: ${cleanEmail}`
      );

      const userResponse = await fetch(
        `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(
          cleanEmail
        )}`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (userResponse.ok) {
        const userData = await userResponse.json();
        console.log(
          `👤 Utilisateur trouvé: ${userData.displayName} (${
            userData.mail || userData.userPrincipalName
          })`
        );

        // Essayer avec l'ID utilisateur au lieu de l'email
        if (userData.id) {
          const photoByIdApproaches = [
            `https://graph.microsoft.com/v1.0/users/${userData.id}/photo/$value`,
            `https://graph.microsoft.com/v1.0/users/${userData.id}/photos/48x48/$value`,
            `https://graph.microsoft.com/v1.0/users/${userData.id}/photos/64x64/$value`,
          ];

          for (const photoUrl of photoByIdApproaches) {
            try {
              const photoByIdResponse = await fetch(photoUrl, {
                headers: {
                  Authorization: `Bearer ${session.accessToken}`,
                },
              });

              if (photoByIdResponse.ok) {
                const imageBuffer = await photoByIdResponse.arrayBuffer();
                const contentType =
                  photoByIdResponse.headers.get("content-type") || "image/jpeg";

                console.log(
                  `✅ Photo récupérée via ID pour ${email}: ${imageBuffer.byteLength} bytes`
                );

                return new NextResponse(imageBuffer, {
                  status: 200,
                  headers: {
                    "Content-Type": contentType,
                    "Cache-Control": "public, max-age=3600",
                    "Content-Length": imageBuffer.byteLength.toString(),
                    "Access-Control-Allow-Origin": "*",
                  },
                });
              }
            } catch (idError) {
              console.log(
                `⚠️ Erreur avec l'ID utilisateur pour ${photoUrl}:`,
                idError
              );
              continue;
            }
          }
        }
      } else {
        console.log(
          `❌ Utilisateur non trouvé: ${userResponse.status} ${userResponse.statusText}`
        );
      }
    } catch (userError) {
      console.log(
        `⚠️ Erreur lors de la récupération des infos utilisateur:`,
        userError
      );
    }

    // Dernière tentative: essayer avec me/photo si c'est l'utilisateur connecté
    if (
      session.user?.email &&
      session.user.email.toLowerCase() === cleanEmail
    ) {
      try {
        console.log(`🔍 Tentative avec me/photo pour l'utilisateur connecté`);

        const myPhotoResponse = await fetch(
          `https://graph.microsoft.com/v1.0/me/photo/$value`,
          {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
          }
        );

        if (myPhotoResponse.ok) {
          const imageBuffer = await myPhotoResponse.arrayBuffer();
          const contentType =
            myPhotoResponse.headers.get("content-type") || "image/jpeg";

          console.log(
            `✅ Photo personnelle récupérée: ${imageBuffer.byteLength} bytes`
          );

          return new NextResponse(imageBuffer, {
            status: 200,
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "public, max-age=3600",
              "Content-Length": imageBuffer.byteLength.toString(),
              "Access-Control-Allow-Origin": "*",
            },
          });
        }
      } catch (meError) {
        console.log(`⚠️ Erreur avec me/photo:`, meError);
      }
    }

    console.log(
      `❌ Aucune photo trouvée pour ${email} après toutes les tentatives`
    );
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  } catch (error) {
    console.error(
      `💥 Erreur générale lors de la récupération de la photo pour ${email}:`,
      error
    );
    return NextResponse.json(
      { error: "Failed to fetch photo" },
      { status: 500 }
    );
  }
}
