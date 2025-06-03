import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (session) {
      console.log(
        `Marquage de déconnexion manuelle pour: ${session.user?.email}`
      );

      // Ici on pourrait marquer dans une base de données que la déconnexion est manuelle
      // Pour l'instant, on se contente de logger

      return NextResponse.json({
        success: true,
        message: "Déconnexion manuelle marquée",
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: "Aucune session active",
      },
      { status: 401 }
    );
  } catch (error) {
    console.error("Erreur lors du marquage de déconnexion manuelle:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur serveur",
      },
      { status: 500 }
    );
  }
}
