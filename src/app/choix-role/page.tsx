import { redirect } from "next/navigation";
import Link from "next/link";
import { Briefcase, ChevronRight, Star } from "lucide-react";
import { AuthShell } from "@/components/layout";
import { getAcces } from "@/lib/auth";

export default async function ChoixRolePage() {
  const acces = await getAcces();
  if (!acces) redirect("/login");

  const doubleRole = acces.estResponsable && acces.star?.statut === "valide";
  if (!doubleRole) redirect("/apres-login");

  const options = [
    {
      href: "/responsable/dashboard",
      icon: <Briefcase size={18} className="text-accent" />,
      label: "Continuer en tant que Responsable",
    },
    {
      href: "/star/calendrier",
      icon: <Star size={18} className="text-accent" />,
      label: "Continuer en tant que Star",
    },
  ];

  return (
    <AuthShell heading="Continuer en tant que" subheading="Vos deux rôles sont validés. Choisissez l'espace à ouvrir.">
      <div className="flex flex-col gap-3">
        {options.map((o) => (
          <Link
            key={o.href}
            href={o.href}
            className="flex items-center gap-3.5 rounded-lg border border-hairline bg-canvas p-[18px] transition-colors hover:border-accent"
          >
            <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full bg-parchment">
              {o.icon}
            </span>
            <span className="flex-1 text-[14.5px] font-semibold text-ink">
              {o.label}
            </span>
            <ChevronRight size={16} className="text-ink-48" />
          </Link>
        ))}
      </div>
    </AuthShell>
  );
}
