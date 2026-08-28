"use client";

import { useEffect, useMemo, useState } from "react";
import { Banner, Button, Legend, MonthNavigator } from "@/components/ui";
import { enregistrerDisponibilites } from "@/lib/actions/disponibilites";
import type { DisposMap } from "@/lib/data/disponibilites";
import { aujourdhuiISO, libelleMois } from "@/lib/dates";
import type { StatutDisponibilite } from "@/types/domain";
import { MoisCalendrier } from "./MoisCalendrier";

type EtatJour = StatutDisponibilite | null;

/** Cycle au clic : non renseigné → disponible → indisponible → non renseigné. */
function suivant(etat: EtatJour): EtatJour {
  if (etat === null) return "disponible";
  if (etat === "disponible") return "indisponible";
  return null;
}

const LEGENDE = [
  { dotClassName: "bg-success", label: "Disponible" },
  { dotClassName: "bg-danger", label: "Indisponible" },
  { dotClassName: "bg-hairline", label: "Non renseigné" },
];

export function DisponibilitesClient({
  dispos,
  joursAvecShift,
  moisEditables,
}: {
  dispos: DisposMap;
  joursAvecShift: string[];
  moisEditables: { annee: number; mois: number }[];
}) {
  const [index, setIndex] = useState(0);
  const [modifs, setModifs] = useState<Record<string, EtatJour>>({});
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const [succes, setSucces] = useState(false);

  const aujourdhui = aujourdhuiISO();
  const shiftSet = useMemo(() => new Set(joursAvecShift), [joursAvecShift]);
  const { annee, mois } = moisEditables[index];

  const etatOriginal = (dateISO: string): EtatJour => dispos[dateISO] ?? null;
  const etatDuJour = (dateISO: string): EtatJour =>
    dateISO in modifs ? modifs[dateISO] : etatOriginal(dateISO);

  /** Changements réels (différents de l'état enregistré). */
  const changements = useMemo(
    () =>
      Object.entries(modifs)
        .filter(([date, statut]) => statut !== (dispos[date] ?? null))
        .map(([date, statut]) => ({ date, statut })),
    [modifs, dispos],
  );

  const conflits = useMemo(
    () =>
      changements
        .filter((c) => shiftSet.has(c.date) && c.statut !== "disponible")
        .map((c) => c.date)
        .sort(),
    [changements, shiftSet],
  );

  useEffect(() => {
    if (changements.length === 0) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [changements.length]);

  function cliquerJour(dateISO: string) {
    setSucces(false);
    setModifs((prev) => ({
      ...prev,
      [dateISO]: suivant(dateISO in prev ? prev[dateISO] : etatOriginal(dateISO)),
    }));
  }

  async function enregistrer() {
    if (changements.length === 0) return;
    setChargement(true);
    setErreur(null);
    const res = await enregistrerDisponibilites(changements);
    setChargement(false);
    if (res.ok) {
      setModifs({});
      setSucces(true);
    } else {
      setErreur(res.erreur);
    }
  }

  return (
    <>
      <h2 className="font-display text-[20px] font-semibold tracking-[-0.3px] text-ink">
        Mes disponibilités
      </h2>
      <p className="mt-1 text-caption text-ink-48">
        Sélectionnez vos disponibilités pour {libelleMois(annee, mois)}. Cliquez
        sur une date pour basculer disponible / indisponible.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
        <MonthNavigator
          size="sm"
          label={libelleMois(annee, mois)}
          onPrev={() => setIndex((i) => Math.max(0, i - 1))}
          onNext={() => setIndex((i) => Math.min(moisEditables.length - 1, i + 1))}
          prevDisabled={index === 0}
          nextDisabled={index === moisEditables.length - 1}
        />
        <Legend items={LEGENDE} />
      </div>

      <div className="mt-4 max-w-[520px]">
        <MoisCalendrier
          annee={annee}
          mois={mois}
          etatDuJour={etatDuJour}
          jourEditable={(dateISO) => dateISO >= aujourdhui}
          aShift={(dateISO) => shiftSet.has(dateISO)}
          onJourClick={cliquerJour}
        />
      </div>

      {shiftSet.size > 0 && (
        <p className="mt-3 flex items-center gap-1.5 text-fine text-ink-48">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Un point indique un shift déjà planifié ce jour-là.
        </p>
      )}

      {conflits.length > 0 && (
        <Banner tone="warning" className="mt-4 max-w-[520px]">
          Vous avez un shift planifié le{" "}
          {conflits.map((d) => d.split("-").reverse().join("/")).join(", ")}. En
          vous déclarant non disponible, prévenez votre responsable.
        </Banner>
      )}

      {erreur && (
        <p role="alert" className="mt-4 text-caption text-danger">
          {erreur}
        </p>
      )}
      {succes && changements.length === 0 && (
        <p className="mt-4 text-caption text-success">
          Disponibilités enregistrées.
        </p>
      )}

      <div className="mt-5 flex items-center gap-3">
        <Button onClick={enregistrer} disabled={chargement || changements.length === 0}>
          {chargement ? "Enregistrement…" : "Enregistrer mes disponibilités"}
        </Button>
        {changements.length > 0 && (
          <span className="text-fine text-ink-48">
            {changements.length} modification{changements.length > 1 ? "s" : ""} non
            enregistrée{changements.length > 1 ? "s" : ""}
          </span>
        )}
      </div>
    </>
  );
}
