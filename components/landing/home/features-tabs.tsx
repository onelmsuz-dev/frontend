"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import { getUi } from "@/lib/i18n/ui";
import { features as baseFeatures } from "./content";
import { DISPLAY } from "./style";
import { Selection } from "./ui";

/**
 * IMKONIYATLAR — har 3 soniyada o'zi almashadigan tab-bo'lim.
 *
 * Taymer: faol tabdagi progress chizig'i va panel burchagidagi halqa BIR XIL CSS
 * animatsiya (3s). Almashtirishni animatsiyaning tugashi (`animationend`) boshqaradi,
 * shuning uchun taymer va ko'rinish hech qachon bir-biridan ajralmaydi; pauza esa
 * `animation-play-state` bilan — davom ettirilganda qolgan joyidan ketadi.
 *
 * QO'LDA TANLASH: foydalanuvchi tabni bossa, panelni sursa yoki klaviaturada o'zgartirsa,
 * avto-almashish to'xtaydi va HOLD_SECONDS (30s) dan keyin o'zi davom etadi. Shu vaqt
 * davomida halqada teskari sanoq ko'rinadi; halqani bossa — darrov davom etadi.
 *
 * To'xtaydi: foydalanuvchi pauza bosganda, qo'lda tanlagandan keyingi 30s da, KLAVIATURA
 * fokusi (`:focus-visible`) ichida bo'lganda va tab/panel maydoni ekranda ko'rinmaganda. `prefers-reduced-motion`
 * yoqilgan bo'lsa animatsiya o'chadi va almashish faqat qo'lda (bosish/surish).
 *
 * DIQQAT: oddiy `:focus` bo'yicha to'xtatish MUMKIN EMAS — sichqoncha yoki barmoq bilan
 * tabni bossa tugma fokusda qoladi va avto-almashish abadiy to'xtab qolardi. Sichqoncha
 * ustida turganda ham to'xtatilmaydi (aks holda kursor bo'limda tursa "qotib qolgan" tuyuladi);
 * to'xtatish uchun panel burchagidagi pauza tugmasi bor.
 *
 * Barcha 8 ta panel HTMLda turadi (bir-birining ustida, faqat faoli ko'rinadi) —
 * shu tufayli almashish haqiqiy crossfade, matn esa qidiruv robotlari uchun ham bor.
 */

const AUTO_SECONDS = 3;
const HOLD_SECONDS = 30;

/** Server komponent matnni beradi (tilga qarab); ikonkalar (funksiya) prop bo'la olmaydi — indeks bo'yicha shu yerda olinadi. */
export interface FeatureTabItem {
  title: string;
  description: string;
  color: string;
  bg: string;
  border: string;
}
export interface FeaturesTabsCopy {
  eyebrow: string;
  titleStart: string;
  titleAccent: string;
  lead: string;
}

