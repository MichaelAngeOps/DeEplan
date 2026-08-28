import {
  Bell,
  CalendarDays,
  Clock,
  FolderTree,
  LayoutDashboard,
  Megaphone,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavEntry {
  /** Segment de route (sous `/responsable` ou `/star`). */
  href: string;
  label: string;
  /** Libellé court pour la tab bar mobile. */
  shortLabel: string;
  icon: LucideIcon;
}

export const RESPONSABLE_NAV: NavEntry[] = [
  { href: "/responsable/dashboard", label: "Tableau de bord", shortLabel: "Bord", icon: LayoutDashboard },
  { href: "/responsable/planning", label: "Planification mensuelle", shortLabel: "Planning", icon: CalendarDays },
  { href: "/responsable/structure", label: "Structure", shortLabel: "Structure", icon: FolderTree },
  { href: "/responsable/stars", label: "Annuaire des stars", shortLabel: "Stars", icon: Users },
  { href: "/responsable/validations", label: "Comptes en attente", shortLabel: "En attente", icon: UserPlus },
  { href: "/responsable/annonces", label: "Annonces", shortLabel: "Annonces", icon: Megaphone },
];

export const STAR_NAV: NavEntry[] = [
  { href: "/star/calendrier", label: "Mon calendrier", shortLabel: "Calendrier", icon: CalendarDays },
  { href: "/star/disponibilites", label: "Mes disponibilités", shortLabel: "Dispos", icon: Clock },
  { href: "/star/notifications", label: "Notifications", shortLabel: "Notifs", icon: Bell },
];
