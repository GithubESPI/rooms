import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LogIn } from "lucide-react";

export default async function SignIn() {
  const session = await getServerSession(authOptions);

  // Si l'utilisateur est déjà connecté, rediriger vers la page d'accueil
  if (session) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Connexion</CardTitle>
          <CardDescription>
            Connectez-vous avec votre compte Microsoft pour accéder à
            l'application de gestion des salles de réunion.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action="/api/auth/signin/azure-ad" method="POST">
            <Button type="submit" className="w-full" size="lg">
              <LogIn className="mr-2 h-4 w-4" />
              Se connecter avec Microsoft
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground">
          Vous devez disposer d'un compte Microsoft valide pour vous connecter.
        </CardFooter>
      </Card>
    </div>
  );
}