export function FeaturesTabs({ items, copy: featuresCopy }: { items: FeatureTabItem[]; copy: FeaturesTabsCopy }) {
  const uid = useId();
  const ui = getUi(useLocale()).home;
  const features = items.map((x, idx) => ({ ...x, icon: baseFeatures[idx].icon }));
  const n = features.length;

  const [i, setI] = useState(0);
  const [cycle, setCycle] = useState(0); // bir xil tabni qayta bossa ham taymer qaytadan boshlansin
  const [userPaused, setUserPaused] = useState(false);
  const [focusIn, setFocusIn] = useState(false);
  const [hold, setHold] = useState(false);        // qo'lda tanlangandan keyingi kutish
  const [holdLeft, setHoldLeft] = useState(HOLD_SECONDS);
  const [holdKey, setHoldKey] = useState(0);      // har yangi qo'lda tanlash kutishni qaytadan boshlaydi
  const [inView, setInView] = useState(false);

  const areaRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);

  const running = inView && !userPaused && !focusIn && !hold;

  const go = useCallback(
    (idx: number) => {
      setI(((idx % n) + n) % n);
      setCycle((c) => c + 1);
    },
    [n],
  );

  /** Kutishni tugatib avto-almashishni darrov (yangi 3s sikl bilan) davom ettiradi. */
  const resume = useCallback(() => {
    setHold(false);
    setCycle((c) => c + 1);
  }, []);

  /** Foydalanuvchi qo'lda tanladi: tabga o'tadi va 30s avto-almashishni to'xtatadi. */
  const pick = useCallback(
    (idx: number) => {
      go(idx);
      // Harakatni kamaytirish yoqilgan bo'lsa avto-almashish yo'q — kutish ham kerak emas.
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      setHoldLeft(HOLD_SECONDS);
      setHoldKey((k) => k + 1);
      setHold(true);
    },
    [go],
  );

  // Kutish: har soniyada teskari sanoq; 0 bo'lganda avto-almashish qaytadan boshlanadi.
  // Haqiqiy (devor) vaqti bo'yicha — bo'lim ekrandan chiqib ketgan bo'lsa ham 30s da davom etadi.
  useEffect(() => {
    if (!hold) return;
    let left = HOLD_SECONDS;
    const id = setInterval(() => {
      left -= 1;
      setHoldLeft(left);
      if (left <= 0) {
        clearInterval(id);
        setHold(false);
        setCycle((c) => c + 1);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [hold, holdKey]);

  // Tab+panel maydoni ekranda bo'lmasa taymer yurmaydi (ko'rinmay aylanib ketmasin).
  // Butun bo'limni emas, faqat shu maydonni kuzatamiz: mobilda bo'lim juda baland.
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Mobil: faol tab gorizontal ro'yxat markaziga silliq keladi. Faqat ro'yxatning o'zi
  // suriladi (scrollIntoView sahifani ham tortib ketardi).
  useEffect(() => {
    const list = listRef.current;
    if (!list || list.scrollWidth <= list.clientWidth + 1) return;
    const btn = list.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!btn) return;
    list.scrollTo({ left: btn.offsetLeft - (list.clientWidth - btn.offsetWidth) / 2, behavior: "smooth" });
  }, [i]);

  function onListKeyDown(e: React.KeyboardEvent) {
    const next =
      e.key === "ArrowRight" || e.key === "ArrowDown" ? i + 1
      : e.key === "ArrowLeft" || e.key === "ArrowUp" ? i - 1
      : e.key === "Home" ? 0
      : e.key === "End" ? n - 1
      : null;
    if (next === null) return;
    e.preventDefault();
    const target = ((next % n) + n) % n;
    pick(target);
    requestAnimationFrame(() => listRef.current?.querySelectorAll<HTMLElement>('[role="tab"]')[target]?.focus());
  }

  // Panel ustida chapga/o'ngga surish (faqat aniq gorizontal harakat).
  function onTouchStart(e: React.TouchEvent) {
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  function onTouchEnd(e: React.TouchEvent) {
    const s = touch.current;
    touch.current = null;
    if (!s) return;
    const dx = e.changedTouches[0].clientX - s.x;
    const dy = e.changedTouches[0].clientY - s.y;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) pick(i + (dx < 0 ? 1 : -1));
  }

  const playState = running ? "running" : "paused";

  return (
    // scroll-mt: bo'limning ichki padding'i (py-24 / sm:py-32) hisobga olinib, "Imkoniyatlar" belgisi
    // (eyebrow) navbar ostida ~104px da to'xtaydi. Hero tugmasi va navbar havolasi shu yerga tushadi.
    <section id="features" className="scroll-mt-2 px-5 py-24 sm:-scroll-mt-6 sm:px-8 sm:py-32" aria-labelledby="features-heading">
      <div className="mx-auto max-w-[1200px]">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-600">{featuresCopy.eyebrow}</p>
        <h2 id="features-heading" className={`mt-4 max-w-4xl text-balance text-[2.5rem] sm:text-6xl ${DISPLAY} text-slate-900`}>
          {featuresCopy.titleStart} <span className="text-blue-600">{featuresCopy.titleAccent}</span>
        </h2>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">{featuresCopy.lead}</p>

        <div
          ref={areaRef}
          className="mt-12 grid gap-6 sm:mt-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-16"
          // Faqat klaviatura fokusi pauza beradi; sichqoncha/barmoq bilan bosishdan qolgan fokus emas.
          onFocus={(e) => setFocusIn(e.target.matches(":focus-visible"))}
          onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusIn(false); }}
        >
          {/* Tablar: mobilda gorizontal (snap + chetlari xira), kompyuterda vertikal katta ro'yxat */}
          <div
            ref={listRef}
            role="tablist"
            aria-label={ui.tabsAria}
            aria-orientation="vertical"
            onKeyDown={onListKeyDown}
            className="relative -mx-5 flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain scroll-px-5 px-5 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [mask-image:linear-gradient(to_right,transparent,#000_22px,#000_calc(100%-36px),transparent)] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:px-0 lg:pb-0 lg:[mask-image:none]"
          >
            {features.map((x, idx) => {
              const active = idx === i;
              return (
                <button
                  key={x.title}
                  id={`${uid}-tab-${idx}`}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  aria-controls={`${uid}-panel-${idx}`}
                  tabIndex={active ? 0 : -1}
                  onClick={() => pick(idx)}
                  className={`group relative flex min-h-11 shrink-0 snap-center items-center gap-3 overflow-hidden rounded-full border-2 px-4 py-2 text-left text-sm font-semibold transition-colors duration-300 lg:min-h-0 lg:overflow-visible lg:rounded-none lg:border-0 lg:px-0 lg:py-2.5 lg:text-[1.7rem] lg:font-bold lg:tracking-[-0.03em] ${
                    active
                      ? "border-slate-900 bg-slate-900 text-white lg:bg-transparent lg:text-slate-900"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-400 lg:bg-transparent lg:text-[#8494ad] lg:hover:text-slate-600"
                  }`}
                >
                  <span className={`hidden h-2.5 w-2.5 shrink-0 rounded-full transition-opacity duration-300 lg:block ${active ? "bg-blue-600 opacity-100" : "opacity-0"}`} />
                  {x.title}
                  {active && (
                    <span aria-hidden className="absolute inset-x-4 bottom-1 h-[3px] overflow-hidden rounded-full bg-white/20 lg:inset-x-0 lg:bottom-0 lg:bg-slate-100">
                      <span
                        key={`${i}-${cycle}`}
                        onAnimationEnd={() => go(i + 1)}
                        style={{ animationPlayState: playState, animationDuration: `${AUTO_SECONDS}s` }}
                        className="home-progress block h-full w-full rounded-full bg-blue-400 lg:bg-blue-600"
                      />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Paneller: hammasi bir katakda ustma-ust, faoli silliq paydo bo'ladi */}
          <div className="relative" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            <div className="absolute right-3 top-3 z-10 flex items-center gap-2 sm:right-5 sm:top-5">
              <span className="text-xs font-bold tabular-nums text-slate-600" aria-hidden>
                {String(i + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (userPaused) { setUserPaused(false); resume(); }      // pauzadan chiqarish
                  else if (hold) resume();                                  // 30s ni kutmasdan davom ettirish
                  else setUserPaused(true);                                 // pauza
                }}
                aria-pressed={userPaused}
                aria-label={
                  userPaused ? ui.autoResume
                  : hold ? ui.autoHold(holdLeft)
                  : ui.autoPause
                }
                className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/85 text-slate-800 shadow-sm backdrop-blur transition-colors hover:bg-white"
              >
                <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90" aria-hidden>
                  <circle cx="18" cy="18" r="16" fill="none" strokeWidth="2.5" className="stroke-slate-900/10" />
                  {hold && !userPaused ? (
                    // 30s teskari sanoq: halqa asta-sekin bo'shaydi
                    <circle
                      key={`hold-${holdKey}`}
                      cx="18" cy="18" r="16" fill="none" strokeWidth="2.5" strokeLinecap="round"
                      pathLength={100} strokeDasharray={100}
                      style={{ animationDuration: `${HOLD_SECONDS}s` }}
                      className="home-ring-drain stroke-slate-500"
                    />
                  ) : (
                    <circle
                      key={`${i}-${cycle}`}
                      cx="18" cy="18" r="16" fill="none" strokeWidth="2.5" strokeLinecap="round"
                      pathLength={100} strokeDasharray={100}
                      style={{ animationPlayState: playState, animationDuration: `${AUTO_SECONDS}s` }}
                      className="home-ring stroke-blue-600"
                    />
                  )}
                </svg>
                {userPaused ? (
                  <Play className="h-3.5 w-3.5 translate-x-px fill-current" aria-hidden />
                ) : hold ? (
                  <span className="text-[11px] font-bold tabular-nums text-slate-700" aria-hidden>{holdLeft}</span>
                ) : (
                  <Pause className="h-3.5 w-3.5 fill-current" aria-hidden />
                )}
              </button>
            </div>

            <div className="grid touch-pan-y">
              {features.map((f, idx) => {
                const active = idx === i;
                return (
                  <div
                    key={f.title}
                    id={`${uid}-panel-${idx}`}
                    role="tabpanel"
                    aria-labelledby={`${uid}-tab-${idx}`}
                    aria-hidden={!active}
                    className={`relative col-start-1 row-start-1 overflow-hidden rounded-[2rem] p-6 pt-16 transition-[opacity,transform,visibility] duration-500 ease-out sm:p-10 sm:pt-20 ${f.bg} ${
                      active ? "visible translate-y-0 opacity-100" : "invisible translate-y-3 opacity-0"
                    }`}
                  >
                    <f.icon aria-hidden className={`pointer-events-none absolute -bottom-10 -right-10 h-64 w-64 opacity-[0.08] ${f.color}`} />
                    <Selection className="inline-block">
                      <span className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ${f.color}`}><f.icon className="h-8 w-8" aria-hidden /></span>
                    </Selection>
                    <h3 className={`mt-9 text-4xl sm:text-5xl ${DISPLAY} text-slate-900`}>{f.title}</h3>
                    <p className="mt-4 max-w-md text-lg leading-relaxed text-slate-700">{f.description}</p>
                    <div className="relative mt-8 space-y-2.5 rounded-2xl bg-white/80 p-4 backdrop-blur">
                      {[78, 56, 68].map((w, k) => (
                        <div key={k} className="flex items-center gap-3">
                          <span className={`h-6 w-6 shrink-0 rounded-md border ${f.bg} ${f.border}`} />
                          <span style={{ width: `${w}%` }} className="h-2.5 rounded-full bg-slate-200" />
                          <span className={`ml-auto h-2.5 w-10 rounded-full border ${f.bg} ${f.border}`} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
