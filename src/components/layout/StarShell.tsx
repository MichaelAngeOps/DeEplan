import { STAR_NAV } from "@/lib/navigation";
import { Sidebar, type SidebarUser } from "./Sidebar";
import { MobileTabBar } from "./MobileTabBar";

export interface StarShellProps {
  user: SidebarUser;
  /** Titre affiché dans le header mobile (page courante). */
  mobileTitle: string;
  sidebarFooter?: React.ReactNode;
  /** Pastilles de compteur par href (ex. `{ "/star/notifications": 3 }`). */
  badges?: Record<string, number>;
  children: React.ReactNode;
}

/**
 * Squelette de l'espace Star, responsive :
 * - ≥ md : sidebar 220px + contenu
 * - < md : header + contenu + tab bar basse
 */
export function StarShell({
  user,
  mobileTitle,
  sidebarFooter,
  badges,
  children,
}: StarShellProps) {
  return (
    <div className="flex min-h-screen bg-parchment text-ink">
      {/* Desktop */}
      <Sidebar
        subtitle="Planning · Star"
        items={STAR_NAV}
        user={user}
        width={220}
        footerExtra={sidebarFooter}
        badges={badges}
        className="sticky top-0 hidden h-screen md:flex"
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header mobile */}
        <header className="flex flex-none items-center justify-between border-b border-hairline bg-canvas px-5 py-3.5 md:hidden">
          <span className="font-display text-[15px] font-semibold text-ink">
            {mobileTitle}
          </span>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto p-6">{children}</main>

        {/* Tab bar mobile */}
        <div className="md:hidden">
          <MobileTabBar items={STAR_NAV} badges={badges} />
        </div>
      </div>
    </div>
  );
}
