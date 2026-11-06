/**
 * Écrit une erreur dans les journaux : ceux de Vercel côté serveur, la console du
 * navigateur côté client. Seuls le type, le message, le code et la pile sont repris :
 * le champ `details` de Postgres peut contenir des valeurs saisies par les utilisateurs.
 */
export function journaliserErreur(contexte: string, erreur: unknown): void {
  const e = (typeof erreur === "object" && erreur !== null ? erreur : {}) as {
    name?: unknown;
    message?: unknown;
    code?: unknown;
    digest?: unknown;
    stack?: unknown;
  };

  // `redirect()` et `notFound()` de Next.js passent par des exceptions : ce ne sont pas des pannes.
  if (typeof e.digest === "string" && e.digest.startsWith("NEXT_")) return;

  const message = typeof e.message === "string" ? e.message : String(erreur);
  console.error(
    `[DeEplan] ${contexte}`,
    JSON.stringify({
      type: typeof e.name === "string" ? e.name : undefined,
      message: message.slice(0, 500),
      code: e.code === undefined ? undefined : String(e.code),
      digest: typeof e.digest === "string" ? e.digest : undefined,
      pile: typeof e.stack === "string" ? e.stack.slice(0, 1500) : undefined,
    }),
  );
}
