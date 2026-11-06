"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Share2, Trash2 } from "lucide-react";
import { Banner, Button, Card, Field, Input, Modal } from "@/components/ui";
import {
  chargerPartageFormulaire,
  supprimerFormulaireFerme,
} from "@/lib/actions/formulaires";
import { definitionPdf, nomFichierPdf } from "@/lib/formulaires-pdf";
import { titreConfirmeCorrespond } from "@/lib/formulaires-shared";

/** Charge pdfmake seulement au clic : la bibliothèque et ses polices pèsent près de 2 Mo. */
async function genererPdf(id: string, titre: string): Promise<File> {
  const res = await chargerPartageFormulaire(id);
  if (!res.ok) throw new Error(res.erreur);

  const [{ default: pdfMake }, { default: polices }] = await Promise.all([
    import("pdfmake/build/pdfmake"),
    import("pdfmake/build/vfs_fonts"),
  ]);
  pdfMake.addVirtualFileSystem(polices);
  const blob = await pdfMake
    .createPdf(definitionPdf(res.formulaire, res.reponses))
    .getBlob();
  return new File([blob], nomFichierPdf(titre), { type: "application/pdf" });
}

function telecharger(fichier: File) {
  const url = URL.createObjectURL(fichier);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = fichier.name;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function ActionsFormulaireFerme({
  id,
  titre,
}: {
  id: string;
  titre: string;
}) {
  const router = useRouter();
  const fichier = useRef<File | null>(null);
  const [enCours, setEnCours] = useState<"telechargement" | "partage" | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [suppression, setSuppression] = useState(false);

  async function obtenirFichier(): Promise<File | null> {
    if (fichier.current) return fichier.current;
    try {
      fichier.current = await genererPdf(id, titre);
      return fichier.current;
    } catch (e) {
      setErreur(e instanceof Error && e.message ? e.message : "Création du PDF impossible.");
      return null;
    }
  }

  function reinitialiser() {
    setErreur(null);
    setInfo(null);
  }

  async function surTelechargement() {
    reinitialiser();
    setEnCours("telechargement");
    const f = await obtenirFichier();
    setEnCours(null);
    if (f) telecharger(f);
  }

  async function surPartage() {
    reinitialiser();
    const essai = new File([""], "essai.pdf", { type: "application/pdf" });
    if (!navigator.canShare?.({ files: [essai] })) {
      setInfo(
        "Le partage direct n'est pas disponible sur cet appareil. Téléchargez le PDF, puis envoyez-le avec l'application de votre choix.",
      );
      return;
    }

    setEnCours("partage");
    const f = await obtenirFichier();
    setEnCours(null);
    if (!f) return;

    try {
      await navigator.share({ files: [f], title: titre });
    } catch (e) {
      const nom = e instanceof Error ? e.name : "";
      if (nom === "NotAllowedError") {
        // La création du PDF a pu consommer le geste requis par le navigateur.
        setInfo("Le PDF est prêt. Cliquez de nouveau sur « Partager ».");
      } else if (nom !== "AbortError") {
        setErreur("Le partage a échoué. Téléchargez le PDF pour l'envoyer.");
      }
    }
  }

  return (
    <Card className="mt-5" title="Partager ou supprimer">
      <p className="text-caption text-ink-48">
        Le PDF contient les questions et les réponses de chaque star, avec leur nom. Partagez-le
        uniquement avec les personnes autorisées.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          leftIcon={<Download size={14} />}
          onClick={surTelechargement}
          disabled={enCours !== null}
        >
          {enCours === "telechargement" ? "Création du PDF…" : "Télécharger le PDF"}
        </Button>
        <Button
          variant="secondary"
          leftIcon={<Share2 size={14} />}
          onClick={surPartage}
          disabled={enCours !== null}
        >
          {enCours === "partage" ? "Création du PDF…" : "Partager"}
        </Button>
        <Button
          variant="danger"
          leftIcon={<Trash2 size={14} />}
          onClick={() => setSuppression(true)}
          disabled={enCours !== null}
        >
          Supprimer le formulaire
        </Button>
      </div>

      {erreur && (
        <Banner tone="danger" className="mt-4">
          {erreur}
        </Banner>
      )}
      {info && (
        <Banner tone="info" className="mt-4">
          {info}
        </Banner>
      )}

      {suppression && (
        <SuppressionModal
          id={id}
          titre={titre}
          onClose={() => setSuppression(false)}
          onSupprime={() => router.push("/responsable/annonces")}
        />
      )}
    </Card>
  );
}

function SuppressionModal({
  id,
  titre,
  onClose,
  onSupprime,
}: {
  id: string;
  titre: string;
  onClose: () => void;
  onSupprime: () => void;
}) {
  const [saisie, setSaisie] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const correspond = titreConfirmeCorrespond(saisie, titre);
  const aide = correspond
    ? "Titre confirmé. Vous pouvez supprimer le formulaire."
    : saisie.trim()
      ? "Le titre saisi ne correspond pas encore."
      : "Le bouton s'activera dès que le titre sera saisi.";

  async function confirmer() {
    setEnCours(true);
    setErreur(null);
    try {
      const res = await supprimerFormulaireFerme(id, saisie);
      if (res.ok) {
        onSupprime();
        return;
      }
      setErreur(res.erreur);
    } catch {
      setErreur("Suppression impossible. Vérifiez votre connexion et réessayez.");
    }
    setEnCours(false);
  }

  return (
    <Modal open onClose={onClose} title="Supprimer définitivement ce formulaire ?">
      <p className="mt-2 text-caption text-ink-80">
        Le formulaire et toutes ses réponses seront effacés, y compris sur les fiches des stars.
        Cette action est irréversible. Téléchargez le PDF avant si vous souhaitez en garder une
        copie.
      </p>
      <Field
        label={`Pour confirmer, saisissez le titre : ${titre}`}
        htmlFor="confirmation-titre"
        error={erreur ?? undefined}
        hint={aide}
        className="mt-4"
      >
        <Input
          id="confirmation-titre"
          value={saisie}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoFocus
          onChange={(e) => {
            setSaisie(e.target.value);
            setErreur(null);
          }}
        />
      </Field>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={enCours}>
          Annuler
        </Button>
        <Button variant="danger" onClick={confirmer} disabled={!correspond || enCours}>
          {enCours ? "Suppression…" : "Supprimer définitivement"}
        </Button>
      </div>
    </Modal>
  );
}
