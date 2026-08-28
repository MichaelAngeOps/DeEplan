import { LogoMark } from "@/components/Logo";
import { Avatar } from "@/components/ui";
import type { NavEntry } from "@/lib/navigation";
import { cn } from "@/lib/cn";
import { NavItem } from "./NavItem";

export interface SidebarUser {
  name: string;
  role: string;
}

export interface SidebarProps {
  /** Sous-titre sous le nom « DeEplan » (ex. « Planning · Responsable »). */
  subtitle: string;
  items: NavEntry[];
  user: SidebarUser;
  /** Largeur (248px Responsable, 220px Star). */
  width?: number;
  /** Contenu additionnel en bas (liens démo, déconnexion…). */
  footerExtra?: React.ReactNode;
  className?: string;
}

export function Sidebar({
  subtitle,
  items,
  user,
  width = 248,
  footerExtra,
  className,
}: SidebarProps) {
  return (
    <aside
      style={{ width }}
      className={cn(
        "flex flex-none flex-col bg-tile-1 text-on-dark",
        className,
      )}
    >
      <div className="flex items-center gap-2.5 border-b border-white/10 px-5 py-4">
        <LogoMark width={20} height={20} className="text-on-dark" />
        <div>
          <div className="font-display text-[13px] font-semibold tracking-[-0.2px] text-on-dark">
            DeEplan
          </div>
          <div className="text-[10.5px] tracking-[-0.1px] text-on-dark-muted">
            {subtitle}
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
        {items.map(({ href, label, icon: Icon }) => (
          <NavItem
            key={href}
            href={href}
            label={label}
            icon={<Icon size={17} />}
          />
        ))}
      </nav>

      <div className="flex items-center gap-2.5 border-t border-white/10 px-5 py-4">
        <Avatar name={user.name} size="sm" onDark />
        <div>
          <div className="text-[12.5px] font-semibold text-on-dark">{user.name}</div>
          <div className="text-[11px] text-on-dark-muted">{user.role}</div>
        </div>
      </div>

      {footerExtra && (
        <div className="border-t border-white/10 px-5 py-3 text-[12px] text-on-dark-muted">
          {footerExtra}
        </div>
      )}
    </aside>
  );
}
