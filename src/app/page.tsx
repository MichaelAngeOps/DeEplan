import Link from "next/link";
import { LogoMark } from "@/components/Logo";

export default function AccueilPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-parchment px-5 py-10 text-ink">
      <div className="w-full max-w-[420px] text-center">
        <LogoMark width={48} height={48} className="mx-auto mb-5 text-ink" />
        <h1 className="font-display text-[26px] font-semibold tracking-[-0.4px] text-ink">
          DeEplan
        </h1>
        <p className="mt-2 text-caption font-medium text-accent">
          Le planning d&apos;équipe, simplifié.
        </p>
        <p className="mt-5 text-caption leading-relaxed text-ink-80">
          Un responsable planifie les shifts de son équipe chaque mois, poste par
          poste. Les stars soumettent leurs disponibilités et consultent leur
          planning en temps réel.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/login"
            className="w-full rounded-pill bg-accent px-5 py-3 text-[14px] font-semibold text-white transition duration-fast ease-smooth active:scale-press"
          >
            Se connecter
          </Link>
          <Link
            href="/inscription"
            className="w-full rounded-pill border border-hairline bg-pearl px-5 py-3 text-[14px] font-semibold text-ink-80 transition duration-fast ease-smooth active:scale-press"
          >
            Créer un compte
          </Link>
        </div>
      </div>
    </main>
  );
}
