"use client";

import { initials } from "@/components/ui";
import { cn } from "@/lib/cn";
import { iso, joursDansMois, jourSemaine } from "@/lib/dates";
import { cleCase, type PlanningMois, type ShiftCase } from "@/lib/planning-shared";
import type { StatutShift } from "@/types/domain";

const CHIP: Record<StatutShift, string> = {
  de_service: "bg-accent/15 text-accent",
  a_servi: "bg-success/15 text-success",
  na_pas_servi: "bg-danger/15 text-danger",
  a_confirmer: "bg-warning/15 text-warning",
};

export interface CelluleCliquee {
  posteId: string;
  posteNom: string;
  sectionId: string;
  sectionNom: string;
  date: string;
  shift: ShiftCase | null;
}

interface Jour {
  jour: number;
  dateISO: string;
  weekend: boolean;
}

function joursDuMois(annee: number, mois: number): Jour[] {
  return Array.from({ length: joursDansMois(annee, mois) }, (_, i) => {
    const jour = i + 1;
    const wd = jourSemaine(iso(annee, mois, jour));
    return { jour, dateISO: iso(annee, mois, jour), weekend: wd === 0 || wd === 6 };
  });
}

export function PlanningGrid({
  annee,
  mois,
  planning,
  onCellClick,
}: {
  annee: number;
  mois: number;
  planning: PlanningMois;
  onCellClick: (c: CelluleCliquee) => void;
}) {
  const jours = joursDuMois(annee, mois);
  const nbCols = jours.length + 1;

  const vide = planning.sections.every((s) => s.postes.length === 0);
  if (vide) {
    return (
      <p className="mt-4 rounded-lg border border-dashed border-hairline px-6 py-10 text-center text-caption text-ink-48">
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
              onCellClick={onCellClick}
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
  onCellClick,
}: {
  section: PlanningMois["sections"][number];
  jours: Jour[];
  cases: PlanningMois["cases"];
  nbCols: number;
  onCellClick: (c: CelluleCliquee) => void;
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
            const shift = cases[cleCase(poste.id, j.dateISO)] ?? null;
            return (
              <td
                key={j.dateISO}
                className={cn(
                  "border-b border-l border-hairline p-0 text-center",
                  j.weekend && "bg-parchment/50",
                )}
              >
                <button
                  type="button"
                  onClick={() =>
                    onCellClick({
                      posteId: poste.id,
                      posteNom: poste.nom,
                      sectionId: section.id,
                      sectionNom: section.nom,
                      date: j.dateISO,
                      shift,
                    })
                  }
                  aria-label={`${poste.nom}, ${j.jour} — ${
                    shift ? (shift.starNom ?? "assigné") : "libre"
                  }`}
                  className="flex h-9 w-full items-center justify-center px-1 transition-colors hover:bg-accent/5"
                >
                  {shift && (
                    <span
                      title={
                        (shift.starNom ?? "Star retiré") +
                        (shift.heureDebut && shift.heureFin
                          ? ` · ${shift.heureDebut.slice(0, 5)}–${shift.heureFin.slice(0, 5)}`
                          : "") +
                        (shift.conflit
                          ? " · ⚠ indisponible ce jour"
                          : "")
                      }
                      className={cn(
                        "inline-flex h-6 w-6 items-center justify-center rounded-xs text-[10.5px] font-semibold",
                        shift.conflit
                          ? "bg-warning/25 text-warning ring-1 ring-warning"
                          : CHIP[shift.statut],
                      )}
                    >
                      {shift.starNom ? initials(shift.starNom) : "?"}
                    </span>
                  )}
                </button>
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
