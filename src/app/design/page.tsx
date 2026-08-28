import { LogoMark, LogoWordmark } from "@/components/Logo";

/**
 * Page temporaire de vérification du design system (étape D).
 * À supprimer quand le vrai layout applicatif sera en place.
 */

const colors: { name: string; className: string; hex: string }[] = [
  { name: "accent", className: "bg-accent", hex: "#1668e3" },
  { name: "accent-focus", className: "bg-accent-focus", hex: "#2a78f0" },
  { name: "accent-on-dark", className: "bg-accent-on-dark", hex: "#4d9bff" },
  { name: "ink", className: "bg-ink", hex: "#18181a" },
  { name: "ink-80", className: "bg-ink-80", hex: "#313134" },
  { name: "ink-48", className: "bg-ink-48", hex: "#7b7b80" },
  { name: "canvas", className: "bg-canvas", hex: "#ffffff" },
  { name: "parchment", className: "bg-parchment", hex: "#f5f5f7" },
  { name: "pearl", className: "bg-pearl", hex: "#fafafc" },
  { name: "tile-1", className: "bg-tile-1", hex: "#1f1f21" },
  { name: "tile-2", className: "bg-tile-2", hex: "#242427" },
  { name: "tile-3", className: "bg-tile-3", hex: "#1b1b1d" },
  { name: "hairline", className: "bg-hairline", hex: "#e2e2e6" },
];

const typeScale = [
  { cls: "text-hero", label: "hero — 56 / 600" },
  { cls: "text-dlg", label: "dlg — 40 / 600" },
  { cls: "text-dmd", label: "dmd — 34 / 600" },
  { cls: "text-lead", label: "lead — 28 / 400" },
  { cls: "text-airy", label: "airy — 24 / 300" },
  { cls: "text-tag", label: "tag — 21 / 600" },
  { cls: "text-body-strong", label: "body-strong — 17 / 600" },
  { cls: "text-body", label: "body — 17 / 400" },
  { cls: "text-caption", label: "caption — 14 / 400" },
  { cls: "text-fine", label: "fine — 12 / 400" },
  { cls: "text-micro", label: "micro — 10 / 400" },
];

// Classes littérales (le scanner JIT de Tailwind ne voit pas les noms construits).
const radii = [
  { cls: "rounded-xs", label: "rounded-xs" },
  { cls: "rounded-sm", label: "rounded-sm" },
  { cls: "rounded-md", label: "rounded-md" },
  { cls: "rounded-lg", label: "rounded-lg" },
  { cls: "rounded-pill", label: "rounded-pill" },
];

export default function DesignPage() {
  return (
    <main className="mx-auto max-w-container-grid px-xl py-xxl">
      <h1 className="text-dlg text-ink">DeEplan — Design system</h1>
      <p className="text-body text-ink-48 mt-xs">
        Vérification visuelle (étape D). Tokens issus de{" "}
        <code className="t-mono">maquette/colors_and_type.css</code>.
      </p>

      <section className="mt-xxl">
        <h2 className="text-tag text-ink">Logos</h2>
        <div className="mt-md flex items-center gap-xl">
          <div className="text-ink">
            <LogoMark />
          </div>
          <div className="rounded-md bg-tile-1 px-lg py-md text-on-dark">
            <LogoWordmark />
          </div>
        </div>
      </section>

      <section className="mt-xxl">
        <h2 className="text-tag text-ink">Couleurs</h2>
        <div className="mt-md grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-sm">
          {colors.map((c) => (
            <div key={c.name} className="rounded-sm border border-hairline overflow-hidden">
              <div className={`${c.className} h-16 w-full`} />
              <div className="bg-canvas px-sm py-xs">
                <div className="text-caption-strong text-ink">{c.name}</div>
                <div className="text-fine text-ink-48">{c.hex}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-xxl">
        <h2 className="text-tag text-ink">Échelle typographique</h2>
        <div className="mt-md space-y-sm">
          {typeScale.map((t) => (
            <div key={t.cls} className="flex items-baseline gap-lg">
              <span className={`${t.cls} text-ink`}>Planning d&apos;équipe</span>
              <span className="text-fine text-ink-48">{t.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-xxl">
        <h2 className="text-tag text-ink">Rayons &amp; ombre</h2>
        <div className="mt-md flex flex-wrap items-end gap-lg">
          {radii.map((r) => (
            <div key={r.cls} className="text-center">
              <div className={`h-20 w-20 bg-accent ${r.cls}`} />
              <div className="text-fine text-ink-48 mt-xs">{r.label}</div>
            </div>
          ))}
          <div className="text-center">
            <div className="h-20 w-20 bg-canvas rounded-md shadow-product" />
            <div className="text-fine text-ink-48 mt-xs">shadow-product</div>
          </div>
        </div>
      </section>

      <section className="mt-xxl">
        <h2 className="text-tag text-ink">Boutons (aperçu)</h2>
        <div className="mt-md flex flex-wrap gap-sm">
          <button className="rounded-pill bg-accent px-lg py-sm text-caption-strong text-on-dark transition duration-fast ease-smooth active:scale-press">
            Action principale
          </button>
          <button className="rounded-pill border border-hairline bg-pearl px-lg py-sm text-caption-strong text-ink transition duration-fast ease-smooth active:scale-press">
            Action secondaire
          </button>
        </div>
      </section>
    </main>
  );
}
