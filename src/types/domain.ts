/**
 * Types métier de DeEplan — dérivés du schéma Supabase réel (`./supabase.ts`,
 * vérifié le 2026-08-28).
 *
 * Les colonnes `statut` / `role` sont des `text` avec contrainte CHECK côté
 * Postgres ; on les resserre ici en unions littérales.
 */

import type { Tables } from "./supabase";

// --------------------------------------------------------------------------
// Alias des lignes de tables
// --------------------------------------------------------------------------

export type Utilisateur = Tables<"utilisateurs">;
export type RoleUtilisateurRow = Tables<"roles_utilisateurs">;
export type Departement = Tables<"departements">;
export type Section = Tables<"sections">;
export type Poste = Tables<"postes">;
export type StarSection = Tables<"star_sections">;
export type DemandeDepartementRow = Tables<"demandes_departement">;
export type DisponibiliteRow = Tables<"disponibilites">;
export type PlanningRow = Tables<"plannings">;
export type AnnonceRow = Tables<"annonces">;
export type NotificationRow = Tables<"notifications">;
export type PushSubscriptionRow = Tables<"push_subscriptions">;

// --------------------------------------------------------------------------
// Unions littérales (contraintes CHECK du schéma)
// --------------------------------------------------------------------------

/** `roles_utilisateurs.role` — CHECK (role IN ('responsable','star')). */
export type Role = "responsable" | "star";

/** `roles_utilisateurs.statut` — CHECK (statut IN ('en_attente','valide','desactive')). */
export type StatutRole = "en_attente" | "valide" | "desactive";

/** `demandes_departement.statut` — CHECK (statut IN ('en_attente','valide','refuse')). */
export type StatutDemande = "en_attente" | "valide" | "refuse";

/** `disponibilites.statut` — CHECK (statut IN ('disponible','indisponible')).
 *  L'absence de ligne (contrainte UNIQUE star_id+date) = « non renseigné ». */
export type StatutDisponibilite = "disponible" | "indisponible";

/** `plannings.statut` — CHECK (…), défaut `de_service` (prompt §8). */
export type StatutShift =
  | "de_service"
  | "a_servi"
  | "na_pas_servi"
  | "a_confirmer";

// --------------------------------------------------------------------------
// Vues composites (assemblées côté app)
// --------------------------------------------------------------------------

/** Rôle d'un utilisateur avec son statut de validation. */
export interface RoleUtilisateur {
  role: Role;
  statut: StatutRole;
}

/**
 * Un « Star » vu par le responsable : l'utilisateur + ses sections + le statut
 * de son rôle star. (Agrège `utilisateurs` + `star_sections` + `roles_utilisateurs`.)
 */
export interface Star {
  utilisateur: Utilisateur;
  statut: StatutRole;
  sectionIds: string[];
}

/** Section avec ses postes (pour l'écran Structure / la grille de planning). */
export interface SectionAvecPostes extends Section {
  postes: Poste[];
}

/** Un shift planifié, statut resserré. */
export interface Shift extends Omit<PlanningRow, "statut"> {
  statut: StatutShift;
}
