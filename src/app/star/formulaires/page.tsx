import { redirect } from "next/navigation";
import { Banner } from "@/components/ui";
import { FormulairesStar } from "@/components/formulaires/FormulairesStar";
import { journaliserErreur } from "@/lib/journal";
import { getAcces, getUser } from "@/lib/auth";
import { getFormulairesStar, type FormulaireStarResume } from "@/lib/data/formulaires";

export const metadata = { title: "Formulaires — DeEplan" };

export default async function FormulairesStarPage() {
  const [acces, user] = await Promise.all([getAcces(), getUser()]);
  if (!user || !acces?.star) redirect("/login");

  let formulaires: FormulaireStarResume[] | null = null;
  try {
    formulaires = await getFormulairesStar(user.id, acces.star.sectionIds);
  } catch (e) {
    journaliserErreur("star/formulaires", e);
    // Message affiché ci-dessous.
  }

  return (
    <>
      <h2 className="font-display text-[20px] font-semibold tracking-[-0.3px] text-ink">
        Formulaires
      </h2>
      {formulaires ? (
        <FormulairesStar formulaires={formulaires} />
      ) : (
        <Banner tone="danger" className="mt-4 max-w-[560px]">
          Impossible de charger vos formulaires. Rechargez la page.
        </Banner>
      )}
    </>
  );
}
