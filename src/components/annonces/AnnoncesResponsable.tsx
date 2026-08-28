"use client";

import { useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button, EmptyState, Field, IconButton, Input, Modal, Textarea } from "@/components/ui";
import { ConfirmDeleteModal } from "@/components/structure/StructureModals";
import {
  creerAnnonce,
  modifierAnnonce,
  supprimerAnnonce,
} from "@/lib/actions/annonces";
import type { Annonce } from "@/lib/data/annonces";

type Modale =
  | { type: "new" }
  | { type: "edit"; annonce: Annonce }
  | { type: "delete"; annonce: Annonce }
  | null;

function dateFr(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function AnnoncesResponsable({ annonces }: { annonces: Annonce[] }) {
  const [modale, setModale] = useState<Modale>(null);
  const fermer = () => setModale(null);

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] font-semibold leading-tight tracking-[-0.4px] text-ink">
            Annonces
          </h1>
          <p className="mt-1 text-body text-ink-48">
            Visibles par toutes les stars du département.
          </p>
        </div>
        <Button leftIcon={<Plus size={14} />} onClick={() => setModale({ type: "new" })}>
          Nouvelle annonce
        </Button>
      </div>

      {annonces.length === 0 ? (
        <EmptyState
          className="max-w-[760px]"
          message="Aucune annonce publiée pour le moment."
        />
      ) : (
        <div className="flex max-w-[760px] flex-col gap-3">
          {annonces.map((a) => (
            <article
              key={a.id}
              className="flex items-start gap-4 rounded-lg border border-hairline bg-canvas p-5"
            >
              <span className="w-[76px] flex-none pt-0.5 text-fine text-ink-48">
                {dateFr(a.date)}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-caption-strong text-ink">{a.titre}</h2>
                <p className="mt-1 whitespace-pre-wrap text-caption text-ink-48">
                  {a.contenu}
                </p>
              </div>
              <div className="flex flex-none gap-1">
                <IconButton
                  size="sm"
                  label="Modifier"
                  icon={<Pencil size={15} />}
                  onClick={() => setModale({ type: "edit", annonce: a })}
                />
                <IconButton
                  size="sm"
                  label="Supprimer"
                  icon={<Trash2 size={15} />}
                  onClick={() => setModale({ type: "delete", annonce: a })}
                />
              </div>
            </article>
          ))}
        </div>
      )}

      {modale?.type === "new" && (
        <EditeurAnnonce
          mode="new"
          onClose={fermer}
          onSubmit={(t, c) => creerAnnonce(t, c)}
        />
      )}
      {modale?.type === "edit" && (
        <EditeurAnnonce
          mode="edit"
          titreInitial={modale.annonce.titre}
          contenuInitial={modale.annonce.contenu}
          onClose={fermer}
          onSubmit={(t, c) => modifierAnnonce(modale.annonce.id, t, c)}
        />
      )}
      {modale?.type === "delete" && (
        <ConfirmDeleteModal
          titre="Supprimer l'annonce"
          message={`« ${modale.annonce.titre} » sera définitivement supprimée.`}
          onClose={fermer}
          onConfirm={() => supprimerAnnonce(modale.annonce.id)}
        />
      )}
    </>
  );
}

function EditeurAnnonce({
  mode,
  titreInitial = "",
  contenuInitial = "",
  onClose,
  onSubmit,
}: {
  mode: "new" | "edit";
  titreInitial?: string;
  contenuInitial?: string;
  onClose: () => void;
  onSubmit: (
    titre: string,
    contenu: string,
  ) => Promise<{ ok: true } | { ok: false; erreur: string }>;
}) {
  const [titre, setTitre] = useState(titreInitial);
  const [contenu, setContenu] = useState(contenuInitial);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!titre.trim() || !contenu.trim()) {
      setErreur("Titre et contenu sont requis.");
      return;
    }
    setEnCours(true);
    setErreur(null);
    const res = await onSubmit(titre, contenu);
    setEnCours(false);
    if (res.ok) onClose();
    else setErreur(res.erreur);
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={mode === "new" ? "Nouvelle annonce" : "Modifier l'annonce"}
    >
      <form onSubmit={submit} className="mt-3 flex flex-col gap-4" noValidate>
        <Field label="Titre" htmlFor="a-titre" error={erreur ?? undefined}>
          <Input
            id="a-titre"
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            placeholder="Titre de l'annonce"
            maxLength={120}
            autoFocus
          />
        </Field>
        <Field label="Contenu" htmlFor="a-contenu">
          <Textarea
            id="a-contenu"
            rows={5}
            value={contenu}
            onChange={(e) => setContenu(e.target.value)}
            placeholder="Rédigez le contenu de l'annonce"
            maxLength={5000}
          />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={enCours}>
            {enCours ? "Enregistrement…" : mode === "new" ? "Publier" : "Enregistrer"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
