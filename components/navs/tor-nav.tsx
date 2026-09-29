"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { navSections, itemVisible, type NavItem, type NavSection } from "@/components/layout/nav-config";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSession, signOut } from "next-auth/react";
import { NAV_PERMISSIONS } from "@/lib/permissions";
import { useMe } from "@/lib/hooks/useMe";
import type { Role } from "@/types/roles";

/**
 * CHAP MENYU — IKKI QAVATLI.
 *
 * Ilgari 17 sahifa bitta uzun ro'yxat edi: ochiq holda kichik noutbukka
 * sig'may aylanar, yig'ilgan holda esa 17 ta ikonka bo'linishsiz turardi
 * (egasi: "juda ko'payib ketdi", 2026-09-28).
 *
 * Endi ikki rejim, ikkalasi ham GURUH bo'yicha:
 *   • TOR (standart, 76px) — faqat 6–7 guruh ikonkasi. Ustiga borilganda
 *     yonidan guruhning sahifalari (flyout) chiqadi; bosilsa guruhning
 *     OXIRGI ochilgan sahifasiga o'tadi. Sensorli ekranda birinchi bosish
 *     ochadi, ikkinchisi o'tadi.
 *   • KENG (220px) — akkordeon: faqat faol guruh ochiq, qolganlari
 *     yig'ilgan. Tanlangan rejim va ochiq guruhlar eslab qolinadi.
 *
 * Flyout PORTAL orqali `body`ga chiziladi: `aside` `overflow-hidden`
 * bo'lgani uchun ichida chizilsa kesilib qolardi.
 */

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

type Mode = "rail" | "wide";
const MODE_KEY = "nav:mode";
const OPEN_KEY = "nav:open";
const LAST_KEY = (id: string) => `nav:last:${id}`;

/** Brauzer xotirasi — private oynada tashlashi mumkin, hamma joyda try/catch. */
function oqi(key: string): string | null {
  try { return window.localStorage.getItem(key); } catch { return null; }
}
function yoz(key: string, v: string) {
  try { window.localStorage.setItem(key, v); } catch { /* jim */ }
}

const isActiveHref = (pathname: string | null, href: string) =>
  pathname === href || !!pathname?.startsWith(href + "/");

const STORE_EVENT = "nav:store";
/**
 * localStorage'dagi qiymat — `useSyncExternalStore` bilan. Serverda
 * `fallback` (gidratsiya mos keladi), mijozda saqlangan qiymat; effektda
 * `setState` chaqirmaslik uchun (lint qoidasi, kaskad render).
 */
function useStored(key: string, fallback: string): [string, (v: string) => void] {
  const subscribe = useCallback((cb: () => void) => {
    const h = (e: Event) => { if (!(e instanceof StorageEvent) || e.key === key || e.key === null) cb(); };
    window.addEventListener("storage", h);
    window.addEventListener(STORE_EVENT, h);
    return () => { window.removeEventListener("storage", h); window.removeEventListener(STORE_EVENT, h); };
  }, [key]);
  const get = useCallback(() => oqi(key) ?? fallback, [key, fallback]);
  const value = useSyncExternalStore(subscribe, get, () => fallback);
  const set = useCallback((v: string) => { yoz(key, v); window.dispatchEvent(new Event(STORE_EVENT)); }, [key]);
  return [value, set];
}
const bosh = () => () => {};

