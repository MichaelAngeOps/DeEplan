import Link from "next/link";
import { ArrowLeftRight, Building2, LogOut } from "lucide-react";
import { deconnexion } from "@/lib/actions/auth";

/**
 * Pied de sidebar : lien « Passer à l'autre espace » (si l'utilisateur cumule
 * Responsable + Star validés), lien « Rejoindre un département » (Star), puis
 * bouton de déconnexion.
 */
export function ProfilFooter({
  autreEspace,
  rejoindreDepartement,
}: {
  autreEspace?: { href: string; label: string };
  rejoindreDepartement?: boolean;
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
      {rejoindreDepartement && (
        <Link
          href="/star/mes-departements"
          className="flex items-center gap-2.5 text-on-dark-muted transition-colors hover:text-on-dark"
        >
          <Building2 size={14} />
          Rejoindre un département
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
