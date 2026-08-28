"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/layout";
import { Button, Field, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const suite = useSearchParams().get("suite");

  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: motDePasse,
    });

    if (error) {
      setChargement(false);
      setErreur(
        error.message === "Invalid login credentials"
          ? "Email ou mot de passe incorrect."
          : "Connexion impossible. Réessayez.",
      );
      return;
    }

    // Navigation complète : laisse le middleware poser les cookies de session.
    const dest = `/apres-login${suite ? `?suite=${encodeURIComponent(suite)}` : ""}`;
    router.replace(dest);
    router.refresh();
  }

  return (
    <AuthShell heading="Connexion" subheading="Accédez à votre espace Responsable ou Star.">
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
        <Field label="Mot de passe" htmlFor="mdp">
          <Input
            id="mdp"
            type="password"
            autoComplete="current-password"
            required
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            placeholder="••••••••"
          />
        </Field>

        {erreur && (
          <p role="alert" className="text-caption text-danger">
            {erreur}
          </p>
        )}

        <Button type="submit" fullWidth disabled={chargement}>
          {chargement ? "Connexion…" : "Se connecter"}
        </Button>
      </form>

      <div className="mt-5 flex flex-col items-center gap-2 text-center text-caption text-ink-48">
        <Link href="/mot-de-passe-oublie" className="font-semibold text-accent">
          Mot de passe oublié ?
        </Link>
        <span>
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="font-semibold text-accent">
            Créer un compte
          </Link>
        </span>
      </div>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
