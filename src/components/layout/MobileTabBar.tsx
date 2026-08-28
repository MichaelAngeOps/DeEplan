import type { NavEntry } from "@/lib/navigation";
import { NavItem } from "./NavItem";

export interface MobileTabBarProps {
  items: NavEntry[];
}

/** Barre d'onglets basse — espace Star sur mobile. */
export function MobileTabBar({ items }: MobileTabBarProps) {
  return (
    <nav className="flex flex-none border-t border-hairline bg-canvas">
      {items.map(({ href, shortLabel, icon: Icon }) => (
        <NavItem
          key={href}
          href={href}
          label={shortLabel}
          icon={<Icon size={18} />}
          variant="tab"
        />
      ))}
    </nav>
  );
}
