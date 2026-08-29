"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/layout";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { Button, Field, Input, Spinner } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const suite = useSearchParams().get("suite");

  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  // `undefined` = vérification en cours ; `null` = non connecté ; string = email connecté.
  const [dejaConnecte, setDejaConnecte] = useState<string | null | undefined>(
    undefined,
  );

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setDejaConnecte(data.user?.email ?? null))
      .catch(() => setDejaConnecte(null));
  }, []);

  const dest = `/apres-login${suite ? `?suite=${encodeURIComponent(suite)}` : ""}`;

  async function changerDeCompte() {
    await createClient().auth.signOut({ scope: "local" });
    setDejaConnecte(null);
    router.refresh();
  }

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
    router.replace(dest);
    router.refresh();
  }

  if (dejaConnecte === undefined) {
    return (
      <AuthShell heading="Connexion">
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      </AuthShell>
    );
  }

  if (dejaConnecte) {
    return (
      <AuthShell
        heading="Vous êtes déjà connecté·e"
        subheading={`Session active : ${dejaConnecte}`}
      >
        <div className="flex flex-col gap-3">
          <Button fullWidth onClick={() => router.replace(dest)}>
            Continuer vers mon espace
          </Button>
          <Button fullWidth variant="secondary" onClick={changerDeCompte}>
            Se connecter avec un autre compte
          </Button>
        </div>
      </AuthShell>
    );
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

      <div className="my-4 flex items-center gap-3 text-fine text-ink-48">
        <span className="h-px flex-1 bg-hairline" />
        ou
        <span className="h-px flex-1 bg-hairline" />
      </div>
      <GoogleButton suite={suite} />

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
