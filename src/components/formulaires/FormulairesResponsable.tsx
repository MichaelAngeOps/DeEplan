import Link from "next/link";
import { ChevronRight, ClipboardList, Plus } from "lucide-react";
import { EmptyState } from "@/components/ui";
import { dateFormulaire } from "@/lib/formulaires-shared";
import type { FormulaireResume } from "@/lib/data/formulaires";
import { StatutFormulaireBadge } from "./StatutFormulaireBadge";

function pluriel(n: number, mot: string): string {
  return `${n} ${mot}${n > 1 ? "s" : ""}`;
}

export function FormulairesResponsable({
  formulaires,
}: {
  formulaires: FormulaireResume[];
}) {
  return (
    <section className="mt-10 max-w-[760px]">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-[20px] font-semibold tracking-[-0.3px] text-ink">
            Formulaires à remplir
          </h2>
          <p className="mt-1 text-caption text-ink-48">
            Posez des questions à toutes les stars du département.
          </p>
        </div>
        <Link
          href="/responsable/annonces/formulaires/nouveau"
          className="inline-flex flex-none items-center gap-xs rounded-pill bg-accent px-4 py-2 text-[12.5px] font-semibold text-white transition duration-fast ease-smooth active:scale-press"
        >
          <Plus size={14} />
          Créer un formulaire
        </Link>
      </div>

      {formulaires.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={22} />}
          message="Aucun formulaire pour le moment."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {formulaires.map((f) => (
            <Link
              key={f.id}
              href={`/responsable/annonces/formulaires/${f.id}`}
              className="flex items-center gap-4 rounded-lg border border-hairline bg-canvas p-5 transition-colors duration-fast ease-smooth hover:bg-parchment"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-caption-strong text-ink">{f.titre}</h3>
                  <StatutFormulaireBadge statut={f.statut} />
                </div>
                <p className="mt-1 text-fine text-ink-48">
                  {pluriel(f.nbQuestions, "question")}
                  {f.statut !== "brouillon" &&
                    ` · ${pluriel(f.nbReponses, "réponse")}`}
                  {" · "}
                  {f.datePublication
                    ? `Publié le ${dateFormulaire(f.datePublication)}`
                    : `Créé le ${dateFormulaire(f.dateCreation)}`}
                </p>
              </div>
              <ChevronRight size={16} className="flex-none text-ink-48" />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
