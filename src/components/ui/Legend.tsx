import { cn } from "@/lib/cn";

export interface LegendItem {
  /** Classe de couleur de la pastille (ex. `bg-success`, `bg-accent`). */
  dotClassName: string;
  label: string;
}

export interface LegendProps {
  items: LegendItem[];
  className?: string;
}

export function Legend({ items, className }: LegendProps) {
  return (
    <div className={cn("flex flex-wrap gap-x-3.5 gap-y-2", className)}>
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-1.5">
          <span className={cn("h-2.5 w-2.5 rounded-full", it.dotClassName)} />
          <span className="text-fine text-ink-48">{it.label}</span>
        </span>
      ))}
    </div>
  );
}
