import { redirect } from "next/navigation";
import { FormulaireEditeur } from "@/components/formulaires/FormulaireEditeur";
import { getAcces } from "@/lib/auth";

export const metadata = { title: "Créer un formulaire — DeEplan" };

export default async function NouveauFormulairePage() {
  const acces = await getAcces();
  if (!acces?.estResponsable || !acces.departementId) redirect("/login");

  return <FormulaireEditeur />;
}
