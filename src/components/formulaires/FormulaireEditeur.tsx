"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ChevronLeft, Plus, Trash2, X } from "lucide-react";
import {
  Banner,
  Button,
  Card,
  Checkbox,
  Field,
  IconButton,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import {
  enregistrerBrouillon,
  publierFormulaire,
  supprimerBrouillon,
} from "@/lib/actions/formulaires";
import type { FormulaireDetail } from "@/lib/data/formulaires";
import {
  DESCRIPTION_MAX,
  LIBELLE_MAX,
  OPTION_MAX,
  TITRE_MAX,
  TYPES_QUESTION,
  estTypeChoix,
  validerFormulaire,
  type ErreursFormulaire,
  type FormulaireSaisie,
  type QuestionSaisie,
} from "@/lib/formulaires-shared";
import type { TypeQuestion } from "@/types/domain";
import { ConfirmationModal } from "./ConfirmationModal";

const PATH_LISTE = "/responsable/annonces";
const AUCUNE_ERREUR: ErreursFormulaire = { questions: {} };

type Confirmation = "publier" | "supprimer" | "quitter" | null;

export function FormulaireEditeur({ initial }: { initial?: FormulaireDetail }) {
  const router = useRouter();
  const compteur = useRef(0);
  const nouvelleCle = () => `q${(compteur.current += 1)}`;

  const [id, setId] = useState(initial?.id);
  const [titre, setTitre] = useState(initial?.titre ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [questions, setQuestions] = useState<QuestionSaisie[]>(() =>
    (initial?.questions ?? []).map((q) => ({
      cle: q.id,
      libelle: q.libelle,
      type: q.type,
      options: q.options,
      obligatoire: q.obligatoire,
    })),
  );
  const [modifie, setModifie] = useState(false);
  const [erreurs, setErreurs] = useState<ErreursFormulaire>(AUCUNE_ERREUR);
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [enregistrement, setEnregistrement] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation>(null);

  useEffect(() => {
    if (!modifie) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [modifie]);

  const saisie: FormulaireSaisie = { titre, description, questions };

  function signalerModif() {
    setModifie(true);
    setMessage(null);
  }

  function majQuestion(cle: string, maj: Partial<QuestionSaisie>) {
    setQuestions((qs) => qs.map((q) => (q.cle === cle ? { ...q, ...maj } : q)));
    signalerModif();
  }

  function changerType(q: QuestionSaisie, type: TypeQuestion) {
    const options =
      estTypeChoix(type) && q.options.length < 2
        ? [...q.options, ...Array<string>(2 - q.options.length).fill("")]
        : q.options;
    majQuestion(q.cle, { type, options });
  }

  function ajouterQuestion() {
    setQuestions((qs) => [
      ...qs,
      { cle: nouvelleCle(), libelle: "", type: "texte_court", options: [], obligatoire: false },
    ]);
    signalerModif();
  }

  function retirerQuestion(cle: string) {
    setQuestions((qs) => qs.filter((q) => q.cle !== cle));
    signalerModif();
  }

  function deplacer(index: number, sens: -1 | 1) {
    setQuestions((qs) => {
      const copie = [...qs];
      [copie[index], copie[index + sens]] = [copie[index + sens], copie[index]];
      return copie;
    });
    signalerModif();
  }

  /** Reporte le résultat d'une action. Renvoie le message d'erreur, ou `null`. */
  function appliquerErreur(res: {
    erreur: string;
    erreurs?: ErreursFormulaire;
    id?: string;
  }): string {
    if (res.id) memoriserId(res.id);
    setErreurs(res.erreurs ?? AUCUNE_ERREUR);
    setErreurGlobale(res.erreurs?.general ?? res.erreur);
    return res.erreurs?.general ?? res.erreur;
  }

  function memoriserId(nouvelId: string) {
    if (id === nouvelId) return;
    setId(nouvelId);
    window.history.replaceState(null, "", `${PATH_LISTE}/formulaires/${nouvelId}`);
  }

  async function enregistrer() {
    setMessage(null);
    const locales = validerFormulaire(saisie, { publication: false });
    if (locales) {
      setErreurs(locales);
      setErreurGlobale(locales.general ?? "Corrigez les champs signalés.");
      return;
    }
    setErreurs(AUCUNE_ERREUR);
    setErreurGlobale(null);
    setEnregistrement(true);
    const res = await enregistrerBrouillon(saisie, id);
    setEnregistrement(false);
    if (res.ok) {
      memoriserId(res.id);
      setModifie(false);
      setMessage("Brouillon enregistré.");
    } else {
      appliquerErreur(res);
    }
  }

  function demanderPublication() {
    setMessage(null);
    const locales = validerFormulaire(saisie, { publication: true });
    if (locales) {
      setErreurs(locales);
      setErreurGlobale(locales.general ?? "Corrigez les champs signalés.");
      return;
    }
    setErreurs(AUCUNE_ERREUR);
    setErreurGlobale(null);
    setConfirmation("publier");
  }

  async function publier(): Promise<string | null> {
    const res = await publierFormulaire(saisie, id);
    if (!res.ok) return appliquerErreur(res);
    setModifie(false);
    router.push(`${PATH_LISTE}/formulaires/${res.id}`);
    return null;
  }

  async function supprimer(): Promise<string | null> {
    if (!id) return null;
    const res = await supprimerBrouillon(id);
    if (!res.ok) return res.erreur;
    setModifie(false);
    router.push(PATH_LISTE);
    return null;
  }

  return (
    <div className="max-w-[760px]">
      <button
        type="button"
        onClick={() => (modifie ? setConfirmation("quitter") : router.push(PATH_LISTE))}
        className="flex items-center gap-1.5 text-fine font-semibold text-ink-48"
      >
        <ChevronLeft size={15} />
        Retour aux annonces
      </button>

      <h1 className="mt-4 font-display text-[28px] font-semibold leading-tight tracking-[-0.4px] text-ink">
        {id ? "Modifier le brouillon" : "Créer un formulaire"}
      </h1>
      <p className="mt-1 text-body text-ink-48">
        Une fois publié, le formulaire ne peut plus être modifié.
      </p>

      <Card className="mt-6">
        <div className="flex flex-col gap-4">
          <Field label="Titre" htmlFor="f-titre" required error={erreurs.titre}>
            <Input
              id="f-titre"
              value={titre}
              invalid={!!erreurs.titre}
              maxLength={TITRE_MAX}
              placeholder="Ex. : Préférences pour le mois de décembre"
              onChange={(e) => {
                setTitre(e.target.value);
                signalerModif();
              }}
            />
          </Field>
          <Field
            label="Description"
            htmlFor="f-description"
            error={erreurs.description}
            hint="Facultatif. Affichée en haut du formulaire."
          >
            <Textarea
              id="f-description"
              rows={3}
              value={description}
              maxLength={DESCRIPTION_MAX}
              onChange={(e) => {
                setDescription(e.target.value);
                signalerModif();
              }}
            />
          </Field>
        </div>
      </Card>

      <div className="mt-5 flex flex-col gap-4">
        {questions.map((q, index) => (
          <Card key={q.cle} padding="sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-caption-strong text-ink">Question {index + 1}</h2>
              <div className="flex gap-1">
                <IconButton
                  size="sm"
                  label="Monter la question"
                  icon={<ArrowUp size={15} />}
                  disabled={index === 0}
                  onClick={() => deplacer(index, -1)}
                />
                <IconButton
                  size="sm"
                  label="Descendre la question"
                  icon={<ArrowDown size={15} />}
                  disabled={index === questions.length - 1}
                  onClick={() => deplacer(index, 1)}
                />
                <IconButton
                  size="sm"
                  label="Supprimer la question"
                  icon={<Trash2 size={15} />}
                  onClick={() => retirerQuestion(q.cle)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_190px]">
              <Field label="Question" htmlFor={`q-${q.cle}`} required>
                <Input
                  id={`q-${q.cle}`}
                  value={q.libelle}
                  maxLength={LIBELLE_MAX}
                  invalid={!!erreurs.questions[q.cle]}
                  onChange={(e) => majQuestion(q.cle, { libelle: e.target.value })}
                />
              </Field>
              <Field label="Type de réponse" htmlFor={`t-${q.cle}`}>
                <Select
                  id={`t-${q.cle}`}
                  value={q.type}
                  onChange={(e) => changerType(q, e.target.value as TypeQuestion)}
                >
                  {TYPES_QUESTION.map((t) => (
                    <option key={t.valeur} value={t.valeur}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            {estTypeChoix(q.type) && (
              <div className="mt-4 flex flex-col gap-2">
                <p className="text-[12px] font-semibold text-ink-80">Options</p>
                {q.options.map((option, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      aria-label={`Option ${i + 1}`}
                      value={option}
                      maxLength={OPTION_MAX}
                      placeholder={`Option ${i + 1}`}
                      onChange={(e) =>
                        majQuestion(q.cle, {
                          options: q.options.map((o, j) => (j === i ? e.target.value : o)),
                        })
                      }
                    />
                    <IconButton
                      size="sm"
                      label={`Retirer l'option ${i + 1}`}
                      icon={<X size={15} />}
                      onClick={() =>
                        majQuestion(q.cle, {
                          options: q.options.filter((_, j) => j !== i),
                        })
                      }
                    />
                  </div>
                ))}
                <div>
                  <Button
                    size="sm"
                    variant="dashed"
                    leftIcon={<Plus size={13} />}
                    onClick={() => majQuestion(q.cle, { options: [...q.options, ""] })}
                  >
                    Ajouter une option
                  </Button>
                </div>
              </div>
            )}

            {erreurs.questions[q.cle] && (
              <p role="alert" className="mt-3 text-fine text-danger">
                {erreurs.questions[q.cle]}
              </p>
            )}

            <div className="mt-4">
              <Checkbox
                id={`o-${q.cle}`}
                label="Réponse obligatoire"
                checked={q.obligatoire}
                onChange={(e) => majQuestion(q.cle, { obligatoire: e.target.checked })}
              />
            </div>
          </Card>
        ))}

        <Button
          variant="dashed"
          fullWidth
          leftIcon={<Plus size={14} />}
          onClick={ajouterQuestion}
        >
          Ajouter une question
        </Button>
      </div>

      {erreurGlobale && (
        <Banner tone="danger" className="mt-5">
          {erreurGlobale}
        </Banner>
      )}
      {message && (
        <Banner tone="info" className="mt-5">
          {message}
        </Banner>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          {id && (
            <Button variant="danger" onClick={() => setConfirmation("supprimer")}>
              Supprimer le brouillon
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={enregistrer} disabled={enregistrement}>
            {enregistrement ? "Enregistrement…" : "Enregistrer le brouillon"}
          </Button>
          <Button onClick={demanderPublication} disabled={enregistrement}>
            Publier
          </Button>
        </div>
      </div>

      {confirmation === "publier" && (
        <ConfirmationModal
          titre="Publier le formulaire"
          message="Les stars du département recevront une notification. Les questions ne pourront plus être modifiées."
          confirmLabel="Publier"
          enCoursLabel="Publication…"
          onClose={() => setConfirmation(null)}
          onConfirm={publier}
        />
      )}
      {confirmation === "supprimer" && (
        <ConfirmationModal
          titre="Supprimer le brouillon"
          message={`« ${titre || "Sans titre"} » sera définitivement supprimé.`}
          confirmLabel="Supprimer"
          enCoursLabel="Suppression…"
          danger
          onClose={() => setConfirmation(null)}
          onConfirm={supprimer}
        />
      )}
      {confirmation === "quitter" && (
        <ConfirmationModal
          titre="Quitter sans enregistrer ?"
          message="Vos dernières modifications seront perdues."
          confirmLabel="Quitter"
          enCoursLabel="…"
          danger
          onClose={() => setConfirmation(null)}
          onConfirm={async () => {
            setModifie(false);
            router.push(PATH_LISTE);
            return null;
          }}
        />
      )}
    </div>
  );
}
