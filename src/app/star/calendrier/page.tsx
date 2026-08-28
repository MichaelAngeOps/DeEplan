import { Banner } from "@/components/ui";
import { CalendrierStar } from "@/components/calendrier/CalendrierStar";
import { getUser } from "@/lib/auth";
import { getShiftsStar } from "@/lib/data/calendrier-star";
import { iso, moisDecale } from "@/lib/dates";

export const metadata = { title: "Mon calendrier — DeEplan" };

function parseMois(v: string | undefined): { annee: number; mois: number } {
  const m = v?.match(/^(\d{4})-(\d{2})$/);
  if (m) {
    const annee = Number(m[1]);
    const mois = Number(m[2]);
    if (mois >= 1 && mois <= 12 && annee >= 2000 && annee <= 2100)
      return { annee, mois };
  }
  const now = new Date();
  return { annee: now.getFullYear(), mois: now.getMonth() + 1 };
}

export default async function CalendrierPage({
  searchParams,
}: {
  searchParams: Promise<{ mois?: string }>;
}) {
  const user = await getUser();
  if (!user) return null; // le layout Star gère la redirection

  const { annee, mois } = parseMois((await searchParams).mois);

  let shifts;
  try {
    shifts = await getShiftsStar(
      user.id,
      iso(annee, mois, 1),
      moisDecale(annee, mois, 1),
    );
  } catch {
    return (
      <>
        <h2 className="font-display text-[20px] font-semibold tracking-[-0.3px] text-ink">
          Mon calendrier
        </h2>
        <Banner tone="danger" className="mt-4 max-w-[560px]">
          Impossible de charger votre calendrier. Rechargez la page.
        </Banner>
      </>
    );
  }

  return <CalendrierStar annee={annee} mois={mois} shifts={shifts} />;
}
