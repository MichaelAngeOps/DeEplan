/**
 * Vérification de connexion au projet Supabase.
 * Lancer :  node --env-file=.env.local scripts/check-supabase.mjs
 *
 * Ne modifie rien. Teste :
 *   1. la présence des variables d'env
 *   2. l'authentification de la clé API (auth.getSession)
 *   3. une lecture sur une table du schéma (RLS actif : un tableau vide SANS
 *      erreur = connexion OK ; "Invalid API key" = clé incorrecte)
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("❌ Variables manquantes : NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}
console.log("• URL      :", url);
console.log("• Clé      :", key.slice(0, 12) + "…(" + key.length + " car.)");

const supabase = createClient(url, key);

let ok = true;

// 1. Auth / validité de la clé
const { error: authErr } = await supabase.auth.getSession();
if (authErr) {
  ok = false;
  console.error("❌ auth.getSession :", authErr.message);
} else {
  console.log("✅ auth.getSession : OK (aucune session, attendu)");
}

// 2. Lecture sur chaque table annoncée au prompt §7
const tables = [
  "utilisateurs",
  "roles_utilisateurs",
  "departements",
  "sections",
  "postes",
  "star_sections",
  "disponibilites",
  "plannings",
  "annonces",
  "notifications",
];

for (const t of tables) {
  const { data, error } = await supabase.from(t).select("*").limit(1);
  if (error) {
    // 42P01 = table inexistante ; PGRST/permission = table présente mais RLS bloque (OK pour la connexion)
    const blockedByRls =
      error.code === "PGRST301" ||
      /permission denied/i.test(error.message) ||
      /row-level security/i.test(error.message);
    if (blockedByRls) {
      console.log(`✅ ${t.padEnd(20)} présente (lecture bloquée par RLS — attendu)`);
    } else {
      ok = false;
      console.error(`❌ ${t.padEnd(20)} ${error.code ?? ""} ${error.message}`);
    }
  } else {
    console.log(`✅ ${t.padEnd(20)} présente (${data.length} ligne(s) visible(s))`);
  }
}

console.log(ok ? "\n✅ Connexion Supabase opérationnelle." : "\n❌ Problème de connexion — voir ci-dessus.");
process.exit(ok ? 0 : 1);
