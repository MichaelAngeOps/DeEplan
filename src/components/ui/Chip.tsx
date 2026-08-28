import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface ChipProps {
  children: ReactNode;
  /** Rend le chip interactif (bouton) et applique l'état sélectionné. */
  selected?: boolean;
  onToggle?: () => void;
  leftIcon?: ReactNode;
  className?: string;
}

export function Chip({
  children,
  selected,
  onToggle,
  leftIcon,
  className,
}: ChipProps) {
  const classes = cn(
    "inline-flex items-center gap-1.5 rounded-pill px-3.5 py-1.5 text-fine font-semibold font-text",
    selected
      ? "border border-accent bg-accent text-white"
      : "border border-transparent bg-parchment text-ink-80",
    onToggle && "cursor-pointer transition duration-fast ease-smooth active:scale-press",
    className,
  );

  if (onToggle) {
    return (
      <button type="button" aria-pressed={selected} onClick={onToggle} className={classes}>
        {leftIcon}
        {children}
      </button>
    );
  }

  return (
    <span className={classes}>
      {leftIcon}
      {children}
    </span>
  );
}
