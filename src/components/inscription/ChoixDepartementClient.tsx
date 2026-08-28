"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Info } from "lucide-react";
import { Button, Modal } from "@/components/ui";
import { cn } from "@/lib/cn";
import { choisirDepartement } from "@/lib/actions/choix-departement";

export function ChoixDepartementClient({
  departements,
}: {
  departements: { id: string; nom: string }[];
}) {
  const router = useRouter();
  const [choix, setChoix] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [confirmSansDept, setConfirmSansDept] = useState(false);

  async function valider() {
    if (!choix) return;
    setEnCours(true);
    setErreur(null);
    const res = await choisirDepartement(choix);
    // succès = redirection serveur ; on n'arrive ici qu'en cas d'erreur
    setEnCours(false);
    if (!res.ok) setErreur(res.erreur);
  }

  if (departements.length === 0) {
    return (
      <>
        <div className="flex items-start gap-2.5 rounded-md border border-hairline bg-parchment px-4 py-3">
          <Info size={16} className="mt-0.5 flex-none text-accent" />
          <p className="text-fine text-ink-80">
            Aucun département n&apos;est actif pour le moment. Vous serez notifié
            dès qu&apos;un département sera créé et pourrez alors le rejoindre.
          </p>
        </div>
        <Button
          fullWidth
          className="mt-5"
          onClick={() => setConfirmSansDept(true)}
        >
          Continuer
        </Button>

        {confirmSansDept && (
          <Modal
            open
            onClose={() => setConfirmSansDept(false)}
            title="Continuer sans département ?"
          >
            <p className="mt-2 text-caption text-ink-80">
              Votre compte sera créé en attente. Vous pourrez choisir votre
              département dès qu&apos;un sera disponible, puis attendre la
              validation du responsable.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setConfirmSansDept(false)}
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={() => router.replace("/compte-en-attente")}
              >
                Continuer
              </Button>
            </div>
          </Modal>
        )}
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {departements.map((d) => (
          <label
            key={d.id}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg border p-4 text-[14px] font-semibold",
              choix === d.id
                ? "border-accent bg-parchment text-ink"
                : "border-hairline bg-canvas text-ink-80",
            )}
          >
            <input
              type="radio"
              name="departement"
              checked={choix === d.id}
              onChange={() => {
                setChoix(d.id);
                setErreur(null);
              }}
              className="h-4 w-4 accent-accent"
            />
            {d.nom}
          </label>
        ))}
      </div>

      {erreur && (
        <p role="alert" className="mt-3 text-caption text-danger">
          {erreur}
        </p>
      )}

      <Button
        fullWidth
        className="mt-5"
        onClick={valider}
        disabled={!choix || enCours}
      >
        {enCours ? "Enregistrement…" : "Valider"}
      </Button>
    </>
  );
}
