import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Banner } from "@/components/ui";
import { ReponsesStar } from "@/components/formulaires/ReponsesStar";
import { StatutFormulaireBadge } from "@/components/formulaires/StatutFormulaireBadge";
import { getAcces } from "@/lib/auth";
import { getFicheStar } from "@/lib/data/annuaire";
import {
  getFormulaire,
  getReponseDuStar,
  type FormulaireDetail,
  type ReponseDuStar,
} from "@/lib/data/formulaires";
import { dateFormulaire } from "@/lib/formulaires-shared";

export const metadata = { title: "Réponses au formulaire — DeEplan" };

export default async function ReponsesFormulaireStarPage({
  params,
}: {
  params: Promise<{ id: string; formulaireId: string }>;
}) {
  const acces = await getAcces();
  if (!acces?.estResponsable || !acces.departementId) redirect("/login");

  const { id: starId, formulaireId } = await params;

  // Le star et le formulaire doivent tous deux appartenir au département.
  const fiche = await getFicheStar(acces.departementId, starId);
  if (!fiche) notFound();

  let formulaire: FormulaireDetail | null;
  let reponse: ReponseDuStar | null;
  try {
    formulaire = await getFormulaire(acces.departementId, formulaireId);
    reponse = formulaire ? await getReponseDuStar(formulaireId, starId) : null;
  } catch {
    return (
      <Banner tone="danger" className="max-w-[760px]">
        Impossible de charger les réponses. Rechargez la page.
      </Banner>
    );
  }
  if (!formulaire || formulaire.statut === "brouillon") notFound();

  return (
    <div className="max-w-[760px]">
      <Link
        href={`/responsable/stars/${starId}`}
        className="flex items-center gap-1.5 text-fine font-semibold text-ink-48"
      >
        <ChevronLeft size={15} />
        Retour à la fiche de {fiche.nom}
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <h1 className="font-display text-[24px] font-semibold tracking-[-0.3px] text-ink">
          {formulaire.titre}
        </h1>
        <StatutFormulaireBadge statut={formulaire.statut} />
      </div>
      <p className="mt-1 text-caption text-ink-48">
        Réponses de {fiche.nom}
        {reponse && ` · Remplies le ${dateFormulaire(reponse.dateModification)}`}
      </p>

      <div className="mt-5">
        {reponse ? (
          <ReponsesStar questions={formulaire.questions} reponses={reponse.reponses} />
        ) : (
          <Banner tone="info">{fiche.nom} n&apos;a pas répondu à ce formulaire.</Banner>
        )}
      </div>
    </div>
  );
}
