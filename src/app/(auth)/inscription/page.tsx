"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Briefcase, ChevronLeft, Info, Star } from "lucide-react";
import { AuthShell } from "@/components/layout";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { Button, Field, Input, Spinner, Textarea } from "@/components/ui";
import { cn } from "@/lib/cn";
import { sinscrire } from "@/lib/actions/inscription";
import { createClient } from "@/lib/supabase/client";
import type { Role } from "@/types/domain";

type Etape = "roles" | "identite";

export default function InscriptionPage() {
  const router = useRouter();
  const [etape, setEtape] = useState<Etape>("roles");

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

  async function seDeconnecter() {
    await createClient().auth.signOut({ scope: "local" });
    setDejaConnecte(null);
    router.refresh();
  }
  const [estResponsable, setEstResponsable] = useState(false);
  const [estStar, setEstStar] = useState(false);

  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [deptNom, setDeptNom] = useState("");
  const [deptDesc, setDeptDesc] = useState("");

  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  const roles: Role[] = [
    ...(estResponsable ? (["responsable"] as const) : []),
    ...(estStar ? (["star"] as const) : []),
  ];

  const resume =
    estResponsable && estStar
      ? "Compte Responsable et Star."
      : estResponsable
        ? "Compte Responsable."
        : "Compte Star — soumis à validation.";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    const res = await sinscrire({
      prenom,
      nom,
      email,
      motDePasse,
      roles,
      departement: estResponsable
        ? { nom: deptNom, description: deptDesc }
        : undefined,
    });
    // succès = redirection serveur ; on n'arrive ici qu'en cas d'erreur
    setChargement(false);
    setErreur(res.erreur);
  }

  if (dejaConnecte === undefined) {
    return (
      <AuthShell heading="Créer un compte">
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
          <Button fullWidth onClick={() => router.replace("/apres-login")}>
            Aller à mon espace
          </Button>
          <Button fullWidth variant="secondary" onClick={seDeconnecter}>
            Me déconnecter pour créer un autre compte
          </Button>
        </div>
      </AuthShell>
    );
  }

  if (etape === "roles") {
    return (
      <AuthShell heading="Créer un compte" subheading="Sélectionnez un ou plusieurs rôles.">
        <div className="flex flex-col gap-3">
          <RoleCard
            icon={<Briefcase size={18} className="text-accent" />}
            titre="Je suis Responsable"
            sousTitre="Je gère un département et planifie les équipes"
            coche={estResponsable}
            onToggle={() => setEstResponsable((v) => !v)}
          />
          <RoleCard
            icon={<Star size={18} className="text-accent" />}
            titre="Je suis Star"
            sousTitre="Je soumets mes disponibilités et consulte mon planning"
            coche={estStar}
            onToggle={() => setEstStar((v) => !v)}
          />
        </div>
        <Button
          fullWidth
          className="mt-6"
          disabled={roles.length === 0}
          onClick={() => setEtape("identite")}
        >
          Continuer
        </Button>

        <div className="my-4 flex items-center gap-3 text-fine text-ink-48">
          <span className="h-px flex-1 bg-hairline" />
          ou
          <span className="h-px flex-1 bg-hairline" />
        </div>
        <GoogleButton />
        <p className="mt-2 text-center text-fine text-ink-48">
          Avec Google, vous choisirez vos rôles juste après.
        </p>

        <p className="mt-5 text-center text-caption text-ink-48">
          Déjà un compte ?{" "}
          <Link href="/login" className="font-semibold text-accent">
            Se connecter
          </Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell heading="Créer un compte" subheading={resume}>
      <button
        type="button"
        onClick={() => setEtape("roles")}
        className="mb-4 flex items-center gap-1.5 text-fine font-semibold text-ink-48"
      >
        <ChevronLeft size={14} />
        Retour au choix du profil
      </button>

      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex gap-3">
          <Field label="Prénom" htmlFor="prenom" className="flex-1">
            <Input id="prenom" value={prenom} onChange={(e) => setPrenom(e.target.value)} required />
          </Field>
          <Field label="Nom" htmlFor="nom" className="flex-1">
            <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
          </Field>
        </div>
        <Field label="Email" htmlFor="email">
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" required />
        </Field>
        <Field label="Mot de passe" htmlFor="mdp" hint="Au moins 8 caractères.">
          <Input id="mdp" type="password" autoComplete="new-password" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} placeholder="••••••••" required />
        </Field>

        {estResponsable && (
          <div className="border-t border-hairline pt-4">
            <p className="mb-3.5 text-caption-strong text-ink">Votre département</p>
            <Field label="Nom du département" htmlFor="dept" className="mb-4">
              <Input id="dept" value={deptNom} onChange={(e) => setDeptNom(e.target.value)} placeholder="Ex : Le Comptoir" required />
            </Field>
            <Field label="Description" htmlFor="deptdesc">
              <Textarea id="deptdesc" rows={3} value={deptDesc} onChange={(e) => setDeptDesc(e.target.value)} placeholder="Décrivez votre département en quelques mots" />
            </Field>
          </div>
        )}

        {estStar && (
          <div className="flex items-start gap-2.5 border-t border-hairline pt-4">
            <Info size={16} className="mt-0.5 flex-none text-accent" />
            <p className="text-fine text-ink-48">
              Votre rôle Star sera soumis à validation par un responsable une fois
              le compte créé.
            </p>
          </div>
        )}

        {erreur && (
          <p role="alert" className="text-caption text-danger">
            {erreur}
          </p>
        )}

        <Button type="submit" fullWidth disabled={chargement}>
          {chargement ? "Création…" : "Créer mon compte"}
        </Button>
      </form>
    </AuthShell>
  );
}

function RoleCard({
  icon,
  titre,
  sousTitre,
  coche,
  onToggle,
}: {
  icon: React.ReactNode;
  titre: string;
  sousTitre: string;
  coche: boolean;
  onToggle: () => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3.5 rounded-lg border p-[18px]",
        coche ? "border-accent bg-parchment" : "border-hairline bg-canvas",
      )}
    >
      <input
        type="checkbox"
        checked={coche}
        onChange={onToggle}
        className="h-[18px] w-[18px] flex-none accent-accent"
      />
      <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full bg-parchment">
        {icon}
      </span>
      <span className="flex-1">
        <span className="block text-[14.5px] font-semibold text-ink">{titre}</span>
        <span className="block text-fine text-ink-48">{sousTitre}</span>
      </span>
    </label>
  );
}
