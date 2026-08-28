"use client";

import { Briefcase, ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { IconButton } from "@/components/ui";
import type { SectionAvecPostes } from "@/types/domain";

export function SectionCard({
  section,
  expanded,
  onToggle,
  onEditSection,
  onDeleteSection,
  onAddPoste,
  onEditPoste,
  onDeletePoste,
}: {
  section: SectionAvecPostes;
  expanded: boolean;
  onToggle: () => void;
  onEditSection: () => void;
  onDeleteSection: () => void;
  onAddPoste: () => void;
  onEditPoste: (posteId: string) => void;
  onDeletePoste: (posteId: string) => void;
}) {
  const nb = section.postes.length;

  return (
    <div className="overflow-hidden rounded-lg border border-hairline bg-canvas">
      <div className="flex items-center gap-2.5 px-[18px] py-3.5">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={expanded ? "Replier la section" : "Déplier la section"}
          className="flex-none text-ink-48 transition-colors hover:text-ink"
        >
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        <span className="flex-1 font-display text-[15px] font-semibold tracking-[-0.2px] text-ink">
          {section.nom}
        </span>
        <span className="text-fine text-ink-48">
          {nb} poste{nb > 1 ? "s" : ""}
        </span>
        <div className="flex gap-1">
          <IconButton
            size="sm"
            label="Renommer la section"
            onClick={onEditSection}
            icon={<Pencil size={15} />}
          />
          <IconButton
            size="sm"
            label="Supprimer la section"
            onClick={onDeleteSection}
            icon={<Trash2 size={15} />}
          />
        </div>
      </div>

      {expanded && (
        <div className="border-t border-hairline bg-parchment">
          {section.postes.map((poste) => (
            <div
              key={poste.id}
              className="flex items-center gap-2.5 border-b border-hairline py-2.5 pl-11 pr-[18px]"
            >
              <Briefcase size={14} className="flex-none text-ink-48" />
              <span className="flex-1">
                <span className="block text-caption text-ink">{poste.nom}</span>
                {poste.description && (
                  <span className="block text-fine text-ink-48">
                    {poste.description}
                  </span>
                )}
              </span>
              <div className="flex gap-1">
                <IconButton
                  size="sm"
                  label="Modifier le poste"
                  onClick={() => onEditPoste(poste.id)}
                  icon={<Pencil size={14} />}
                />
                <IconButton
                  size="sm"
                  label="Supprimer le poste"
                  onClick={() => onDeletePoste(poste.id)}
                  icon={<Trash2 size={14} />}
                />
              </div>
            </div>
          ))}

          {nb === 0 && (
            <p className="border-b border-hairline py-2.5 pl-11 pr-[18px] text-fine text-ink-48">
              Aucun poste dans cette section.
            </p>
          )}

          <div className="py-2.5 pl-11 pr-[18px]">
            <button
              type="button"
              onClick={onAddPoste}
              className="inline-flex items-center gap-1.5 rounded-pill border border-dashed border-hairline px-3.5 py-1.5 text-[12px] font-semibold text-accent transition-colors hover:bg-canvas"
            >
              <Plus size={13} />
              Ajouter un poste
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
