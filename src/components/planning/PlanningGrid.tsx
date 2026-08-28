import { initials } from "@/components/ui";
import { cn } from "@/lib/cn";
import { iso, joursDansMois } from "@/lib/dates";
import { cleCase, type PlanningMois } from "@/lib/data/planning";
import type { StatutShift } from "@/types/domain";

const CHIP: Record<StatutShift, string> = {
  de_service: "bg-accent/15 text-accent",
  a_servi: "bg-success/15 text-success",
  na_pas_servi: "bg-danger/15 text-danger",
  a_confirmer: "bg-warning/15 text-warning",
};

interface Jour {
  jour: number;
  dateISO: string;
  weekend: boolean;
}

function joursDuMois(annee: number, mois: number): Jour[] {
  return Array.from({ length: joursDansMois(annee, mois) }, (_, i) => {
    const jour = i + 1;
    const wd = new Date(annee, mois - 1, jour).getDay();
    return { jour, dateISO: iso(annee, mois, jour), weekend: wd === 0 || wd === 6 };
  });
}

export function PlanningGrid({
  annee,
  mois,
  planning,
}: {
  annee: number;
  mois: number;
  planning: PlanningMois;
}) {
  const jours = joursDuMois(annee, mois);
  const nbCols = jours.length + 1;

  const vide = planning.sections.every((s) => s.postes.length === 0);
  if (vide) {
    return (
      <p className="mt-6 rounded-lg border border-dashed border-hairline px-6 py-10 text-center text-caption text-ink-48">
        Aucun poste à planifier. Créez des sections et des postes dans{" "}
        <span className="font-semibold text-ink">Structure</span>.
      </p>
    );
  }

  return (
    <div className="mt-4 max-w-full overflow-auto rounded-lg border border-hairline bg-canvas">
      <table className="w-max border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 z-20 min-w-[180px] border-b border-hairline bg-canvas px-3.5 py-2.5 text-left text-[12px] font-semibold text-ink-48">
              Poste
            </th>
            {jours.map((j) => (
              <th
                key={j.dateISO}
                className={cn(
                  "min-w-[34px] border-b border-hairline px-1.5 py-2.5 text-center text-[11.5px] font-semibold",
                  j.weekend ? "bg-parchment text-ink" : "text-ink-48",
                )}
              >
                {j.jour}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {planning.sections.map((section) => (
            <SectionRows
              key={section.id}
              section={section}
              jours={jours}
              cases={planning.cases}
              nbCols={nbCols}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionRows({
  section,
  jours,
  cases,
  nbCols,
}: {
  section: PlanningMois["sections"][number];
  jours: Jour[];
  cases: PlanningMois["cases"];
  nbCols: number;
}) {
  return (
    <>
      <tr>
        <td
          colSpan={nbCols}
          className="sticky left-0 border-y border-hairline bg-parchment px-3.5 py-2 text-[12.5px] font-semibold text-ink"
        >
          {section.nom}
        </td>
      </tr>
      {section.postes.length === 0 && (
        <tr>
          <td
            colSpan={nbCols}
            className="sticky left-0 border-b border-hairline bg-canvas px-3.5 py-2 pl-6 text-fine text-ink-48"
          >
            Aucun poste.
          </td>
        </tr>
      )}
      {section.postes.map((poste) => (
        <tr key={poste.id}>
          <td className="sticky left-0 z-10 border-b border-hairline bg-canvas px-3.5 py-2 pl-6 text-[13px] text-ink">
            {poste.nom}
          </td>
          {jours.map((j) => {
            const c = cases[cleCase(poste.id, j.dateISO)];
            return (
              <td
                key={j.dateISO}
                className={cn(
                  "border-b border-l border-hairline px-1 py-1.5 text-center",
                  j.weekend && "bg-parchment/50",
                )}
              >
                {c && (
                  <span
                    title={
                      (c.starNom ?? "Star retiré") +
                      (c.heureDebut && c.heureFin
                        ? ` · ${c.heureDebut.slice(0, 5)}–${c.heureFin.slice(0, 5)}`
                        : "")
                    }
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-xs text-[10.5px] font-semibold",
                      CHIP[c.statut],
                    )}
                  >
                    {c.starNom ? initials(c.starNom) : "?"}
                  </span>
                )}
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
