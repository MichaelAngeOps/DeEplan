import Link from "next/link";
import { SearchX } from "lucide-react";
import { AuthShell } from "@/components/layout/AuthShell";

export default function PageIntrouvable() {
  return (
    <AuthShell>
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-parchment">
          <SearchX size={24} className="text-accent" />
        </span>
        <h1 className="font-display text-[20px] font-semibold tracking-[-0.3px] text-ink">
          Page introuvable
        </h1>
        <p className="text-caption text-ink-80">
          Cette page n&apos;existe pas ou n&apos;est plus disponible.
        </p>
        <Link
          href="/apres-login"
          className="mt-2 rounded-pill bg-accent px-5 py-2.5 text-[13px] font-semibold text-white"
        >
          Retour à mon espace
        </Link>
      </div>
    </AuthShell>
  );
}
