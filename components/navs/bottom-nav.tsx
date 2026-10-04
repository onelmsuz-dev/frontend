"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal, X, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { navSections, navItemVisible, type NavItem } from "@/components/layout/nav-config";
import { useSession, signOut } from "next-auth/react";
import { useMe } from "@/lib/hooks/useMe";
import type { Role } from "@/types/roles";

/**
 * TELEFON MENYUSI — ROLGA QARAB (2026-10-02).
 *
 * Ilgari to'rt tab hammaga bir xil edi (Bosh sahifa, O'quvchilar, Guruhlar,
 * Moliya): o'qituvchi va yordamchi o'qituvchi uchun eng kerakli Davomat va
 * Jadval "Ko'proq" ichida yashirinib yotardi, Moliya esa ularga umuman
 * ochiq emas. Endi nomzodlar ro'yxati rolga qarab tuziladi va ruxsat
 * bo'yicha filtrlanadi (chap menyu bilan bir qoida — `navItemVisible`).
 *
 * Yorliqlar QISQA: 5 katak 390px ekranda ~78px, "Bosh sahifa" kattalashgan
 * shriftda "Bosh..." bo'lib kesilardi (ekrandagi shikoyat shu edi).
 */
const QISQA: Record<string, string> = {
  "/dashboard": "Bosh",
  "/students": "O'quvchi",
  "/groups": "Guruh",
  "/finance": "Moliya",
  "/attendance": "Davomat",
  "/schedule": "Jadval",
  "/leads": "Lidlar",
  "/salary": "Oyligim",
};
/** Dars beradiganlar: jadval va davomat oldinda. */
const DARS_TARTIBI = ["/schedule", "/attendance", "/groups", "/students", "/dashboard", "/salary"];
/** Boshqaruv: bosh sahifa, o'quvchi, guruh, keyin pul yoki lidlar. */
const BOSHQARUV_TARTIBI = ["/dashboard", "/students", "/groups", "/finance", "/leads", "/attendance", "/schedule"];

