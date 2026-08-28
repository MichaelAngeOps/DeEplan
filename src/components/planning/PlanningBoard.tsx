"use client";

import { useState } from "react";
import type { PlanningMois } from "@/lib/planning-shared";
import { AssignationModal } from "./AssignationModal";
import { PlanningGrid, type CelluleCliquee } from "./PlanningGrid";

export function PlanningBoard({
  annee,
  mois,
  planning,
}: {
  annee: number;
  mois: number;
  planning: PlanningMois;
}) {
  const [cellule, setCellule] = useState<CelluleCliquee | null>(null);

  return (
    <>
      <PlanningGrid
        annee={annee}
        mois={mois}
        planning={planning}
        onCellClick={setCellule}
      />
      {cellule && (
        <AssignationModal cellule={cellule} onClose={() => setCellule(null)} />
      )}
    </>
  );
}
