"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Legend, Modal, MonthNavigator, StatusBadge } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { ShiftStar, ShiftsStarMap } from "@/lib/data/calendrier-star";
import {
  JOURS_FR,
  decalagePremierJour,
  iso,
  joursDansMois,
  jourSemaine,
  libelleMois,
  moisDecale,
} from "@/lib/dates";
import type { StatutShift } from "@/types/domain";

const CHIP: Record<StatutShift, string> = {
  de_service: "bg-accent/15 text-accent",
  a_servi: "bg-success/15 text-success",
  na_pas_servi: "bg-danger/15 text-danger",
  a_confirmer: "bg-warning/15 text-warning",
};

const LEGENDE = [
  { dotClassName: "bg-accent", label: "De service" },
  { dotClassName: "bg-success", label: "A servi" },
  { dotClassName: "bg-danger", label: "N'a pas servi" },
  { dotClassName: "bg-warning", label: "À confirmer" },
];

function horaire(s: ShiftStar): string {
  if (!s.heureDebut || !s.heureFin) return "Horaire non précisé";
  return `${s.heureDebut.slice(0, 5)} – ${s.heureFin.slice(0, 5)}`;
}

export function CalendrierStar({
  annee,
  mois,
  shifts,
}: {
  annee: number;
  mois: number;
  shifts: ShiftsStarMap;
}) {
  const router = useRouter();
  const [jourDetail, setJourDetail] = useState<string | null>(null);

  const nbJours = joursDansMois(annee, mois);
  const decalage = decalagePremierJour(annee, mois);

  function allerAuMois(n: number) {
    router.push(`/star/calendrier?mois=${moisDecale(annee, mois, n).slice(0, 7)}`);
  }

  return (
    <>
      <h2 className="font-display text-[20px] font-semibold tracking-[-0.3px] text-ink">
        Mon calendrier
      </h2>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
        <MonthNavigator
          size="sm"
          label={libelleMois(annee, mois)}
          onPrev={() => allerAuMois(-1)}
          onNext={() => allerAuMois(1)}
        />
        <Legend items={LEGENDE} />
      </div>

      <div className="mt-4 max-w-[560px]">
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
            <div key={`v-${i}`} />
          ))}
          {Array.from({ length: nbJours }).map((_, i) => {
            const jour = i + 1;
            const dateISO = iso(annee, mois, jour);
            const duJour = shifts[dateISO] ?? [];
            const weekend = [0, 6].includes(jourSemaine(dateISO));
            return (
              <button
                key={dateISO}
                type="button"
                disabled={duJour.length === 0}
                onClick={() => duJour.length > 0 && setJourDetail(dateISO)}
                className={cn(
                  "min-h-[52px] rounded-sm border border-hairline p-1.5 text-left align-top transition-colors",
                  weekend && "bg-parchment/50",
                  duJour.length > 0
                    ? "cursor-pointer hover:border-accent"
                    : "cursor-default",
                )}
              >
                <span className="text-[11px] font-semibold text-ink">{jour}</span>
                {duJour.slice(0, 2).map((s) => (
                  <span
                    key={s.id}
                    className={cn(
                      "mt-1 block truncate rounded px-1 py-0.5 text-[9px] font-semibold",
                      CHIP[s.statut],
                    )}
                  >
                    {s.posteNom}
                  </span>
                ))}
                {duJour.length > 2 && (
                  <span className="mt-0.5 block text-[9px] font-semibold text-ink-48">
                    +{duJour.length - 2}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {Object.keys(shifts).length === 0 && (
        <p className="mt-4 text-caption text-ink-48">
          Aucun shift planifié ce mois-ci.
        </p>
      )}

      {jourDetail && (
        <Modal
          open
          onClose={() => setJourDetail(null)}
          title={(shifts[jourDetail]?.length ?? 0) > 1 ? "Détail des shifts" : "Détail du shift"}
          subtitle={new Date(jourDetail).toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        >
          <div className="mt-3 flex flex-col gap-5">
            {(shifts[jourDetail] ?? []).map((s) => (
              <div
                key={s.id}
                className="flex flex-col gap-3 border-b border-hairline pb-4 last:border-0 last:pb-0"
              >
                <Ligne label="Statut">
                  <StatusBadge statut={s.statut} />
                </Ligne>
                <Ligne label="Section">{s.sectionNom}</Ligne>
                <Ligne label="Poste">{s.posteNom}</Ligne>
                <Ligne label="Horaire">{horaire(s)}</Ligne>
                {s.description && (
                  <Ligne label="Description">{s.description}</Ligne>
                )}
              </div>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
}

function Ligne({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="text-fine text-ink-48">{label}</span>
      <div className="text-ink">{children}</div>
    </div>
  );
}
