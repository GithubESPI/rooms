"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Home, RefreshCw } from "lucide-react";
import Link from "next/link";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  let errorMessage = "Une erreur s'est produite lors de l'authentification.";
  let errorDescription =
    "Veuillez réessayer ou contacter l'administrateur système.";
  let troubleshooting = "";

  // Personnaliser le message d'erreur en fonction du code d'erreur
  switch (error) {
    case "Configuration":
      errorMessage = "Erreur de configuration";
      errorDescription =
        "Il y a un problème avec la configuration de l'authentification.";
      troubleshooting =
        "Vérifiez les variables d'environnement MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET et MICROSOFT_TENANT_ID.";
      break;
    case "AccessDenied":
      errorMessage = "Accès refusé";
      errorDescription =
        "Vous n'avez pas les autorisations nécessaires pour accéder à cette application.";
      troubleshooting =
        "Contactez votre administrateur pour obtenir l'accès à cette application.";
      break;
    case "OAuthCallback":
      errorMessage = "Erreur de callback OAuth";
      errorDescription =
        "Le processus d'authentification avec Microsoft a échoué.";
      troubleshooting =
        "Cela peut être dû à une mauvaise configuration de l'URL de redirection dans Azure AD ou à des permissions insuffisantes.";
      break;
    case "OAuthSignin":
      errorMessage = "Erreur de connexion OAuth";
      errorDescription = "Impossible d'initier la connexion avec Microsoft.";
      troubleshooting =
        "Vérifiez la configuration du client Azure AD et les permissions.";
      break;
    case "Verification":
      errorMessage = "Vérification échouée";
      errorDescription =
        "Le lien de vérification a expiré ou a déjà été utilisé.";
      break;
    case "OAuthCreateAccount":
    case "EmailCreateAccount":
    case "Callback":
    case "OAuthAccountNotLinked":
    case "EmailSignin":
    case "CredentialsSignin":
    case "SessionRequired":
      errorMessage = "Erreur d'authentification";
      errorDescription =
        "Une erreur s'est produite lors de l'authentification. Veuillez réessayer.";
      break;
    default:
      break;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl">{errorMessage}</CardTitle>
          <CardDescription>{errorDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>
              <strong>Code d'erreur :</strong> {error || "Inconnu"}
            </p>
            {troubleshooting && (
              <div className="mt-3 p-3 bg-muted rounded-md">
                <p className="font-medium">Diagnostic :</p>
                <p className="mt-1">{troubleshooting}</p>
              </div>
            )}
          </div>

          {/* Informations de débogage pour l'administrateur */}
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Informations techniques (pour l'administrateur)
            </summary>
            <div className="mt-2 p-2 bg-muted rounded text-muted-foreground">
              <p>
                <strong>URL actuelle :</strong>{" "}
                {typeof window !== "undefined" ? window.location.href : ""}
              </p>
              <p>
                <strong>Erreur :</strong> {error}
              </p>
              <p>
                <strong>Variables d'environnement à vérifier :</strong>
              </p>
              <ul className="list-disc list-inside ml-2">
                <li>MICROSOFT_CLIENT_ID</li>
                <li>MICROSOFT_CLIENT_SECRET</li>
                <li>MICROSOFT_TENANT_ID</li>
                <li>NEXTAUTH_URL</li>
                <li>NEXTAUTH_SECRET</li>
              </ul>
            </div>
          </details>
        </CardContent>
        <CardFooter className="flex justify-center gap-2">
          <Button asChild variant="outline">
            <Link href="/auth/signin">
              <RefreshCw className="mr-2 h-4 w-4" />
              Réessayer
            </Link>
          </Button>
          <Button asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Retour à l'accueil
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Chargement...
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  );
}
