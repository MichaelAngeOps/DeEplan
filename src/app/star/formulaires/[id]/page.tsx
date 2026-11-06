import { notFound, redirect } from "next/navigation";
import { Banner } from "@/components/ui";
import { FormulaireStarRemplissage } from "@/components/formulaires/FormulaireStarRemplissage";
import { journaliserErreur } from "@/lib/journal";
import { getAcces, getUser } from "@/lib/auth";
import { getFormulaireStar, type FormulaireStarDetail } from "@/lib/data/formulaires";

export const metadata = { title: "Formulaire — DeEplan" };

export default async function FormulaireStarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [acces, user] = await Promise.all([getAcces(), getUser()]);
  if (!user || !acces?.star) redirect("/login");

  const { id } = await params;

  let formulaire: FormulaireStarDetail | null;
  try {
    formulaire = await getFormulaireStar(user.id, acces.star.sectionIds, id);
  } catch (e) {
    journaliserErreur("star/formulaires/[id]", e);
    return (
      <Banner tone="danger" className="max-w-[640px]">
        Impossible de charger ce formulaire. Rechargez la page.
      </Banner>
    );
  }
  if (!formulaire) notFound();

  return <FormulaireStarRemplissage key={formulaire.id} formulaire={formulaire} />;
}
