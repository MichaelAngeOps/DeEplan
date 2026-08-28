"use client";

import { cn } from "@/lib/cn";
import {
  JOURS_FR,
  decalagePremierJour,
  iso,
  joursDansMois,
} from "@/lib/dates";
import type { StatutDisponibilite } from "@/types/domain";

type EtatJour = StatutDisponibilite | null;

const CELLULE: Record<"disponible" | "indisponible" | "vide", string> = {
  disponible: "border-success bg-success/10 text-success",
  indisponible: "border-danger bg-danger/10 text-danger",
  vide: "border-hairline bg-canvas text-ink",
};

export function MoisCalendrier({
  annee,
  mois,
  etatDuJour,
  jourEditable,
  aShift,
  onJourClick,
}: {
  annee: number;
  mois: number;
  etatDuJour: (dateISO: string) => EtatJour;
  jourEditable: (dateISO: string) => boolean;
  aShift: (dateISO: string) => boolean;
  onJourClick: (dateISO: string) => void;
}) {
  const nbJours = joursDansMois(annee, mois);
  const decalage = decalagePremierJour(annee, mois);

  return (
    <div>
      <div className="mb-1.5 grid grid-cols-7 gap-1.5">
        {JOURS_FR.map((j) => (
          <div
            key={j}
            className="text-center text-[10.5px] font-semibold text-ink-48"
          >
            {j}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: decalage }).map((_, i) => (
          <div key={`vide-${i}`} />
        ))}
        {Array.from({ length: nbJours }).map((_, i) => {
          const jour = i + 1;
          const dateISO = iso(annee, mois, jour);
          const etat = etatDuJour(dateISO);
          const editable = jourEditable(dateISO);
          const cle =
            etat === "disponible"
              ? "disponible"
              : etat === "indisponible"
                ? "indisponible"
                : "vide";
          return (
            <button
              key={dateISO}
              type="button"
              disabled={!editable}
              onClick={() => onJourClick(dateISO)}
              aria-label={`${jour} — ${
                etat === "disponible"
                  ? "disponible"
                  : etat === "indisponible"
                    ? "indisponible"
                    : "non renseigné"
              }`}
              className={cn(
                "relative min-h-[38px] rounded-sm border px-1 py-2 text-center transition-colors duration-fast ease-smooth",
                CELLULE[cle],
                editable
                  ? "cursor-pointer hover:border-accent"
                  : "cursor-not-allowed opacity-40",
              )}
            >
              <span className="text-[11.5px] font-semibold">{jour}</span>
              {aShift(dateISO) && (
                <span
                  aria-hidden
                  className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-accent"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
