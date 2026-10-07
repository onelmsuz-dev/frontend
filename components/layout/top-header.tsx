"use client";

import { ReactNode, useState, useRef, useEffect, useMemo } from "react";
import {
  Bell, Search, Plus, DollarSign, UserPlus, Users, UserCog,
  Check, BookOpen, X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useNotifications, type Notification } from "@/lib/hooks/useNotifications";
import { useLeadStages } from "@/lib/hooks/useLeads";
import { stageHue } from "@/lib/lead-stages";
import { cn } from "@/lib/utils";
import { TOUR_TARGETS } from "@/lib/onboarding/steps";
import { BranchHeaderControls } from "@/components/layout/branch-header-controls";
import { FullscreenToggle } from "@/components/fullscreen-toggle";
import { MyTasksButton } from "@/components/layout/my-tasks-button";
import { bolimlarniTop } from "@/components/layout/search-index";
import { useMe } from "@/lib/hooks/useMe";
import { useFeatures } from "@/lib/hooks/useFeatures";
import { useOnboardingCtx } from "@/lib/contexts/onboarding-context";
import type { Role } from "@/types/roles";

interface TopHeaderProps {
  title: string;
  subtitle?: ReactNode;
  action?: { label: string; onClick?: () => void };
}

// ── Notifications ────────────────────────────────────────────────────────────

