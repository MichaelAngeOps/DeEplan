import { describe, expect, it } from "vitest";
import { filtrerParEspace, TYPES_RESPONSABLE } from "@/lib/notifications-shared";

function requete() {
  const appels: unknown[][] = [];
  const r = {
    appels,
    in(...a: unknown[]) {
      appels.push(["in", ...a]);
      return r;
    },
    not(...a: unknown[]) {
      appels.push(["not", ...a]);
      return r;
    },
  };
  return r;
}

describe("filtrerParEspace", () => {
  it("donne au responsable ses seuls types", () => {
    expect(filtrerParEspace(requete(), "responsable").appels).toEqual([
      ["in", "type", TYPES_RESPONSABLE],
    ]);
  });

  it("exclut ces types de l'espace star", () => {
    expect(filtrerParEspace(requete(), "star").appels).toEqual([
      ["not", "type", "in", "(conflit_dispo)"],
    ]);
  });
});
