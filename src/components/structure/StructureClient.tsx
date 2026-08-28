"use client";

import { useMemo, useState } from "react";
import { FolderTree, Plus } from "lucide-react";
import { Button, EmptyState } from "@/components/ui";
import {
  creerPoste,
  creerSection,
  modifierPoste,
  renommerSection,
  supprimerPoste,
  supprimerSection,
} from "@/lib/actions/structure";
import type { SectionAvecPostes } from "@/types/domain";
import { SectionCard } from "./SectionCard";
import {
  ConfirmDeleteModal,
  PosteFormModal,
  SectionFormModal,
} from "./StructureModals";

type Modal =
  | { type: "section-new" }
  | { type: "section-edit"; id: string; nom: string }
  | { type: "section-delete"; id: string; nom: string; nbPostes: number }
  | { type: "poste-new"; sectionId: string; sectionNom: string }
  | {
      type: "poste-edit";
      id: string;
      nom: string;
      description: string;
      sectionNom: string;
    }
  | { type: "poste-delete"; id: string; nom: string }
  | null;

export function StructureClient({
  sections,
}: {
  sections: SectionAvecPostes[];
}) {
  const [modal, setModal] = useState<Modal>(null);
  const [replie, setReplie] = useState<Set<string>>(new Set());

  const fermer = () => setModal(null);

  const posteParId = useMemo(() => {
    const m = new Map<
      string,
      { nom: string; description: string; sectionNom: string }
    >();
    for (const s of sections)
      for (const p of s.postes)
        m.set(p.id, {
          nom: p.nom,
          description: p.description ?? "",
          sectionNom: s.nom,
        });
    return m;
  }, [sections]);

  function toggle(id: string) {
    setReplie((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] font-semibold leading-tight tracking-[-0.4px] text-ink">
            Structure du département
          </h1>
          <p className="mt-1 text-body text-ink-48">
            Organisez vos sections et les postes qui les composent.
          </p>
        </div>
        <Button
          leftIcon={<Plus size={14} />}
          onClick={() => setModal({ type: "section-new" })}
        >
          Nouvelle section
        </Button>
      </div>

      {sections.length === 0 ? (
        <EmptyState
          className="max-w-[820px]"
          icon={<FolderTree size={22} />}
          title="Aucune section"
          message="Créez une première section pour commencer à structurer votre département."
          action={
            <Button
              leftIcon={<Plus size={14} />}
              onClick={() => setModal({ type: "section-new" })}
            >
              Nouvelle section
            </Button>
          }
        />
      ) : (
        <div className="flex max-w-[820px] flex-col gap-3">
          {sections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              expanded={!replie.has(section.id)}
              onToggle={() => toggle(section.id)}
              onEditSection={() =>
                setModal({
                  type: "section-edit",
                  id: section.id,
                  nom: section.nom,
                })
              }
              onDeleteSection={() =>
                setModal({
                  type: "section-delete",
                  id: section.id,
                  nom: section.nom,
                  nbPostes: section.postes.length,
                })
              }
              onAddPoste={() =>
                setModal({
                  type: "poste-new",
                  sectionId: section.id,
                  sectionNom: section.nom,
                })
              }
              onEditPoste={(posteId) => {
                const p = posteParId.get(posteId);
                if (p)
                  setModal({
                    type: "poste-edit",
                    id: posteId,
                    nom: p.nom,
                    description: p.description,
                    sectionNom: p.sectionNom,
                  });
              }}
              onDeletePoste={(posteId) => {
                const p = posteParId.get(posteId);
                if (p)
                  setModal({ type: "poste-delete", id: posteId, nom: p.nom });
              }}
            />
          ))}
        </div>
      )}

      {modal?.type === "section-new" && (
        <SectionFormModal
          mode="new"
          onClose={fermer}
          onSubmit={(nom) => creerSection(nom)}
        />
      )}

      {modal?.type === "section-edit" && (
        <SectionFormModal
          mode="edit"
          valeurInitiale={modal.nom}
          onClose={fermer}
          onSubmit={(nom) => renommerSection(modal.id, nom)}
        />
      )}

      {modal?.type === "section-delete" && (
        <ConfirmDeleteModal
          titre="Supprimer la section"
          message={
            modal.nbPostes === 0
              ? `La section « ${modal.nom} » sera supprimée.`
              : `La section « ${modal.nom} » et ses ${modal.nbPostes} poste${
                  modal.nbPostes > 1 ? "s" : ""
                } seront supprimés. Cette action est irréversible.`
          }
          onClose={fermer}
          onConfirm={() => supprimerSection(modal.id)}
        />
      )}

      {modal?.type === "poste-new" && (
        <PosteFormModal
          mode="new"
          sectionNom={modal.sectionNom}
          onClose={fermer}
          onSubmit={(nom, description) =>
            creerPoste(modal.sectionId, nom, description)
          }
        />
      )}

      {modal?.type === "poste-edit" && (
        <PosteFormModal
          mode="edit"
          nomInitial={modal.nom}
          descriptionInitiale={modal.description}
          sectionNom={modal.sectionNom}
          onClose={fermer}
          onSubmit={(nom, description) =>
            modifierPoste(modal.id, nom, description)
          }
        />
      )}

      {modal?.type === "poste-delete" && (
        <ConfirmDeleteModal
          titre="Supprimer le poste"
          message={`Le poste « ${modal.nom} » sera supprimé.`}
          onClose={fermer}
          onConfirm={() => supprimerPoste(modal.id)}
        />
      )}
    </>
  );
}
