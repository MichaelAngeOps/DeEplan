"use client";

import { useEffect } from "react";
import { journaliserErreur } from "@/lib/journal";
import "./globals.css";

/** Dernier recours, si la mise en page racine elle-même échoue. Remplace tout le document. */
export default function ErreurRacine({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    journaliserErreur("racine", error);
  }, [error]);

  return (
    <html lang="fr">
      <body>
        <main
          role="alert"
          className="flex min-h-screen flex-col items-center justify-center gap-3 bg-parchment px-5 text-center text-ink"
        >
          <h1 className="text-[20px] font-semibold">DeEplan n&apos;a pas pu s&apos;afficher</h1>
          <p className="text-caption text-ink-80">Rechargez la page dans un instant.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-2 rounded-pill bg-accent px-5 py-2.5 text-[13px] font-semibold text-white"
          >
            Recharger
          </button>
          {error.digest && <p className="mt-2 text-fine text-ink-48">Référence : {error.digest}</p>}
        </main>
      </body>
    </html>
  );
}
