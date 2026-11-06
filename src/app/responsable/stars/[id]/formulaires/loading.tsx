import { Skeleton } from "@/components/ui";

export default function Chargement() {
  return (
    <div className="flex max-w-[760px] flex-col gap-4" aria-busy="true" aria-label="Chargement">
      <Skeleton className="h-9 w-2/3" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
