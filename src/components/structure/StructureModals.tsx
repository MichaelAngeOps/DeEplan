"use client";

import { useState, type FormEvent } from "react";
import { Button, Field, Input, Modal, Textarea } from "@/components/ui";
import type { ActionResultat } from "@/lib/actions/structure";

/** Modale création / renommage de section. */
export function SectionFormModal({
  mode,
  valeurInitiale = "",
  onClose,
  onSubmit,
}: {
  mode: "new" | "edit";
  valeurInitiale?: string;
  onClose: () => void;
  onSubmit: (nom: string) => Promise<ActionResultat>;
}) {
  const [nom, setNom] = useState(valeurInitiale);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!nom.trim()) {
      setErreur("Le nom de la section est requis.");
      return;
    }
    setChargement(true);
    setErreur(null);
    const res = await onSubmit(nom);
    setChargement(false);
    if (res.ok) onClose();
    else setErreur(res.erreur);
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={mode === "new" ? "Nouvelle section" : "Renommer la section"}
    >
      <form onSubmit={submit} className="mt-3 flex flex-col gap-4" noValidate>
        <Field label="Nom de la section" htmlFor="section-nom" error={erreur ?? undefined}>
          <Input
            id="section-nom"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Ex : Restauration"
            autoFocus
            maxLength={60}
            invalid={Boolean(erreur)}
          />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={chargement}>
            {chargement ? "Enregistrement…" : mode === "new" ? "Créer" : "Enregistrer"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/** Modale création / édition de poste. */
export function PosteFormModal({
  mode,
  nomInitial = "",
  descriptionInitiale = "",
  sectionNom,
  onClose,
  onSubmit,
}: {
  mode: "new" | "edit";
  nomInitial?: string;
  descriptionInitiale?: string;
  sectionNom?: string;
  onClose: () => void;
  onSubmit: (nom: string, description: string) => Promise<ActionResultat>;
}) {
  const [nom, setNom] = useState(nomInitial);
  const [description, setDescription] = useState(descriptionInitiale);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!nom.trim()) {
      setErreur("Le nom du poste est requis.");
      return;
    }
    setChargement(true);
    setErreur(null);
    const res = await onSubmit(nom, description);
    setChargement(false);
    if (res.ok) onClose();
    else setErreur(res.erreur);
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={mode === "new" ? "Nouveau poste" : "Modifier le poste"}
      subtitle={sectionNom ? `Section « ${sectionNom} »` : undefined}
    >
      <form onSubmit={submit} className="mt-3 flex flex-col gap-4" noValidate>
        <Field label="Nom du poste" htmlFor="poste-nom" error={erreur ?? undefined}>
          <Input
            id="poste-nom"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Ex : Bar"
            autoFocus
            maxLength={60}
            invalid={Boolean(erreur)}
          />
        </Field>
        <Field
          label="Description"
          htmlFor="poste-desc"
          hint="Optionnel — précisez le rôle attendu sur ce poste."
        >
          <Textarea
            id="poste-desc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={200}
            placeholder="Ex : Service au comptoir, encaissement"
          />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={chargement}>
            {chargement ? "Enregistrement…" : mode === "new" ? "Créer" : "Enregistrer"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/** Modale de confirmation de suppression. */
export function ConfirmDeleteModal({
  titre,
  message,
  confirmLabel = "Supprimer",
  onClose,
  onConfirm,
}: {
  titre: string;
  message: string;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: () => Promise<ActionResultat>;
}) {
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function confirmer() {
    setChargement(true);
    setErreur(null);
    const res = await onConfirm();
    setChargement(false);
    if (res.ok) onClose();
    else setErreur(res.erreur);
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
        <Button type="button" variant="secondary" onClick={onClose}>
          Annuler
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={confirmer}
          disabled={chargement}
        >
          {chargement ? "Suppression…" : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
