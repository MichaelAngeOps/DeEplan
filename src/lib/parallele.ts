/**
 * Traite `elements` avec au plus `limite` traitements simultanés, puis attend la fin de tous.
 * Une erreur n'interrompt pas les autres traitements : la première est relancée à la fin.
 */
export async function enParallele<T>(
  elements: readonly T[],
  limite: number,
  traiter: (element: T) => Promise<void>,
): Promise<void> {
  let suivant = 0;
  const erreurs: unknown[] = [];

  async function travailleur() {
    while (suivant < elements.length) {
      const element = elements[suivant++];
      try {
        await traiter(element);
      } catch (e) {
        erreurs.push(e);
      }
    }
  }

  const nombre = Math.max(1, Math.min(limite, elements.length));
  await Promise.all(Array.from({ length: nombre }, travailleur));
  if (erreurs.length > 0) throw erreurs[0];
}
