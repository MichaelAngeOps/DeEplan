/**
 * Types métier de DeEplan.
 *
 * ⚠️ PROVISOIRE — à aligner sur le schéma Supabase réel (10 tables du prompt §7)
 * lors de l'étape « Vérification du schéma » qui précède le Lot 1. Les noms de
 * champs sont ici en camelCase ; le mapping vers/depuis les colonnes Postgres
 * (souvent snake_case) sera fait dans la couche d'accès aux données.
 */

export type UUID = string;
/** Date ISO `YYYY-MM-DD`. */
export type IsoDate = string;
/** Timestamp ISO 8601. */
export type IsoDateTime = string;

// --------------------------------------------------------------------------
// Rôles & utilisateurs
// --------------------------------------------------------------------------

export type Role = "responsable" | "star";

/** Statut d'un compte (validation par un responsable pour le rôle star). */
export type StatutCompte = "en_attente" | "actif" | "desactive";

export interface Utilisateur {
  id: UUID;
  prenom: string;
  nom: string;
  email: string;
  roles: Role[];
  createdAt: IsoDateTime;
}

/** Profil « star » d'un utilisateur, rattaché à un département. */
export interface StarProfil {
  utilisateurId: UUID;
  departementId: UUID;
  statut: StatutCompte;
  sectionIds: UUID[];
}

// --------------------------------------------------------------------------
// Structure organisationnelle : Département → Sections → Postes
// --------------------------------------------------------------------------

export interface Departement {
  id: UUID;
  nom: string;
  description: string | null;
  responsableId: UUID;
}

export interface Section {
  id: UUID;
  departementId: UUID;
  nom: string;
}

export interface Poste {
  id: UUID;
  sectionId: UUID;
  nom: string;
  /** Horaire par défaut du poste (décision produit #3). Format `HH:MM`. */
  heureDebut: string | null;
  heureFin: string | null;
}

// --------------------------------------------------------------------------
// Disponibilités (décision produit #2 : binaire, journée entière)
// --------------------------------------------------------------------------

export interface Disponibilite {
  id: UUID;
  starId: UUID;
  date: IsoDate;
  disponible: boolean;
}

// --------------------------------------------------------------------------
// Planning & statuts de shift
// --------------------------------------------------------------------------

/**
 * Statut d'un shift planifié (prompt §8).
 * L'absence de shift = « pas en service » (pas de valeur dédiée, décision #4).
 */
export type StatutShift =
  | "de_service"
  | "a_servi"
  | "na_pas_servi"
  | "a_confirmer";

export interface ShiftPlanning {
  id: UUID;
  posteId: UUID;
  starId: UUID;
  date: IsoDate;
  statut: StatutShift;
  updatedAt: IsoDateTime;
}

// --------------------------------------------------------------------------
// Annonces & notifications
// --------------------------------------------------------------------------

export interface Annonce {
  id: UUID;
  departementId: UUID;
  titre: string;
  contenu: string;
  auteurId: UUID;
  publieeLe: IsoDateTime;
}

export interface Notification {
  id: UUID;
  destinataireId: UUID;
  texte: string;
  lue: boolean;
  creeeLe: IsoDateTime;
}
