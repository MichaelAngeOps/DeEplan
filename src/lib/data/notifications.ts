// Serveur uniquement (dépend de @/lib/supabase/server).
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { filtrerParEspace, type EspaceNotifications } from "@/lib/notifications-shared";
import type { TypeNotification } from "@/lib/notify";

export interface NotificationItem {
  id: string;
  type: TypeNotification | string;
  contenu: string;
  lu: boolean;
  date: string;
  /** Chemin interne ouvert au clic, si la notification est cliquable. */
  lien: string | null;
}

/** Un compte peut cumuler les rôles : chaque espace n'affiche que ses notifications. */
export const getNotifications = cache(
  async (userId: string, espace: EspaceNotifications = "star"): Promise<NotificationItem[]> => {
    const supabase = await createClient();
    const { data, error } = await filtrerParEspace(
      supabase
        .from("notifications")
        .select("id, type, contenu, lu, date_creation, lien")
        .eq("utilisateur_id", userId),
      espace,
    )
      .order("date_creation", { ascending: false })
      .limit(50);

    if (error) throw new Error("Chargement des notifications impossible.");

    return (data ?? []).map((n) => ({
      id: n.id,
      type: n.type,
      contenu: n.contenu,
      lu: n.lu,
      date: n.date_creation,
      lien: n.lien,
    }));
  },
);

/** Nombre de notifications non lues (pour la pastille de navigation). */
export const getNbNotificationsNonLues = cache(
  async (userId: string, espace: EspaceNotifications = "star"): Promise<number> => {
    const supabase = await createClient();
    const { count } = await filtrerParEspace(
      supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("utilisateur_id", userId)
        .eq("lu", false),
      espace,
    );
    return count ?? 0;
  },
);
