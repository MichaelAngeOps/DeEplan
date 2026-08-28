// Serveur uniquement (dépend de @/lib/supabase/server).
import { createClient } from "@/lib/supabase/server";

export type TypeNotification =
  | "compte_valide"
  | "shift_assigne"
  | "shift_modifie"
  | "shift_retire"
  | "annonce"
  | "departement_cree";

/**
 * Crée une notification pour un utilisateur. **Best-effort** : une notification
 * qui échoue (RLS, réseau) ne doit jamais faire échouer l'action métier
 * appelante — l'erreur est volontairement ignorée.
 */
export async function notifier(
  utilisateurId: string,
  type: TypeNotification,
  contenu: string,
): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase
      .from("notifications")
      .insert({ utilisateur_id: utilisateurId, type, contenu });
  } catch {
    // ignoré
  }
}

/** Notifie en lot plusieurs utilisateurs (même type / contenu). Best-effort. */
export async function notifierPlusieurs(
  utilisateurIds: string[],
  type: TypeNotification,
  contenu: string,
): Promise<void> {
  if (utilisateurIds.length === 0) return;
  try {
    const supabase = await createClient();
    await supabase
      .from("notifications")
      .insert(
        utilisateurIds.map((utilisateur_id) => ({
          utilisateur_id,
          type,
          contenu,
        })),
      );
  } catch {
    // ignoré
  }
}
