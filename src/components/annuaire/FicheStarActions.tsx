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
            ? "Désactiver le compte"
            : "Réactiver le compte"}
      </Button>
      {erreur && <p className="text-fine text-danger">{erreur}</p>}

      {confirmation && (
        <Modal
          open
          onClose={() => setConfirmation(false)}
          title="Désactiver ce compte ?"
        >
          <p className="mt-2 text-caption text-ink-80">
            Êtes-vous sûr de vouloir désactiver ce compte ? Le star perdra
            l&apos;accès à l&apos;application. Son historique (planning,
            disponibilités) est conservé et le compte peut être réactivé.
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
              {enCours ? "Désactivation…" : "Désactiver"}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
