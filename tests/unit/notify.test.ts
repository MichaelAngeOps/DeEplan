import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// Rien ne sort : `after`, l'envoi de push et les clients Supabase sont simulés.
const etat = vi.hoisted(() => ({
  taches: [] as (() => Promise<void>)[],
  enCours: 0,
  maximum: 0,
  echec: new Map<string, number>(),
  rpc: [] as [string, Record<string, unknown>][],
  inserts: [] as unknown[],
  lecturesAbonnementsAdmin: 0,
  suppressionsAdmin: 0,
}));

vi.mock("next/server", () => ({
  after: (tache: () => Promise<void>) => {
    etat.taches.push(tache);
  },
}));

vi.mock("web-push", () => ({
  default: {
    setVapidDetails: () => {},
    sendNotification: async (abonnement: { endpoint: string }) => {
      etat.enCours += 1;
      etat.maximum = Math.max(etat.maximum, etat.enCours);
      await new Promise((r) => setTimeout(r, 3));
      etat.enCours -= 1;
      const code = etat.echec.get(abonnement.endpoint);
      if (code) throw Object.assign(new Error(`push ${code}`), { statusCode: code });
    },
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: () => ({
      insert: async (lignes: unknown) => {
        etat.inserts.push(lignes);
        return { error: null };
      },
    }),
    rpc: async (nom: string, args: Record<string, unknown>) => {
      etat.rpc.push([nom, args]);
      if (nom === "push_subscriptions_pour")
        return {
          data: [{ type: "web", endpoint: `https://push/${args.p_user}`, p256dh: "k", auth: "a" }],
          error: null,
        };
      return { data: null, error: null };
    },
  }),
}));

// Chaîne de requête minimale : chaque méthode renvoie la chaîne, `await` donne le résultat.
function chaine(resultat: () => unknown) {
  const c: Record<string, unknown> = {};
  for (const m of ["select", "eq", "in", "gte", "delete"]) c[m] = () => c;
  c.then = (ok: (v: unknown) => void) => ok(resultat());
  return c;
}

vi.mock("@/lib/supabase/admin", () => ({
  clientAdmin: () => ({
    from: (table: string) => {
      if (table === "plannings")
        return chaine(() => ({
          data: ["2099-01-01", "2099-01-02", "2099-01-03"].map((date) => ({
            date,
            utilisateurs: { prenom: "Ana", nom: "Essai" },
            postes: { nom: "Accueil", sections: { departements: { responsable_id: "resp-1" } } },
          })),
          error: null,
        }));
      return {
        select: () => {
          etat.lecturesAbonnementsAdmin += 1;
          return chaine(() => ({
            data: [{ id: "ab-1", endpoint: "https://push/resp-1", p256dh: "k", auth: "a" }],
            error: null,
          }));
        },
        delete: () => {
          etat.suppressionsAdmin += 1;
          return chaine(() => ({ error: null }));
        },
      };
    },
  }),
}));

const { notifierPlusieurs, pousserConflitsAuxResponsables } = await import("@/lib/notify");

async function executerApresReponse() {
  const taches = etat.taches.splice(0);
  for (const t of taches) await t();
  return taches.length;
}

describe("envoi des push", () => {
  beforeAll(() => {
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "pub";
    process.env.VAPID_PRIVATE_KEY = "priv";
    process.env.VAPID_SUBJECT = "mailto:essai@test.deeplan";
  });

  let console_: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    Object.assign(etat, {
      taches: [],
      enCours: 0,
      maximum: 0,
      echec: new Map(),
      rpc: [],
      inserts: [],
      lecturesAbonnementsAdmin: 0,
      suppressionsAdmin: 0,
    });
    console_ = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => console_.mockRestore());

  it("écrit les notifications tout de suite et envoie les push après la réponse, 10 à la fois au plus", async () => {
    const ids = Array.from({ length: 65 }, (_, i) => `star-${i}`);
    await notifierPlusieurs(ids, "annonce", "📣 Réunion lundi");

    expect(etat.inserts).toHaveLength(1);
    expect(etat.inserts[0]).toHaveLength(65);
    expect(etat.rpc).toHaveLength(0);

    expect(await executerApresReponse()).toBe(1);
    expect(etat.rpc.filter(([n]) => n === "push_subscriptions_pour")).toHaveLength(65);
    expect(etat.maximum).toBeGreaterThan(1);
    expect(etat.maximum).toBeLessThanOrEqual(10);
  });

  it("supprime un abonnement expiré et journalise les autres échecs sans s'arrêter", async () => {
    etat.echec.set("https://push/star-1", 410);
    etat.echec.set("https://push/star-2", 500);
    await notifierPlusieurs(["star-1", "star-2", "star-3"], "annonce", "Réunion");
    await executerApresReponse();

    const suppressions = etat.rpc.filter(([n]) => n === "supprimer_abonnement_push");
    expect(suppressions).toEqual([["supprimer_abonnement_push", { p_endpoint: "https://push/star-1" }]]);
    expect(console_).toHaveBeenCalledTimes(1);
    expect(String(console_.mock.calls[0][0])).toContain("notify/push");
  });

  it("prévient le responsable après la réponse, en lisant ses abonnements une seule fois", async () => {
    await pousserConflitsAuxResponsables("star-1", ["2099-01-01", "2099-01-02", "2099-01-03"]);
    expect(etat.lecturesAbonnementsAdmin).toBe(0);

    expect(await executerApresReponse()).toBe(1);
    expect(etat.lecturesAbonnementsAdmin).toBe(1);
    expect(etat.maximum).toBeGreaterThanOrEqual(1);
    expect(console_).not.toHaveBeenCalled();
  });

  it("supprime l'abonnement expiré d'un responsable", async () => {
    etat.echec.set("https://push/resp-1", 404);
    await pousserConflitsAuxResponsables("star-1", ["2099-01-01"]);
    await executerApresReponse();
    expect(etat.suppressionsAdmin).toBe(3);
  });
});
