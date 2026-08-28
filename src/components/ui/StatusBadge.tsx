import { cn } from "@/lib/cn";
import type { StatutShift } from "@/types/domain";

/** Statut affichable = statut de shift + « pas en service » (absence de shift). */
export type StatutAffichage = StatutShift | "pas_en_service";

const STYLES: Record<
  StatutAffichage,
  { label: string; className: string; dot: string }
> = {
  pas_en_service: {
    label: "Pas en service",
    className: "text-ink-48 bg-transparent",
    dot: "bg-hairline",
  },
  de_service: {
    label: "De service",
    className: "text-accent bg-accent/10",
    dot: "bg-accent",
  },
  a_servi: {
    label: "A servi",
    className: "text-success bg-success/10",
    dot: "bg-success",
  },
  na_pas_servi: {
    label: "N'a pas servi",
    className: "text-danger bg-danger/10",
    dot: "bg-danger",
  },
  a_confirmer: {
    label: "À confirmer",
    className: "text-warning bg-warning/10",
    dot: "bg-warning",
  },
};

export const STATUT_LABELS = Object.fromEntries(
  Object.entries(STYLES).map(([k, v]) => [k, v.label]),
) as Record<StatutAffichage, string>;

export interface StatusBadgeProps {
  statut: StatutAffichage;
  /** Style : `chip` (fond teinté) ou `dot` (pastille + libellé). */
  variant?: "chip" | "dot";
  className?: string;
}

export function StatusBadge({
  statut,
  variant = "chip",
  className,
}: StatusBadgeProps) {
  const s = STYLES[statut];

  if (variant === "dot") {
    return (
      <span
        className={cn("inline-flex items-center gap-1.5 text-fine text-ink-48", className)}
      >
        <span className={cn("h-2 w-2 rounded-full", s.dot)} />
        {s.label}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-xs px-2 py-0.5 text-[10.5px] font-semibold",
        s.className,
        className,
      )}
    >
      {s.label}
    </span>
  );
}
