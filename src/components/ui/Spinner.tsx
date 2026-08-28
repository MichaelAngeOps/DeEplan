import { cn } from "@/lib/cn";

type Size = "sm" | "md" | "lg";

const sizes: Record<Size, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-[3px]",
};

export interface SpinnerProps {
  size?: Size;
  label?: string;
  className?: string;
}

/** Indicateur de chargement (convention états de chargement, prompt §4). */
export function Spinner({ size = "md", label = "Chargement…", className }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-block animate-spin rounded-full border-hairline border-t-accent",
        sizes[size],
        className,
      )}
    />
  );
}
