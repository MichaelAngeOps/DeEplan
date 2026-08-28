"use client";

import { useState, type ReactNode } from "react";
import {
  Bell,
  Briefcase,
  CalendarX,
  PartyPopper,
  Pencil,
} from "lucide-react";
import { Button, EmptyState } from "@/components/ui";
import { cn } from "@/lib/cn";
import { marquerNotificationsLues } from "@/lib/actions/notifications";
import type { NotificationItem } from "@/lib/data/notifications";

const ICONE: Record<string, ReactNode> = {
  compte_valide: <PartyPopper size={15} className="text-accent" />,
  shift_assigne: <Briefcase size={15} className="text-accent" />,
  shift_modifie: <Pencil size={15} className="text-accent" />,
  shift_retire: <CalendarX size={15} className="text-accent" />,
};

function dateLisible(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NotificationsClient({
  notifications,
}: {
  notifications: NotificationItem[];
}) {
  const [enCours, setEnCours] = useState(false);
  const nbNonLues = notifications.filter((n) => !n.lu).length;

  async function toutLire() {
    setEnCours(true);
    await marquerNotificationsLues();
    setEnCours(false);
  }

  if (notifications.length === 0) {
    return (
      <EmptyState
        className="mt-4 max-w-[560px]"
        icon={<Bell size={22} />}
        message="Aucune notification pour le moment."
      />
    );
  }

  return (
    <div className="mt-4 max-w-[560px]">
      {nbNonLues > 0 && (
        <div className="mb-3 flex justify-end">
          <Button size="sm" variant="secondary" onClick={toutLire} disabled={enCours}>
            {enCours ? "…" : "Tout marquer comme lu"}
          </Button>
        </div>
      )}

      <div className="flex flex-col">
        {notifications.map((n) => (
          <div
            key={n.id}
            className="flex items-start gap-3 border-b border-hairline py-3.5 last:border-0"
          >
            <span
              className={cn(
                "mt-1.5 h-2 w-2 flex-none rounded-full",
                n.lu ? "bg-transparent" : "bg-accent",
              )}
            />
            <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-parchment">
              {ICONE[n.type] ?? <Bell size={15} className="text-accent" />}
            </span>
            <div className="flex-1">
              <p
                className={cn(
                  "text-caption leading-relaxed text-ink",
                  !n.lu && "font-semibold",
                )}
              >
                {n.contenu}
              </p>
              <p className="mt-0.5 text-fine text-ink-48">{dateLisible(n.date)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
