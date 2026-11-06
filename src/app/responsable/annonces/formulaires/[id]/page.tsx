import { notFound, redirect } from "next/navigation";
import { Banner } from "@/components/ui";
import { FormulaireDetailResponsable } from "@/components/formulaires/FormulaireDetailResponsable";
import { FormulaireEditeur } from "@/components/formulaires/FormulaireEditeur";
import { getAcces } from "@/lib/auth";
import { getFormulaire, type FormulaireDetail } from "@/lib/data/formulaires";

export const metadata = { title: "Formulaire — DeEplan" };

export default async function FormulairePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const acces = await getAcces();
  if (!acces?.estResponsable || !acces.departementId) redirect("/login");

  const { id } = await params;

  let formulaire: FormulaireDetail | null;
  try {
    formulaire = await getFormulaire(acces.departementId, id);
  } catch {
    return (
      <Banner tone="danger" className="max-w-[760px]">
        Impossible de charger ce formulaire. Rechargez la page.
      </Banner>
    );
  }
  if (!formulaire) notFound();

  return formulaire.statut === "brouillon" ? (
    <FormulaireEditeur key={formulaire.id} initial={formulaire} />
  ) : (
    <FormulaireDetailResponsable formulaire={formulaire} />
  );
}
