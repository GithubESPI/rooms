import { Building2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-slate-900 to-purple-900">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg animate-pulse">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-4">Groupe ESPI</h1>
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
        <p className="text-blue-200 text-sm mt-4">
          Chargement de l'application...
        </p>
      </div>
    </div>
  );
}
