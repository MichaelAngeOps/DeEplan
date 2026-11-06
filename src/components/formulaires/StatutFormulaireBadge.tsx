import { cn } from "@/lib/cn";
import { LIBELLE_STATUT } from "@/lib/formulaires-shared";
import type { StatutFormulaire } from "@/types/domain";

const COULEURS: Record<StatutFormulaire, string> = {
  brouillon: "bg-parchment text-ink-80",
  publie: "bg-accent/10 text-accent",
  ferme: "bg-hairline text-ink-48",
};

export function StatutFormulaireBadge({ statut }: { statut: StatutFormulaire }) {
  return (
    <span
      className={cn(
        "inline-flex flex-none items-center rounded-pill px-2.5 py-0.5 text-[11px] font-semibold",
        COULEURS[statut],
      )}
    >
      {LIBELLE_STATUT[statut]}
    </span>
  );
}
