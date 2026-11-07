"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Briefcase,
  Building2,
  CalendarX,
  ChevronRight,
  ClipboardList,
  Megaphone,
  PartyPopper,
  Pencil,
  TriangleAlert,
} from "lucide-react";
import { Button, EmptyState } from "@/components/ui";
import { formatInstant } from "@/lib/dates";
import { cn } from "@/lib/cn";
import {
  marquerNotificationLue,
  marquerNotificationsLues,
} from "@/lib/actions/notifications";
import type { NotificationItem } from "@/lib/data/notifications";
import type { EspaceNotifications } from "@/lib/notifications-shared";

const ICONE: Record<string, ReactNode> = {
  compte_valide: <PartyPopper size={15} className="text-accent" />,
  shift_assigne: <Briefcase size={15} className="text-accent" />,
  shift_modifie: <Pencil size={15} className="text-accent" />,
  shift_retire: <CalendarX size={15} className="text-accent" />,
  annonce: <Megaphone size={15} className="text-accent" />,
  departement_cree: <Building2 size={15} className="text-accent" />,
  formulaire: <ClipboardList size={15} className="text-accent" />,
  conflit_dispo: <TriangleAlert size={15} className="text-danger" />,
};

function dateLisible(iso: string): string {
  return formatInstant(iso, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NotificationsClient({
  notifications,
  espace = "star",
}: {
  notifications: NotificationItem[];
  espace?: EspaceNotifications;
}) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);
  const [ouverture, setOuverture] = useState<string | null>(null);
  const nbNonLues = notifications.filter((n) => !n.lu).length;

  async function toutLire() {
    setEnCours(true);
    await marquerNotificationsLues(espace);
    setEnCours(false);
  }

  /** Marque comme lue puis ouvre le lien. Un échec du marquage ne bloque pas l'ouverture. */
  async function ouvrir(n: NotificationItem) {
    if (!n.lien) return;
    setOuverture(n.id);
    if (!n.lu) {
      try {
        await marquerNotificationLue(n.id);
      } catch {
        // ignoré
      }
    }
    router.push(n.lien);
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
        {notifications.map((n) => {
          const corps = (
            <>
              <span
                className={cn(
                  "mt-1.5 h-2 w-2 flex-none rounded-full",
                  n.lu ? "bg-transparent" : "bg-accent",
                )}
              />
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-parchment">
                {ICONE[n.type] ?? <Bell size={15} className="text-accent" />}
              </span>
              <span className="block min-w-0 flex-1">
                <span
                  className={cn(
                    "block whitespace-pre-wrap text-caption leading-relaxed text-ink",
                    !n.lu && "font-semibold",
                  )}
                >
                  {n.contenu}
                </span>
                <span className="mt-0.5 block text-fine text-ink-48">
                  {dateLisible(n.date)}
                </span>
              </span>
            </>
          );
          const classes =
            "flex w-full items-start gap-3 border-b border-hairline py-3.5 text-left last:border-0";

          return n.lien ? (
            <button
              key={n.id}
              type="button"
              onClick={() => ouvrir(n)}
              disabled={ouverture !== null}
              className={cn(classes, "transition-colors hover:bg-parchment disabled:opacity-60")}
            >
              {corps}
              <ChevronRight size={16} className="mt-1.5 flex-none text-ink-48" />
            </button>
          ) : (
            <div key={n.id} className={classes}>
              {corps}
            </div>
          );
        })}
      </div>
    </div>
  );
}
