"use client";

import { useEffect, useState } from "react";
import { BellOff, BellRing } from "lucide-react";
import { Button } from "@/components/ui";
import {
  enregistrerAbonnementPush,
  supprimerAbonnementPush,
} from "@/lib/actions/push";

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

type Etat = "chargement" | "non_supporte" | "inactif" | "actif";

export function PushToggle() {
  const [etat, setEtat] = useState<Etat>("chargement");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    if (
      !VAPID ||
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      setEtat("non_supporte");
      return;
    }
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setEtat(sub ? "actif" : "inactif"))
      .catch(() => setEtat("non_supporte"));
  }, []);

  async function activer() {
    setEnCours(true);
    setErreur(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setErreur(
          "Autorisation refusée. Activez les notifications pour ce site dans votre navigateur.",
        );
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID,
      });
      const json = sub.toJSON() as {
        endpoint?: string;
        keys?: { p256dh?: string; auth?: string };
      };
      const res = await enregistrerAbonnementPush({
        endpoint: json.endpoint ?? "",
        keys: {
          p256dh: json.keys?.p256dh ?? "",
          auth: json.keys?.auth ?? "",
        },
      });
      if (res.ok) setEtat("actif");
      else {
        setErreur(res.erreur);
        await sub.unsubscribe().catch(() => {});
      }
    } catch {
      setErreur("Activation impossible.");
    } finally {
      setEnCours(false);
    }
  }

  async function desactiver() {
    setEnCours(true);
    setErreur(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await supprimerAbonnementPush(sub.endpoint);
        await sub.unsubscribe();
      }
      setEtat("inactif");
    } catch {
      setErreur("Désactivation impossible.");
    } finally {
      setEnCours(false);
    }
  }

  if (etat === "chargement" || etat === "non_supporte") return null;

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-hairline bg-canvas px-4 py-3">
      <div className="flex items-center gap-2.5">
        {etat === "actif" ? (
          <BellRing size={16} className="text-success" />
        ) : (
          <BellOff size={16} className="text-ink-48" />
        )}
        <span className="text-caption text-ink">
          Notifications push{" "}
          {etat === "actif" ? "activées sur cet appareil" : "désactivées"}
        </span>
      </div>
      <Button
        size="sm"
        variant={etat === "actif" ? "secondary" : "primary"}
        onClick={etat === "actif" ? desactiver : activer}
        disabled={enCours}
      >
        {enCours ? "…" : etat === "actif" ? "Désactiver" : "Activer"}
      </Button>
      {erreur && (
        <p role="alert" className="w-full text-fine text-danger">
          {erreur}
        </p>
      )}
    </div>
  );
}
