"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/types/domain";

export interface InscriptionPayload {
  prenom: string;
  nom: string;
  email: string;
  motDePasse: string;
  roles: Role[];
  /** Requis si `roles` contient "responsable". */
  departement?: { nom: string; description: string };
}

export type InscriptionResultat = { erreur: string };

function valider(p: InscriptionPayload): string | null {
  if (!p.prenom.trim() || !p.nom.trim()) return "Prénom et nom sont requis.";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p.email)) return "Email invalide.";
  if (p.motDePasse.length < 8)
    return "Le mot de passe doit faire au moins 8 caractères.";
  if (p.roles.length === 0) return "Sélectionnez au moins un rôle.";
  if (p.roles.includes("responsable") && !p.departement?.nom.trim())
    return "Le nom du département est requis.";
  return null;
}

/**
 * Inscription : crée le compte auth, la ligne `utilisateurs`, les rôles
 * (`en_attente`), et le département si l'utilisateur est responsable.
 * Redirige vers `/bienvenue` (responsable) ou `/compte-en-attente` (star seul).
 */
export async function sinscrire(
  p: InscriptionPayload,
): Promise<InscriptionResultat> {
  const probleme = valider(p);
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

  const userId = data.user.id;

  const { error: eUtil } = await supabase.from("utilisateurs").insert({
    id: userId,
    email: p.email.trim(),
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

    // Cumul Responsable + Star : demande auto-validée sur le département créé.
    if (p.roles.includes("star")) {
      await supabase.from("demandes_departement").insert({
        star_id: userId,
        departement_id: dept.id,
        statut: "valide",
      });
    }
  }

  if (p.roles.includes("responsable")) redirect("/bienvenue");
  // Star seul : il choisit ensuite un ou plusieurs départements.
  redirect("/choisir-departement");
}
