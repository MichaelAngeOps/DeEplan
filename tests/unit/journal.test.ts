import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import { journaliserErreur } from "@/lib/journal";

describe("journaliserErreur", () => {
  let console_: MockInstance<typeof console.error>;

  beforeEach(() => {
    console_ = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    console_.mockRestore();
  });

  const contenu = () => String(console_.mock.calls[0][1]);

  it("écrit le contexte et le message d'une erreur", () => {
    journaliserErreur("page/test", new Error("panne"));
    expect(console_.mock.calls[0][0]).toBe("[DeEplan] page/test");
    expect(JSON.parse(contenu())).toMatchObject({ type: "Error", message: "panne" });
  });

  it("garde le message et le code d'une erreur Supabase, jamais ses détails", () => {
    journaliserErreur("page/test", {
      message: "violation",
      code: "23505",
      details: "email=personne@exemple.ca",
    });
    expect(JSON.parse(contenu())).toMatchObject({ message: "violation", code: "23505" });
    expect(contenu()).not.toContain("personne@exemple.ca");
  });

  it("ignore les redirections et les 404 de Next.js", () => {
    journaliserErreur("page/test", { digest: "NEXT_REDIRECT;replace;/login;307;" });
    journaliserErreur("page/test", { digest: "NEXT_HTTP_ERROR_FALLBACK;404" });
    expect(console_).not.toHaveBeenCalled();
  });

  it("accepte n'importe quelle valeur et limite la longueur du message", () => {
    journaliserErreur("page/test", "texte");
    expect(JSON.parse(contenu()).message).toBe("texte");
    console_.mockClear();
    journaliserErreur("page/test", new Error("x".repeat(2000)));
    expect(JSON.parse(contenu()).message).toHaveLength(500);
  });
});
