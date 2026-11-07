// Serveur uniquement (dépend de @/lib/supabase/server).
import { journaliserErreur } from "@/lib/journal";
import webpush from "web-push";
import { aujourdhuiISO } from "@/lib/dates";
import { messageConflit } from "@/lib/planning-shared";
import { clientAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type TypeNotification =
  | "compte_valide"
  | "shift_assigne"
  | "shift_modifie"
  | "shift_retire"
  | "annonce"
  | "departement_cree"
  | "formulaire"
  | "conflit_dispo";

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
  formulaire: "Nouveau formulaire",
  conflit_dispo: "Conflit de disponibilité",
};

async function envoyerPush(
  utilisateurIds: string[],
  type: TypeNotification,
  contenu: string,
  lien?: string,
): Promise<void> {
  if (!vapidConfig() || utilisateurIds.length === 0) return;
  const titre = TITRE_PUSH[type] ?? "DeEplan";
  const corps = contenu.replace(/^📣\s*/, "").split("\n")[0].slice(0, 180);
  const payload = JSON.stringify({
    title: titre,
    body: corps,
    url: lien ?? "/star/notifications",
    tag: type,
  });

  try {
    const supabase = await createClient();
    for (const userId of utilisateurIds) {
      const { data: subs, error } = await supabase.rpc("push_subscriptions_pour", {
        p_user: userId,
      });
      if (error) journaliserErreur("notify/abonnements", error);
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
          } else {
            journaliserErreur("notify/push", e);
          }
        }
      }
    }
  } catch (e) {
    journaliserErreur("notify/push", e);
  }
}

// --------------------------------------------------------------------------
// Notifications (ligne en base + push)
// --------------------------------------------------------------------------

/**
 * Crée une notification pour un utilisateur, puis envoie un push. **Best-effort**
 * — aucune erreur ne fait échouer l'action métier appelante.
 *
 * `lien` : chemin interne (`/star/…`) ouvert au clic sur la notification ou le
 * push. La base refuse tout lien externe.
 */
export async function notifier(
  utilisateurId: string,
  type: TypeNotification,
  contenu: string,
  lien?: string,
): Promise<void> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("notifications")
      .insert({ utilisateur_id: utilisateurId, type, contenu, lien: lien ?? null });
    if (error) journaliserErreur(`notify/${type}`, error);
  } catch (e) {
    journaliserErreur(`notify/${type}`, e);
  }
  await envoyerPush([utilisateurId], type, contenu, lien);
}

/** Notifie en lot plusieurs utilisateurs (même type / contenu). Best-effort. */
export async function notifierPlusieurs(
  utilisateurIds: string[],
  type: TypeNotification,
  contenu: string,
  lien?: string,
): Promise<void> {
  if (utilisateurIds.length === 0) return;
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("notifications")
      .insert(
        utilisateurIds.map((utilisateur_id) => ({
          utilisateur_id,
          type,
          contenu,
          lien: lien ?? null,
        })),
      );
    if (error) journaliserErreur(`notify/${type}`, error);
  } catch (e) {
    journaliserErreur(`notify/${type}`, e);
  }
  await envoyerPush(utilisateurIds, type, contenu, lien);
}

/** Vrai si le serveur peut envoyer un push à un responsable. */
export function pushResponsableActif(): boolean {
  return clientAdmin() !== null && vapidConfig();
}

/**
 * Push aux responsables concernés quand le star connecté devient indisponible un jour de shift.
 * La notification en base est créée par un déclencheur ; seul l'envoi passe ici, avec le client
 * admin, car la session du star ne peut pas lire les abonnements d'un responsable. Best-effort.
 */
export async function pousserConflitsAuxResponsables(
  starId: string,
  dates: string[],
): Promise<void> {
  if (dates.length === 0 || !vapidConfig()) return;
  const admin = clientAdmin();
  if (!admin) return;

  try {
    const { data: shifts, error } = await admin
      .from("plannings")
      .select(
        "date, utilisateurs!plannings_star_id_fkey ( prenom, nom ), postes!inner ( nom, sections!inner ( departements!inner ( responsable_id ) ) )",
      )
      .eq("star_id", starId)
      .in("date", dates)
      .gte("date", aujourdhuiISO());
    if (error) throw error;

    for (const shift of shifts ?? []) {
      const u = shift.utilisateurs as { prenom: string; nom: string } | null;
      const poste = shift.postes as unknown as {
        nom: string;
        sections: { departements: { responsable_id: string } };
      };
      const responsableId = poste.sections.departements.responsable_id;

      const { data: abonnements, error: erreurAbonnements } = await admin
        .from("push_subscriptions")
        .select("id, endpoint, p256dh, auth")
        .eq("user_id", responsableId)
        .eq("type", "web");
      if (erreurAbonnements) throw erreurAbonnements;

      const payload = JSON.stringify({
        title: TITRE_PUSH.conflit_dispo,
        body: messageConflit(shift.date, poste.nom, `${u?.prenom ?? ""} ${u?.nom ?? ""}`.trim()),
        url: "/responsable/dashboard",
        tag: "conflit_dispo",
      });

      for (const a of abonnements ?? []) {
        if (!a.p256dh || !a.auth) continue;
        try {
          await webpush.sendNotification(
            { endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } },
            payload,
          );
        } catch (e: unknown) {
          const code = (e as { statusCode?: number }).statusCode;
          if (code === 404 || code === 410) {
            await admin.from("push_subscriptions").delete().eq("id", a.id);
          } else {
            journaliserErreur("notify/push-responsable", e);
          }
        }
      }
    }
  } catch (e) {
    journaliserErreur("notify/push-responsable", e);
  }
}
