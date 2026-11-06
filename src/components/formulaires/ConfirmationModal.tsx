"use client";

import { useState } from "react";
import { Button, Modal } from "@/components/ui";

export function ConfirmationModal({
  titre,
  message,
  confirmLabel,
  enCoursLabel,
  danger,
  onClose,
  onConfirm,
}: {
  titre: string;
  message: string;
  confirmLabel: string;
  enCoursLabel: string;
  danger?: boolean;
  onClose: () => void;
  /** Renvoie un message d'erreur, ou `null` si l'action a réussi. */
  onConfirm: () => Promise<string | null>;
}) {
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function confirmer() {
    setEnCours(true);
    setErreur(null);
    const res = await onConfirm();
    setEnCours(false);
    if (res) setErreur(res);
  }

  return (
    <Modal open onClose={onClose} title={titre}>
      <p className="mt-2 text-caption text-ink-80">{message}</p>
      {erreur && (
        <p role="alert" className="mt-3 text-caption text-danger">
          {erreur}
        </p>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={enCours}>
          Annuler
        </Button>
        <Button
          variant={danger ? "danger" : "primary"}
          onClick={confirmer}
          disabled={enCours}
        >
          {enCours ? enCoursLabel : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
