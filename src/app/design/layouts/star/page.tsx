import { StarShell } from "@/components/layout";
import { Card } from "@/components/ui";

export default function StarShellPreview() {
  return (
    <StarShell user={{ name: "Nora Haddad", role: "Star" }} mobileTitle="Mon calendrier">
      <h2 className="font-display text-[20px] font-semibold tracking-[-0.3px] text-ink">
        Mon calendrier
      </h2>
      <p className="mt-1 text-caption text-ink-48">
        Réduire la fenêtre sous ~768px pour voir le header + la tab bar mobile.
      </p>
      <Card className="mt-4">
        <p className="text-caption text-ink-48">Contenu factice.</p>
      </Card>
    </StarShell>
  );
}
