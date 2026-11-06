import { Skeleton } from "@/components/ui";

export default function Chargement() {
  return (
    <div className="flex max-w-[640px] flex-col gap-4" aria-busy="true" aria-label="Chargement">
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-28 w-full" />
    </div>
  );
}