export function BottomNav() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);
  const { data: session } = useSession();
  const { me } = useMe();
  const role = (session?.user?.role ?? "TEACHER") as Role;
  const permissions = me?.permissions;

  const barcha = useMemo(() => navSections.flatMap((s) => s.items), []);
  const visible = useMemo(
    () => (item: NavItem) => navItemVisible(item, { role, permissions, teacherId: me?.teacherId }),
    [role, permissions, me?.teacherId]);

  const bottomItems = useMemo(() => {
    const has = (k: string) => permissions?.includes("*") || permissions?.includes(k);
    // Davomat belgilaydi, lekin pul ko'rmaydi — o'qituvchi yoki yordamchisi.
    const darsBeradi = role === "TEACHER" || (!!permissions && !!has("attendance.mark") && !has("payments.view"));
    const tartib = darsBeradi ? DARS_TARTIBI : BOSHQARUV_TARTIBI;
    const out: NavItem[] = [];
    for (const href of tartib) {
      const item = barcha.find((i) => i.href === href);
      if (item && visible(item)) out.push(item);
      if (out.length === 4) break;
    }
    // Ruxsatlar hali kelmagan yoki juda tor rol — bo'sh qolmasin.
    if (out.length < 2) for (const item of barcha) { if (!out.includes(item) && visible(item)) out.push(item); if (out.length === 4) break; }
    return out;
  }, [barcha, visible, role, permissions]);

  const bottomHrefs = useMemo(() => new Set(bottomItems.map((i) => i.href)), [bottomItems]);
  const faol = (href: string) => pathname === href || pathname?.startsWith(href + "/");

  // "KO'PROQ" OYNASI — GURUH BO'YICHA (chap menyu bilan bir xil bo'linish,
  // 2026-09-28). Pastdagi to'rttasi bu yerda takrorlanmaydi.
  const moreSections = useMemo(() => navSections
    .map((s) => ({ ...s, items: s.items.filter((i) => !bottomHrefs.has(i.href) && visible(i)) }))
    .filter((s) => s.items.length > 0), [bottomHrefs, visible]);
  // Hozirgi sahifa "Ko'proq" ichida bo'lsa — o'sha tugma faol ko'rinadi.
  const moreFaol = !bottomItems.some((i) => faol(i.href)) && moreSections.some((s) => s.items.some((i) => faol(i.href)));

  return (
    <>
      {showMore && (
        <div
          className="fixed inset-0 bg-black/40 z-[60] lg:hidden"
          onClick={() => setShowMore(false)}
        />
      )}

      {showMore && (
        <div className="glass-strong fixed bottom-[88px] left-3 right-3 z-[70] lg:hidden rounded-3xl border border-white/60 dark:border-white/10 px-4 pt-3 pb-4 shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
              Boshqa sahifalar
            </p>
            <button onClick={() => setShowMore(false)} aria-label="Yopish" className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3 max-h-[60dvh] overflow-y-auto">
            {moreSections.map((section) => (
              <div key={section.id}>
                <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider px-1 mb-1.5">
                  {section.label}
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = faol(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setShowMore(false)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl transition-colors",
                          isActive
                            ? "bg-indigo-100/80 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-200"
                            : "text-neutral-500 dark:text-neutral-400 hover:bg-white/60 dark:hover:bg-white/10"
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-[10px] font-medium text-center leading-tight">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-white/50 dark:border-white/10">
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

      {/* `bottom` — uy indikatori bor telefonlarda xavfsiz zonadan pastga tushmaydi. */}
      {/* Fon TO'LIQ (shaffof emas) — `glass-strong` (85%) ostidan sahifa matni ko'rinib,
          menyu yozuvlari bilan ustma-ust tushardi va o'qilmasdi. */}
      <nav aria-label="Asosiy menyu"
        className="glass-strong bg-white! dark:bg-[rgb(20_18_26)]! fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 right-3 z-[60] lg:hidden rounded-3xl border border-white/60 dark:border-white/10 shadow-xl flex items-stretch overflow-hidden">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = faol(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                // `min-w-0` SHART: flex elementining standart eng kichik
                // kengligi matn kengligi, ya'ni usiz uzun yozuv katakni
                // kengaytirib butun menyuni yorib chiqardi.
                "flex-1 min-w-0 flex flex-col items-center justify-center gap-1 py-2 px-1 transition-colors",
                isActive
                  ? "text-indigo-600 dark:text-indigo-300"
                  : "text-neutral-400 dark:text-neutral-500"
              )}
            >
              <div className={cn(
                "w-10 h-6 rounded-full flex items-center justify-center transition-colors",
                isActive && "bg-indigo-100/80 dark:bg-indigo-400/15"
              )}>
                <Icon className={cn("w-[18px] h-[18px]", isActive && "stroke-[2.5]")} />
              </div>
              <span className="bottom-nav-label text-[10px] font-medium leading-none w-full text-center truncate">
                {QISQA[item.href] ?? item.label}
              </span>
            </Link>
          );
        })}

        <button
          onClick={() => setShowMore((v) => !v)}
          aria-expanded={showMore}
          className={cn(
            "flex-1 min-w-0 flex flex-col items-center justify-center gap-1 py-2 px-1 transition-colors",
            showMore || moreFaol ? "text-indigo-600 dark:text-indigo-300" : "text-neutral-400 dark:text-neutral-500"
          )}
        >
          <div className={cn(
            "w-10 h-6 rounded-full flex items-center justify-center transition-colors",
            (showMore || moreFaol) && "bg-indigo-100/80 dark:bg-indigo-400/15"
          )}>
            <MoreHorizontal className={cn("w-[18px] h-[18px]", (showMore || moreFaol) && "stroke-[2.5]")} />
          </div>
          <span className="bottom-nav-label w-full text-center truncate text-[10px] font-medium leading-none">Yana</span>
        </button>
      </nav>
    </>
  );
}
