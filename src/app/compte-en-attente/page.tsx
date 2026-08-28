import { redirect } from "next/navigation";
import { Ban, Clock } from "lucide-react";
import { AuthShell } from "@/components/layout";
import { deconnexion } from "@/lib/actions/auth";
import { getAcces } from "@/lib/auth";

export default async function CompteEnAttentePage() {
  const acces = await getAcces();
  if (!acces) redirect("/login");

  // Déjà un accès exploitable → on n'a rien à faire ici.
  if (acces.estResponsable || acces.star?.statut === "valide") {
    redirect("/apres-login");
  }

  const refuse = acces.star?.statut === "desactive";

  return (
    <AuthShell>
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-parchment">
          {refuse ? (
            <Ban size={24} className="text-danger" />
          ) : (
            <Clock size={24} className="text-accent" />
          )}
        </span>
        <h1 className="font-display text-[20px] font-semibold tracking-[-0.3px] text-ink">
          {refuse
            ? "Compte non validé"
            : "Compte en attente de validation"}
        </h1>
        <p className="text-caption text-ink-80">
          {refuse
            ? "Votre inscription n'a pas été retenue par un responsable. Contactez votre responsable si vous pensez qu'il s'agit d'une erreur."
            : "Votre inscription doit être validée par un responsable, qui vous affectera à une ou plusieurs sections. Vous recevrez l'accès dès la confirmation."}
        </p>
        <p className="text-fine text-ink-48">
          Aucun accès à l&apos;application n&apos;est possible pour le moment.
        </p>
        <form action={deconnexion} className="mt-2">
          <button type="submit" className="text-fine font-semibold text-accent">
            Se déconnecter
          </button>
        </form>
      </div>
    </AuthShell>
  );
}
