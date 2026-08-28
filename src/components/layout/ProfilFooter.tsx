import Link from "next/link";
import { ArrowLeftRight, LogOut } from "lucide-react";
import { deconnexion } from "@/lib/actions/auth";

/**
 * Pied de sidebar : lien « Passer à l'autre espace » (si l'utilisateur cumule
 * les rôles Responsable + Star validés) + bouton de déconnexion.
 */
export function ProfilFooter({
  autreEspace,
}: {
  autreEspace?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {autreEspace && (
        <Link
          href={autreEspace.href}
          className="flex items-center gap-2.5 text-on-dark-muted transition-colors hover:text-on-dark"
        >
          <ArrowLeftRight size={14} />
          {autreEspace.label}
        </Link>
      )}
      <form action={deconnexion}>
        <button
          type="submit"
          className="flex items-center gap-2.5 text-on-dark-muted transition-colors hover:text-on-dark"
        >
          <LogOut size={14} />
          Se déconnecter
        </button>
      </form>
    </div>
  );
}
