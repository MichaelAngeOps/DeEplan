/** Nombre maximal de lignes renvoyées par une lecture Supabase. Au-delà, les lignes manquent sans erreur. */
export const TAILLE_TRANCHE = 1000;

/** Garde-fou : mieux vaut une erreur visible qu'une boucle sans fin ou une liste incomplète. */
const TRANCHES_MAX = 200;

/**
 * Lit toutes les lignes d'une requête, tranche par tranche. La requête doit avoir un tri stable
 * (par exemple sur `id`) : sans lui, des lignes peuvent être lues deux fois ou manquer.
 */
export async function lireTout<T>(
  lireTranche: (
    debut: number,
    fin: number,
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const lignes: T[] = [];
  for (let tranche = 0; tranche < TRANCHES_MAX; tranche += 1) {
    const debut = tranche * TAILLE_TRANCHE;
    const { data, error } = await lireTranche(debut, debut + TAILLE_TRANCHE - 1);
    if (error) throw new Error(error.message);
    lignes.push(...(data ?? []));
    if ((data?.length ?? 0) < TAILLE_TRANCHE) return lignes;
  }
  throw new Error("Trop de lignes à lire.");
}
