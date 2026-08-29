import Link from "next/link";
import { redirect } from "next/navigation";
import { Ban, Building2, Clock } from "lucide-react";
import { AuthShell } from "@/components/layout";
import { deconnexion } from "@/lib/actions/auth";
import { getAcces } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function CompteEnAttentePage() {
  const acces = await getAcces();
  if (!acces) redirect("/login");

  // Profil incomplet (connexion Google sans rôle) → finaliser d'abord.
  if (!acces.star && !acces.estResponsable) redirect("/completer-profil");

  // Déjà un accès exploitable → on n'a rien à faire ici.
  if (acces.estResponsable || acces.star?.statut === "valide") {
    redirect("/apres-login");
  }

  const demandes = acces.star?.departements ?? [];
  const enAttente = demandes.filter((d) => d.statut === "en_attente");
  const toutesRefusees =
    demandes.length > 0 && demandes.every((d) => d.statut === "refuse");
  const aucuneDemande = demandes.length === 0;

  const supabase = await createClient();

  // Noms des départements en attente + nombre de départements existants.
  let nomsEnAttente: string[] = [];
  if (enAttente.length > 0) {
    const { data } = await supabase
      .from("departements")
      .select("nom")
      .in(
        "id",
        enAttente.map((d) => d.id),
      );
    nomsEnAttente = (data ?? []).map((d) => d.nom);
  }
  let departementsExistent = false;
  if (aucuneDemande) {
    const { count } = await supabase
      .from("departements")
      .select("*", { count: "exact", head: true });
    departementsExistent = (count ?? 0) > 0;
  }

  const { icone, titre, texte } = contenu({
    toutesRefusees,
    aucuneDemande,
    departementsExistent,
    nomsEnAttente,
  });

  return (
    <AuthShell>
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-parchment">
          {icone}
        </span>
        <h1 className="font-display text-[20px] font-semibold tracking-[-0.3px] text-ink">
          {titre}
        </h1>
        <p className="text-caption text-ink-80">{texte}</p>

        {aucuneDemande && departementsExistent && (
          <Link
            href="/choisir-departement"
            className="mt-2 rounded-pill bg-accent px-5 py-2.5 text-[13px] font-semibold text-white"
          >
            Choisir mon département
          </Link>
        )}

        <p className="mt-1 text-fine text-ink-48">
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

function contenu({
  toutesRefusees,
  aucuneDemande,
  departementsExistent,
  nomsEnAttente,
}: {
  toutesRefusees: boolean;
  aucuneDemande: boolean;
  departementsExistent: boolean;
  nomsEnAttente: string[];
}) {
  if (toutesRefusees)
    return {
      icone: <Ban size={24} className="text-danger" />,
      titre: "Compte non validé",
      texte:
        "Aucune de vos demandes n'a été retenue. Contactez le responsable concerné si vous pensez qu'il s'agit d'une erreur.",
    };
  if (aucuneDemande && !departementsExistent)
    return {
      icone: <Building2 size={24} className="text-accent" />,
      titre: "Aucun département actif",
      texte:
        "Aucun département n'est encore créé. Vous serez notifié dès qu'un département sera disponible et pourrez alors le rejoindre.",
    };
  if (aucuneDemande)
    return {
      icone: <Building2 size={24} className="text-accent" />,
      titre: "Choisissez votre département",
      texte:
        "Un ou plusieurs départements sont disponibles. Sélectionnez celui que vous souhaitez rejoindre pour finaliser votre inscription.",
    };
  return {
    icone: <Clock size={24} className="text-accent" />,
    titre: "Demande en attente de validation",
    texte:
      nomsEnAttente.length > 0
        ? `Votre demande est en attente de validation par le responsable de : ${nomsEnAttente.join(", ")}. Vous recevrez l'accès dès la confirmation.`
        : "Votre demande est en attente de validation. Vous recevrez l'accès dès la confirmation.",
  };
}
