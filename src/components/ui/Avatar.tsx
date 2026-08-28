import { cn } from "@/lib/cn";

type Size = "xs" | "sm" | "md" | "lg";

const sizes: Record<Size, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-7 w-7 text-[11px]",
  md: "h-9 w-9 text-[12px]",
  lg: "h-14 w-14 text-[18px]",
};

/** Initiales à partir d'un nom complet (« Camille Morel » → « CM »). */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export interface AvatarProps {
  name: string;
  size?: Size;
  /** Sur fond sombre (sidebar) : cercle translucide clair. */
  onDark?: boolean;
  className?: string;
}

export function Avatar({ name, size = "md", onDark, className }: AvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex flex-none items-center justify-center rounded-full font-text font-semibold",
        onDark
          ? "bg-white/15 text-on-dark"
          : "border border-hairline bg-parchment text-ink",
        sizes[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
