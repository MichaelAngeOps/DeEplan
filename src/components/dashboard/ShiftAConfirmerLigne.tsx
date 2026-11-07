"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { definirStatutShift } from "@/lib/actions/planning";
import { dateCourteFr } from "@/lib/dates";
import type { ShiftAConfirmer } from "@/lib/data/dashboard";

/** Shift resté sans statut : le responsable indique ce qui s'est réellement passé. */
export function ShiftAConfirmerLigne({ shift }: { shift: ShiftAConfirmer }) {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function regler(statut: "a_servi" | "na_pas_servi") {
    setEnCours(true);
    setErreur(null);
    try {
      const res = await definirStatutShift(shift.id, statut);
      // En cas de succès, la ligne disparaît au rafraîchissement de la page.
      if (!res.ok) setErreur(res.erreur);
    } catch {
      setErreur("Mise à jour impossible. Vérifiez votre connexion et réessayez.");
    }
    setEnCours(false);
  }

  return (
    <div className="border-b border-hairline py-2.5 last:border-0">
      <p className="text-fine leading-relaxed text-ink-48">
        {shift.starNom} · {shift.posteNom} · {dateCourteFr(shift.date)}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" disabled={enCours} onClick={() => regler("a_servi")}>
          A servi
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={enCours}
          onClick={() => regler("na_pas_servi")}
        >
          N&apos;a pas servi
        </Button>
      </div>
      {erreur && (
        <p role="alert" className="mt-1 text-fine text-danger">
          {erreur}
        </p>
      )}
    </div>
  );
}
