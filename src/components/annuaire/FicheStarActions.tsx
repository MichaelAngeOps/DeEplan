"use client";

import { useState } from "react";
import { UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui";
import { definirActivationStar } from "@/lib/actions/annuaire";

export function FicheStarActions({
  starId,
  actif,
}: {
  starId: string;
  actif: boolean;
}) {
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function basculer() {
    setEnCours(true);
    setErreur(null);
    const res = await definirActivationStar(starId, !actif);
    setEnCours(false);
    if (!res.ok) setErreur(res.erreur);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant={actif ? "danger" : "primary"}
        size="sm"
        leftIcon={actif ? <UserX size={14} /> : <UserCheck size={14} />}
        onClick={basculer}
        disabled={enCours}
      >
        {enCours
          ? "…"
          : actif
            ? "Désactiver le compte"
            : "Réactiver le compte"}
      </Button>
      {erreur && <p className="text-fine text-danger">{erreur}</p>}
    </div>
  );
}
