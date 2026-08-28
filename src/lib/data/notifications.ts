// Serveur uniquement (dépend de @/lib/supabase/server).
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { TypeNotification } from "@/lib/notify";

export interface NotificationItem {
  id: string;
  type: TypeNotification | string;
  contenu: string;
  lu: boolean;
  date: string;
}

/** Notifications de l'utilisateur, les plus récentes d'abord. RLS : les siennes. */
export const getNotifications = cache(
  async (userId: string): Promise<NotificationItem[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("notifications")
      .select("id, type, contenu, lu, date_creation")
      .eq("utilisateur_id", userId)
      .order("date_creation", { ascending: false })
      .limit(50);

    if (error) throw new Error("Chargement des notifications impossible.");

    return (data ?? []).map((n) => ({
      id: n.id,
      type: n.type,
      contenu: n.contenu,
      lu: n.lu,
      date: n.date_creation,
    }));
  },
);

/** Nombre de notifications non lues (pour la pastille de navigation). */
export const getNbNotificationsNonLues = cache(
  async (userId: string): Promise<number> => {
    const supabase = await createClient();
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("utilisateur_id", userId)
      .eq("lu", false);
    return count ?? 0;
  },
);
