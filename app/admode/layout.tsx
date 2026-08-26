"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { FullscreenToggle } from "@/components/fullscreen-toggle";
import {
  LayoutDashboard, Building2, CreditCard, LogOut, ShieldCheck,
  Settings, Users, BarChart3, MessageSquare, Rocket,
} from "lucide-react";

const SECTIONS = [
  {
    label: "Asosiy",
    items: [
      { href: "/admode",       label: "Dashboard",   icon: LayoutDashboard },
      { href: "/admode/stats", label: "Statistika",  icon: BarChart3 },
    ],
  },
  {
    label: "Boshqaruv",
    items: [
      { href: "/admode/organizations", label: "Tashkilotlar", icon: Building2 },
      { href: "/admode/subscriptions", label: "Obunalar",     icon: CreditCard },
      { href: "/admode/sms",           label: "SMS paketlar", icon: MessageSquare },
      { href: "/admode/users",         label: "Foydalanuvchilar", icon: Users },
    ],
  },
  {
    label: "Tizim",
    items: [
      { href: "/admode/features", label: "Yangilanishlar", icon: Rocket },
      { href: "/admode/settings", label: "Sozlamalar", icon: Settings },
    ],
  },
];

export default function AdmodeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  if (pathname === "/admode/login") return <>{children}</>;

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 sticky top-0 h-dvh flex flex-col border-r border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900">

        {/* Logo */}
        <div className="h-14 shrink-0 flex items-center gap-2.5 px-4 border-b border-neutral-200 dark:border-white/10">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-neutral-900 dark:text-white leading-none">OneRoom</p>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-none mt-0.5">Platform Admin</p>
          </div>
        </div>

        {/* Nav sections */}
        <nav className="flex-1 min-h-0 overflow-y-auto py-4 px-2 space-y-5">
          {SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest px-3 mb-1.5">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map(({ href, label, icon: Icon }) => {
                  const active = href === "/admode"
                    ? pathname === "/admode"
                    : pathname.startsWith(href);
                  return (
                    <Link key={href} href={href}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors",
                        active
                          ? "bg-blue-600 text-white"
                          : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/8"
                      )}>
                      <Icon className="w-4 h-4 shrink-0" />
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="shrink-0 p-3 border-t border-neutral-200 dark:border-white/10">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/8 transition-colors group">
            <div className="w-7 h-7 rounded-full bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                {session?.user?.name?.[0]?.toUpperCase() ?? "A"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-neutral-900 dark:text-white truncate">
                {session?.user?.name ?? "Admin"}
              </p>
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500">Platform Admin</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/admode/login" })}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400 dark:text-neutral-500 hover:text-red-500 dark:hover:text-red-400"
              title="Chiqish"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="sticky top-0 z-30 h-14 shrink-0 flex items-center justify-end gap-1 px-6
          border-b border-neutral-200 dark:border-white/10
          bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md">
          <FullscreenToggle />
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
