"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LogIn, Building2, Calendar, Users } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      console.log("Tentative de connexion avec Azure AD...");

      await signIn("azure-ad", {
        callbackUrl,
        redirect: true,
      });
    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background avec gradient animé */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-slate-900 to-purple-900">
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute inset-0 bg-repeat"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>
      </div>

      {/* Éléments décoratifs flottants */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-blue-500/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-10 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl animate-pulse delay-500"></div>

      <div className="relative z-10 w-full max-w-md p-6">
        {/* Logo/Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Groupe ESPI</h1>
          <p className="text-blue-200 text-sm">Gestion des Salles de Réunion</p>
        </div>

        {/* Main Card */}
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Connexion
            </CardTitle>
            <CardDescription className="text-slate-600 leading-relaxed">
              Connectez-vous avec votre compte Microsoft pour accéder à la
              plateforme de gestion des salles de réunion du Groupe ESPI.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Features Icons */}
            <div className="grid grid-cols-3 gap-4 py-4">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 rounded-xl mb-2">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-xs text-slate-600">Réservation</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-50 rounded-xl mb-2">
                  <Building2 className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-xs text-slate-600">Salles</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-50 rounded-xl mb-2">
                  <Users className="w-6 h-6 text-indigo-600" />
                </div>
                <p className="text-xs text-slate-600">Équipes</p>
              </div>
            </div>

            {/* Login Button */}
            <Button
              onClick={handleSignIn}
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
              size="lg"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                  Connexion en cours...
                </div>
              ) : (
                <>
                  <LogIn className="mr-3 h-5 w-5" />
                  Se connecter avec Microsoft
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">
                  Sécurisé par Microsoft
                </span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="text-center pt-0">
            <div className="w-full space-y-2">
              <p className="text-sm text-slate-600">
                Plateforme dédiée aux établissements du Groupe ESPI
              </p>
              <div className="flex items-center justify-center space-x-2 text-xs text-slate-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Connexion sécurisée</span>
              </div>
            </div>
          </CardFooter>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-blue-200 text-sm">
            © 2024 Groupe ESPI - Tous droits réservés
          </p>
          <p className="text-blue-300 text-xs mt-1">
            École Supérieure des Professions Immobilières
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-slate-900 to-purple-900">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Chargement...</h1>
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SignInForm />
    </Suspense>
  );
}
