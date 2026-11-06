"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Banner, Button, Card, Input, Textarea } from "@/components/ui";
import { enregistrerReponses } from "@/lib/actions/reponses-formulaire";
import type {
  FormulaireStarDetail,
  QuestionFormulaire,
} from "@/lib/data/formulaires";
import {
  REPONSE_COURTE_MAX,
  REPONSE_LONGUE_MAX,
  dateFormulaire,
  validerReponses,
  type Reponses,
  type ValeurReponse,
} from "@/lib/formulaires-shared";

const OPTION =
  "flex cursor-pointer items-center gap-2.5 text-[13px] text-ink has-[:disabled]:cursor-default";

function ChampReponse({
  question: q,
  valeur,
  invalide,
  onChange,
}: {
  question: QuestionFormulaire;
  valeur: ValeurReponse | undefined;
  invalide: boolean;
  onChange: (v: ValeurReponse | undefined) => void;
}) {
  const nom = `q-${q.id}`;

  switch (q.type) {
    case "texte_court":
      return (
        <Input
          id={nom}
          value={typeof valeur === "string" ? valeur : ""}
          maxLength={REPONSE_COURTE_MAX}
          invalid={invalide}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "texte_long":
      return (
        <Textarea
          id={nom}
          rows={4}
          value={typeof valeur === "string" ? valeur : ""}
          maxLength={REPONSE_LONGUE_MAX}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "date":
      return (
        <Input
          id={nom}
          type="date"
          className="max-w-[220px]"
          value={typeof valeur === "string" ? valeur : ""}
          invalid={invalide}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "choix_unique":
      return (
        <div className="flex flex-col gap-2">
          {q.options.map((o) => (
            <label key={o} className={OPTION}>
              <input
                type="radio"
                name={nom}
                className="h-[18px] w-[18px] flex-none accent-accent"
                checked={valeur === o}
                onChange={() => onChange(o)}
              />
              {o}
            </label>
          ))}
        </div>
      );
    case "choix_multiple": {
      const coches = Array.isArray(valeur) ? valeur : [];
      return (
        <div className="flex flex-col gap-2">
          {q.options.map((o) => (
            <label key={o} className={OPTION}>
              <input
                type="checkbox"
                className="h-[18px] w-[18px] flex-none accent-accent"
                checked={coches.includes(o)}
                onChange={(e) =>
                  onChange(
                    e.target.checked
                      ? q.options.filter((x) => x === o || coches.includes(x))
                      : coches.filter((x) => x !== o),
                  )
                }
              />
              {o}
            </label>
          ))}
        </div>
      );
    }
    case "oui_non":
      return (
        <div className="flex gap-5">
          {[
            { label: "Oui", v: true },
            { label: "Non", v: false },
          ].map(({ label, v }) => (
            <label key={label} className={OPTION}>
              <input
                type="radio"
                name={nom}
                className="h-[18px] w-[18px] flex-none accent-accent"
                checked={valeur === v}
                onChange={() => onChange(v)}
              />
              {label}
            </label>
          ))}
        </div>
      );
  }
}

export function FormulaireStarRemplissage({
  formulaire: f,
}: {
  formulaire: FormulaireStarDetail;
}) {
  const [reponses, setReponses] = useState<Reponses>(f.reponses);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);
  const [modifie, setModifie] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [dateReponse, setDateReponse] = useState(f.dateReponse);
  const [ferme, setFerme] = useState(!f.modifiable);

  useEffect(() => {
    if (!modifie) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [modifie]);

  function changer(id: string, v: ValeurReponse | undefined) {
    setReponses((r) => {
      const copie = { ...r };
      if (v === undefined) delete copie[id];
      else copie[id] = v;
      return copie;
    });
    setErreurs((e) => {
      const copie = { ...e };
      delete copie[id];
      return copie;
    });
    setModifie(true);
    setSucces(false);
  }

  async function enregistrer(e: FormEvent) {
    e.preventDefault();
    setSucces(false);
    const locales = validerReponses(f.questions, reponses);
    if (Object.keys(locales).length > 0) {
      setErreurs(locales);
      setErreurGlobale("Vérifiez les réponses signalées.");
      return;
    }
    setErreurs({});
    setErreurGlobale(null);
    setEnCours(true);
    let res;
    try {
      res = await enregistrerReponses(f.id, reponses);
    } catch {
      res = { ok: false as const, erreur: "Enregistrement impossible. Vérifiez votre connexion et réessayez." };
    }
    setEnCours(false);
    if (res.ok) {
      setModifie(false);
      setSucces(true);
      setDateReponse(res.date);
    } else {
      setErreurs(res.erreurs ?? {});
      setErreurGlobale(res.erreur);
      if (res.erreur.startsWith("Ce formulaire n'est plus ouvert")) {
        setFerme(true);
        setModifie(false);
      }
    }
  }

  return (
    <div className="max-w-[640px]">
      <Link
        href="/star/formulaires"
        className="flex items-center gap-1.5 text-fine font-semibold text-ink-48"
      >
        <ChevronLeft size={15} />
        Retour aux formulaires
      </Link>

      <h2 className="mt-4 font-display text-[22px] font-semibold tracking-[-0.3px] text-ink">
        {f.titre}
      </h2>
      <p className="mt-0.5 text-fine text-ink-48">
        {f.departementNom}
        {f.datePublication && ` · Publié le ${dateFormulaire(f.datePublication)}`}
      </p>
      {f.description && (
        <p className="mt-3 whitespace-pre-wrap text-caption text-ink-80">{f.description}</p>
      )}

      {ferme && (
        <Banner tone="info" className="mt-4">
          {f.statut === "ferme" || f.modifiable
            ? "Ce formulaire est fermé : les réponses ne peuvent plus être modifiées."
            : "Vous ne faites plus partie de ce département : vos réponses ne peuvent plus être modifiées."}
        </Banner>
      )}
      {ferme && !dateReponse && (
        <p className="mt-3 text-caption text-ink-48">Vous n&apos;avez pas répondu à ce formulaire.</p>
      )}

      <form onSubmit={enregistrer} noValidate className="mt-5">
        <fieldset disabled={ferme || enCours} className="flex flex-col gap-4">
          {f.questions.map((q, i) => {
            const v = reponses[q.id];
            const effacable =
              !ferme &&
              !q.obligatoire &&
              v !== undefined &&
              (q.type === "choix_unique" || q.type === "oui_non");
            return (
              <Card key={q.id} padding="sm">
                <label
                  htmlFor={`q-${q.id}`}
                  className="mb-3 block text-caption-strong text-ink"
                >
                  {i + 1}. {q.libelle}
                  {q.obligatoire && <span className="text-danger"> *</span>}
                </label>
                <ChampReponse
                  question={q}
                  valeur={v}
                  invalide={!!erreurs[q.id]}
                  onChange={(nv) => changer(q.id, nv)}
                />
                {effacable && (
                  <button
                    type="button"
                    onClick={() => changer(q.id, undefined)}
                    className="mt-2 text-fine font-semibold text-ink-48"
                  >
                    Effacer ma réponse
                  </button>
                )}
                {erreurs[q.id] && (
                  <p role="alert" className="mt-2 text-fine text-danger">
                    {erreurs[q.id]}
                  </p>
                )}
              </Card>
            );
          })}
        </fieldset>

        {erreurGlobale && (
          <Banner tone="danger" className="mt-5">
            {erreurGlobale}
          </Banner>
        )}
        {succes && (
          <Banner tone="info" className="mt-5">
            Vos réponses sont enregistrées. Vous pouvez les modifier tant que le formulaire est ouvert.
          </Banner>
        )}

        {!ferme && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-fine text-ink-48">
              {dateReponse && `Dernière réponse le ${dateFormulaire(dateReponse)}`}
            </p>
            <Button type="submit" disabled={enCours}>
              {enCours ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
