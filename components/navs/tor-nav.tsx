"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { navSections, itemVisible } from "@/components/layout/nav-config";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSession, signOut } from "next-auth/react";
import { NAV_PERMISSIONS } from "@/lib/permissions";
import { useMe } from "@/lib/hooks/useMe";
import type { Role } from "@/types/roles";

const ROLE_LABELS: Record<string, string> = {
  PLATFORM_ADMIN: "Platform Admin",
  SUPER_ADMIN:    "Super Admin",
  TEACHER:        "O'qituvchi",
  RECEPTIONIST:   "Qabulxona",
  ACCOUNTANT:     "Buxgalter",
  STAFF:          "Xodim",
  STUDENT:        "O'quvchi",
};

const ACTIVE_ITEM = "bg-indigo-100/70 text-indigo-700 font-medium dark:bg-indigo-400/15 dark:text-indigo-200";
const IDLE_ITEM   = "text-neutral-500 hover:bg-white/60 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-neutral-100";

export function TorNav() {
  const pathname = usePathname();
  const router   = useRouter();
  const [open, setOpen] = useState(true);
  const { data: session } = useSession();
  const { me } = useMe();
  const role = (session?.user?.role ?? "TEACHER") as Role;
  const permissions = me?.permissions;

  // Ruxsat bo'yicha filtr (yuklanmaguncha role fallback)
  const visible = (item: (typeof navSections)[number]["items"][number]) => {
    // SUPER_ADMIN o'zini o'qituvchi qilib qo'shgan bo'lsa (Jadval → "O'zimni
    // qo'shish"), teacherId mavjud bo'ladi va u ham "Oyligim"ni ko'rishi kerak.
    if (item.teacherOnly) return role === "TEACHER" || (role === "SUPER_ADMIN" && !!me?.teacherId);
    if (permissions) return itemVisible(item.perm, permissions);
    const allowed = NAV_PERMISSIONS[item.href];
    return !allowed || allowed.includes(role);
  };

  const filteredSections = navSections
    .map(s => ({ ...s, items: s.items.filter(visible) }))
    .filter(s => s.items.length > 0);

  const allItems = filteredSections.flatMap(s => s.items);

  return (
    <aside className={cn(
      "rail-sidebar glass-panel sticky top-4 z-40 hidden h-[calc(100dvh-32px)] shrink-0 flex-col overflow-hidden rounded-3xl border border-white/60 dark:border-white/10 lg:flex",
      open ? "w-[220px]" : "w-[76px]"
    )}>

      {/* Logo */}
      <div className={cn(
        "h-[60px] shrink-0 flex items-center",
        open ? "px-4 gap-2.5" : "justify-center"
      )}>
        <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-300/50 bg-indigo-100/70 text-indigo-600 dark:border-indigo-400/30 dark:bg-indigo-400/10 dark:text-indigo-300">
          <span className="font-bold text-[15px]">O</span>
        </div>
        {open && (
          <span className="rail-label-in flex-1 font-semibold text-[15px] text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
            OneRoom
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className={cn(
        "flex-1 overflow-y-auto py-2 flex flex-col gap-0.5 px-2"
      )}>

        {/* Toggle button */}
        <button
          onClick={() => setOpen(v => !v)}
          className={cn(
            "w-full flex items-center h-10 rounded-2xl transition-colors mb-1",
            open ? "px-3 gap-3" : "justify-center",
            IDLE_ITEM
          )}
        >
          {open
            ? <ChevronLeft className="w-5 h-5 shrink-0" />
            : <ChevronRight className="w-5 h-5 shrink-0" />
          }
          {open && (
            <span className="rail-label-in text-[13px] font-medium whitespace-nowrap">
              Yopish
            </span>
          )}
        </button>

        {/* Nav sections */}
        {open ? filteredSections.map(section => (
          <div key={section.id} className="mb-1">
            <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-600 uppercase tracking-wider px-3 mb-1 mt-2">
              {section.label}
            </p>
            {section.items.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <Link key={item.href} href={item.href}
                  className={cn(
                    "flex items-center h-9 rounded-2xl transition-colors px-3 gap-3",
                    isActive ? ACTIVE_ITEM : IDLE_ITEM
                  )}>
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="text-[13px] whitespace-nowrap">{item.label}</span>
                </Link>
              );
            })}
          </div>
        )) : allItems.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href}
              title={item.label}
              className={cn(
                "flex items-center h-10 rounded-2xl transition-colors justify-center",
                isActive ? ACTIVE_ITEM : IDLE_ITEM
              )}>
              <Icon className="w-5 h-5 shrink-0" />
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className={cn(
        "pb-3 pt-2 border-t border-white/50 dark:border-white/10 shrink-0 flex flex-col gap-1 px-2"
      )}>
        <div className={cn(
          "flex items-center h-10 rounded-2xl transition-colors hover:bg-white/50 dark:hover:bg-white/5",
          open ? "px-2.5 gap-3" : "justify-center"
        )}>
          <ThemeToggle />
          {open && (
            <span className="rail-label-in text-[13px] font-medium whitespace-nowrap text-neutral-500 dark:text-neutral-400">
              Mavzu
            </span>
          )}
        </div>

        <div className={cn(
          "flex items-center h-10 rounded-2xl transition-colors hover:bg-white/50 dark:hover:bg-white/5",
          open ? "px-2 gap-3" : "justify-center"
        )}>
          <div className="w-8 h-8 bg-indigo-500 dark:bg-indigo-400/90 rounded-full flex items-center justify-center shrink-0">
            <span className="text-white text-[11px] font-bold">
              {(session?.user?.name?.[0] ?? "U").toUpperCase()}
            </span>
          </div>
          {open && (
            <div className="rail-label-in min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                {session?.user?.name ?? "Foydalanuvchi"}
              </p>
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500">
                {ROLE_LABELS[role]}
              </p>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={async () => {
            const loginUrl = (typeof window !== "undefined" ? window.location.origin : "") + "/login";
            await signOut({ redirect: false });
            window.location.href = loginUrl;
          }}
          className={cn(
            "w-full flex items-center h-9 rounded-2xl transition-colors",
            open ? "px-3 gap-3" : "justify-center",
            "text-red-500 hover:text-red-600 hover:bg-red-50/70 dark:hover:bg-red-900/20"
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {open && (
            <span className="rail-label-in text-[13px] font-medium whitespace-nowrap">
              Chiqish
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
