import { redirect } from "next/navigation";
import Link from "next/link";
import { PartyPopper } from "lucide-react";
import { AuthShell } from "@/components/layout";
import { createClient } from "@/lib/supabase/server";
import { getAcces } from "@/lib/auth";

export default async function BienvenuePage() {
  const acces = await getAcces();
  if (!acces) redirect("/login");
  if (!acces.estResponsable) redirect("/apres-login");

  const supabase = await createClient();
  const { data: dept } = await supabase
    .from("departements")
    .select("nom")
    .eq("id", acces.departementId ?? "")
    .maybeSingle();

  return (
    <AuthShell>
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-parchment">
          <PartyPopper size={24} className="text-accent" />
        </span>
        <h1 className="font-display text-[20px] font-semibold tracking-[-0.3px] text-ink">
          Bienvenue{dept?.nom ? ` dans le département ${dept.nom}` : ""}
        </h1>
        <p className="text-caption text-ink-80">
          Votre espace est prêt. Créez vos sections et vos postes, puis planifiez
          les shifts de votre équipe.
        </p>
        <Link
          href="/responsable/dashboard"
          className="mt-2 w-full rounded-pill bg-accent px-5 py-3 text-[14px] font-semibold text-white"
        >
          Continuer
        </Link>
      </div>
    </AuthShell>
  );
}
