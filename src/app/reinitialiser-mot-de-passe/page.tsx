"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/layout";
import { Button, Field, Input, Spinner } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

export default function ReinitialiserMotDePassePage() {
  const router = useRouter();
  const [sessionOk, setSessionOk] = useState<boolean | null>(null);
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setSessionOk(!!data.session);
    });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);

    if (motDePasse.length < 8) {
      setErreur("Le mot de passe doit faire au moins 8 caractères.");
      return;
    }
    if (motDePasse !== confirmation) {
      setErreur("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setChargement(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: motDePasse });
    if (error) {
      setChargement(false);
      setErreur("Impossible de mettre à jour le mot de passe. Réessayez.");
      return;
    }
    router.replace("/apres-login");
    router.refresh();
  }

  if (sessionOk === null) {
    return (
      <AuthShell>
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      </AuthShell>
    );
  }

  if (!sessionOk) {
    return (
      <AuthShell heading="Lien expiré">
        <p className="text-center text-caption text-ink-80">
          Ce lien de réinitialisation n&apos;est plus valide. Refaites une
          demande depuis la page de connexion.
        </p>
        <Link
          href="/mot-de-passe-oublie"
          className="mt-4 block text-center text-fine font-semibold text-accent"
        >
          Refaire une demande
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell heading="Nouveau mot de passe" subheading="Choisissez un nouveau mot de passe pour votre compte.">
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <Field label="Nouveau mot de passe" htmlFor="mdp" hint="Au moins 8 caractères.">
          <Input
            id="mdp"
            type="password"
            autoComplete="new-password"
            required
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            placeholder="••••••••"
          />
        </Field>
        <Field label="Confirmer le mot de passe" htmlFor="conf">
          <Input
            id="conf"
            type="password"
            autoComplete="new-password"
            required
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="••••••••"
          />
        </Field>

        {erreur && (
          <p role="alert" className="text-caption text-danger">
            {erreur}
          </p>
        )}

        <Button type="submit" fullWidth disabled={chargement}>
          {chargement ? "Mise à jour…" : "Mettre à jour le mot de passe"}
        </Button>
      </form>
    </AuthShell>
  );
}
