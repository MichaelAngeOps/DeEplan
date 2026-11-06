"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { fermerFormulaire } from "@/lib/actions/formulaires";
import type { FormulaireDetail } from "@/lib/data/formulaires";
import { LIBELLE_TYPE, dateFormulaire, estTypeChoix } from "@/lib/formulaires-shared";
import { ConfirmationModal } from "./ConfirmationModal";
import { StatutFormulaireBadge } from "./StatutFormulaireBadge";

export function FormulaireDetailResponsable({
  formulaire,
}: {
  formulaire: FormulaireDetail;
}) {
  const [confirmer, setConfirmer] = useState(false);

  return (
    <div className="max-w-[760px]">
      <Link
        href="/responsable/annonces"
        className="flex items-center gap-1.5 text-fine font-semibold text-ink-48"
      >
        <ChevronLeft size={15} />
        Retour aux annonces
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-[28px] font-semibold leading-tight tracking-[-0.4px] text-ink">
              {formulaire.titre}
            </h1>
            <StatutFormulaireBadge statut={formulaire.statut} />
          </div>
          <p className="mt-1 text-caption text-ink-48">
            {formulaire.datePublication &&
              `Publié le ${dateFormulaire(formulaire.datePublication)}`}
            {formulaire.dateFermeture &&
              ` · Fermé le ${dateFormulaire(formulaire.dateFermeture)}`}
          </p>
        </div>
        {formulaire.statut === "publie" && (
          <Button variant="danger" onClick={() => setConfirmer(true)}>
            Fermer le formulaire
          </Button>
        )}
      </div>

      {formulaire.description && (
        <p className="mt-4 whitespace-pre-wrap text-caption text-ink-80">
          {formulaire.description}
        </p>
      )}

      <Card className="mt-6" title="Réponses reçues">
        <p className="font-display text-[32px] font-semibold tracking-[-0.3px] text-accent">
          {formulaire.nbReponses}
        </p>
      </Card>

      <Card className="mt-5" title={`Questions (${formulaire.questions.length})`}>
        <ol className="flex flex-col">
          {formulaire.questions.map((q, i) => (
            <li key={q.id} className="border-b border-hairline py-3 last:border-0">
              <p className="text-caption-strong text-ink">
                {i + 1}. {q.libelle}
                {q.obligatoire && <span className="text-danger"> *</span>}
              </p>
              <p className="mt-0.5 text-fine text-ink-48">{LIBELLE_TYPE[q.type]}</p>
              {estTypeChoix(q.type) && (
                <ul className="mt-1.5 list-disc pl-5 text-caption text-ink-80">
                  {q.options.map((o) => (
                    <li key={o}>{o}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </Card>

      {confirmer && (
        <ConfirmationModal
          titre="Fermer le formulaire"
          message="Les stars ne pourront plus répondre ni modifier leurs réponses. Cette action est définitive, et les réponses reçues restent consultables."
          confirmLabel="Fermer le formulaire"
          enCoursLabel="Fermeture…"
          danger
          onClose={() => setConfirmer(false)}
          onConfirm={async () => {
            const res = await fermerFormulaire(formulaire.id);
            if (!res.ok) return res.erreur;
            setConfirmer(false);
            return null;
          }}
        />
      )}
    </div>
  );
}
