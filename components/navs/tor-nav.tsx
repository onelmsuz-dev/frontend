"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronsLeft, LogOut } from "lucide-react";
import { navSections, navItemVisible, type NavItem } from "@/components/layout/nav-config";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSession, signOut } from "next-auth/react";
import { useMe } from "@/lib/hooks/useMe";
import type { Role } from "@/types/roles";
import s from "./tor-nav.module.css";

/**
 * CHAP MENYU — "OROLCHA".
 *
 * Suzuvchi yumaloq panel. Odatda TOR (68px): faqat bo'lim ikonkalari.
 * Sichqoncha ustiga borganda (yoki klaviatura fokusi tushganda) kengayadi va
 * bo'limlar akkordeon bo'lib ochiladi. Kontent menyu bilan BIRGA suriladi va
 * yangi enga moslashadi — menyu sahifa ustini yopmaydi (egasi talabi,
 * 2026-10-04). "Qadash" tugmasi bosilsa keng holatda qoladi; tanlov eslab
 * qolinadi.
 *
 * Menyu TARKIBI o'zgarmagan: bo'limlar, sahifalar, ikonkalar va ruxsat
 * qoidasi avvalgidek `nav-config.ts` dan (`navSections`, `navItemVisible`) —
 * tepadagi qidiruv ham aynan shundan o'qiydi.
 *
 * ANIMATSIYA:
 *   · en va akkordeon bitta egri chiziqda (`--ease`), bitta davomiylikda;
 *   · faol band belgisi BITTA element — banddan bandga sirpanadi; faol sahifa
 *     yopiq bo'limda bo'lsa, belgi bo'lim sarlavhasiga ko'chadi;
 *   · ochilish 90ms kechikadi (tasodifan tegib ketganda ochilib ketmasin);
 *   · `prefers-reduced-motion` da animatsiya o'chadi (CSS).
 *
 * Sensorli ekran (hover yo'q): tor panelga bosilganda fokus tushadi va u
 * ochiladi, tashqariga bosilganda yopiladi.
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

/**
 * QADASH holati: "1" = qadalgan, aks holda suzuvchi (standart).
 *
 * YANGI kalit — eski `nav:mode` ATAYLAB o'qilmaydi. Avvalgi menyuda "keng"
 * rejimni tanlagan odamda u "wide" bo'lib qolgan; shuni "qadalgan" deb
 * o'qisak, orolcha hech qachon suzmay, eski keng menyuga o'xshab turardi va
 * yangi dizayn umuman ko'rinmasdi.
 */
const MODE_KEY = "nav:pin";
const STORE_EVENT = "nav:store";

/** Brauzer xotirasi — private oynada tashlashi mumkin, hamma joyda try/catch. */
function oqi(key: string): string | null {
  try { return window.localStorage.getItem(key); } catch { return null; }
}
function yoz(key: string, v: string) {
  try { window.localStorage.setItem(key, v); } catch { /* jim */ }
}

const isActiveHref = (pathname: string | null, href: string) =>
  pathname === href || !!pathname?.startsWith(href + "/");

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

/**
 * SIRPANUVCHI BELGI. Faol bandning (`data-active`) joyini o'lchab, belgi
 * elementiga `--y` / `--h` beradi. Faol band yopiq akkordeon ichida bo'lsa —
 * o'sha bo'limning sarlavhasiga (`data-here`) o'tadi. Panel eni yoki akkordeon
 * o'zgarganda qayta o'lchanadi, shuning uchun belgi banddan ortda qolmaydi.
 */
function useGlide(dep: unknown) {
  const box = useRef<HTMLElement>(null);
  const [pos, setPos] = useState<{ y: number; h: number } | null>(null);
  const measure = useCallback(() => {
    const root = box.current;
    if (!root) return;
    // "Ko'rinadi" — o'zi ham, uni kesib turgan otalari ham (yopiq akkordeon
    // `overflow: hidden` bilan 0 ga siqiladi, bandning o'z o'lchami esa qoladi).
    const korinadi = (x: HTMLElement) => {
      if (x.offsetParent === null) return false;
      for (let e: HTMLElement | null = x; e && e !== root; e = e.parentElement) {
        if (e.getBoundingClientRect().height < 8) return false;
      }
      return true;
    };
    const el = [...root.querySelectorAll<HTMLElement>('[data-active="true"]')].find(korinadi)
      ?? [...root.querySelectorAll<HTMLElement>('[data-here="true"]')].find(korinadi);
    if (!el) { setPos(null); return; }
    const a = el.getBoundingClientRect();
    const b = root.getBoundingClientRect();
    const next = { y: Math.round(a.top - b.top + root.scrollTop), h: Math.round(a.height) };
    setPos((p) => (p && p.y === next.y && p.h === next.h ? p : next));
  }, []);
  useLayoutEffect(measure, [dep, measure]);
  useEffect(() => {
    const root = box.current;
    if (!root) return;
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    root.querySelectorAll("[data-observe]").forEach((el) => ro.observe(el));
    return () => ro.disconnect();
  }, [measure, dep]);
  const style = pos
    ? ({ "--y": `${pos.y}px`, "--h": `${pos.h}px`, opacity: 1 } as React.CSSProperties)
    : ({ opacity: 0 } as React.CSSProperties);
  return [box, style] as const;
}

