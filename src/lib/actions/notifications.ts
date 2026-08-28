"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function marquerNotificationsLues(): Promise<{ ok: boolean }> {
  const user = await getUser();
  if (!user) return { ok: false };

  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ lu: true })
    .eq("utilisateur_id", user.id)
    .eq("lu", false);

  if (error) return { ok: false };

  revalidatePath("/star/notifications");
  revalidatePath("/star", "layout"); // pastille de navigation
  return { ok: true };
}
