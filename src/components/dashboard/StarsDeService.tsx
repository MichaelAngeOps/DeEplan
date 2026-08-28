"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Avatar } from "@/components/ui";
import { cn } from "@/lib/cn";
import { definirStatutShift } from "@/lib/actions/planning";
import type { ShiftDuJour } from "@/lib/data/dashboard";

function horaireLisible(debut: string | null, fin: string | null): string {
  if (!debut || !fin) return "horaire non précisé";
  return `${debut.slice(0, 5)} – ${fin.slice(0, 5)}`;
}

export function StarsDeService({ shifts }: { shifts: ShiftDuJour[] }) {
  return (
    <div className="flex flex-col">
      {shifts.map((s) => (
        <Ligne key={s.id} shift={s} />
      ))}
    </div>
  );
}

function Ligne({ shift }: { shift: ShiftDuJour }) {
  const [statut, setStatut] = useState(shift.statut);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function basculer(cible: "a_servi" | "na_pas_servi") {
    const nouveau = statut === cible ? "de_service" : cible;
    const precedent = statut;
    setStatut(nouveau);
    setEnCours(true);
    setErreur(null);
    const res = await definirStatutShift(shift.id, nouveau);
    setEnCours(false);
    if (!res.ok) {
      setStatut(precedent);
      setErreur(res.erreur);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2 border-b border-hairline py-3.5 last:border-0">
      <Avatar name={shift.starNom ?? "?"} size="md" />
      <div className="min-w-[150px] flex-1">
        <p className="text-caption-strong text-ink">
          {shift.starNom ?? "Star retiré"}
        </p>
        <p className="text-fine text-ink-48">
          {shift.sectionNom} · {shift.posteNom} ·{" "}
          {horaireLisible(shift.heureDebut, shift.heureFin)}
        </p>
        {erreur && <p className="text-fine text-danger">{erreur}</p>}
      </div>
      <div className="ml-auto flex gap-2">
        <button
          type="button"
          disabled={enCours}
          onClick={() => basculer("a_servi")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-[12px] font-semibold transition-colors disabled:opacity-50",
            statut === "a_servi"
              ? "border-success bg-success/10 text-success"
              : "border-hairline bg-pearl text-ink-48 hover:text-ink",
          )}
        >
          <Check size={14} />A servi
        </button>
        <button
          type="button"
          disabled={enCours}
          onClick={() => basculer("na_pas_servi")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-[12px] font-semibold transition-colors disabled:opacity-50",
            statut === "na_pas_servi"
              ? "border-danger bg-danger/10 text-danger"
              : "border-hairline bg-pearl text-ink-48 hover:text-ink",
          )}
        >
          <X size={14} />
          N&apos;a pas servi
        </button>
      </div>
    </div>
  );
}