export function TorNav() {
  const pathname = usePathname();
  const router   = useRouter();
  const { data: session } = useSession();
  const { me } = useMe();
  const role = (session?.user?.role ?? "TEACHER") as Role;
  const permissions = me?.permissions;

  // ── rejim (tor/keng) — eslab qolinadi ────────────────────────────────
  const mounted = useSyncExternalStore(bosh, () => true, () => false);
  const [modeRaw, setModeRaw] = useStored(MODE_KEY, "rail");
  const wide = (modeRaw as Mode) === "wide";
  const almashtir = () => setModeRaw(wide ? "rail" : "wide");

  // ── ruxsat bo'yicha filtr (yuklanmaguncha role fallback) ─────────────
  const visible = useCallback((item: NavItem) => {
    // SUPER_ADMIN o'zini o'qituvchi qilib qo'shgan bo'lsa (Jadval → "O'zimni
    // qo'shish"), teacherId mavjud bo'ladi va u ham "Oyligim"ni ko'rishi kerak.
    if (item.teacherOnly) return role === "TEACHER" || (role === "SUPER_ADMIN" && !!me?.teacherId);
    if (permissions) return itemVisible(item.perm, permissions);
    const allowed = NAV_PERMISSIONS[item.href];
    return !allowed || allowed.includes(role);
  }, [role, permissions, me?.teacherId]);

  const sections = useMemo(() => navSections
    .map(s => ({ ...s, items: s.items.filter(visible) }))
    .filter(s => s.items.length > 0), [visible]);

  const activeSectionId = useMemo(
    () => sections.find(s => s.items.some(i => isActiveHref(pathname, i.href)))?.id ?? null,
    [sections, pathname]);

  // ── guruhning oxirgi ochilgan sahifasi ───────────────────────────────
  useEffect(() => {
    if (!activeSectionId || !pathname) return;
    yoz(LAST_KEY(activeSectionId), pathname);
  }, [activeSectionId, pathname]);
  const kirishManzili = (s: NavSection) => {
    const last = oqi(LAST_KEY(s.id));
    const bor = last && s.items.find(i => isActiveHref(last, i.href));
    return bor ? bor.href : s.items[0].href;
  };

  // ── keng rejim: akkordeon holati (saqlanadi; faol guruh HAR DOIM ochiq) ──
  const [ochiqRaw, setOchiqRaw] = useStored(OPEN_KEY, "");
  const saqlangan = useMemo(() => {
    try { return new Set(ochiqRaw ? (JSON.parse(ochiqRaw) as string[]) : []); }
    catch { return new Set<string>(); }
  }, [ochiqRaw]);
  const ochiq = useMemo(() => {
    const n = new Set(saqlangan);
    if (activeSectionId) n.add(activeSectionId);
    return n;
  }, [saqlangan, activeSectionId]);
  const toggleOchiq = (id: string) => {
    const next = new Set(saqlangan);
    if (next.has(id)) next.delete(id); else next.add(id);
    setOchiqRaw(JSON.stringify([...next]));
  };
  // HOVER (keng rejim) — yig'ilgan guruh ustiga borilsa vaqtincha ochiladi,
  // ketsa yig'iladi; bosilsa `toggleOchiq` bilan qoladi (sozlamalardagi kabi).
  const [hoverGuruh, setHoverGuruh] = useState<string | null>(null);
  const hoverTimer = useRef<number | null>(null);
  const hoverKech = (id: string | null, ms: number) => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setHoverGuruh(id), ms);
  };
  useEffect(() => () => { if (hoverTimer.current) window.clearTimeout(hoverTimer.current); }, []);

  // ── tor rejim: flyout ────────────────────────────────────────────────
  const [fly, setFly] = useState<{ id: string; top: number; left: number; pinned: boolean } | null>(null);
  const openTimer  = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);
  const flyRef = useRef<HTMLDivElement | null>(null);
  const clearTimers = () => {
    if (openTimer.current)  { window.clearTimeout(openTimer.current);  openTimer.current = null; }
    if (closeTimer.current) { window.clearTimeout(closeTimer.current); closeTimer.current = null; }
  };
  const flyOch = (id: string, el: HTMLElement, pinned = false) => {
    const r = el.getBoundingClientRect();
    setFly({ id, top: r.top, left: r.right, pinned });
  };
  const hoverIn = (s: NavSection) => (e: React.MouseEvent<HTMLElement>) => {
    if (fly?.pinned) return;
    clearTimers();
    const el = e.currentTarget;
    openTimer.current = window.setTimeout(() => flyOch(s.id, el), 60);
  };
  const hoverOut = () => {
    if (fly?.pinned) return;
    clearTimers();
    closeTimer.current = window.setTimeout(() => setFly(null), 180);
  };
  const flyStay = () => { if (!fly?.pinned) clearTimers(); };
  useEffect(() => () => clearTimers(), []);
  // Qadalgan flyout — tashqariga bosilsa / Escape'da yopiladi.
  useEffect(() => {
    if (!fly?.pinned) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (flyRef.current?.contains(t)) return;
      if ((t as HTMLElement).closest?.("[data-rail-section]")) return;
      setFly(null);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFly(null); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [fly?.pinned]);
  // Ekran pastiga sig'masin — o'lchab DOM'da yuqoriga suramiz (holatsiz).
  useLayoutEffect(() => {
    const el = flyRef.current;
    if (!fly || !el) return;
    const max = window.innerHeight - el.offsetHeight - 12;
    if (fly.top > max) el.style.top = `${Math.max(12, max)}px`;
  }, [fly]);

  const sensorli = () => typeof window !== "undefined" && window.matchMedia?.("(hover: none)").matches;
  const railClick = (s: NavSection) => (e: React.MouseEvent<HTMLElement>) => {
    if (s.items.length === 1) { setFly(null); router.push(s.items[0].href); return; }
    // Sensorli ekran: birinchi bosish ochadi (qadaladi), ikkinchisi o'tadi.
    if (sensorli() && fly?.id !== s.id) { clearTimers(); flyOch(s.id, e.currentTarget, true); return; }
    setFly(null);
    router.push(kirishManzili(s));
  };
  const railKey = (s: NavSection) => (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (s.items.length === 1) router.push(s.items[0].href);
      else if (fly?.id === s.id && fly.pinned) setFly(null);
      else { clearTimers(); flyOch(s.id, e.currentTarget, true); }
    }
  };

  const flySection = fly ? sections.find(s => s.id === fly.id) ?? null : null;

  // ── umumiy pastki qism ───────────────────────────────────────────────
  const chiqish = async () => {
    const loginUrl = (typeof window !== "undefined" ? window.location.origin : "") + "/login";
    await signOut({ redirect: false });
    window.location.href = loginUrl;
  };

  return (
    <>
      <aside className={cn(
        "rail-sidebar glass-panel sticky top-4 z-40 hidden h-[calc(100dvh-32px)] shrink-0 flex-col overflow-hidden rounded-3xl border border-white/60 dark:border-white/10 lg:flex",
        // `rail-wide` — shrift kattalashtirilganda menyu ham kengaysin (globals.css).
        wide ? "rail-wide w-[220px]" : "w-[76px]",
      )}>
        {/* Logo */}
        <div className={cn("h-[60px] shrink-0 flex items-center", wide ? "px-4 gap-2.5" : "justify-center")}>
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-300/50 bg-indigo-100/70 text-indigo-600 dark:border-indigo-400/30 dark:bg-indigo-400/10 dark:text-indigo-300">
            <span className="font-bold text-[15px]">O</span>
          </div>
          {wide && (
            <span className="rail-label-in flex-1 font-semibold text-[15px] text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
              OneRoom
            </span>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-1 flex flex-col gap-1 px-2">
          {wide ? sections.map(section => {
            const SIcon = section.icon;
            const faol = section.id === activeSectionId;
            const yolgiz = section.items.length === 1;
            const ochiqmi = ochiq.has(section.id) || hoverGuruh === section.id;
            if (yolgiz) {
              const item = section.items[0];
              const isActive = isActiveHref(pathname, item.href);
              return (
                <Link key={section.id} href={item.href}
                  className={cn("flex items-center h-10 rounded-2xl transition-colors px-3 gap-3", isActive ? ACTIVE_ITEM : IDLE_ITEM)}>
                  <SIcon className="w-[18px] h-[18px] shrink-0" />
                  <span className="text-[13px] whitespace-nowrap">{item.label}</span>
                </Link>
              );
            }
            return (
              <div key={section.id}
                onMouseEnter={() => { if (!ochiq.has(section.id)) hoverKech(section.id, 80); }}
                onMouseLeave={() => hoverKech(null, 160)}>
                <button type="button" aria-expanded={ochiqmi}
                  onClick={() => { setHoverGuruh(null); toggleOchiq(section.id); }}
                  className={cn(
                    "w-full flex items-center h-10 rounded-2xl transition-colors px-3 gap-3",
                    faol && !ochiqmi ? ACTIVE_ITEM : IDLE_ITEM,
                  )}>
                  <SIcon className="w-[18px] h-[18px] shrink-0" />
                  <span className="text-[13px] font-medium whitespace-nowrap flex-1 text-left">{section.label}</span>
                  <ChevronDown className={cn("w-3.5 h-3.5 shrink-0 opacity-60 transition-transform duration-200", ochiqmi && "rotate-180")} />
                </button>
                <div className={cn("grid transition-[grid-template-rows] duration-200 ease-out", ochiqmi ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                  <div className="overflow-hidden">
                    <div className="ml-4 pl-3 my-0.5 border-l border-neutral-200/80 dark:border-white/10 flex flex-col gap-0.5">
                      {section.items.map(item => {
                        const Icon = item.icon;
                        const isActive = isActiveHref(pathname, item.href);
                        return (
                          <Link key={item.href} href={item.href}
                            className={cn("flex items-center h-8 rounded-xl transition-colors px-2.5 gap-2.5", isActive ? ACTIVE_ITEM : IDLE_ITEM)}>
                            <Icon className="w-4 h-4 shrink-0" />
                            <span className="text-[12.5px] whitespace-nowrap">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          }) : sections.map(section => {
            const SIcon = section.icon;
            const faol = section.id === activeSectionId;
            const ochiqFly = fly?.id === section.id;
            return (
              <button key={section.id} type="button" data-rail-section
                title={section.items.length === 1 ? section.items[0].label : section.label}
                aria-haspopup={section.items.length > 1 ? "menu" : undefined}
                aria-expanded={section.items.length > 1 ? ochiqFly : undefined}
                onMouseEnter={hoverIn(section)} onMouseLeave={hoverOut}
                onClick={railClick(section)} onKeyDown={railKey(section)}
                className={cn(
                  "w-full flex flex-col items-center justify-center gap-1 h-[56px] rounded-2xl transition-colors outline-none",
                  "focus-visible:ring-2 focus-visible:ring-indigo-400/60",
                  faol ? ACTIVE_ITEM : ochiqFly ? "bg-white/70 text-neutral-900 dark:bg-white/10 dark:text-neutral-100" : IDLE_ITEM,
                )}>
                <SIcon className={cn("w-5 h-5 shrink-0", faol && "stroke-[2.25]")} />
                <span className="text-[10px] font-medium leading-none tracking-tight">{section.short ?? section.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Pastki qism: rejim, mavzu, profil, chiqish */}
        <div className="pb-3 pt-2 border-t border-white/50 dark:border-white/10 shrink-0 flex flex-col gap-1 px-2">
          <button type="button" onClick={almashtir} title={wide ? "Tor menyu" : "Keng menyu"}
            className={cn("w-full flex items-center h-9 rounded-2xl transition-colors", wide ? "px-3 gap-3" : "justify-center", IDLE_ITEM)}>
            {wide ? <ChevronLeft className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
            {wide && <span className="rail-label-in text-[12px] font-medium whitespace-nowrap">Yig&apos;ish</span>}
          </button>

          <div className={cn("flex items-center h-10 rounded-2xl transition-colors hover:bg-white/50 dark:hover:bg-white/5", wide ? "px-2.5 gap-3" : "justify-center")}>
            <ThemeToggle />
            {wide && <span className="rail-label-in text-[13px] font-medium whitespace-nowrap text-neutral-500 dark:text-neutral-400">Mavzu</span>}
          </div>

          <div className={cn("flex items-center h-10 rounded-2xl transition-colors hover:bg-white/50 dark:hover:bg-white/5", wide ? "px-2 gap-3" : "justify-center")}
            title={wide ? undefined : `${session?.user?.name ?? "Foydalanuvchi"} · ${ROLE_LABELS[role]}`}>
            <div className="w-8 h-8 bg-indigo-500 dark:bg-indigo-400/90 rounded-full flex items-center justify-center shrink-0">
              <span className="text-white text-[11px] font-bold">{(session?.user?.name?.[0] ?? "U").toUpperCase()}</span>
            </div>
            {wide && (
              <div className="rail-label-in min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-100 truncate">{session?.user?.name ?? "Foydalanuvchi"}</p>
                <p className="text-[10px] text-neutral-400 dark:text-neutral-500">{ROLE_LABELS[role]}</p>
              </div>
            )}
          </div>

          <button type="button" onClick={chiqish} title="Chiqish"
            className={cn("w-full flex items-center h-9 rounded-2xl transition-colors", wide ? "px-3 gap-3" : "justify-center",
              "text-red-500 hover:text-red-600 hover:bg-red-50/70 dark:hover:bg-red-900/20")}>
            <LogOut className="w-4 h-4 shrink-0" />
            {wide && <span className="rail-label-in text-[13px] font-medium whitespace-nowrap">Chiqish</span>}
          </button>
        </div>
      </aside>

      {/* FLYOUT — tor rejimda guruhning sahifalari. Portal: `aside`ning
          `overflow-hidden`i kesib qo'ymasin. Chap tomondagi 10px shaffof
          hoshiya sichqoncha o'tadigan "ko'prik". */}
      {mounted && !wide && fly && flySection && flySection.items.length > 1 && createPortal(
        <div ref={flyRef} role="menu" aria-label={flySection.label}
          onMouseEnter={flyStay} onMouseLeave={hoverOut}
          style={{ position: "fixed", top: fly.top, left: fly.left }}
          className="z-[70] pl-2.5 animate-in fade-in-0 slide-in-from-left-1 duration-150">
          <div className="glass-strong rounded-2xl border border-white/60 dark:border-white/10 shadow-xl shadow-black/10 dark:shadow-black/40 min-w-[196px] p-1.5">
            <p className="px-2.5 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              {flySection.label}
            </p>
            {flySection.items.map(item => {
              const Icon = item.icon;
              const isActive = isActiveHref(pathname, item.href);
              return (
                <Link key={item.href} href={item.href} role="menuitem" onClick={() => setFly(null)}
                  className={cn("flex items-center h-9 rounded-xl transition-colors px-2.5 gap-2.5", isActive ? ACTIVE_ITEM : IDLE_ITEM)}>
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="text-[13px] whitespace-nowrap">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
