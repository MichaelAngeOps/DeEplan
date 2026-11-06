"use client";

import { startTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui";
import { journaliserErreur } from "@/lib/journal";

export interface ErreurPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/** Message affiché lorsqu'un écran échoue. La référence retrouve l'erreur dans les journaux Vercel. */
export function BlocErreur({ error, reset }: ErreurPageProps) {
  const router = useRouter();

  useEffect(() => {
    journaliserErreur("ecran", error);
  }, [error]);

  function reessayer() {
    // `reset` seul ne relance pas les données chargées côté serveur.
    startTransition(() => {
      router.refresh();
      reset();
    });
  }

  return (
    <div role="alert" className="flex flex-col items-center gap-3 py-10 text-center">
      <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-parchment">
        <AlertTriangle size={24} className="text-danger" />
      </span>
      <h1 className="font-display text-[20px] font-semibold tracking-[-0.3px] text-ink">
        Cette page n&apos;a pas pu s&apos;afficher
      </h1>
      <p className="max-w-[420px] text-caption text-ink-80">
        Réessayez dans un instant. Si le problème continue, transmettez la référence ci-dessous à
        votre responsable.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <Button onClick={reessayer}>Réessayer</Button>
        <Link
          href="/apres-login"
          className="rounded-pill border border-hairline bg-pearl px-4 py-2 text-[12.5px] font-semibold text-ink-80"
        >
          Retour à mon espace
        </Link>
      </div>
      {error.digest && <p className="mt-2 text-fine text-ink-48">Référence : {error.digest}</p>}
    </div>
  );
}
