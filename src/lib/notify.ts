// Serveur uniquement (dépend de @/lib/supabase/server).
import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";

export type TypeNotification =
  | "compte_valide"
  | "shift_assigne"
  | "shift_modifie"
  | "shift_retire"
  | "annonce"
  | "departement_cree";

// --------------------------------------------------------------------------
// Web push (best-effort, aucun échec ne remonte)
// --------------------------------------------------------------------------

let vapidPret = false;
function vapidConfig(): boolean {
  if (vapidPret) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!pub || !priv || !subject) return false;
  webpush.setVapidDetails(subject, pub, priv);
  vapidPret = true;
  return true;
}

const TITRE_PUSH: Partial<Record<TypeNotification, string>> = {
  compte_valide: "Compte validé",
  shift_assigne: "Nouveau shift",
  shift_modifie: "Shift modifié",
  shift_retire: "Shift retiré",
  annonce: "Nouvelle annonce",
};

async function envoyerPush(
  utilisateurIds: string[],
  type: TypeNotification,
  contenu: string,
): Promise<void> {
  if (!vapidConfig() || utilisateurIds.length === 0) return;
  const titre = TITRE_PUSH[type] ?? "DeEplan";
  const corps = contenu.replace(/^📣\s*/, "").split("\n")[0].slice(0, 180);
  const payload = JSON.stringify({
    title: titre,
    body: corps,
    url: "/star/notifications",
    tag: type,
  });

  try {
    const supabase = await createClient();
    for (const userId of utilisateurIds) {
      const { data: subs } = await supabase.rpc("push_subscriptions_pour", {
        p_user: userId,
      });
      for (const s of subs ?? []) {
        if (s.type !== "web" || !s.p256dh || !s.auth) continue;
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
          );
        } catch (e: unknown) {
          const code = (e as { statusCode?: number }).statusCode;
          if (code === 404 || code === 410) {
            await supabase.rpc("supprimer_abonnement_push", {
              p_endpoint: s.endpoint,
            });
          }
        }
      }
    }
  } catch {
    // ignoré
  }
}

// --------------------------------------------------------------------------
// Notifications (ligne en base + push)
// --------------------------------------------------------------------------

/**
 * Crée une notification pour un utilisateur, puis envoie un push. **Best-effort**
 * — aucune erreur ne fait échouer l'action métier appelante.
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
  await envoyerPush([utilisateurId], type, contenu);
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
  await envoyerPush(utilisateurIds, type, contenu);
}
