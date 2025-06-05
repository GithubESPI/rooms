import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileQuestion, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 p-4">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4 mx-auto">
            <FileQuestion className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">
            Page non trouvée
          </CardTitle>
          <CardDescription className="text-slate-600">
            La page que vous recherchez n'existe pas ou a été déplacée.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à l'accueil
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
