import { Card } from "@/components/ui";

/** Placeholder — le vrai calendrier arrive au Lot 5. */
export default function CalendrierPage() {
  return (
    <>
      <h2 className="font-display text-[20px] font-semibold tracking-[-0.3px] text-ink">
        Mon calendrier
      </h2>
      <p className="mt-1 text-caption text-ink-48">
        Espace Star — authentification en place (Lot 1a).
      </p>
      <Card className="mt-4">
        <p className="text-caption text-ink-48">
          Le calendrier des shifts sera développé aux lots suivants.
        </p>
      </Card>
    </>
  );
}
