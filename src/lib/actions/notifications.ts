"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth";
import { filtrerParEspace, type EspaceNotifications } from "@/lib/notifications-shared";
import { createClient } from "@/lib/supabase/server";

/** Marque une seule notification comme lue (clic sur une notification avec lien). */
export async function marquerNotificationLue(
  notificationId: string,
): Promise<{ ok: boolean }> {
  const user = await getUser();
  if (!user) return { ok: false };

  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ lu: true })
    .eq("id", notificationId)
    .eq("utilisateur_id", user.id);

  if (error) return { ok: false };

  revalidatePath("/star", "layout"); // pastille de navigation
  revalidatePath("/responsable", "layout");
  return { ok: true };
}

export async function marquerNotificationsLues(
  espace: EspaceNotifications = "star",
): Promise<{ ok: boolean }> {
  const user = await getUser();
  if (!user) return { ok: false };

  const supabase = await createClient();
  const { error } = await filtrerParEspace(
    supabase
      .from("notifications")
      .update({ lu: true })
      .eq("utilisateur_id", user.id)
      .eq("lu", false),
    espace,
  );

  if (error) return { ok: false };

  revalidatePath(espace === "responsable" ? "/responsable/notifications" : "/star/notifications");
  revalidatePath(espace === "responsable" ? "/responsable" : "/star", "layout"); // pastille
  return { ok: true };
}