export function TorNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { me } = useMe();
  const role = (session?.user?.role ?? "TEACHER") as Role;
  const permissions = me?.permissions;

  // ── qadalganmi (eslab qolinadi) ──────────────────────────────────────
  const [modeRaw, setModeRaw] = useStored(MODE_KEY, "0");
  const pinned = modeRaw === "1";
  /** "Yopish" bosildi — sichqoncha chiqib ketguncha menyu yig'iq ushlanadi. */
  const [yopildi, setYopildi] = useState(false);
  /**
   * Sichqoncha PANEL ustida (yoki fokus ichkarida). Tutqich bu hisobga
   * KIRMAYDI: uning ustiga borish menyuni ochmaydi — aks holda tutqich joyidan
   * siljib, bosib bo'lmasdi. Ochilish 90ms kechikadi (tasodifiy tegish).
   */
  const [ustida, setUstida] = useState(false);
  const kutish = useRef<number | null>(null);
  const kutishniBekor = () => { if (kutish.current) { window.clearTimeout(kutish.current); kutish.current = null; } };
  useEffect(() => kutishniBekor, []);
  const ochishniBoshla = () => { kutishniBekor(); kutish.current = window.setTimeout(() => setUstida(true), 90); };
  const ochiqHolat = pinned || (ustida && !yopildi);

  // ── ruxsat bo'yicha filtr (yuklanmaguncha role fallback) ─────────────
  // Qoida `navItemVisible` da — tepadagi qidiruv ham aynan shundan o'qiydi.
  const visible = useCallback(
    (item: NavItem) => navItemVisible(item, { role, permissions, teacherId: me?.teacherId }),
    [role, permissions, me?.teacherId]);

  const sections = useMemo(() => navSections
    .map(sec => ({ ...sec, items: sec.items.filter(visible) }))
    .filter(sec => sec.items.length > 0), [visible]);

  const activeSectionId = useMemo(
    () => sections.find(sec => sec.items.some(i => isActiveHref(pathname, i.href)))?.id ?? null,
    [sections, pathname]);

  // ── akkordeon: bir vaqtda BITTA bo'lim ochiq ─────────────────────────
  // Standart — faol sahifaning bo'limi. Qo'lda ochilgan bo'lim sahifa
  // almashguncha saqlanadi (holat manzil bilan birga turadi — effektda
  // `setState` chaqirmaslik uchun).
  const [qolda, setQolda] = useState<{ path: string | null; id: string } | null>(null);
  const ochiqId = qolda && qolda.path === pathname ? qolda.id : activeSectionId ?? "";
  const almashtir = (id: string) => setQolda({ path: pathname, id: ochiqId === id ? "" : id });

  const [box, glide] = useGlide(`${pathname}|${ochiqId}|${ochiqHolat}|${sections.length}`);

  const chiqish = async () => {
    const loginUrl = (typeof window !== "undefined" ? window.location.origin : "") + "/login";
    await signOut({ redirect: false });
    window.location.href = loginUrl;
  };

  const ism = session?.user?.name ?? "Foydalanuvchi";

  return (
    <div className={s.slot} data-pinned={pinned} data-open={ochiqHolat}
      // Sichqoncha butun menyu hududidan (panel + tutqich) chiqqanda: yig'iladi,
      // "Yopish"dan keyingi ushlab turish tugaydi va ichkarida qolgan fokus
      // olinadi (bosilgan havola fokusda qolib, menyuni ochiq ushlab turmasin).
      onMouseLeave={(e) => {
        kutishniBekor(); setUstida(false); setYopildi(false);
        const f = document.activeElement;
        if (f instanceof HTMLElement && e.currentTarget.contains(f)) f.blur();
      }}>
      {/* OCHIQ/YOPIQ KALITI — panel chetida, tor holatda ham ko'rinadi.
          Qadalmagan: bosilsa menyu ochiq QOLADI. Qadalgan: bosilsa DARHOL
          yig'iladi (sichqoncha ustida tursa ham) va yana odatdagidek ustiga
          borilganda ochiladigan bo'ladi. */}
      <button type="button" className={s.handle} aria-pressed={pinned}
        aria-label={pinned ? "Menyuni yopish" : "Menyuni ochiq qoldirish"}
        // Tushuntirish — o'zimizning tooltip (CSS, `data-tip`): brauzerning `title`i
        // bir soniyacha kechikib chiqadi va mavzuga mos kelmaydi.
        data-tip={pinned ? "Menyuni yopish" : "Menyuni ochiq qoldirish"}
        onClick={(e) => {
          if (pinned) { kutishniBekor(); setModeRaw("0"); setUstida(false); setYopildi(true); e.currentTarget.blur(); }
          else setModeRaw("1");
        }}>
        {/* Bitta strelka: yopiq holatda o'ngga ("ochish"), ochiqda chapga
            ("yopish") qaraydi — holat almashganda silliq buriladi (CSS). */}
        <ChevronsLeft size={14} />
      </button>
      <aside className={s.island} aria-label="Asosiy menyu"
        // Klaviatura (Tab) yoki sensorli ekranda bosish — fokus RO'YXATGA yoki
        // pastki qismga tushganda ochiladi (`onFocus` o'sha ikkisida; logo
        // bosilganda ochilmaydi), butunlay chiqqanda yig'iladi.
        onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null) && !e.currentTarget.matches(":hover")) setUstida(false); }}>
        {/* TEPA QISM (logo qatori) — ustiga borilganda menyu OCHILMAYDI: tutqich
            shu yerda, unga qo'l cho'zganda menyu ochilib ketmasin. Ochilish
            faqat pastdagi ro'yxat va profil qismi ustida boshlanadi. */}
        <div className={s.head} onMouseEnter={kutishniBekor}>
          <Link href="/dashboard" className={s.brand} aria-label="OneRoom — bosh sahifa">
            <span className={s.logo}><Image src="/logo.png" alt="" width={24} height={20} priority /></span>
            <span className={`${s.brandText} ${s.fade}`}>One<b>Room</b></span>
          </Link>
        </div>

        <nav className={s.scroll} ref={box} aria-label="Bo'limlar" onMouseEnter={ochishniBoshla} onFocus={() => setUstida(true)}>
          <span className={s.glide} style={glide} aria-hidden />
          {sections.map((sec) => {
            const Icon = sec.icon;
            const yolgiz = sec.items.length === 1;
            const ochiq = ochiqId === sec.id;
            const shuYerda = sec.id === activeSectionId;

            // Bitta sahifali bo'lim — akkordeonsiz, to'g'ridan-to'g'ri havola.
            if (yolgiz) {
              const item = sec.items[0];
              return (
                <div key={sec.id} className={s.acc}>
                  <Link href={item.href} className={s.accHead} title={item.label}
                    data-here={shuYerda} data-active={shuYerda}
                    aria-current={shuYerda ? "page" : undefined}>
                    <Icon size={19} className={s.icon} />
                    <span className={`${s.label} ${s.fade}`}>{item.label}</span>
                  </Link>
                </div>
              );
            }

            return (
              <div key={sec.id} className={s.acc} data-open={ochiq} data-observe>
                <button type="button" className={s.accHead} title={sec.label}
                  data-here={shuYerda} data-active={shuYerda && !ochiq}
                  aria-expanded={ochiq} onClick={() => almashtir(sec.id)}>
                  <Icon size={19} className={s.icon} />
                  <span className={`${s.label} ${s.fade}`}>{sec.label}</span>
                  <ChevronDown size={14} className={`${s.chev} ${s.fade}`} />
                </button>
                <div className={s.accBody}>
                  <div className={s.accInner}>
                    {sec.items.map((item) => {
                      const faol = isActiveHref(pathname, item.href);
                      return (
                        <Link key={item.href} href={item.href} className={s.sub}
                          tabIndex={ochiq ? 0 : -1}
                          data-active={ochiq && faol} aria-current={faol ? "page" : undefined}>
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        {/* Pastki qism: mavzu, profil, chiqish */}
        <div className={s.foot} onMouseEnter={ochishniBoshla} onFocus={() => setUstida(true)}>
          <div className={s.row}>
            <span className={s.themeCell}><ThemeToggle /></span>
            <span className={`${s.label} ${s.fade} ${s.rowLabel}`}>Mavzu</span>
          </div>
          <div className={s.row} title={`${ism} · ${ROLE_LABELS[role] ?? role}`}>
            <span className={s.avatar}>{(ism[0] ?? "U").toUpperCase()}</span>
            <span className={`${s.who} ${s.fade}`}><b>{ism}</b><small>{ROLE_LABELS[role] ?? role}</small></span>
            <button type="button" className={`${s.iconBtn} ${s.danger} ${s.fade}`} onClick={chiqish} aria-label="Chiqish" title="Chiqish">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
