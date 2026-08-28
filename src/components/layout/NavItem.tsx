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
}

export function NavItem({ href, label, icon, variant = "sidebar" }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  if (variant === "tab") {
    return (
      <Link
        href={href}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex flex-1 flex-col items-center gap-1 py-2.5 text-[9.5px] font-semibold",
          isActive ? "text-accent" : "text-ink-48",
        )}
      >
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
      <span>{label}</span>
    </Link>
  );
}
