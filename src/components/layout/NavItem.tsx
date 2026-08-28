"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export interface NavItemProps {
  href: string;
  label: string;
  /** Icône déjà rendue (élément, pas un composant — contrainte Server→Client). */
  icon: ReactNode;
  /** `sidebar` (vertical) ou `tab` (tab bar mobile). */
  variant?: "sidebar" | "tab";
  /** Pastille de compteur (ex. notifications non lues). 0 / undefined = masquée. */
  badge?: number;
}

export function NavItem({
  href,
  label,
  icon,
  variant = "sidebar",
  badge,
}: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");
  const compteur = badge && badge > 0 ? (badge > 9 ? "9+" : String(badge)) : null;

  if (variant === "tab") {
    return (
      <Link
        href={href}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[9.5px] font-semibold",
          isActive ? "text-accent" : "text-ink-48",
        )}
      >
        {compteur && (
          <span className="absolute right-[22%] top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-accent px-1 text-[8px] font-bold text-white">
            {compteur}
          </span>
        )}
        {icon}
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-sm px-3 py-2.5 text-[13.5px] tracking-[-0.1px]",
        "transition-colors duration-fast ease-smooth",
        isActive
          ? "bg-accent text-white"
          : "text-on-dark-muted hover:bg-white/5 hover:text-on-dark",
      )}
    >
      <span className="flex-none">{icon}</span>
      <span className="flex-1">{label}</span>
      {compteur && (
        <span
          className={cn(
            "flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold",
            isActive ? "bg-white text-accent" : "bg-accent text-white",
          )}
        >
          {compteur}
        </span>
      )}
    </Link>
  );
}
