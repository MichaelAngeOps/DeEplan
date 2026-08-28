"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { EmptyState, Input, Select } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { StarAnnuaire } from "@/lib/data/annuaire";

function sansAccents(v: string): string {
  return v
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function AnnuaireClient({ stars }: { stars: StarAnnuaire[] }) {
  const [recherche, setRecherche] = useState("");
  const [section, setSection] = useState("__all__");

  const sections = useMemo(
    () => [...new Set(stars.flatMap((s) => s.sections))].sort((a, b) => a.localeCompare(b, "fr")),
    [stars],
  );

  const filtres = stars.filter((s) => {
    const okSection = section === "__all__" || s.sections.includes(section);
    const okNom =
      recherche.trim() === "" ||
      sansAccents(s.nom).includes(sansAccents(recherche.trim()));
    return okSection && okNom;
  });

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-48"
          />
          <Input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un nom"
            className="w-[240px] pl-9"
          />
        </div>
        <Select value={section} onChange={(e) => setSection(e.target.value)}>
          <option value="__all__">Toutes les sections</option>
          {sections.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <span className="text-fine text-ink-48">
          {filtres.length} star{filtres.length > 1 ? "s" : ""}
        </span>
      </div>

      {filtres.length === 0 ? (
        <EmptyState message="Aucun star ne correspond." />
      ) : (
        <div className="max-w-full overflow-x-auto rounded-lg border border-hairline bg-canvas">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr className="border-b border-hairline text-[12px] font-semibold text-ink-48">
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Sections</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Dimanches (mois)</th>
              </tr>
            </thead>
            <tbody>
              {filtres.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-hairline last:border-0 hover:bg-parchment/50"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/responsable/stars/${s.id}`}
                      className="text-[13px] font-semibold text-ink hover:text-accent"
                    >
                      {s.nom}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-fine text-ink-48">
                    {s.sections.join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-pill px-2 py-0.5 text-[10.5px] font-semibold",
                        s.statut === "valide"
                          ? "bg-success/10 text-success"
                          : s.statut === "desactive"
                            ? "bg-danger/10 text-danger"
                            : "bg-warning/10 text-warning",
                      )}
                    >
                      {s.statut === "valide"
                        ? "Actif"
                        : s.statut === "desactive"
                          ? "Désactivé"
                          : "En attente"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-[13px] text-ink">
                    {s.dimanchesMois}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
