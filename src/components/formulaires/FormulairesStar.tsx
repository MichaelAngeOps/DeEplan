import Link from "next/link";
import { ChevronRight, ClipboardList } from "lucide-react";
import { EmptyState } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { FormulaireStarResume } from "@/lib/data/formulaires";
import { dateFormulaire } from "@/lib/formulaires-shared";

function etat(f: FormulaireStarResume): { texte: string; classes: string } {
  if (f.dateReponse) return { texte: "Répondu", classes: "bg-success/10 text-success" };
  if (f.statut === "ferme") return { texte: "Fermé", classes: "bg-hairline text-ink-48" };
  return { texte: "À remplir", classes: "bg-accent/10 text-accent" };
}

export function FormulairesStar({ formulaires }: { formulaires: FormulaireStarResume[] }) {
  if (formulaires.length === 0) {
    return (
      <EmptyState
        className="mt-4 max-w-[560px]"
        icon={<ClipboardList size={22} />}
        message="Aucun formulaire pour le moment."
      />
    );
  }

  return (
    <div className="mt-4 flex max-w-[560px] flex-col gap-3">
      {formulaires.map((f) => {
        const e = etat(f);
        return (
          <Link
            key={f.id}
            href={`/star/formulaires/${f.id}`}
            className="flex items-center gap-3 rounded-lg border border-hairline bg-canvas p-4 transition-colors duration-fast ease-smooth hover:bg-parchment"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-caption-strong text-ink">{f.titre}</h3>
                <span
                  className={cn(
                    "inline-flex flex-none rounded-pill px-2.5 py-0.5 text-[11px] font-semibold",
                    e.classes,
                  )}
                >
                  {e.texte}
                </span>
              </div>
              <p className="mt-1 text-fine text-ink-48">
                {f.departementNom}
                {f.dateReponse
                  ? ` · Réponse du ${dateFormulaire(f.dateReponse)}`
                  : f.datePublication
                    ? ` · Publié le ${dateFormulaire(f.datePublication)}`
                    : ""}
              </p>
            </div>
            <ChevronRight size={16} className="flex-none text-ink-48" />
          </Link>
        );
      })}
    </div>
  );
}
