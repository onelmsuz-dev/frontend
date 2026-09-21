import {
  LayoutDashboard, Users, GraduationCap, BookOpen, CalendarDays,
  ClipboardList, Wallet, BarChart3, Settings, UserCheck, Target,
  Home, Megaphone, Layers, Banknote, Wrench, MessageSquare, Trophy, type LucideIcon,
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
      { href: "/gamification", label: "Gamifikatsiya", icon: Trophy, perm: "gamification.view" },
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

/**
 * XODIMGA OCHIQ BIRINCHI BO'LIM.
 *
 * Kirgandan keyin hamma `/dashboard` ga tushadi, lekin `dashboard.view`
 * hamma rolda yo'q. Operator rolida bu aniq ko'rindi: unga dashboard
 * kerak emas, lekin u baribir o'sha yerga tushardi (egasi xabar
 * berdi, 2026-09-21).
 *
 * Menyu tartibi bo'yicha yuriladi — ya'ni xodim o'zining eng muhim
 * bo'limiga tushadi (sotuvchi → Lidlar, o'qituvchi → Jadval).
 * Hech biri ochiq bo'lmasa `null`: bunday xodimga umuman ish yo'q
 * va uni jimgina biror sahifaga tashlash chalg'itardi.
 */
export function birinchiOchiq(permissions: string[] | undefined): string | null {
  if (!permissions) return null;
  for (const s of navSections) {
    for (const i of s.items) {
      if (i.href === "/dashboard") continue;   // dashboard — chiqish nuqtasi emas
      if (i.teacherOnly) continue;             // rolga qarab, ruxsatga emas
      if (itemVisible(i.perm, permissions)) return i.href;
    }
  }
  return null;
}

export function getActiveSection(pathname: string): string {
  for (const s of navSections) {
    if (s.items.some(i => pathname === i.href || pathname?.startsWith(i.href + "/"))) return s.id;
  }
  return "asosiy";
}
