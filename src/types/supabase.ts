/**
 * Types générés depuis le schéma Supabase (projet deeplan-prod).
 * Régénérer après toute évolution du schéma :
 *   npx supabase gen types typescript --project-id wjsvygzatbguwzzzvopv > src/types/supabase.ts
 * (ou via l'outil MCP Supabase `generate_typescript_types`).
 *
 * NE PAS éditer à la main.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.17";
  };
  public: {
    Tables: {
      annonces: {
        Row: {
          contenu: string;
          date_publication: string;
          departement_id: string;
          id: string;
          responsable_id: string;
          titre: string;
        };
        Insert: {
          contenu: string;
          date_publication?: string;
          departement_id: string;
          id?: string;
          responsable_id: string;
          titre: string;
        };
        Update: {
          contenu?: string;
          date_publication?: string;
          departement_id?: string;
          id?: string;
          responsable_id?: string;
          titre?: string;
        };
        Relationships: [
          {
            foreignKeyName: "annonces_departement_id_fkey";
            columns: ["departement_id"];
            isOneToOne: false;
            referencedRelation: "departements";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "annonces_responsable_id_fkey";
            columns: ["responsable_id"];
            isOneToOne: false;
            referencedRelation: "utilisateurs";
            referencedColumns: ["id"];
          },
        ];
      };
      departements: {
        Row: {
          description: string | null;
          id: string;
          nom: string;
          responsable_id: string;
        };
        Insert: {
          description?: string | null;
          id?: string;
          nom: string;
          responsable_id: string;
        };
        Update: {
          description?: string | null;
          id?: string;
          nom?: string;
          responsable_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "departements_responsable_id_fkey";
            columns: ["responsable_id"];
            isOneToOne: false;
            referencedRelation: "utilisateurs";
            referencedColumns: ["id"];
          },
        ];
      };
      disponibilites: {
        Row: { date: string; id: string; star_id: string; statut: string };
        Insert: { date: string; id?: string; star_id: string; statut: string };
        Update: { date?: string; id?: string; star_id?: string; statut?: string };
        Relationships: [
          {
            foreignKeyName: "disponibilites_star_id_fkey";
            columns: ["star_id"];
            isOneToOne: false;
            referencedRelation: "utilisateurs";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          contenu: string;
          date_creation: string;
          id: string;
          lu: boolean;
          type: string;
          utilisateur_id: string;
        };
        Insert: {
          contenu: string;
          date_creation?: string;
          id?: string;
          lu?: boolean;
          type: string;
          utilisateur_id: string;
        };
        Update: {
          contenu?: string;
          date_creation?: string;
          id?: string;
          lu?: boolean;
          type?: string;
          utilisateur_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_utilisateur_id_fkey";
            columns: ["utilisateur_id"];
            isOneToOne: false;
            referencedRelation: "utilisateurs";
            referencedColumns: ["id"];
          },
        ];
      };
      plannings: {
        Row: {
          cree_par: string;
          date: string;
          date_creation: string;
          description: string | null;
          heure_debut: string | null;
          heure_fin: string | null;
          id: string;
          poste_id: string;
          star_id: string;
          statut: string;
        };
        Insert: {
          cree_par: string;
          date: string;
          date_creation?: string;
          description?: string | null;
          heure_debut?: string | null;
          heure_fin?: string | null;
          id?: string;
          poste_id: string;
          star_id: string;
          statut?: string;
        };
        Update: {
          cree_par?: string;
          date?: string;
          date_creation?: string;
          description?: string | null;
          heure_debut?: string | null;
          heure_fin?: string | null;
          id?: string;
          poste_id?: string;
          star_id?: string;
          statut?: string;
        };
        Relationships: [
          {
            foreignKeyName: "plannings_cree_par_fkey";
            columns: ["cree_par"];
            isOneToOne: false;
            referencedRelation: "utilisateurs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "plannings_poste_id_fkey";
            columns: ["poste_id"];
            isOneToOne: false;
            referencedRelation: "postes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "plannings_star_id_fkey";
            columns: ["star_id"];
            isOneToOne: false;
            referencedRelation: "utilisateurs";
            referencedColumns: ["id"];
          },
        ];
      };
      postes: {
        Row: {
          description: string | null;
          id: string;
          nom: string;
          section_id: string;
        };
        Insert: {
          description?: string | null;
          id?: string;
          nom: string;
          section_id: string;
        };
        Update: {
          description?: string | null;
          id?: string;
          nom?: string;
          section_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "postes_section_id_fkey";
            columns: ["section_id"];
            isOneToOne: false;
            referencedRelation: "sections";
            referencedColumns: ["id"];
          },
        ];
      };
      roles_utilisateurs: {
        Row: {
          date_creation: string;
          id: string;
          role: string;
          statut: string;
          utilisateur_id: string;
        };
        Insert: {
          date_creation?: string;
          id?: string;
          role: string;
          statut?: string;
          utilisateur_id: string;
        };
        Update: {
          date_creation?: string;
          id?: string;
          role?: string;
          statut?: string;
          utilisateur_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "roles_utilisateurs_utilisateur_id_fkey";
            columns: ["utilisateur_id"];
            isOneToOne: false;
            referencedRelation: "utilisateurs";
            referencedColumns: ["id"];
          },
        ];
      };
      sections: {
        Row: { departement_id: string; id: string; nom: string };
        Insert: { departement_id: string; id?: string; nom: string };
        Update: { departement_id?: string; id?: string; nom?: string };
        Relationships: [
          {
            foreignKeyName: "sections_departement_id_fkey";
            columns: ["departement_id"];
            isOneToOne: false;
            referencedRelation: "departements";
            referencedColumns: ["id"];
          },
        ];
      };
      star_sections: {
        Row: { section_id: string; star_id: string };
        Insert: { section_id: string; star_id: string };
        Update: { section_id?: string; star_id?: string };
        Relationships: [
          {
            foreignKeyName: "star_sections_section_id_fkey";
            columns: ["section_id"];
            isOneToOne: false;
            referencedRelation: "sections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "star_sections_star_id_fkey";
            columns: ["star_id"];
            isOneToOne: false;
            referencedRelation: "utilisateurs";
            referencedColumns: ["id"];
          },
        ];
      };
      utilisateurs: {
        Row: {
          date_creation: string;
          email: string;
          id: string;
          nom: string;
          prenom: string;
        };
        Insert: {
          date_creation?: string;
          email: string;
          id: string;
          nom: string;
          prenom: string;
        };
        Update: {
          date_creation?: string;
          email?: string;
          id?: string;
          nom?: string;
          prenom?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      is_any_responsable: { Args: Record<never, never>; Returns: boolean };
      is_responsable_of: { Args: { dept_id: string }; Returns: boolean };
      is_star_in_departement: { Args: { dept_id: string }; Returns: boolean };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
