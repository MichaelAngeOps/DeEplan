"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { journaliserErreur } from "@/lib/journal";
import { createClient } from "@/lib/supabase/client";

/**
 * Rafraîchit l'arbre RSC (pastille de nav + liste) dès qu'une notification est
 * insérée pour l'utilisateur courant — Supabase Realtime, RLS appliquée.
 */
export function RealtimeNotifications({ userId }: { userId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let annule = false;

    async function abonner() {
      // La session est lue de façon asynchrone. Sans cette attente, le canal peut être
      // rejoint sans jeton : la RLS filtre alors tous les événements, sans aucune erreur.
      await supabase.realtime.setAuth();
      if (annule) return;

      channel = supabase
        .channel(`notif:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `utilisateur_id=eq.${userId}`,
          },
          () => router.refresh(),
        )
        .subscribe((statut, erreur) => {
          if (statut === "CHANNEL_ERROR") {
            journaliserErreur("notifications/temps-reel", erreur ?? statut);
          }
        });
    }

    abonner().catch((e) => journaliserErreur("notifications/temps-reel", e));

    return () => {
      annule = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId, router]);

  return null;
}
