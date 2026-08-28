"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, MailCheck } from "lucide-react";
import { AuthShell } from "@/components/layout";
import { Button, Field, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState("");
  const [envoye, setEnvoye] = useState(false);
  const [chargement, setChargement] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setChargement(true);

    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
        "/reinitialiser-mot-de-passe",
      )}`,
    });

    // Écran neutre quelle que soit l'existence du compte (pas de fuite d'info).
    setChargement(false);
    setEnvoye(true);
  }

  if (envoye) {
    return (
      <AuthShell>
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-parchment">
            <MailCheck size={24} className="text-accent" />
          </span>
          <h1 className="font-display text-[20px] font-semibold tracking-[-0.3px] text-ink">
            Email envoyé
          </h1>
          <p className="text-caption text-ink-80">
            Si un compte existe pour <strong>{email.trim()}</strong>, un lien de
            réinitialisation vient d&apos;être envoyé. Pensez à vérifier vos spams.
          </p>
          <Link href="/login" className="mt-2 text-fine font-semibold text-accent">
            Retour à la connexion
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      heading="Réinitialiser votre mot de passe"
      subheading="Indiquez votre email, nous vous envoyons un lien pour en créer un nouveau."
    >
      <Link
        href="/login"
        className="mb-4 flex items-center gap-1.5 text-fine font-semibold text-ink-48"
      >
        <ChevronLeft size={14} />
        Retour à la connexion
      </Link>

      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
          />
        </Field>
        <Button type="submit" fullWidth disabled={chargement}>
          {chargement ? "Envoi…" : "Envoyer le lien de réinitialisation"}
        </Button>
      </form>
    </AuthShell>
  );
}
