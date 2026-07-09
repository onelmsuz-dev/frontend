"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, GraduationCap, Users, Wallet, MoreHorizontal, X, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { navSections, itemVisible } from "@/components/layout/nav-config";
import { NAV_PERMISSIONS } from "@/lib/permissions";
import { useSession, signOut } from "next-auth/react";
import { useMe } from "@/lib/hooks/useMe";
import type { Role } from "@/types/roles";

const BOTTOM_ITEMS = [
  { href: "/dashboard",  label: "Bosh sahifa", icon: LayoutDashboard },
  { href: "/students",   label: "O'quvchilar", icon: GraduationCap },
  { href: "/groups",     label: "Guruhlar",    icon: Users },
  { href: "/finance",    label: "Moliya",      icon: Wallet },
];

const BOTTOM_HREFS = new Set(BOTTOM_ITEMS.map(i => i.href));

export function BottomNav() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);
  const { data: session } = useSession();
  const { me } = useMe();
  const role = (session?.user?.role ?? "TEACHER") as Role;
  const permissions = me?.permissions;

  const moreItems = navSections
    .flatMap(s => s.items)
    .filter(item => {
      if (BOTTOM_HREFS.has(item.href)) return false;
      if (item.teacherOnly) return role === "TEACHER";
      if (permissions) return itemVisible(item.perm, permissions);
      const allowed = NAV_PERMISSIONS[item.href];
      return !allowed || allowed.includes(role);
    });

  return (
    <>
      {showMore && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setShowMore(false)}
        />
      )}

      {showMore && (
        <div className="fixed bottom-[65px] left-0 right-0 z-50 lg:hidden bg-white dark:bg-neutral-900 rounded-t-2xl border-t border-neutral-200 dark:border-neutral-800 px-4 pt-3 pb-5 shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
              Boshqa sahifalar
            </p>
            <button onClick={() => setShowMore(false)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {moreItems.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setShowMore(false)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl transition-colors",
                    isActive
                      ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
                      : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium text-center leading-tight">{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <button
              onClick={async () => {
                setShowMore(false);
                const loginUrl = (typeof window !== "undefined" ? window.location.origin : "") + "/login";
                await signOut({ redirect: false });
                window.location.href = loginUrl;
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span className="text-[13px] font-medium">Chiqish</span>
            </button>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 flex items-stretch">
        {BOTTOM_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 transition-colors",
                isActive
                  ? "text-neutral-900 dark:text-neutral-100"
                  : "text-neutral-400 dark:text-neutral-500"
              )}
            >
              <div className={cn(
                "w-10 h-6 rounded-full flex items-center justify-center transition-colors",
                isActive && "bg-neutral-100 dark:bg-neutral-800"
              )}>
                <Icon className={cn("w-[18px] h-[18px]", isActive && "stroke-[2.5]")} />
              </div>
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}

        <button
          onClick={() => setShowMore(v => !v)}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 transition-colors",
            showMore ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-400 dark:text-neutral-500"
          )}
        >
          <div className={cn(
            "w-10 h-6 rounded-full flex items-center justify-center transition-colors",
            showMore && "bg-neutral-100 dark:bg-neutral-800"
          )}>
            <MoreHorizontal className={cn("w-[18px] h-[18px]", showMore && "stroke-[2.5]")} />
          </div>
          <span className="text-[10px] font-medium leading-none">Ko'proq</span>
        </button>
      </nav>
    </>
  );
}
