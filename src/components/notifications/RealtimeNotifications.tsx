"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { journaliserErreur } from "@/lib/journal";
import { createClient } from "@/lib/supabase/client";

/**
 * Rafraîchit l'arbre RSC (pastille de nav + liste) dès qu'une notification est
 * insérée pour l'utilisateur courant — Supabase Realtime, RLS appliquée.
 *
 * Les notifications reçues en rafale (plusieurs shifts attribués d'affilée) donnent un seul
 * rafraîchissement, décalé au hasard pour que tout un département ne recharge pas à la même seconde.
 */
const DELAI_MIN_MS = 500;
const DELAI_ALEATOIRE_MS = 1500;

export function RealtimeNotifications({ userId }: { userId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let annule = false;
    let minuterie: ReturnType<typeof setTimeout> | null = null;

    function rafraichirBientot() {
      if (minuterie) return;
      minuterie = setTimeout(
        () => {
          minuterie = null;
          if (!annule) router.refresh();
        },
        DELAI_MIN_MS + Math.random() * DELAI_ALEATOIRE_MS,
      );
    }

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
          rafraichirBientot,
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
      if (minuterie) clearTimeout(minuterie);
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId, router]);

  return null;
}
