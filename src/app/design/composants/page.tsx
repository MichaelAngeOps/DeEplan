"use client";

import { useState } from "react";
import { Pencil, Trash2, Plus, Check, X, Inbox } from "lucide-react";
import {
  Avatar,
  Banner,
  Button,
  Card,
  Checkbox,
  Chip,
  EmptyState,
  Field,
  IconButton,
  Input,
  Legend,
  Modal,
  MonthNavigator,
  Select,
  Skeleton,
  Spinner,
  StatusBadge,
  Textarea,
  type StatutAffichage,
} from "@/components/ui";

/** Galerie temporaire des primitifs UI (Lot 0a). À retirer plus tard. */

function Row({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-xxl">
      <h2 className="mb-md font-display text-tag font-semibold text-ink">{title}</h2>
      <div className="flex flex-wrap items-center gap-4">{children}</div>
    </section>
  );
}

const STATUTS: StatutAffichage[] = [
  "pas_en_service",
  "de_service",
  "a_servi",
  "na_pas_servi",
  "a_confirmer",
];

export default function ComposantsPage() {
  const [modal, setModal] = useState(false);
  const [chips, setChips] = useState<Record<string, boolean>>({ Accueil: true });
  const [month, setMonth] = useState(8);
  const monthLabel = new Date(2026, month - 1, 1).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  return (
    <main className="mx-auto max-w-container-text px-xl py-xxl">
      <h1 className="font-display text-dlg font-semibold text-ink">Composants — Lot 0a</h1>
      <p className="mt-xs text-body text-ink-48">
        Galerie de vérification visuelle. Route temporaire.
      </p>

      <Row title="Button — variantes">
        <Button variant="primary">Principal</Button>
        <Button variant="secondary">Secondaire</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="dashed" leftIcon={<Plus size={13} />}>
          Ajouter un poste
        </Button>
        <Button disabled>Désactivé</Button>
      </Row>

      <Row title="Button — tailles + icônes">
        <Button size="sm" leftIcon={<Check size={14} />}>
          A servi
        </Button>
        <Button size="md" leftIcon={<Plus size={14} />}>
          Nouvelle section
        </Button>
        <Button size="lg" fullWidth={false}>
          Créer mon compte
        </Button>
      </Row>

      <Row title="IconButton">
        <IconButton label="Modifier" icon={<Pencil size={15} />} />
        <IconButton label="Supprimer" icon={<Trash2 size={15} />} />
        <IconButton variant="outline" label="Valider" icon={<Check size={15} />} />
        <IconButton variant="outline" size="sm" label="Fermer" icon={<X size={13} />} />
      </Row>

      <Row title="Champs de formulaire">
        <div className="flex w-full max-w-[420px] flex-col gap-4">
          <Field label="Email" htmlFor="f-email" required>
            <Input id="f-email" type="email" placeholder="vous@exemple.com" />
          </Field>
          <Field
            label="Mot de passe"
            htmlFor="f-pwd"
            error="Au moins 8 caractères."
          >
            <Input id="f-pwd" type="password" invalid placeholder="••••••••" />
          </Field>
          <Field label="Section" htmlFor="f-sec" hint="Filtrer l'annuaire.">
            <Select id="f-sec" defaultValue="all">
              <option value="all">Toutes les sections</option>
              <option value="accueil">Accueil</option>
              <option value="resto">Restauration</option>
            </Select>
          </Field>
          <Field label="Description" htmlFor="f-desc">
            <Textarea id="f-desc" placeholder="Décrivez votre département…" />
          </Field>
          <Checkbox id="f-cb" label="Je suis Responsable" defaultChecked />
        </div>
      </Row>

      <Row title="Card">
        <Card
          title="Stars de service aujourd'hui"
          headerAction={<span className="text-caption text-ink-48">5 planifiées</span>}
          className="w-full max-w-[420px]"
        >
          <p className="text-caption text-ink-48">Contenu de la carte.</p>
        </Card>
      </Row>

      <Row title="Avatar">
        <Avatar name="Camille Morel" size="xs" />
        <Avatar name="Nora Haddad" size="sm" />
        <Avatar name="Julien Dubois" size="md" />
        <Avatar name="Léa Martin" size="lg" />
        <span className="rounded-md bg-tile-1 p-2">
          <Avatar name="Camille Morel" size="sm" onDark />
        </span>
      </Row>

      <Row title="StatusBadge — chip">
        {STATUTS.map((s) => (
          <StatusBadge key={s} statut={s} />
        ))}
      </Row>
      <Row title="StatusBadge — dot">
        {STATUTS.map((s) => (
          <StatusBadge key={s} statut={s} variant="dot" />
        ))}
      </Row>

      <Row title="Chip">
        {["Accueil", "Restauration", "Logistique", "Sécurité"].map((c) => (
          <Chip
            key={c}
            selected={!!chips[c]}
            onToggle={() => setChips((p) => ({ ...p, [c]: !p[c] }))}
          >
            {c}
          </Chip>
        ))}
        <Chip>Non interactif</Chip>
      </Row>

      <Row title="Banner">
        <div className="flex w-full flex-col gap-3">
          <Banner tone="info">Votre rôle Star est en attente de validation.</Banner>
          <Banner tone="warning">Statuts non confirmés depuis 24h.</Banner>
          <Banner tone="danger">Conflit de disponibilité non résolu.</Banner>
        </div>
      </Row>

      <Row title="MonthNavigator">
        <MonthNavigator
          label={monthLabel[0].toUpperCase() + monthLabel.slice(1)}
          onPrev={() => setMonth((m) => (m <= 1 ? 12 : m - 1))}
          onNext={() => setMonth((m) => (m >= 12 ? 1 : m + 1))}
        />
        <MonthNavigator
          size="sm"
          label={monthLabel[0].toUpperCase() + monthLabel.slice(1)}
          onPrev={() => setMonth((m) => (m <= 1 ? 12 : m - 1))}
          onNext={() => setMonth((m) => (m >= 12 ? 1 : m + 1))}
        />
      </Row>

      <Row title="Legend">
        <Legend
          items={[
            { dotClassName: "bg-hairline", label: "Pas en service" },
            { dotClassName: "bg-accent", label: "De service" },
            { dotClassName: "bg-success", label: "A servi" },
            { dotClassName: "bg-danger", label: "N'a pas servi" },
            { dotClassName: "bg-warning", label: "À confirmer" },
          ]}
        />
      </Row>

      <Row title="Spinner / Skeleton">
        <Spinner size="sm" />
        <Spinner size="md" />
        <Spinner size="lg" />
        <div className="flex w-full max-w-[320px] flex-col gap-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </Row>

      <Row title="EmptyState">
        <EmptyState
          icon={<Inbox size={22} />}
          title="Aucun compte en attente"
          message="Les nouvelles inscriptions apparaîtront ici."
          action={<Button size="sm">Actualiser</Button>}
          className="w-full max-w-[420px]"
        />
      </Row>

      <Row title="Modal">
        <Button onClick={() => setModal(true)}>Ouvrir la modale</Button>
        <Modal
          open={modal}
          onClose={() => setModal(false)}
          title="Règle des dimanches"
          subtitle="Restauration · Bar · 17 août"
        >
          <p className="mb-5 text-caption text-ink-80">
            Nora Haddad est déjà planifiée sur 3 dimanches ce mois-ci. Continuer ?
          </p>
          <div className="flex gap-2.5">
            <Button variant="secondary" fullWidth onClick={() => setModal(false)}>
              Annuler
            </Button>
            <Button fullWidth onClick={() => setModal(false)}>
              Planifier quand même
            </Button>
          </div>
        </Modal>
      </Row>
    </main>
  );
}
