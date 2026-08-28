"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button, EmptyState } from "@/components/ui";
import { cn } from "@/lib/cn";
import { refuserCompte, validerCompte } from "@/lib/actions/validations";
import type { CompteEnAttente } from "@/lib/data/validations";

interface SectionSimple {
  id: string;
  nom: string;
}

export function ValidationsClient({
  comptes,
  sections,
}: {
  comptes: CompteEnAttente[];
  sections: SectionSimple[];
}) {
  const [traites, setTraites] = useState<Set<string>>(new Set());

  const restants = comptes.filter((c) => !traites.has(c.id));

  if (restants.length === 0) {
    return (
      <EmptyState
        className="mt-6 max-w-[720px]"
        message="Aucun compte en attente."
      />
    );
  }

  return (
    <div className="mt-6 flex max-w-[720px] flex-col gap-4">
      {restants.map((compte) => (
        <CompteCard
          key={compte.id}
          compte={compte}
          sections={sections}
          onTraite={() =>
            setTraites((prev) => new Set(prev).add(compte.id))
          }
        />
      ))}
    </div>
  );
}

function CompteCard({
  compte,
  sections,
  onTraite,
}: {
  compte: CompteEnAttente;
  sections: SectionSimple[];
  onTraite: () => void;
}) {
  const [choisies, setChoisies] = useState<Set<string>>(new Set());
  const [erreur, setErreur] = useState<string | null>(null);
  const [action, setAction] = useState<"valider" | "refuser" | null>(null);

  function toggle(id: string) {
    setErreur(null);
    setChoisies((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function valider() {
    setAction("valider");
    setErreur(null);
    const res = await validerCompte(compte.id, [...choisies]);
    if (res.ok) onTraite();
    else {
      setErreur(res.erreur);
      setAction(null);
    }
  }

  async function refuser() {
    setAction("refuser");
    setErreur(null);
    const res = await refuserCompte(compte.id);
    if (res.ok) onTraite();
    else {
      setErreur(res.erreur);
      setAction(null);
    }
  }

  const dateFr = new Date(compte.dateInscription).toLocaleDateString("fr-FR");

  return (
    <div className="rounded-lg border border-hairline bg-canvas p-5">
      <p className="text-caption-strong text-ink">{compte.nom}</p>
      <p className="text-fine text-ink-48">
        {compte.email} · inscrit le {dateFr}
      </p>

      <p className="mb-2 mt-4 text-[12px] font-semibold text-ink-48">
        Assigner à une ou plusieurs sections
      </p>
      {sections.length === 0 ? (
        <p className="text-fine text-danger">
          Créez d&apos;abord des sections dans Structure.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {sections.map((s) => {
            const on = choisies.has(s.id);
            return (
              <label
                key={s.id}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-pill border px-3 py-1.5 text-[12px] font-semibold",
                  on
                    ? "border-accent bg-parchment text-ink"
                    : "border-hairline bg-canvas text-ink-48",
                )}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggle(s.id)}
                  className="h-3.5 w-3.5 accent-accent"
                />
                {s.nom}
              </label>
            );
          })}
        </div>
      )}

      {erreur && (
        <p role="alert" className="mt-3 text-caption text-danger">
          {erreur}
        </p>
      )}

      <div className="mt-4 flex gap-2.5">
        <Button
          size="sm"
          leftIcon={<Check size={14} />}
          onClick={valider}
          disabled={action !== null || sections.length === 0}
        >
          {action === "valider" ? "Validation…" : "Valider"}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          leftIcon={<X size={14} />}
          onClick={refuser}
          disabled={action !== null}
        >
          {action === "refuser" ? "Refus…" : "Refuser"}
        </Button>
      </div>
    </div>
  );
}
