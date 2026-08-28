/**
 * Accès centralisé aux variables d'environnement publiques.
 * Lève une erreur explicite au démarrage si une variable requise manque,
 * plutôt que de laisser une erreur obscure survenir plus tard.
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    throw new Error(
      `Variable d'environnement manquante : ${name}. ` +
        `Copie .env.local.example en .env.local et renseigne cette valeur.`,
    );
  }
  return value;
}

export const env = {
  supabaseUrl: required(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  ),
  supabaseAnonKey: required(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ),
};
