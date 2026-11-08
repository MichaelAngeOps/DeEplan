import { describe, expect, it } from "vitest";
import { enParallele } from "@/lib/parallele";

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("enParallele", () => {
  it("traite chaque élément une fois, sans dépasser la limite", async () => {
    let enCours = 0;
    let maximum = 0;
    const vus: number[] = [];
    await enParallele(
      Array.from({ length: 37 }, (_, i) => i),
      5,
      async (i) => {
        enCours += 1;
        maximum = Math.max(maximum, enCours);
        await pause(2);
        vus.push(i);
        enCours -= 1;
      },
    );
    expect(maximum).toBe(5);
    expect([...vus].sort((a, b) => a - b)).toEqual(Array.from({ length: 37 }, (_, i) => i));
  });

  it("gère une liste vide et une liste plus courte que la limite", async () => {
    await enParallele([], 10, async () => {
      throw new Error("jamais appelé");
    });
    const vus: string[] = [];
    await enParallele(["a", "b"], 10, async (x) => {
      vus.push(x);
    });
    expect(vus.sort()).toEqual(["a", "b"]);
  });

  it("va jusqu'au bout malgré une erreur, puis la signale", async () => {
    const vus: number[] = [];
    await expect(
      enParallele([1, 2, 3, 4], 2, async (i) => {
        if (i === 2) throw new Error("échec 2");
        vus.push(i);
      }),
    ).rejects.toThrow("échec 2");
    expect(vus.sort()).toEqual([1, 3, 4]);
  });
});
