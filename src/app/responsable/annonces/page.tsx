import { redirect } from "next/navigation";
import { Banner } from "@/components/ui";
import { AnnoncesResponsable } from "@/components/annonces/AnnoncesResponsable";
import { FormulairesResponsable } from "@/components/formulaires/FormulairesResponsable";
import { getAcces } from "@/lib/auth";
import { getAnnonces } from "@/lib/data/annonces";
import { getFormulaires, type FormulaireResume } from "@/lib/data/formulaires";

export const metadata = { title: "Annonces — DeEplan" };

export default async function AnnoncesPage() {
  const acces = await getAcces();
  if (!acces?.estResponsable || !acces.departementId) redirect("/login");

  let annonces;
  try {
    annonces = await getAnnonces(acces.departementId);
  } catch {
    return (
      <>
        <h1 className="font-display text-[28px] font-semibold leading-tight tracking-[-0.4px] text-ink">
          Annonces
        </h1>
        <Banner tone="danger" className="mt-6 max-w-[760px]">
          Impossible de charger les annonces. Rechargez la page.
        </Banner>
      </>
    );
  }

  let formulaires: FormulaireResume[] | null = null;
  try {
    formulaires = await getFormulaires(acces.departementId);
  } catch {
    // Les annonces restent utilisables : l'erreur s'affiche dans la section.
  }

  return (
    <>
      <AnnoncesResponsable annonces={annonces} />
      {formulaires ? (
        <FormulairesResponsable formulaires={formulaires} />
      ) : (
        <Banner tone="danger" className="mt-10 max-w-[760px]">
          Impossible de charger les formulaires. Rechargez la page.
        </Banner>
      )}
    </>
  );
}
