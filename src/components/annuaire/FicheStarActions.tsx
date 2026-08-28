"use client";

import { useState } from "react";
import { UserCheck, UserX } from "lucide-react";
import { Button, Modal } from "@/components/ui";
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
  const [confirmation, setConfirmation] = useState(false);

  async function appliquer(nouvelEtat: boolean) {
    setEnCours(true);
    setErreur(null);
    const res = await definirActivationStar(starId, nouvelEtat);
    setEnCours(false);
    setConfirmation(false);
    if (!res.ok) setErreur(res.erreur);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant={actif ? "danger" : "primary"}
        size="sm"
        leftIcon={actif ? <UserX size={14} /> : <UserCheck size={14} />}
        onClick={() => (actif ? setConfirmation(true) : appliquer(true))}
        disabled={enCours}
      >
        {enCours && !confirmation
          ? "…"
          : actif
            ? "Retirer du département"
            : "Réintégrer"}
      </Button>
      {erreur && <p className="text-fine text-danger">{erreur}</p>}

      {confirmation && (
        <Modal
          open
          onClose={() => setConfirmation(false)}
          title="Retirer ce star du département ?"
        >
          <p className="mt-2 text-caption text-ink-80">
            Êtes-vous sûr de vouloir retirer ce star de votre département ? Il
            sera désassigné de vos sections et perdra l&apos;accès à vos
            plannings. Ses autres départements et son historique sont conservés.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmation(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => appliquer(false)}
              disabled={enCours}
            >
              {enCours ? "Retrait…" : "Retirer"}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
