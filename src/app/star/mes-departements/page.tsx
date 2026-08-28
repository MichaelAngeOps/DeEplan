import Link from "next/link";
import { Building2, Plus } from "lucide-react";
import { getAcces } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/cn";
import type { StatutDemande } from "@/types/domain";

export const metadata = { title: "Mes départements — DeEplan" };

const ETIQUETTE: Record<StatutDemande, { label: string; cls: string }> = {
  valide: { label: "Actif", cls: "bg-success/10 text-success" },
  en_attente: { label: "En attente de validation", cls: "bg-warning/10 text-warning" },
  refuse: { label: "Refusé", cls: "bg-danger/10 text-danger" },
};

export default async function MesDepartementsPage() {
  const acces = await getAcces();
  const demandes = acces?.star?.departements ?? [];

  const supabase = await createClient();
  const { data: tous } = await supabase.from("departements").select("id, nom");
  const nom = new Map((tous ?? []).map((d) => [d.id, d.nom]));

  const actifs = new Set(demandes.filter((d) => d.statut !== "refuse").map((d) => d.id));
  const peutRejoindre = (tous ?? []).some((d) => !actifs.has(d.id));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-[20px] font-semibold tracking-[-0.3px] text-ink">
          Mes départements
        </h2>
        {peutRejoindre && (
          <Link
            href="/choisir-departement"
            className="inline-flex items-center gap-1.5 rounded-pill bg-accent px-4 py-2 text-[12.5px] font-semibold text-white"
          >
            <Plus size={14} />
            Rejoindre un département
          </Link>
        )}
      </div>

      {demandes.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-hairline px-6 py-10 text-center text-caption text-ink-48">
          Vous n&apos;êtes rattaché à aucun département.
        </p>
      ) : (
        <div className="mt-4 flex max-w-[520px] flex-col gap-2">
          {demandes.map((d) => {
            const e = ETIQUETTE[d.statut];
            return (
              <div
                key={d.id}
                className="flex items-center gap-3 rounded-lg border border-hairline bg-canvas p-4"
              >
                <Building2 size={16} className="flex-none text-ink-48" />
                <span className="flex-1 text-caption-strong text-ink">
                  {nom.get(d.id) ?? "Département"}
                </span>
                <span
                  className={cn(
                    "rounded-pill px-2 py-0.5 text-[10.5px] font-semibold",
                    e.cls,
                  )}
                >
                  {e.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
