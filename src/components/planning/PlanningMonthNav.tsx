"use client";

import { useRouter } from "next/navigation";
import { MonthNavigator } from "@/components/ui";
import { libelleMois, moisDecale } from "@/lib/dates";

/** Navigation de mois pour le planning — pilotée par le paramètre d'URL `?mois=`. */
export function PlanningMonthNav({
  annee,
  mois,
}: {
  annee: number;
  mois: number;
}) {
  const router = useRouter();

  function aller(n: number) {
    const cible = moisDecale(annee, mois, n); // "YYYY-MM-01"
    router.push(`/responsable/planning?mois=${cible.slice(0, 7)}`);
  }

  return (
    <MonthNavigator
      label={libelleMois(annee, mois)}
      onPrev={() => aller(-1)}
      onNext={() => aller(1)}
    />
  );
}
