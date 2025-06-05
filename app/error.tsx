"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-slate-900 to-purple-900 p-4">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4 mx-auto">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-600">
            Erreur de l'application
          </CardTitle>
          <CardDescription className="text-slate-600">
            Une erreur inattendue s'est produite. Veuillez réessayer ou
            contacter le support technique.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Button onClick={reset} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Réessayer
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/")}
              className="w-full"
            >
              <Home className="mr-2 h-4 w-4" />
              Retour à l'accueil
            </Button>
          </div>
          {process.env.NODE_ENV === "development" && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500 font-mono">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-slate-400 mt-1">
                  Digest: {error.digest}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
