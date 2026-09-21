"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight, ArrowUpRight, BellRing, CalendarDays, ChartColumn, ChevronDown, ClipboardCheck,
  CreditCard, Phone, Send, Sparkles, Users, UsersRound, Wallet,
} from "lucide-react";
import { ApplyButton } from "@/components/landing/apply-dialog";
import { LanguageSwitcher } from "@/components/landing/language-switcher";
import { localeFromPathname, localizePath, stripLocale, type Locale } from "@/lib/i18n/config";
import { getClusterMeta } from "@/lib/i18n/cluster-meta";
import { getUi } from "@/lib/i18n/ui";
import { CONTACT_PHONE, CONTACT_PHONE_DISPLAY } from "./content";

/**
 * BOSH SAHIFA NAVBARI — sahifa bilan birga ketmaydigan, `fixed` suzuvchi "orol" (island).
 *
 * Nega `fixed`: ilgari `sticky` edi, lekin uning ota-elementlarida `overflow-x: hidden`
 * bor (html, body va sahifa qobig'i) — shu sababli `sticky` ishlamay, navbar skroll bilan
 * ketib qolardi. `fixed` bunga bog'liq emas. Oqimdagi joyni pastdagi `spacer` egallaydi.
 *
 * Imkoniyatlar:
 *  - skroll qilinganda "orol" ixchamlashadi, foni zichlashadi, pastida o'qish progressi chiqadi;
 *  - skroll-spy: qaysi bo'limda turgan bo'lsangiz, o'sha havola belgilanadi;
 *  - bitta highlight havolalar orasida silliq siljiydi (hover'ga ergashadi, hover yo'q bo'lsa
 *    faol bo'limda turadi);
 *  - "Yechimlar" — barcha klaster sahifalarga havolali mega-panel (DOM'da doim bor, shuning
 *    uchun qidiruv botlari ham ichki havolalarni ko'radi);
 *  - `lg` dan pastda — burger, animatsiyali menyu (Yechimlar akkordeon ko'rinishida).
 */

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";
const SOLUTIONS_HREF = "#solutions";

const SOLUTION_ICONS: Record<string, LucideIcon> = {
  "/oquv-markaz-crm": Users,
  "/davomat": ClipboardCheck,
  "/tolovlar": CreditCard,
  "/qarzdorlik": BellRing,
  "/hisobot": ChartColumn,
  "/oqituvchi-oyligi": Wallet,
  "/guruh-boshqaruvi": UsersRound,
  "/dars-jadvali": CalendarDays,
  "/telegram-bot": Send,
  "/oquv-markazini-avtomatlashtirish": Sparkles,
};
const iconFor = (href: string): LucideIcon => SOLUTION_ICONS[href] ?? Sparkles;

const NAV_CACHE: Partial<Record<Locale, { label: string; href: string }[]>> = {};
/** Navbar havolalari (tilga qarab; har til uchun BIR marta yaratiladi — effektlar bog'liqligi barqaror bo'lsin). */
function navLinksFor(locale: Locale) {
  return (NAV_CACHE[locale] ??= (() => {
    const nav = getUi(locale).nav;
    return [
      { label: nav.features, href: "#features" },
      { label: nav.solutions, href: SOLUTIONS_HREF },
      { label: nav.how, href: "#how-it-works" },
      { label: nav.pricing, href: "#pricing" },
      { label: nav.blog, href: "/blog" },
      { label: nav.contact, href: "#contact" },
    ];
  })());
}

/** Sahifa ichidagi `#bo'lim` ga silliq o'tish (harakatni kamaytirish yoqilgan bo'lsa — sakrab). */
function goTo(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
  if (!href.startsWith("#")) return;
  const target = document.getElementById(href.slice(1));
  if (!target) return;
  e.preventDefault();
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  history.replaceState(null, "", href);
}

