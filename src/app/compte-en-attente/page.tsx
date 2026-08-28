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

  // Déjà un accès exploitable → on n'a rien à faire ici.
  if (acces.estResponsable || acces.star?.statut === "valide") {
    redirect("/apres-login");
  }

  const refuse = acces.star?.statut === "desactive";
  const sansDepartement = !refuse && !acces.star?.departementChoisi;

  // Star sans département : y a-t-il des départements à rejoindre ?
  let departementsExistent = false;
  if (sansDepartement) {
    const supabase = await createClient();
    const { count } = await supabase
      .from("departements")
      .select("*", { count: "exact", head: true });
    departementsExistent = (count ?? 0) > 0;
  }

  const { icone, titre, texte } = contenu({
    refuse,
    sansDepartement,
    departementsExistent,
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

        {sansDepartement && departementsExistent && (
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
  refuse,
  sansDepartement,
  departementsExistent,
}: {
  refuse: boolean;
  sansDepartement: boolean;
  departementsExistent: boolean;
}) {
  if (refuse)
    return {
      icone: <Ban size={24} className="text-danger" />,
      titre: "Compte non validé",
      texte:
        "Votre inscription n'a pas été retenue par un responsable. Contactez votre responsable si vous pensez qu'il s'agit d'une erreur.",
    };
  if (sansDepartement && !departementsExistent)
    return {
      icone: <Building2 size={24} className="text-accent" />,
      titre: "Aucun département actif",
      texte:
        "Aucun département n'est encore créé. Vous serez notifié dès qu'un département sera disponible et pourrez alors le rejoindre.",
    };
  if (sansDepartement)
    return {
      icone: <Building2 size={24} className="text-accent" />,
      titre: "Choisissez votre département",
      texte:
        "Un ou plusieurs départements sont disponibles. Sélectionnez celui que vous souhaitez rejoindre pour finaliser votre inscription.",
    };
  return {
    icone: <Clock size={24} className="text-accent" />,
    titre: "Compte en attente de validation",
    texte:
      "Votre inscription doit être validée par le responsable de votre département, qui vous affectera à une ou plusieurs sections. Vous recevrez l'accès dès la confirmation.",
  };
}
