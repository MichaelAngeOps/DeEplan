"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Avatar, Button, Field, Input, Modal, Spinner } from "@/components/ui";
import {
  assignerShift,
  chargerCandidats,
  retirerShift,
} from "@/lib/actions/planning";
import type { Candidat } from "@/lib/planning-shared";
import { libelleMois } from "@/lib/dates";
import type { CelluleCliquee } from "./PlanningGrid";

function dateLisible(iso: string): string {
  const [a, m, j] = iso.split("-").map(Number);
  return `${j} ${libelleMois(a, m)}`;
}

export function AssignationModal({
  cellule,
  onClose,
}: {
  cellule: CelluleCliquee;
  onClose: () => void;
}) {
  const occupe = cellule.shift !== null;
  const [mode, setMode] = useState<"apercu" | "choix">(
    occupe ? "apercu" : "choix",
  );

  const [candidats, setCandidats] = useState<Candidat[] | null>(null);
  const [heureDebut, setHeureDebut] = useState("");
  const [heureFin, setHeureFin] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState<string | null>(null); // id du star en cours
  const [confirmDimanche, setConfirmDimanche] = useState<{
    starId: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (mode !== "choix") return;
    setCandidats(null);
    setErreur(null);
    chargerCandidats(cellule.sectionId, cellule.posteId, cellule.date).then(
      (res) => {
        if (res.ok) setCandidats(res.candidats);
        else setErreur(res.erreur);
      },
    );
  }, [mode, cellule.sectionId, cellule.posteId, cellule.date]);

  async function assigner(starId: string, forcerDimanche = false) {
    setEnCours(starId);
    setErreur(null);
    const res = await assignerShift({
      posteId: cellule.posteId,
      sectionId: cellule.sectionId,
      date: cellule.date,
      starId,
      heureDebut,
      heureFin,
      forcerDimanche,
    });
    setEnCours(null);
    if (res.ok) {
      onClose();
    } else if ("confirmationDimanche" in res) {
      setConfirmDimanche({ starId, message: res.confirmationDimanche });
    } else {
      setErreur(res.erreur);
    }
  }

  async function retirer() {
    if (!cellule.shift) return;
    setEnCours("__retrait__");
    setErreur(null);
    const res = await retirerShift(cellule.shift.id);
    setEnCours(null);
    if (res.ok) onClose();
    else setErreur(res.erreur);
  }

  const sousTitre = `${cellule.sectionNom} · ${cellule.posteNom} · ${dateLisible(cellule.date)}`;

  return (
    <Modal
      open
      onClose={onClose}
      title={
        mode === "apercu"
          ? "Star assigné"
          : occupe
            ? "Changer de star"
            : "Assigner un star"
      }
      subtitle={sousTitre}
    >
      {mode === "apercu" && cellule.shift && (
        <div className="mt-3">
          <div className="flex items-center gap-3 border-b border-hairline pb-4">
            <Avatar name={cellule.shift.starNom ?? "?"} size="sm" />
            <div>
              <p className="text-caption-strong text-ink">
                {cellule.shift.starNom ?? "Star retiré"}
              </p>
              {cellule.shift.heureDebut && cellule.shift.heureFin && (
                <p className="text-fine text-ink-48">
                  {cellule.shift.heureDebut.slice(0, 5)} –{" "}
                  {cellule.shift.heureFin.slice(0, 5)}
                </p>
              )}
            </div>
          </div>
          {erreur && (
            <p role="alert" className="mt-3 text-caption text-danger">
              {erreur}
            </p>
          )}
          <div className="mt-4 flex flex-col gap-2">
            <Button variant="secondary" onClick={() => setMode("choix")}>
              Changer de star
            </Button>
            <Button
              variant="danger"
              onClick={retirer}
              disabled={enCours !== null}
            >
              {enCours === "__retrait__" ? "Retrait…" : "Retirer"}
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Annuler
            </Button>
          </div>
        </div>
      )}

      {mode === "choix" && (
        <div className="mt-3">
          <div className="mb-4 flex gap-3">
            <Field label="Début (optionnel)" htmlFor="h-debut" className="flex-1">
              <Input
                id="h-debut"
                type="time"
                value={heureDebut}
                onChange={(e) => setHeureDebut(e.target.value)}
              />
            </Field>
            <Field label="Fin (optionnel)" htmlFor="h-fin" className="flex-1">
              <Input
                id="h-fin"
                type="time"
                value={heureFin}
                onChange={(e) => setHeureFin(e.target.value)}
              />
            </Field>
          </div>

          {candidats === null && !erreur && (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          )}

          {erreur && (
            <p role="alert" className="text-caption text-danger">
              {erreur}
            </p>
          )}

          {candidats !== null && candidats.length === 0 && !erreur && (
            <p className="py-4 text-caption text-ink-48">
              Aucun star disponible pour ce poste à cette date.
            </p>
          )}

          {candidats?.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between border-b border-hairline py-2.5"
            >
              <div>
                <p className="text-caption-strong text-ink">{c.nom}</p>
                <p className="text-fine text-ink-48">
                  Disponible ce jour
                  {c.dejaPlanifieAilleurs && " · déjà planifié ailleurs"}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => assigner(c.id)}
                disabled={enCours !== null}
              >
                {enCours === c.id ? "…" : "Assigner"}
              </Button>
            </div>
          ))}

          {occupe && (
            <button
              type="button"
              onClick={() => setMode("apercu")}
              className="mt-4 text-fine font-semibold text-ink-48"
            >
              ← Retour
            </button>
          )}
        </div>
      )}

      {confirmDimanche && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-[340px] rounded-lg bg-canvas p-[22px] shadow-[0_12px_40px_rgba(0,0,0,0.2)]">
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle size={18} className="text-warning" />
              <h4 className="font-display text-[15px] font-semibold text-ink">
                Règle des dimanches
              </h4>
            </div>
            <p className="text-caption text-ink-80">{confirmDimanche.message}</p>
            <div className="mt-5 flex gap-2">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setConfirmDimanche(null)}
              >
                Annuler
              </Button>
              <Button
                fullWidth
                onClick={() => {
                  const id = confirmDimanche.starId;
                  setConfirmDimanche(null);
                  assigner(id, true);
                }}
              >
                Planifier quand même
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