const TYPE_ICON: Record<string, { icon: typeof DollarSign; cls: string }> = {
  payment: { icon: DollarSign, cls: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" },
  lead:    { icon: UserPlus,   cls: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" },
  student: { icon: Users,      cls: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" },
  // Platforma qo'shimcha xodim o'rni ochganda (admode, faqat egaga).
  staff:   { icon: UserCog,    cls: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" },
};

function NotifIcon({ type }: { type: string }) {
  const cfg = TYPE_ICON[type] ?? TYPE_ICON["student"];
  const Icon = cfg.icon;
  return (
    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0", cfg.cls)}>
      <Icon className="w-4 h-4" />
    </div>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "Hozirgina";
  if (mins < 60) return `${mins} daq. oldin`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs} soat oldin`;
  return `${Math.floor(hrs / 24)} kun oldin`;
}

// ── Search ───────────────────────────────────────────────────────────────────

type SearchResult = {
  students: { id: string; name: string; phone: string; isActive: boolean }[];
  groups:   { id: string; name: string; status: string; course: { name: string } | null }[];
  leads:    { id: string; name: string; phone: string; stageId: string }[];
};

const BOSH_NATIJA: SearchResult = { students: [], groups: [], leads: [] };

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  UPCOMING: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-neutral-100 text-neutral-500",
};
const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Faol", UPCOMING: "Kutilmoqda", COMPLETED: "Tugagan",
};

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/** Ro'yxat sarlavhasi — natija guruhlari ustida. */
function GuruhSarlavha({ children }: { children: ReactNode }) {
  return (
    <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400 border-b border-white/50 dark:border-white/10">
      {children}
    </p>
  );
}

/**
 * HEADER'DAGI UMUMIY QIDIRUV.
 *
 * 2026-10-01 gacha uchta kamchilik bor edi (sozlamalardan kelgan shikoyat:
 * "bir narsa yozib Enter bossa — not found"):
 *  1. Faqat serverdagi o'quvchi/guruh/lid qidirilardi — sozlamalar
 *     bo'limlari va sahifalar umuman yo'q edi. Endi "Bo'limlar" guruhi
 *     brauzerning o'zida, darhol (`search-index.ts`).
 *  2. Enter hech narsa qilmasdi. Endi Enter belgilangan natijani ochadi,
 *     ↑/↓ yuradi, Esc yopadi. Natija hali kelmagan bo'lsa, kelgach ochiladi.
 *  3. Yozish davom etganda eski bo'sh javob YANGI so'z bilan "topilmadi"
 *     deb ko'rsatilardi (natija kelguncha); server xato qaytarsa esa
 *     (sessiya tugagan, ruxsat yo'q) javob natija deb o'qilib, sahifa
 *     yiqilardi. Endi javob qaysi so'zga tegishli ekani saqlanadi va
 *     faqat o'shanda ko'rsatiladi; xato alohida yoziladi.
 */
function GlobalSearch() {
  const router   = useRouter();
  const pathname = usePathname();
  const { me } = useMe();
  const features = useFeatures().data;
  const { enabled: onboardingEnabled } = useOnboardingCtx();
  const { data: stagesData } = useLeadStages();
  const stagesById = Object.fromEntries((stagesData ?? []).map((s) => [s.id, s]));

  const [query,    setQuery]    = useState("");
  const [server,   setServer]   = useState<{ q: string; res: SearchResult | null } | null>(null);
  const [open,     setOpen]     = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [faol,     setFaol]     = useState(0);
  // Natija kelmasdan Enter bosilgan so'z — javob kelishi bilan birinchisi ochiladi.
  const [enterKutadi, setEnterKutadi] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);
  const debouncedQ   = useDebounce(query, 300);
  const q = query.trim();

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    const so = debouncedQ.trim();
    if (so.length < 2) return;
    let cancelled = false;
    fetch(`/api/search?q=${encodeURIComponent(so)}`)
      .then(async (r) => {
        // Ruxsat yo'q (`dashboard.view` siz rol) — xato emas: serverdan
        // natija yo'q, lekin bo'limlar baribir ko'rinadi.
        if (r.status === 403) return BOSH_NATIJA;
        if (!r.ok) throw new Error(String(r.status));
        const d = await r.json();
        return {
          students: Array.isArray(d?.students) ? d.students : [],
          groups:   Array.isArray(d?.groups)   ? d.groups   : [],
          leads:    Array.isArray(d?.leads)    ? d.leads    : [],
        } as SearchResult;
      })
      .then((res) => { if (!cancelled) setServer({ q: so, res }); })
      .catch(() => { if (!cancelled) setServer({ q: so, res: null }); });
    return () => { cancelled = true; };
  }, [debouncedQ]);

  const bolimlar = useMemo(() => q.length < 2 ? [] : bolimlarniTop(q, {
    role: (me?.role ?? "TEACHER") as Role,
    permissions: me?.permissions,
    teacherId: me?.teacherId,
    blocked: me?.subscriptionBlocked === true,
    features,
    onboardingEnabled,
    onSettings: pathname?.startsWith("/settings") ?? false,
  }), [q, me, features, onboardingEnabled, pathname]);

  // Server javobi FAQAT shu so'z uchun bo'lsa ko'rsatiladi.
  const javob     = server && server.q === q ? server : null;
  const kutilmoqda = q.length >= 2 && !javob;
  const res       = javob?.res ?? null;
  const xato      = !!javob && javob.res === null;

  /** Klaviatura tartibi — ekrandagi tartib bilan bir xil. */
  const items = useMemo(() => [
    ...bolimlar.map((b) => ({ key: b.key, href: b.href })),
    ...(res?.students ?? []).map((s) => ({ key: `s:${s.id}`, href: `/students/${s.id}` })),
    ...(res?.groups ?? []).map((g) => ({ key: `g:${g.id}`, href: `/groups/${g.id}` })),
    ...(res?.leads ?? []).map((l) => ({ key: `l:${l.id}`, href: "/leads" })),
  ], [bolimlar, res]);
  const faolIdx = items.length ? Math.min(faol, items.length - 1) : -1;
  const faolKey = faolIdx >= 0 ? items[faolIdx].key : null;
  const showPanel = open && q.length >= 2;

  function clear() {
    setQuery(""); setServer(null); setOpen(false); setExpanded(false);
    setFaol(0); setEnterKutadi(null);
  }

  function och(href: string) {
    clear();
    inputRef.current?.blur();
    router.push(href);
  }

  // Enter natija kelmasdan bosilgan bo'lsa — javob kelgach birinchisini ochamiz.
  useEffect(() => {
    if (!enterKutadi || enterKutadi !== q || kutilmoqda) return;
    const birinchi = items[0];
    if (birinchi) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      och(birinchi.href);
    } else {
      setEnterKutadi(null);
    }
    // `och` har renderda yangi — kuzatilmaydi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enterKutadi, q, kutilmoqda, items]);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (q.length < 2) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      if (!items.length) return;
      const d = e.key === "ArrowDown" ? 1 : -1;
      setFaol((faolIdx + d + items.length) % items.length);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      setOpen(true);
      if (faolIdx >= 0 && (bolimlar.length > 0 || !kutilmoqda)) och(items[faolIdx].href);
      else if (kutilmoqda) setEnterKutadi(q);
    }
  }

  const qatorCls = (key: string) => cn(
    "flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-white/50 dark:hover:bg-white/5",
    faolKey === key && "bg-white/60 dark:bg-white/10",
  );
  const hechNarsa = !kutilmoqda && !xato && bolimlar.length === 0
    && (res?.students.length ?? 0) + (res?.groups.length ?? 0) + (res?.leads.length ?? 0) === 0;

  return (
    // Tor panelda `static`: ochilgan qidiruv va natijalar oynasi butun
    // PANELGA nisbatan joylashadi (pastdagi `absolute inset-0`).
    <div className="@min-[58rem]:relative" ref={containerRef}>
      {/* Tor panel: ikonka, bosilganda qidiruv ochiladi */}
      {!expanded && (
        <button
          aria-label="Qidirish"
          className="@min-[58rem]:hidden w-9 h-9 flex items-center justify-center rounded-xl text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-white/60 dark:hover:bg-white/10 transition-colors"
          onClick={() => { setExpanded(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        >
          <Search className="w-4 h-4" />
        </button>
      )}

      {/* Keng panelda doim ko'rinadi. Tor panelda ochilganda PANELNING
          USTINI to'liq yopadi — ilgari maydon boshqa tugmalar qatoriga
          qo'shilib, sarlavhani va asosiy tugmani ekrandan surib chiqarardi. */}
      <div className={cn(expanded
        ? "@max-[58rem]:absolute @max-[58rem]:inset-0 @max-[58rem]:z-10 @max-[58rem]:flex @max-[58rem]:items-center @max-[58rem]:px-3 @max-[58rem]:rounded-[inherit] @max-[58rem]:bg-[#f6f8ff] dark:@max-[58rem]:bg-[#17181f]"
        : "hidden @min-[58rem]:block")}>
       <div className="relative w-full @min-[58rem]:w-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); setFaol(0); setEnterKutadi(null); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={showPanel}
          aria-controls="global-search-panel"
          aria-autocomplete="list"
          placeholder="Qidirish..."
          className="glass-soft pl-9 pr-8 h-9 w-full @min-[58rem]:w-56 text-[13px] border border-white/60 dark:border-white/10 rounded-full
            text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 outline-none
            focus:border-indigo-300 dark:focus:border-indigo-400/40 transition-colors"
        />
        {query && (
          <button onClick={clear} aria-label="Tozalash"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        {!query && expanded && (
          <button onClick={() => setExpanded(false)} aria-label="Yopish"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors @min-[58rem]:hidden">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
       </div>
      </div>

      {showPanel && (
        <div id="global-search-panel" role="listbox"
          className="absolute right-3 @min-[58rem]:right-0 top-full mt-1.5 glass-strong w-[min(20rem,calc(100%-1.5rem))] @min-[58rem]:w-80 max-h-[70vh] overflow-y-auto
          border border-white/60 dark:border-white/10 rounded-3xl shadow-xl z-50">

          {bolimlar.length > 0 && (
            <div>
              <GuruhSarlavha>Bo&apos;limlar</GuruhSarlavha>
              {bolimlar.map(b => {
                const Icon = b.icon;
                return (
                  <Link key={b.key} href={b.href} onClick={clear} role="option"
                    aria-selected={faolKey === b.key} className={qatorCls(b.key)}>
                    <div className="w-7 h-7 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 truncate">{b.label}</p>
                      <p className="text-[11px] text-neutral-400 truncate">{b.where}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {kutilmoqda && (
            <div className="px-4 py-4 text-center text-[12px] text-neutral-400">Qidirilmoqda...</div>
          )}

          {xato && (
            <div className="px-4 py-4 text-center text-[12px] text-red-500">Qidiruv ishlamadi. Birozdan keyin qayta urinib ko&apos;ring.</div>
          )}

          {hechNarsa && (
            <div className="px-4 py-6 text-center text-[12px] text-neutral-400">&quot;{q}&quot; bo&apos;yicha natija topilmadi</div>
          )}

          {res && res.students.length > 0 && (
            <div>
              <GuruhSarlavha>O&apos;quvchilar</GuruhSarlavha>
              {res.students.map(s => (
                <Link key={s.id} href={`/students/${s.id}`} onClick={clear} role="option"
                  aria-selected={faolKey === `s:${s.id}`} className={qatorCls(`s:${s.id}`)}>
                  <div className={cn("w-7 h-7 rounded-xl flex items-center justify-center text-white text-[11px] font-bold shrink-0",
                    s.isActive ? "bg-gradient-to-br from-blue-400 to-indigo-500" : "bg-gradient-to-br from-amber-400 to-orange-400")}>
                    {s.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 truncate">{s.name}</p>
                    <p className="text-[11px] text-neutral-400">{s.phone}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {res && res.groups.length > 0 && (
            <div>
              <GuruhSarlavha>Guruhlar</GuruhSarlavha>
              {res.groups.map(g => (
                <Link key={g.id} href={`/groups/${g.id}`} onClick={clear} role="option"
                  aria-selected={faolKey === `g:${g.id}`} className={qatorCls(`g:${g.id}`)}>
                  <div className="w-7 h-7 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                    <BookOpen className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 truncate">{g.name}</p>
                    <p className="text-[11px] text-neutral-400">{g.course?.name}</p>
                  </div>
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0",
                    STATUS_BADGE[g.status] ?? "bg-neutral-100 text-neutral-500")}>
                    {STATUS_LABEL[g.status] ?? g.status}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {res && res.leads.length > 0 && (
            <div>
              <GuruhSarlavha>Arizalar (CRM)</GuruhSarlavha>
              {res.leads.map(l => {
                const stage = stagesById[l.stageId];
                const hue = stage ? stageHue(stage.color) : null;
                return (
                  <Link key={l.id} href="/leads" onClick={clear} role="option"
                    aria-selected={faolKey === `l:${l.id}`} className={qatorCls(`l:${l.id}`)}>
                    <div className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                      <UserPlus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 truncate">{l.name}</p>
                      <p className="text-[11px] text-neutral-400">{l.phone}</p>
                    </div>
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0",
                      hue?.badge ?? "bg-neutral-100 text-neutral-500")}>
                      {stage?.name ?? "—"}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function TopHeader({ title, subtitle, action }: TopHeaderProps) {
  const [showNotif, setShowNotif] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { items, unread, markAllRead } = useNotifications();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
    }
    if (showNotif) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showNotif]);

  return (
    // `@container` — tugmalar EKRAN kengligiga emas, PANELNING o'z kengligiga
    // qarab ixchamlashadi. Ekran bo'yicha (`lg:`) qilinganda chap menyu keng
    // ochilgan planshet/noutbukda panel torayib, sarlavha yo'qolar va asosiy
    // tugma o'ngdan kesilardi. Bosqichlar:
    //   tor (<42rem)  — hammasi ikonka: filial, qidiruv, asosiy tugma "+"
    //   @2xl (42rem)  — filial nomi, to'liq ekran tugmasi
    //   @3xl (48rem)  — asosiy tugma yozuvi bilan
    //   58rem         — qidiruv maydoni ochiq
    // FON TO'LIQ (shaffof emas). `glass-panel` 55% shaffof edi: sahifa
    // aylantirilganda kartalar va matn panel ostidan ko'rinib, sarlavha va
    // tugmalar bilan chalkashib ketardi. Ranglar — shisha panelning toza fon
    // ustidagi ko'rinishiga teng, ya'ni tinch holatda farq sezilmaydi.
    <header className="@container glass-panel bg-[#f6f8ff]! dark:bg-[#17181f]! sticky top-0 z-30 mb-3 flex h-[56px] items-center justify-between border-b border-white/60 dark:border-white/10 px-4
      lg:top-4 lg:mx-5 lg:mb-1 lg:h-[64px] lg:rounded-3xl lg:border lg:border-white/60 lg:dark:border-white/10 lg:px-5">
      {/* PANEL USTIDAGI TIRQISH — kompyuterda panel ekran tepasidan 16px pastda
          "suzadi"; sahifa aylantirilganda kontent shu tirqishdan ko'rinib, panel
          ustidan chiqib turgandek bo'lardi. Ikki qatlam uni sahifa foni bilan
          yopadi (asos rang + gradient). `bg-fixed` — gradient oynaga nisbatan
          chiziladi, ya'ni orqadagi fon bilan aniq ustma-ust tushadi va yamoq
          sezilmaydi. Telefonda panel tepaga yopishgan — tirqish yo'q. */}
      <span aria-hidden className="app-bg-base pointer-events-none absolute -inset-x-5 -top-[17px] hidden h-4 lg:block" />
      <span aria-hidden className="app-bg-split bg-fixed pointer-events-none absolute -inset-x-5 -top-[17px] hidden h-4 lg:block" />
      <div className="min-w-0 flex-1 mr-2 @2xl:mr-3">
        <h1 className="font-semibold text-[16px] lg:text-[18px] text-neutral-900 dark:text-neutral-100 tracking-tight leading-none truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[11px] lg:text-[12px] text-neutral-500 dark:text-neutral-400 mt-1 truncate">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-1 @2xl:gap-2 shrink-0">
        <BranchHeaderControls />
        <GlobalSearch />
        <FullscreenToggle className="hidden @2xl:flex w-9 h-9 rounded-xl" />

        <MyTasksButton />

        {/* Bell */}
        <div className="relative" ref={panelRef}>
          <button onClick={() => setShowNotif(v => !v)} aria-label="Bildirishnomalar" title="Bildirishnomalar"
            className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors
              text-neutral-500 hover:text-indigo-600 dark:text-neutral-400 dark:hover:text-indigo-300
              hover:bg-white/60 dark:hover:bg-white/10">
            <Bell className="w-4 h-4" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] bg-red-500 rounded-full
                text-[9px] text-white font-bold flex items-center justify-center px-0.5">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 top-full mt-1.5 glass-strong w-80
              border border-white/60 dark:border-white/10 rounded-3xl shadow-xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/50 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <h3 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">Bildirishnomalar</h3>
                  {unread > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {unread}
                    </span>
                  )}
                </div>
                {unread > 0 && (
                  <button onClick={markAllRead}
                    className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                    <Check className="w-3 h-3" />{" "}Barchasini o&apos;qildi
                  </button>
                )}
              </div>

              <div className="max-h-[340px] overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center py-10 text-neutral-400">
                    <Bell className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-[12px]">Bildirishnomalar yo&apos;q</p>
                  </div>
                ) : (
                  items.map((n: Notification) => (
                    <div key={n.id}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-white/50 dark:hover:bg-white/5",
                        !n.isRead && "bg-blue-50/50 dark:bg-blue-900/10",
                      )}>
                      <NotifIcon type={n.type} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                            {n.title}
                          </p>
                          {!n.isRead && (
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">{n.body}</p>
                        <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {action && (
          <>
            {/* Tor panel: faqat ikonka (nomi `aria-label`/`title` da) */}
            <button
              onClick={action.onClick}
              aria-label={action.label} title={action.label}
              data-tour={TOUR_TARGETS.headerAction}
              className="@3xl:hidden w-9 h-9 shrink-0 flex items-center justify-center rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
            {/* Keng panel: yozuv + ikonka */}
            <Button size="sm" onClick={action.onClick}
              data-tour={TOUR_TARGETS.headerAction}
              className="hidden @3xl:flex gap-1.5 h-9 px-4 text-[13px] bg-indigo-600 hover:bg-indigo-700
                text-white rounded-2xl shadow-sm">
              <Plus className="w-3.5 h-3.5" />
              {action.label}
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
