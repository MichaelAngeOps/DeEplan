"use server";

import { revalidatePath } from "next/cache";
import { getAcces } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const PATH = "/responsable/structure";
const NOM_MAX = 60;
const DESC_MAX = 200;

export type ActionResultat = { ok: true } | { ok: false; erreur: string };

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

/** Espaces multiples réduits, bords rognés. */
function propre(v: string): string {
  return v.trim().replace(/\s+/g, " ");
}

/** Clé de comparaison : minuscules, sans accents (unicité insensible à la casse). */
function cle(v: string): string {
  return propre(v)
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function validerNom(v: string, sujet: string): string | null {
  const n = propre(v);
  if (!n) return `Le nom ${sujet} est requis.`;
  if (n.length > NOM_MAX)
    return `Le nom ${sujet} ne doit pas dépasser ${NOM_MAX} caractères.`;
  return null;
}

/** Vérifie que l'utilisateur courant est responsable d'un département. */
async function garde(): Promise<
  { ok: true; departementId: string } | { ok: false; erreur: string }
> {
  const acces = await getAcces();
  if (!acces?.estResponsable || !acces.departementId)
    return { ok: false, erreur: "Accès réservé au responsable du département." };
  return { ok: true, departementId: acces.departementId };
}

// --------------------------------------------------------------------------
// Sections
// --------------------------------------------------------------------------

export async function creerSection(nom: string): Promise<ActionResultat> {
  const g = await garde();
  if (!g.ok) return g;

  const probleme = validerNom(nom, "de la section");
  if (probleme) return { ok: false, erreur: probleme };

  const supabase = await createClient();

  const { data: existantes } = await supabase
    .from("sections")
    .select("nom")
    .eq("departement_id", g.departementId);
  if ((existantes ?? []).some((s) => cle(s.nom) === cle(nom)))
    return { ok: false, erreur: `Une section nommée « ${propre(nom)} » existe déjà.` };

  const { error } = await supabase
    .from("sections")
    .insert({ departement_id: g.departementId, nom: propre(nom) });
  if (error) return { ok: false, erreur: "Création de la section impossible." };

  revalidatePath(PATH);
  return { ok: true };
}

export async function renommerSection(
  id: string,
  nom: string,
): Promise<ActionResultat> {
  const g = await garde();
  if (!g.ok) return g;

  const probleme = validerNom(nom, "de la section");
  if (probleme) return { ok: false, erreur: probleme };

  const supabase = await createClient();

  const { data: section } = await supabase
    .from("sections")
    .select("id")
    .eq("id", id)
    .eq("departement_id", g.departementId)
    .maybeSingle();
  if (!section) return { ok: false, erreur: "Section introuvable." };

  const { data: fratrie } = await supabase
    .from("sections")
    .select("id, nom")
    .eq("departement_id", g.departementId);
  if ((fratrie ?? []).some((s) => s.id !== id && cle(s.nom) === cle(nom)))
    return { ok: false, erreur: `Une section nommée « ${propre(nom)} » existe déjà.` };

  const { error } = await supabase
    .from("sections")
    .update({ nom: propre(nom) })
    .eq("id", id);
  if (error) return { ok: false, erreur: "Renommage impossible." };

  revalidatePath(PATH);
  return { ok: true };
}

export async function supprimerSection(id: string): Promise<ActionResultat> {
  const g = await garde();
  if (!g.ok) return g;

  const supabase = await createClient();

  const { data: postes } = await supabase
    .from("postes")
    .select("id, sections!inner(departement_id)")
    .eq("section_id", id)
    .eq("sections.departement_id", g.departementId);

  // Section inexistante / hors département : `postes` est vide — on vérifie la
  // section elle-même pour distinguer « vide » de « introuvable ».
  if (!postes || postes.length === 0) {
    const { data: section } = await supabase
      .from("sections")
      .select("id")
      .eq("id", id)
      .eq("departement_id", g.departementId)
      .maybeSingle();
    if (!section) return { ok: false, erreur: "Section introuvable." };
  }

  const posteIds = (postes ?? []).map((p) => p.id);
  if (posteIds.length > 0) {
    const { count } = await supabase
      .from("plannings")
      .select("*", { count: "exact", head: true })
      .in("poste_id", posteIds);
    if (count && count > 0)
      return {
        ok: false,
        erreur:
          "Cette section a un historique de planning. Retirez d'abord ses shifts.",
      };
  }

  const { error } = await supabase.from("sections").delete().eq("id", id);
  if (error) return { ok: false, erreur: "Suppression de la section impossible." };

  revalidatePath(PATH);
  return { ok: true };
}

// --------------------------------------------------------------------------
// Postes
// --------------------------------------------------------------------------

/** Charge un poste en vérifiant qu'il appartient au département du responsable. */
async function chargerPoste(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string,
  departementId: string,
): Promise<{ id: string; section_id: string } | null> {
  const { data } = await supabase
    .from("postes")
    .select("id, section_id, sections!inner(departement_id)")
    .eq("id", id)
    .eq("sections.departement_id", departementId)
    .maybeSingle();
  return data ? { id: data.id, section_id: data.section_id } : null;
}

async function sectionDuDepartement(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sectionId: string,
  departementId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("sections")
    .select("id")
    .eq("id", sectionId)
    .eq("departement_id", departementId)
    .maybeSingle();
  return Boolean(data);
}

async function nomPostePris(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sectionId: string,
  nom: string,
  exclureId?: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("postes")
    .select("id, nom")
    .eq("section_id", sectionId);
  return (data ?? []).some(
    (p) => p.id !== exclureId && cle(p.nom) === cle(nom),
  );
}

function validerDescription(v: string): string | null {
  if (propre(v).length > DESC_MAX)
    return `La description ne doit pas dépasser ${DESC_MAX} caractères.`;
  return null;
}

export async function creerPoste(
  sectionId: string,
  nom: string,
  description: string,
): Promise<ActionResultat> {
  const g = await garde();
  if (!g.ok) return g;

  const probleme = validerNom(nom, "du poste") ?? validerDescription(description);
  if (probleme) return { ok: false, erreur: probleme };

  const supabase = await createClient();

  if (!(await sectionDuDepartement(supabase, sectionId, g.departementId)))
    return { ok: false, erreur: "Section introuvable." };

  if (await nomPostePris(supabase, sectionId, nom))
    return {
      ok: false,
      erreur: `Un poste nommé « ${propre(nom)} » existe déjà dans cette section.`,
    };

  const { error } = await supabase.from("postes").insert({
    section_id: sectionId,
    nom: propre(nom),
    description: propre(description) || null,
  });
  if (error) return { ok: false, erreur: "Création du poste impossible." };

  revalidatePath(PATH);
  return { ok: true };
}

export async function modifierPoste(
  id: string,
  nom: string,
  description: string,
): Promise<ActionResultat> {
  const g = await garde();
  if (!g.ok) return g;

  const probleme = validerNom(nom, "du poste") ?? validerDescription(description);
  if (probleme) return { ok: false, erreur: probleme };

  const supabase = await createClient();

  const poste = await chargerPoste(supabase, id, g.departementId);
  if (!poste) return { ok: false, erreur: "Poste introuvable." };

  if (await nomPostePris(supabase, poste.section_id, nom, id))
    return {
      ok: false,
      erreur: `Un poste nommé « ${propre(nom)} » existe déjà dans cette section.`,
    };

  const { error } = await supabase
    .from("postes")
    .update({
      nom: propre(nom),
      description: propre(description) || null,
    })
    .eq("id", id);
  if (error) return { ok: false, erreur: "Modification du poste impossible." };

  revalidatePath(PATH);
  return { ok: true };
}

export async function supprimerPoste(id: string): Promise<ActionResultat> {
  const g = await garde();
  if (!g.ok) return g;

  const supabase = await createClient();

  const poste = await chargerPoste(supabase, id, g.departementId);
  if (!poste) return { ok: false, erreur: "Poste introuvable." };

  const { count } = await supabase
    .from("plannings")
    .select("*", { count: "exact", head: true })
    .eq("poste_id", id);
  if (count && count > 0)
    return {
      ok: false,
      erreur:
        "Ce poste est utilisé dans le planning. Retirez d'abord ses shifts.",
    };

  const { error } = await supabase.from("postes").delete().eq("id", id);
  if (error) return { ok: false, erreur: "Suppression du poste impossible." };

  revalidatePath(PATH);
  return { ok: true };
}