export function HomeHeader() {
  const pathname = usePathname() ?? "/";
  // Til manzildan olinadi (`/ru/...`, `/en/...`; aks holda o'zbekcha) — `lib/i18n/config.ts`.
  const locale = localeFromPathname(pathname);
  const ui = getUi(locale);
  const basePath = stripLocale(pathname);
  const isHome = basePath === "/";
  // `#bo'lim` — bosh sahifada joyida, boshqa sahifada o'sha tildagi bosh sahifaga; oddiy manzil — tilga moslanadi.
  const homeSectionHref = (href: string) =>
    href.startsWith("#") ? (isHome ? href : `${localizePath("/", locale)}${href}`) : localizePath(href, locale);
  const navLinks = navLinksFor(locale);
  const clusters = getClusterMeta(locale);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [mobileSolutions, setMobileSolutions] = useState(false);
  const [hoverKey, setHoverKey] = useState<string | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const highlightRef = useRef<HTMLSpanElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const solutionsBtnRef = useRef<HTMLButtonElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLElement | null>>({});
  const closeTimer = useRef<number | undefined>(undefined);
  // Panel sichqoncha bilan ustiga borilganda ochilsa true; bosib "qadalsa" false (chiqib ketganda yopilmaydi).
  const openedByHover = useRef(false);

  // Highlight qaysi havola ustida turadi: hover → ochiq panel (Yechimlar) → faol bo'lim.
  const currentPage = basePath === "/blog" || basePath.startsWith("/blog/") ? "/blog" : null;
  const target = hoverKey ?? (panelOpen ? SOLUTIONS_HREF : currentPage ?? active);

  /* ── Skroll: ixchamlashish, progress, skroll-spy ── */
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrolled(y > 12);
      if (barRef.current) {
        const p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
        barRef.current.style.transform = `scaleX(${p})`;
      }
      // Ekranning yuqori 40% chizig'idan o'tgan oxirgi bo'lim — faol. Sahifa oxirida — oxirgisi.
      const line = window.innerHeight * 0.4;
      let current: string | null = null;
      for (const l of navLinks) {
        if (!l.href.startsWith("#")) continue;
        const el = document.getElementById(l.href.slice(1));
        if (el && el.getBoundingClientRect().top <= line) current = l.href;
      }
      if (max > 0 && y >= max - 4) current = navLinks[navLinks.length - 1].href;
      setActive(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [navLinks]);

  /* ── Highlight'ni havola ustiga qo'yish (o'lchov DOM'dan, state'siz — qayta render yo'q) ── */
  const placeHighlight = useCallback(() => {
    const hl = highlightRef.current;
    if (!hl) return;
    const el = target ? itemRefs.current[target] : null;
    if (!el) {
      hl.style.opacity = "0";
      return;
    }
    hl.style.width = `${el.offsetWidth}px`;
    hl.style.transform = `translateX(${el.offsetLeft}px)`;
    hl.style.opacity = "1";
  }, [target]);

  useLayoutEffect(() => {
    placeHighlight();
    window.addEventListener("resize", placeHighlight);
    return () => window.removeEventListener("resize", placeHighlight);
  }, [placeHighlight]);

  /* ── Tashqariga bosish / Escape: panel va menyuni yopish ── */
  useEffect(() => {
    if (!panelOpen && !menuOpen) return;
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current?.contains(e.target as Node)) return;
      setPanelOpen(false);
      setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (panelOpen) solutionsBtnRef.current?.focus();
      else burgerRef.current?.focus();
      setPanelOpen(false);
      setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [panelOpen, menuOpen]);

  /* ── Mobil menyu ochiqda: orqa sahifa aylanmasin; keng ekranga o'tsa menyu yopiladi ── */
  useEffect(() => {
    if (!menuOpen) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => mq.matches && setMenuOpen(false);
    mq.addEventListener("change", onChange);
    return () => {
      html.style.overflow = prev;
      mq.removeEventListener("change", onChange);
    };
  }, [menuOpen]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  const cancelClose = () => window.clearTimeout(closeTimer.current);
  const closePanelSoon = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => {
      if (!openedByHover.current) return;
      openedByHover.current = false;
      setPanelOpen(false);
    }, 140);
  };

  const navItemClass = (isActive: boolean) =>
    `relative z-10 flex h-9 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-[13px] font-bold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 xl:px-3 ${
      isActive ? "text-slate-900" : "text-slate-600 hover:text-slate-900"
    }`;

  const ctaClass =
    // Telefonda (<sm) navbar qatorida yo'q — u faqat ochilgan mobil menyu ichida turadi.
    "group relative hidden h-9 items-center gap-2 overflow-hidden whitespace-nowrap rounded-full bg-gradient-to-b from-blue-500 to-blue-600 pl-4 pr-2.5 text-[13px] font-bold text-white shadow-[0_6px_16px_-6px_rgba(37,99,235,0.75),inset_0_1px_0_rgba(255,255,255,0.28)] outline-none transition-shadow duration-200 hover:shadow-[0_10px_22px_-8px_rgba(37,99,235,0.85),inset_0_1px_0_rgba(255,255,255,0.28)] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:inline-flex";

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        {ui.header.skip}
      </a>

      {/* Navbar `fixed` (oqimdan chiqqan) — uning o'rnini shu bo'sh joy saqlaydi. */}
      <div aria-hidden className="h-[60px]" />

      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-5">
        {/* Mobil menyu ochiqda orqa fonni xiralashtiradi; bosilsa yopiladi (`onDown` orqali). */}
        <div
          aria-hidden
          className={`fixed inset-0 -z-10 bg-slate-900/25 backdrop-blur-[3px] transition-opacity duration-300 lg:hidden ${
            menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          }`}
        />

        <div
          ref={wrapRef}
          onPointerEnter={(e) => e.pointerType === "mouse" && cancelClose()}
          onPointerLeave={(e) => e.pointerType === "mouse" && closePanelSoon()}
          className={`pointer-events-auto relative mx-auto transition-[max-width] duration-500 ${EASE} ${
            scrolled ? "max-w-[1120px]" : "max-w-[1200px]"
          }`}
        >
          {/* ── "Orol" ── */}
          <div
            className={`relative flex h-14 items-center justify-between gap-2 rounded-full pl-4 pr-1.5 ring-1 backdrop-blur-xl backdrop-saturate-150 transition-[background-color,box-shadow] duration-300 lg:pl-5 lg:pr-2 ${
              menuOpen
                ? "bg-white/95 ring-slate-900/[0.08] shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_24px_-12px_rgba(15,23,42,0.2)]"
                : scrolled
                ? "bg-white/85 ring-slate-900/[0.08] shadow-[0_1px_2px_rgba(15,23,42,0.05),0_16px_40px_-16px_rgba(37,99,235,0.35)]"
                : "bg-white/65 ring-slate-900/[0.06] shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.12)]"
            }`}
          >
            {/* Logo (avvalgidan 30% katta: 27×22 → 35×29, yozuv 15px → 19.5px) */}
            <Link
              href={homeSectionHref("#hero")}
              onClick={(event) => isHome && goTo(event, "#hero")}
              aria-label={ui.header.homeAria}
              className="flex shrink-0 items-center gap-2.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-4"
            >
              <Image
                src="/logo.png"
                alt=""
                width={35}
                height={29}
                priority
                className="mix-blend-multiply"
              />
              <span className="text-[19.5px] font-bold tracking-[-0.035em] text-slate-900">
                One<span className="text-blue-600">Room</span>
              </span>
            </Link>

            {/* Desktop navigatsiya */}
            <nav
              aria-label={ui.header.mainMenu}
              onPointerLeave={() => setHoverKey(null)}
              className="relative hidden items-center lg:flex"
            >
              <span
                ref={highlightRef}
                aria-hidden
                className={`pointer-events-none absolute inset-y-0 left-0 rounded-full bg-slate-900/[0.06] opacity-0 transition-[transform,width,opacity] duration-300 motion-reduce:transition-none ${EASE}`}
              />
              {navLinks.map((l) => {
                const isActive = (currentPage ?? active) === l.href;
                const setRef = (el: HTMLElement | null) => {
                  itemRefs.current[l.href] = el;
                };
                const dot = (
                  <span
                    aria-hidden
                    className={`absolute -bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-blue-600 transition-[opacity,scale] duration-300 ${
                      isActive ? "scale-100 opacity-100" : "scale-0 opacity-0"
                    }`}
                  />
                );

                if (l.href === SOLUTIONS_HREF) {
                  return (
                    <button
                      key={l.href}
                      ref={(el) => {
                        setRef(el);
                        solutionsBtnRef.current = el;
                      }}
                      type="button"
                      aria-expanded={panelOpen}
                      aria-haspopup="true"
                      aria-controls="home-solutions-panel"
                      onPointerEnter={(e) => {
                        if (e.pointerType !== "mouse") return;
                        setHoverKey(l.href);
                        cancelClose();
                        if (!panelOpen) {
                          openedByHover.current = true;
                          setPanelOpen(true);
                        }
                      }}
                      onClick={() => {
                        // Hover bilan ochilgan panelni bosib "qadaymiz". Holat `panelOpen` emas, ref'dan
                        // o'qiladi: hover'dan keyin darhol bosilsa, closure hali eski qiymatni ko'radi.
                        if (openedByHover.current) {
                          openedByHover.current = false;
                          setPanelOpen(true);
                          return;
                        }
                        setPanelOpen((v) => !v);
                      }}
                      className={navItemClass(isActive || panelOpen)}
                    >
                      {l.label}
                      <ChevronDown
                        aria-hidden
                        className={`h-3.5 w-3.5 transition-transform duration-300 ${panelOpen ? "rotate-180" : ""}`}
                      />
                      {dot}
                    </button>
                  );
                }

                return (
                  <a
                    key={l.href}
                    ref={setRef}
                    href={homeSectionHref(l.href)}
                    onClick={(e) => isHome && goTo(e, l.href)}
                    onPointerEnter={(e) => {
                      if (e.pointerType !== "mouse") return;
                      setHoverKey(l.href);
                      setPanelOpen(false);
                    }}
                    aria-current={isActive ? "location" : undefined}
                    className={navItemClass(isActive)}
                  >
                    {l.label}
                    {dot}
                  </a>
                );
              })}
            </nav>

            {/* O'ng tomon: telefon, kirish, CTA, burger */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              <LanguageSwitcher />
              <a
                href={`tel:${CONTACT_PHONE}`}
                className="hidden h-9 items-center gap-2 whitespace-nowrap rounded-full pl-1.5 pr-3 text-[13px] font-bold text-slate-800 outline-none transition-colors hover:bg-slate-900/[0.05] focus-visible:ring-2 focus-visible:ring-blue-500 xl:inline-flex"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <Phone className="h-3.5 w-3.5" aria-hidden />
                </span>
                {CONTACT_PHONE_DISPLAY}
              </a>
              <a
                href={`tel:${CONTACT_PHONE}`}
                aria-label={`${ui.header.call}: ${CONTACT_PHONE_DISPLAY}`}
                className="hidden h-9 w-9 items-center justify-center rounded-full text-blue-600 outline-none transition-colors hover:bg-slate-900/[0.05] focus-visible:ring-2 focus-visible:ring-blue-500 sm:flex xl:hidden"
              >
                <Phone className="h-4 w-4" aria-hidden />
              </a>
              <ApplyButton where="Header" className={ctaClass}>
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 -left-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 group-hover:translate-x-[400%] motion-reduce:hidden"
                />
                <span className="relative">{ui.header.cta}</span>
                <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                  <ArrowUpRight
                    className="h-3 w-3 transition-transform duration-200 group-hover:-translate-y-px group-hover:translate-x-px"
                    aria-hidden
                  />
                </span>
              </ApplyButton>

              <button
                ref={burgerRef}
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-controls="home-mobile-menu"
                aria-label={menuOpen ? ui.header.menuClose : ui.header.menuOpen}
                className="flex h-10 w-10 items-center justify-center rounded-full text-slate-800 outline-none transition-colors hover:bg-slate-900/[0.06] focus-visible:ring-2 focus-visible:ring-blue-500 lg:hidden"
              >
                <span aria-hidden className="relative block h-4 w-[18px]">
                  <span
                    className={`absolute left-0 h-[2px] w-full rounded-full bg-current transition-[top,transform] duration-300 ${EASE} ${
                      menuOpen ? "top-[7px] rotate-45" : "top-[4px]"
                    }`}
                  />
                  <span
                    className={`absolute left-0 h-[2px] w-full rounded-full bg-current transition-[top,transform] duration-300 ${EASE} ${
                      menuOpen ? "top-[7px] -rotate-45" : "top-[10px]"
                    }`}
                  />
                </span>
              </button>
            </div>

            {/* O'qish progressi (skroll qilinganda ko'rinadi) */}
            <span
              aria-hidden
              className={`pointer-events-none absolute inset-x-7 bottom-px h-[2px] overflow-hidden rounded-full transition-opacity duration-300 ${
                scrolled ? "opacity-100" : "opacity-0"
              }`}
            >
              <span
                ref={barRef}
                className="block h-full origin-left bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 will-change-transform"
                style={{ transform: "scaleX(0)" }}
              />
            </span>
          </div>

          {/* ── Yechimlar mega-paneli (desktop) ── */}
          <div
            id="home-solutions-panel"
            className={`absolute inset-x-0 top-full hidden origin-top pt-2 transition-[opacity,transform,visibility] duration-200 motion-reduce:transition-none lg:block ${
              panelOpen
                ? "visible translate-y-0 opacity-100"
                : "pointer-events-none invisible -translate-y-1.5 opacity-0"
            }`}
          >
            <div className="mx-auto w-full max-w-[780px] rounded-[28px] bg-white/90 p-2.5 shadow-[0_28px_70px_-24px_rgba(15,23,42,0.4)] ring-1 ring-slate-900/[0.06] backdrop-blur-2xl backdrop-saturate-150">
              <div className="grid gap-x-1 gap-y-0.5 sm:grid-cols-2">
                {clusters.map((p) => {
                  const Icon = iconFor(p.href);
                  return (
                    <Link
                      key={p.href}
                      href={localizePath(p.href, locale)}
                      onClick={() => setPanelOpen(false)}
                      className="group/item flex items-start gap-3 rounded-2xl p-3 outline-none transition-colors hover:bg-blue-50/70 focus-visible:bg-blue-50/70 focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100 transition-colors duration-200 group-hover/item:bg-blue-600 group-hover/item:text-white group-hover/item:ring-blue-600">
                        <Icon className="h-[18px] w-[18px]" aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-1 text-[13.5px] font-bold text-slate-900">
                          {p.navLabel}
                          <ArrowUpRight
                            aria-hidden
                            className="h-3.5 w-3.5 -translate-x-1 text-blue-600 opacity-0 transition-[opacity,transform] duration-200 group-hover/item:translate-x-0 group-hover/item:opacity-100"
                          />
                        </span>
                        <span className="mt-0.5 block text-xs leading-snug text-slate-500">{p.blurb}</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs text-slate-500">
                  <span className="font-semibold text-slate-800">7 kunlik bepul sinov</span> — hisobingizni ochib beramiz
                </p>
                <a
                  href={homeSectionHref(SOLUTIONS_HREF)}
                  onClick={(e) => {
                    setPanelOpen(false);
                    if (isHome) goTo(e, SOLUTIONS_HREF);
                  }}
                  className="group/all inline-flex shrink-0 items-center gap-1 rounded-full text-xs font-semibold text-blue-600 outline-none hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {ui.header.allSolutions}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/all:translate-x-0.5" aria-hidden />
                </a>
              </div>
            </div>
          </div>

          {/* ── Mobil menyu ── */}
          <div
            id="home-mobile-menu"
            className={`absolute inset-x-0 top-full origin-top pt-2 transition-[opacity,transform,visibility] duration-300 motion-reduce:transition-none lg:hidden ${EASE} ${
              menuOpen
                ? "visible translate-y-0 scale-100 opacity-100"
                : "pointer-events-none invisible -translate-y-2 scale-[0.97] opacity-0"
            }`}
          >
            <div className="max-h-[calc(100dvh-5.5rem)] overflow-y-auto overscroll-contain rounded-[28px] bg-white/95 p-3 shadow-[0_28px_70px_-24px_rgba(15,23,42,0.45)] ring-1 ring-slate-900/[0.06] backdrop-blur-2xl">
              <nav aria-label={ui.header.mobileMenu}>
                <ul>
                  {navLinks.map((l, i) => {
                    const isActive = (currentPage ?? active) === l.href;
                    const isSolutions = l.href === SOLUTIONS_HREF;
                    const stagger = {
                      transitionDelay: menuOpen ? `${80 + i * 45}ms` : "0ms",
                    };
                    const rowClass = `group flex w-full items-center gap-3 rounded-2xl px-3 py-3.5 text-left outline-none transition-[opacity,transform,background-color] duration-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      menuOpen ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
                    }`;
                    const inner = (
                      <>
                        <span className="w-6 text-[11px] font-bold tabular-nums text-slate-300">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span
                          className={`flex-1 text-[17px] font-bold tracking-[-0.02em] ${
                            isActive ? "text-blue-600" : "text-slate-900"
                          }`}
                        >
                          {l.label}
                        </span>
                        {isSolutions ? (
                          <ChevronDown
                            aria-hidden
                            className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${mobileSolutions ? "rotate-180" : ""}`}
                          />
                        ) : (
                          <ArrowUpRight aria-hidden className="h-4 w-4 text-slate-300 transition-colors group-hover:text-blue-600" />
                        )}
                      </>
                    );

                    if (isSolutions) {
                      return (
                        <li key={l.href}>
                          <button
                            type="button"
                            style={stagger}
                            aria-expanded={mobileSolutions}
                            aria-controls="home-mobile-solutions"
                            onClick={() => setMobileSolutions((v) => !v)}
                            className={rowClass}
                          >
                            {inner}
                          </button>
                          <div
                            id="home-mobile-solutions"
                            className={`grid transition-[grid-template-rows] duration-300 ${EASE} ${
                              mobileSolutions ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                            }`}
                          >
                            <div className="overflow-hidden" inert={!mobileSolutions}>
                              <div className="grid gap-0.5 pb-2 pl-9">
                                {clusters.map((p) => {
                                  const Icon = iconFor(p.href);
                                  return (
                                    <Link
                                      key={p.href}
                                      href={localizePath(p.href, locale)}
                                      onClick={() => setMenuOpen(false)}
                                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold text-slate-700 outline-none transition-colors hover:bg-blue-50/70 focus-visible:ring-2 focus-visible:ring-blue-500"
                                    >
                                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                        <Icon className="h-4 w-4" aria-hidden />
                                      </span>
                                      {p.navLabel}
                                    </Link>
                                  );
                                })}
                                <a
                                  href={homeSectionHref(SOLUTIONS_HREF)}
                                  onClick={(e) => {
                                    setMenuOpen(false);
                                    if (isHome) goTo(e, SOLUTIONS_HREF);
                                  }}
                                  className="mt-1 inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold text-blue-600 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                >
                                  {ui.header.allSolutions} <ArrowRight className="h-4 w-4" aria-hidden />
                                </a>
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    }

                    return (
                      <li key={l.href}>
                        <a
                          href={homeSectionHref(l.href)}
                          style={stagger}
                          aria-current={isActive ? "location" : undefined}
                          onClick={(e) => {
                            setMenuOpen(false);
                            if (isHome) goTo(e, l.href);
                          }}
                          className={rowClass}
                        >
                          {inner}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-900/5 pt-3">
                <a
                  href={`tel:${CONTACT_PHONE}`}
                  className="col-span-2 flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-50 text-sm font-bold text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <Phone className="h-4 w-4 text-blue-600" aria-hidden />
                  {CONTACT_PHONE_DISPLAY}
                </a>
                <ApplyButton
                  where="Header (mobil menyu)"
                  onClick={() => setMenuOpen(false)}
                  className="col-span-2 h-12 rounded-2xl bg-gradient-to-b from-blue-500 to-blue-600 text-sm font-bold text-white shadow-[0_8px_20px_-8px_rgba(37,99,235,0.8),inset_0_1px_0_rgba(255,255,255,0.28)] outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  {ui.header.cta}
                </ApplyButton>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
