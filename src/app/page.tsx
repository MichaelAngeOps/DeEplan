import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="text-center">
        <h1 className="font-display text-dmd font-semibold text-ink">DeEplan</h1>
        <p className="mt-2 text-caption text-ink-48">
          Squelette Next.js 15 · TypeScript · Tailwind v3 — en cours de construction.
        </p>
      </div>

      {/* Liens temporaires vers les pages de vérification (Lot 0). */}
      <nav className="flex flex-wrap justify-center gap-3">
        <Link
          href="/design"
          className="rounded-pill border border-hairline bg-pearl px-4 py-2 text-caption-strong text-ink-80"
        >
          Design system (tokens)
        </Link>
        <Link
          href="/design/composants"
          className="rounded-pill border border-hairline bg-pearl px-4 py-2 text-caption-strong text-ink-80"
        >
          Composants UI
        </Link>
      </nav>
    </main>
  );
}
