import { describe, expect, it } from "vitest";
import { lireTout, TAILLE_TRANCHE } from "@/lib/supabase/pagination";

function source(total: number) {
  const appels: [number, number][] = [];
  const lire = async (debut: number, fin: number) => {
    appels.push([debut, fin]);
    const lignes = Array.from({ length: total }, (_, i) => i).slice(debut, fin + 1);
    return { data: lignes, error: null };
  };
  return { appels, lire };
}

describe("lireTout", () => {
  it("lit en une tranche quand tout tient dedans", async () => {
    const s = source(15);
    expect(await lireTout(s.lire)).toHaveLength(15);
    expect(s.appels).toEqual([[0, TAILLE_TRANCHE - 1]]);
  });

  it("récupère toutes les lignes au-delà de la limite, dans l'ordre", async () => {
    const s = source(2500);
    const lignes = await lireTout(s.lire);
    expect(lignes).toHaveLength(2500);
    expect(lignes).toEqual(Array.from({ length: 2500 }, (_, i) => i));
    expect(s.appels).toEqual([
      [0, 999],
      [1000, 1999],
      [2000, 2999],
    ]);
  });

  it("gère un total exactement égal à la taille d'une tranche", async () => {
    const s = source(TAILLE_TRANCHE);
    expect(await lireTout(s.lire)).toHaveLength(TAILLE_TRANCHE);
    expect(s.appels).toHaveLength(2);
  });

  it("gère une lecture vide", async () => {
    expect(await lireTout(source(0).lire)).toEqual([]);
  });

  it("signale une erreur, même après des tranches réussies, au lieu d'une liste partielle", async () => {
    let n = 0;
    await expect(
      lireTout(async () => {
        n += 1;
        if (n === 2) return { data: null, error: { message: "panne" } };
        return { data: Array.from({ length: TAILLE_TRANCHE }, () => 1), error: null };
      }),
    ).rejects.toThrow("panne");
  });

  it("s'arrête avec une erreur si la source ne finit jamais", async () => {
    await expect(
      lireTout(async () => ({
        data: Array.from({ length: TAILLE_TRANCHE }, () => 1),
        error: null,
      })),
    ).rejects.toThrow("Trop de lignes");
  });
});
