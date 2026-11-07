"use client";

import { useState } from "react";
import { UserCheck, UserX } from "lucide-react";
import { Button, Modal } from "@/components/ui";
import { definirActivationStar } from "@/lib/actions/annuaire";
import { dateCourteFr } from "@/lib/dates";

const MAX_SHIFTS_AFFICHES = 10;

export function FicheStarActions({
  starId,
  actif,
  shiftsAVenir,
}: {
  starId: string;
  actif: boolean;
  /** `null` : la liste n'a pas pu être chargée. */
  shiftsAVenir: { id: string; posteNom: string; date: string }[] | null;
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
          {shiftsAVenir === null ? (
            <p className="mt-3 text-caption text-danger">
              La liste de ses shifts à venir n&apos;a pas pu être chargée. Vérifiez le planning
              après le retrait.
            </p>
          ) : (
            shiftsAVenir.length > 0 && (
              <div className="mt-3 rounded-md border border-warning/60 bg-warning/10 px-3 py-2.5">
                <p className="text-caption-strong text-ink">
                  {shiftsAVenir.length === 1
                    ? "1 shift à venir restera au planning :"
                    : `${shiftsAVenir.length} shifts à venir resteront au planning :`}
                </p>
                <ul className="mt-1 text-fine text-ink-80">
                  {shiftsAVenir.slice(0, MAX_SHIFTS_AFFICHES).map((s) => (
                    <li key={s.id}>
                      {dateCourteFr(s.date)} · {s.posteNom}
                    </li>
                  ))}
                  {shiftsAVenir.length > MAX_SHIFTS_AFFICHES && (
                    <li>et {shiftsAVenir.length - MAX_SHIFTS_AFFICHES} autres</li>
                  )}
                </ul>
                <p className="mt-1.5 text-fine text-ink-48">
                  Ils seront signalés sur votre tableau de bord pour que vous les réattribuiez ou
                  les retiriez.
                </p>
              </div>
            )
          )}
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
