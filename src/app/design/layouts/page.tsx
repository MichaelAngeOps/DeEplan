import Link from "next/link";

/** Index des prévisualisations de layout (Lot 0b, temporaire). */
export default function LayoutsIndex() {
  const links = [
    { href: "/design/layouts/auth", label: "AuthShell", desc: "Écrans de connexion / inscription (responsive)" },
    { href: "/design/layouts/responsable", label: "ResponsableShell", desc: "Sidebar 248px + contenu" },
    { href: "/design/layouts/star", label: "StarShell", desc: "Sidebar desktop / header + tab bar mobile (réduire la fenêtre)" },
  ];
  return (
    <main className="mx-auto max-w-container-text px-xl py-xxl">
      <h1 className="font-display text-dlg font-semibold text-ink">Layouts — Lot 0b</h1>
      <p className="mt-xs text-body text-ink-48">Prévisualisations avec données factices.</p>
      <div className="mt-xl flex flex-col gap-3">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-lg border border-hairline bg-canvas p-5 transition-colors hover:border-accent"
          >
            <div className="font-display text-[17px] font-semibold text-ink">{l.label}</div>
            <div className="mt-1 text-caption text-ink-48">{l.desc}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
