import { Card } from "@/components/ui";

/** Placeholder — le vrai tableau de bord arrive au Lot 5. */
export default function DashboardPage() {
  return (
    <>
      <h1 className="font-display text-[28px] font-semibold leading-tight tracking-[-0.4px] text-ink">
        Tableau de bord
      </h1>
      <p className="mt-1 text-body text-ink-48">
        Espace Responsable — authentification en place (Lot 1a).
      </p>
      <Card className="mt-8 max-w-container-text">
        <p className="text-caption text-ink-48">
          Le contenu (stars de service, alertes, comptes en attente) sera
          développé aux lots suivants.
        </p>
      </Card>
    </>
  );
}
