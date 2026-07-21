import {
  LayoutDashboard, Users, GraduationCap, BookOpen, CalendarDays,
  ClipboardList, Wallet, BarChart3, Settings, UserCheck, Target,
  Home, Megaphone, Layers, Banknote, Wrench, MessageSquare, type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Ko'rinishi uchun kerakli permission(lar) — kamida bittasi. */
  perm?: string | string[];
  /** Faqat o'qituvchi paneli uchun (permissiondan mustaqil). */
  teacherOnly?: boolean;
}

export interface NavSection {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    id: "asosiy", label: "Asosiy", icon: Home,
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, perm: "dashboard.view" }],
  },
  {
    id: "crm", label: "CRM", icon: Megaphone,
    items: [
      { href: "/leads", label: "Lidlar", icon: Target, perm: "leads.view" },
      { href: "/sms", label: "SMS xabarlar", icon: MessageSquare, perm: "sms.view" },
    ],
  },
  {
    id: "talim", label: "Ta'lim", icon: BookOpen,
    items: [
      { href: "/courses", label: "Kurslar", icon: Layers, perm: "courses.view" },
      { href: "/groups", label: "Guruhlar", icon: Users, perm: "groups.view" },
      { href: "/schedule", label: "Jadval", icon: CalendarDays, perm: "schedule.view" },
      { href: "/attendance", label: "Davomat", icon: UserCheck, perm: "attendance.view" },
    ],
  },
  {
    id: "odamlar", label: "Odamlar", icon: GraduationCap,
    items: [
      { href: "/students", label: "O'quvchilar", icon: GraduationCap, perm: "students.view" },
      { href: "/teachers", label: "O'qituvchilar", icon: ClipboardList, perm: "teachers.view" },
    ],
  },
  {
    id: "moliya", label: "Moliyaviy", icon: Banknote,
    items: [
      { href: "/finance", label: "Moliya", icon: Wallet, perm: ["payments.view", "expenses.view"] },
      { href: "/reports", label: "Hisobotlar", icon: BarChart3, perm: "reports.view" },
    ],
  },
  {
    id: "shaxsiy", label: "Shaxsiy", icon: Banknote,
    items: [{ href: "/salary", label: "Oyligim", icon: Wallet, teacherOnly: true }],
  },
  {
    id: "tizim", label: "Tizim", icon: Wrench,
    items: [{ href: "/settings", label: "Sozlamalar", icon: Settings, perm: "settings.view" }],
  },
];

/** Item permission bo'yicha ko'rinadimi. permissions bo'sh bo'lsa (yuklanmagan) — role fallback. */
export function itemVisible(perm: NavItem["perm"], permissions: string[] | undefined): boolean {
  if (!perm) return true;
  if (!permissions || permissions.length === 0) return false;
  if (permissions.includes("*")) return true;
  const list = Array.isArray(perm) ? perm : [perm];
  return list.some((p) => permissions.includes(p));
}

export function getActiveSection(pathname: string): string {
  for (const s of navSections) {
    if (s.items.some(i => pathname === i.href || pathname?.startsWith(i.href + "/"))) return s.id;
  }
  return "asosiy";
}
