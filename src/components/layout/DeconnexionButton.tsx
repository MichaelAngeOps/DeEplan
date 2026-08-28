import { LogOut } from "lucide-react";
import { deconnexion } from "@/lib/actions/auth";

/** Bouton de déconnexion (Server Action). */
export function DeconnexionButton() {
  return (
    <form action={deconnexion}>
      <button
        type="submit"
        className="flex items-center gap-2.5 text-on-dark-muted transition-colors hover:text-on-dark"
      >
        <LogOut size={14} />
        Se déconnecter
      </button>
    </form>
  );
}
