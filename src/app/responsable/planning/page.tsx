import { redirect } from "next/navigation";
import { Banner, Legend } from "@/components/ui";
import { PlanningGrid } from "@/components/planning/PlanningGrid";
import { PlanningMonthNav } from "@/components/planning/PlanningMonthNav";
import { getAcces } from "@/lib/auth";
import { getPlanningMois } from "@/lib/data/planning";
import { iso, moisDecale } from "@/lib/dates";

export const metadata = { title: "Planification — DeEplan" };

const LEGENDE = [
  { dotClassName: "bg-accent", label: "De service" },
  { dotClassName: "bg-success", label: "A servi" },
  { dotClassName: "bg-danger", label: "N'a pas servi" },
  { dotClassName: "bg-warning", label: "À confirmer" },
];

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

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ mois?: string }>;
}) {
  const acces = await getAcces();
  if (!acces?.estResponsable || !acces.departementId) redirect("/login");

  const { annee, mois } = parseMois((await searchParams).mois);
  const debut = iso(annee, mois, 1);
  const fin = moisDecale(annee, mois, 1);

  let planning;
  try {
    planning = await getPlanningMois(acces.departementId, debut, fin);
  } catch {
    return (
      <>
        <Entete />
        <Banner tone="danger" className="mt-6">
          Impossible de charger le planning. Rechargez la page.
        </Banner>
      </>
    );
  }

  return (
    <>
      <Entete />
      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        <PlanningMonthNav annee={annee} mois={mois} />
        <Legend items={LEGENDE} />
      </div>
      <PlanningGrid annee={annee} mois={mois} planning={planning} />
    </>
  );
}

function Entete() {
  return (
    <div>
      <h1 className="font-display text-[28px] font-semibold leading-tight tracking-[-0.4px] text-ink">
        Planification mensuelle
      </h1>
      <p className="mt-1 text-body text-ink-48">
        Par section puis par poste, jour par jour.
      </p>
    </div>
  );
}
