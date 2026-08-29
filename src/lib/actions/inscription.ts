"use server";

import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/types/domain";

export interface ProfilPayload {
  prenom: string;
  nom: string;
  roles: Role[];
  /** Requis si `roles` contient "responsable". */
  departement?: { nom: string; description: string };
}

export interface InscriptionPayload extends ProfilPayload {
  email: string;
  motDePasse: string;
}

export type ActionResultat = { erreur: string };

function validerProfil(p: ProfilPayload): string | null {
  if (!p.prenom.trim() || !p.nom.trim()) return "Prénom et nom sont requis.";
  if (p.roles.length === 0) return "Sélectionnez au moins un rôle.";
  if (p.roles.includes("responsable") && !p.departement?.nom.trim())
    return "Le nom du département est requis.";
  return null;
}

/**
 * Crée `utilisateurs` + `roles_utilisateurs` (+ `departements` si responsable)
 * pour un compte auth **déjà existant**. Partagé entre l'inscription
 * email/mot de passe et la finalisation après connexion Google.
 * **Redirige** en cas de succès (ne retourne rien).
 */
async function creerProfil(
  userId: string,
  email: string,
  p: ProfilPayload,
): Promise<ActionResultat | never> {
  const probleme = validerProfil(p);
  if (probleme) return { erreur: probleme };

  const supabase = await createClient();

  const { error: eUtil } = await supabase.from("utilisateurs").insert({
    id: userId,
    email: email.trim(),
    nom: p.nom.trim(),
    prenom: p.prenom.trim(),
  });
  if (eUtil) return { erreur: "Création du profil impossible. Réessayez." };

  const { error: eRoles } = await supabase.from("roles_utilisateurs").insert(
    p.roles.map((role) => ({
      utilisateur_id: userId,
      role,
      statut: "en_attente",
    })),
  );
  if (eRoles) return { erreur: "Enregistrement des rôles impossible." };

  if (p.roles.includes("responsable") && p.departement) {
    const { data: dept, error: eDept } = await supabase
      .from("departements")
      .insert({
        nom: p.departement.nom.trim(),
        description: p.departement.description.trim() || null,
        responsable_id: userId,
      })
      .select("id")
      .single();
    if (eDept || !dept)
      return { erreur: "Création du département impossible." };

    if (p.roles.includes("star")) {
      await supabase.from("demandes_departement").insert({
        star_id: userId,
        departement_id: dept.id,
        statut: "valide",
      });
    }
  }

  if (p.roles.includes("responsable")) redirect("/bienvenue");
  redirect("/choisir-departement");
}

/** Inscription par email / mot de passe. */
export async function sinscrire(
  p: InscriptionPayload,
): Promise<ActionResultat> {
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p.email))
    return { erreur: "Email invalide." };
  if (p.motDePasse.length < 8)
    return { erreur: "Le mot de passe doit faire au moins 8 caractères." };
  const probleme = validerProfil(p);
  if (probleme) return { erreur: probleme };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: p.email.trim(),
    password: p.motDePasse,
  });

  if (error) {
    if (/registered|already/i.test(error.message))
      return { erreur: "Un compte existe déjà avec cet email." };
    return { erreur: "Inscription impossible. Réessayez." };
  }
  if (!data.session || !data.user) {
    return {
      erreur:
        "La confirmation d'email est active côté Supabase : impossible de finaliser l'inscription automatiquement.",
    };
  }

  return creerProfil(data.user.id, p.email, p);
}

/** Finalisation du profil après une connexion sans formulaire (Google). */
export async function completerProfil(
  p: ProfilPayload,
): Promise<ActionResultat> {
  const user = await getUser();
  if (!user) return { erreur: "Session expirée. Reconnectez-vous." };

  const supabase = await createClient();
  const { data: existe } = await supabase
    .from("utilisateurs")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (existe) redirect("/apres-login");

  return creerProfil(user.id, user.email ?? "", p);
}

// Compat : ancien nom du type de retour.
export type InscriptionResultat = ActionResultat;
