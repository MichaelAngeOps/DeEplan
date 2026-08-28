import Link from "next/link";
import { ChevronRight, ClockAlert, TriangleAlert, UserPlus } from "lucide-react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/cn";
import { dateCourteFr } from "@/lib/dates";
import type { ConflitDispo, ShiftAConfirmer } from "@/lib/data/dashboard";

export function AlertesPanel({
  conflits,
  aConfirmer,
  nbEnAttente,
}: {
  conflits: ConflitDispo[];
  aConfirmer: ShiftAConfirmer[];
  nbEnAttente: number;
}) {
  const alerteActive = conflits.length > 0 || aConfirmer.length > 0;

  return (
    <Card
      title="Alertes"
      className={cn(
        alerteActive && "border-danger ring-2 ring-danger/30",
      )}
    >
      <Bloc
        icon={<ClockAlert size={15} className="text-warning" />}
        titre="Statuts non confirmés depuis 24 h"
        alerte={aConfirmer.length > 0}
      >
        {aConfirmer.length === 0 ? (
          <Vide>Aucun.</Vide>
        ) : (
          aConfirmer.map((s, i) => (
            <Item key={i}>
              {s.starNom} · {s.posteNom} · {dateCourteFr(s.date)}
            </Item>
          ))
        )}
      </Bloc>

      <Bloc
        icon={<TriangleAlert size={15} className="text-danger" />}
        titre="Conflits de disponibilité non résolus"
        alerte={conflits.length > 0}
      >
        {conflits.length === 0 ? (
          <Vide>Aucun conflit.</Vide>
        ) : (
          conflits.map((c) => (
            <Item key={c.planningId}>
              {c.starNom} est indisponible le {dateCourteFr(c.date)} mais planifié
              à {c.posteNom}.
            </Item>
          ))
        )}
      </Bloc>

      <Link
        href="/responsable/validations"
        className="flex items-center justify-between rounded-md bg-parchment px-3.5 py-3 transition-colors hover:bg-parchment/70"
      >
        <span className="flex items-center gap-2 text-caption-strong text-ink">
          <UserPlus size={15} className="text-accent" />
          Comptes en attente de validation
        </span>
        <span className="flex items-center gap-1 text-caption-strong text-accent">
          {nbEnAttente}
          <ChevronRight size={15} />
        </span>
      </Link>
    </Card>
  );
}

function Bloc({
  icon,
  titre,
  alerte,
  children,
}: {
  icon: React.ReactNode;
  titre: string;
  alerte?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "mb-4 rounded-md p-3",
        alerte
          ? "border border-danger/60 bg-danger/5"
          : "border border-transparent",
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <span className="text-caption-strong text-ink">{titre}</span>
      </div>
      <div className="pl-[23px]">{children}</div>
    </div>
  );
}

function Item({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-b border-hairline py-2 text-fine leading-relaxed text-ink-48 last:border-0">
      {children}
    </p>
  );
}

function Vide({ children }: { children: React.ReactNode }) {
  return <p className="py-1 text-fine text-ink-48">{children}</p>;
}
