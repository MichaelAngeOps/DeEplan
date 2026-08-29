"use server";

import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type PushResultat = { ok: true } | { ok: false; erreur: string };

export interface AbonnementWeb {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/** Enregistre un abonnement web push pour l'utilisateur courant. */
export async function enregistrerAbonnementPush(
  sub: AbonnementWeb,
): Promise<PushResultat> {
  const user = await getUser();
  if (!user) return { ok: false, erreur: "Session expirée." };
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth)
    return { ok: false, erreur: "Abonnement invalide." };

  const supabase = await createClient();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      type: "web",
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    },
    { onConflict: "user_id,endpoint" },
  );
  if (error) return { ok: false, erreur: "Enregistrement impossible. Réessayez." };
  return { ok: true };
}

/** Supprime un abonnement (l'utilisateur a désactivé les notifications). */
export async function supprimerAbonnementPush(
  endpoint: string,
): Promise<PushResultat> {
  const user = await getUser();
  if (!user) return { ok: false, erreur: "Session expirée." };

  const supabase = await createClient();
  await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);
  return { ok: true };
}
