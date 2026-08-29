"use client";

import { useState } from "react";
import { Briefcase, Star } from "lucide-react";
import { AuthShell } from "@/components/layout";
import { Button, Field, Input, Textarea } from "@/components/ui";
import { cn } from "@/lib/cn";
import { completerProfil } from "@/lib/actions/inscription";
import type { Role } from "@/types/domain";

export function CompleterProfilClient({
  prenomDefaut,
  nomDefaut,
}: {
  prenomDefaut: string;
  nomDefaut: string;
}) {
  const [estResponsable, setEstResponsable] = useState(false);
  const [estStar, setEstStar] = useState(true);
  const [prenom, setPrenom] = useState(prenomDefaut);
  const [nom, setNom] = useState(nomDefaut);
  const [deptNom, setDeptNom] = useState("");
  const [deptDesc, setDeptDesc] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  const roles: Role[] = [
    ...(estResponsable ? (["responsable"] as const) : []),
    ...(estStar ? (["star"] as const) : []),
  ];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    const res = await completerProfil({
      prenom,
      nom,
      roles,
      departement: estResponsable
        ? { nom: deptNom, description: deptDesc }
        : undefined,
    });
    setChargement(false);
    setErreur(res.erreur);
  }

  return (
    <AuthShell
      heading="Compléter mon profil"
      subheading="Encore quelques informations pour finaliser votre compte."
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex gap-3">
          <Field label="Prénom" htmlFor="prenom" className="flex-1">
            <Input
              id="prenom"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              required
            />
          </Field>
          <Field label="Nom" htmlFor="nom" className="flex-1">
            <Input
              id="nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
            />
          </Field>
        </div>

        <p className="text-caption-strong text-ink">Je suis…</p>
        <RoleCard
          icon={<Briefcase size={18} className="text-accent" />}
          titre="Responsable"
          sousTitre="Je gère un département et planifie les équipes"
          coche={estResponsable}
          onToggle={() => setEstResponsable((v) => !v)}
        />
        <RoleCard
          icon={<Star size={18} className="text-accent" />}
          titre="Star"
          sousTitre="Je soumets mes disponibilités et consulte mon planning"
          coche={estStar}
          onToggle={() => setEstStar((v) => !v)}
        />

        {estResponsable && (
          <div className="border-t border-hairline pt-4">
            <p className="mb-3.5 text-caption-strong text-ink">Votre département</p>
            <Field label="Nom du département" htmlFor="dept" className="mb-4">
              <Input
                id="dept"
                value={deptNom}
                onChange={(e) => setDeptNom(e.target.value)}
                placeholder="Ex : Le Comptoir"
                required
              />
            </Field>
            <Field label="Description" htmlFor="deptdesc">
              <Textarea
                id="deptdesc"
                rows={3}
                value={deptDesc}
                onChange={(e) => setDeptDesc(e.target.value)}
                placeholder="Décrivez votre département en quelques mots"
              />
            </Field>
          </div>
        )}

        {erreur && (
          <p role="alert" className="text-caption text-danger">
            {erreur}
          </p>
        )}

        <Button
          type="submit"
          fullWidth
          disabled={chargement || roles.length === 0}
        >
          {chargement ? "Enregistrement…" : "Continuer"}
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
