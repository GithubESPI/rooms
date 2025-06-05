"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "Configuration":
        return {
          title: "Erreur de configuration",
          description:
            "Il y a un problème avec la configuration du serveur. Veuillez contacter l'administrateur.",
        };
      case "AccessDenied":
        return {
          title: "Accès refusé",
          description:
            "Vous n'avez pas les permissions nécessaires pour accéder à cette application.",
        };
      case "Verification":
        return {
          title: "Erreur de vérification",
          description:
            "Le token a expiré ou n'est pas valide. Veuillez réessayer.",
        };
      case "OAuthSignin":
      case "OAuthCallback":
        return {
          title: "Erreur d'authentification",
          description:
            "Une erreur s'est produite lors de la connexion avec Microsoft. Veuillez réessayer.",
        };
      default:
        return {
          title: "Erreur de connexion",
          description:
            "Une erreur inattendue s'est produite. Veuillez réessayer.",
        };
    }
  };

  const errorInfo = getErrorMessage(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-slate-900 to-purple-900 p-4">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4 mx-auto">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-600">
            {errorInfo.title}
          </CardTitle>
          <CardDescription className="text-slate-600">
            {errorInfo.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Button asChild className="w-full">
              <Link href="/auth/signin">
                <RefreshCw className="mr-2 h-4 w-4" />
                Réessayer la connexion
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à l'accueil
              </Link>
            </Button>
          </div>
          {error && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500">Code d'erreur: {error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ErrorLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-slate-900 to-purple-900">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Chargement...</h1>
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={<ErrorLoadingFallback />}>
      <ErrorContent />
    </Suspense>
  );
}
