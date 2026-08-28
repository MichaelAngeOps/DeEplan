import { ResponsableShell } from "@/components/layout";
import { Card } from "@/components/ui";

export default function ResponsableShellPreview() {
  return (
    <ResponsableShell user={{ name: "Camille Morel", role: "Responsable" }}>
      <h1 className="font-display text-[28px] font-semibold leading-tight tracking-[-0.4px] text-ink">
        Tableau de bord
      </h1>
      <p className="mt-1 text-body text-ink-48">Contenu factice — prévisualisation du shell.</p>
      <div className="mt-8 grid gap-7 lg:grid-cols-[1.4fr_1fr]">
        <Card title="Colonne principale">
          <p className="text-caption text-ink-48">…</p>
        </Card>
        <Card title="Colonne latérale">
          <p className="text-caption text-ink-48">…</p>
        </Card>
      </div>
    </ResponsableShell>
  );
}
