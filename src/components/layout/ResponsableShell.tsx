import { RESPONSABLE_NAV } from "@/lib/navigation";
import { Sidebar, type SidebarUser } from "./Sidebar";

export interface ResponsableShellProps {
  user: SidebarUser;
  /** Contenu injecté sous la sidebar (liens démo, déconnexion). */
  sidebarFooter?: React.ReactNode;
  children: React.ReactNode;
}

/** Squelette de l'espace Responsable : sidebar 248px + zone de contenu. */
export function ResponsableShell({
  user,
  sidebarFooter,
  children,
}: ResponsableShellProps) {
  return (
    <div className="flex min-h-screen bg-parchment text-ink">
      <Sidebar
        subtitle="Planning · Responsable"
        items={RESPONSABLE_NAV}
        user={user}
        width={248}
        footerExtra={sidebarFooter}
        className="sticky top-0 h-screen"
      />
      <main className="relative min-w-0 flex-1 px-5 pb-20 pt-9 lg:px-11">
        {children}
      </main>
    </div>
  );
}
