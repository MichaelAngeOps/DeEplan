import { cn } from "@/lib/cn";

export interface SkeletonProps {
  className?: string;
}

/** Bloc de contenu en attente (convention états de chargement, prompt §4). */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <span
      aria-hidden
      className={cn("block animate-pulse rounded-sm bg-parchment", className)}
    />
  );
}
