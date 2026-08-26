"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMe, hasPerm } from "@/lib/hooks/useMe";
import { useOnboarding, onboardingAction } from "@/lib/hooks/useOnboarding";
import { ONBOARDING_STEPS, STEP_BY_KEY } from "@/lib/onboarding/steps";
import type { OnboardingCtxValue, TourState } from "@/lib/contexts/onboarding-context";
import { OnboardingErrorBoundary } from "./onboarding-error-boundary";
import { OnboardingSpotlight } from "./onboarding-spotlight";
import { OnboardingCelebration } from "./onboarding-celebration";

/**
 * TUR HOLATI localStorage'da — sahifadan sahifaga o'tishda va F5 dan keyin
 * saqlanishi kerak. Server'da saqlanmaydi: bu bitta brauzerdagi vaqtinchalik
 * sayohat, boshqa qurilmaga ko'chirilishi shart emas.
 */
const TOUR_LS = "oneroom.tour.v1";
/** Yarim qolgan tur ertasi kuni foydalanuvchiga hujum qilmasin. */
const TOUR_MAX_AGE_MS = 24 * 60 * 60 * 1000;

interface StoredTour extends TourState {
  startedAt: number;
}

function readTour(): StoredTour | null {
  try {
    const raw = localStorage.getItem(TOUR_LS);
    if (!raw) return null;
    const v = JSON.parse(raw) as StoredTour;
    if (!v?.stepKey || !STEP_BY_KEY[v.stepKey]) return null;
    if (Date.now() - (v.startedAt ?? 0) > TOUR_MAX_AGE_MS) {
      localStorage.removeItem(TOUR_LS);
      return null;
    }
    return v;
  } catch {
    return null;
  }
}

function writeTour(v: StoredTour | null) {
  try {
    if (v) localStorage.setItem(TOUR_LS, JSON.stringify(v));
    else localStorage.removeItem(TOUR_LS);
  } catch {
    // Shaxsiy rejimda localStorage yozib bo'lmasligi mumkin — tur baribir
    // joriy sahifada ishlayveradi, faqat F5 dan keyin tiklanmaydi.
  }
}

/**
 * Onboarding "miyasi". Bolalarni O'RAMAYDI — holatni `onValue` orqali
 * yuqoriga uzatadi va faqat qoplamalarni (spotlight, tabrik) chizadi.
 * Sabab: `OnboardingMount` dagi izohga qarang (daraxt qayta qurilmasin).
 */
/**
 * Joriy URL qadamning manziliga MOS kelyaptimi.
 * `href` dagi har bir query parametri joriy URL'da ham xuddi shunday
 * bo'lishi shart — aks holda o'tish kerak.
 */
function needsNavigation(href: string): boolean {
  const [path, query] = href.split("?");
  if (window.location.pathname !== path) return true;
  if (!query) return false;
  const cur = new URLSearchParams(window.location.search);
  for (const [k, v] of new URLSearchParams(query)) {
    if (cur.get(k) !== v) return true;
  }
  return false;
}

export function OnboardingRuntime({ onValue }: { onValue: (v: OnboardingCtxValue) => void }) {
  const { me } = useMe();
  const router = useRouter();
  const pathname = usePathname();
  const { data, isLoading, mutate } = useOnboarding(true);

  const [tour, setTour] = useState<TourState | null>(null);
  /** Optimistik: tugma bosilgan zahoti holat o'zgarsin, server keyin tasdiqlaydi. */
  const [localStatus, setLocalStatus] = useState<string | null>(null);

  // ── Turni localStorage'dan tiklash ──────────────────────────────────────
  // Render PAYTIDA emas, effektda: server ham, mijoz ham bir xil boshlang'ich
  // holatdan chizsin (gidratsiya nomuvofiqligi bo'lmasin).
  useEffect(() => {
    const v = readTour();
    if (v) setTour({ stepKey: v.stepKey, stopIdx: v.stopIdx, paused: v.paused,
                     replay: !!v.replay, walkthrough: !!v.walkthrough });
  }, []);

  // ── Rol bo'yicha filtrlangan qadamlar ───────────────────────────────────
  const steps = useMemo(
    () => ONBOARDING_STEPS.filter((s) => hasPerm(me?.permissions, s.perm)),
    [me?.permissions],
  );

  // `?? {}` har renderda YANGI obyekt beradi va quyidagi `useMemo` larni
  // butunlay foydasiz qilardi — shuning uchun barqarorlashtiriladi.
  const doneMap = useMemo(() => data?.steps ?? {}, [data?.steps]);
  const skipped = useMemo(() => data?.skipped ?? [], [data?.skipped]);

  // `startTour` `doneMap` ga bog'lanib qolmasin (u har javobda yangilanadi va
  // butun kontekst qiymatini qayta yaratardi).
  const doneMapRef = useRef<Record<string, boolean>>({});

  const serverStatus = data?.status ?? "ACTIVE";
  const status: "ACTIVE" | "DISMISSED" | "DONE" =
    (localStatus as "ACTIVE" | "DISMISSED" | "DONE" | null) ?? serverStatus;

  // Server bizning optimistik holatimizni tasdiqlagach — mahalliy ustunlikni
  // olib tashlaymiz, aks holda keyingi haqiqiy o'zgarish ko'rinmay qolardi.
  useEffect(() => {
    if (localStatus && serverStatus === localStatus) setLocalStatus(null);
  }, [localStatus, serverStatus]);

  useEffect(() => {
    doneMapRef.current = doneMap;
  }, [doneMap]);

  const required = useMemo(() => steps.filter((s) => s.required), [steps]);
  const requiredDone = required.filter((s) => doneMap[s.key]).length;
  const allRequiredDone = required.length > 0 && requiredDone === required.length;

  /** Bloklangan qadam — bog'liqligi bajarilmagan. */
  const isBlocked = useCallback(
    (key: string) => {
      const dep = STEP_BY_KEY[key]?.dependsOn ?? [];
      return dep.some((d) => !doneMap[d]);
    },
    [doneMap],
  );

  const nextStep = useMemo(() => {
    const pool = allRequiredDone ? steps : required;
    return (
      pool.find((s) => !doneMap[s.key] && !skipped.includes(s.key) && !isBlocked(s.key)) ??
      null
    );
  }, [steps, required, allRequiredDone, doneMap, skipped, isBlocked]);

  const visible = status === "ACTIVE" && steps.length > 0;

  /**
   * Ma'lumot BIRINCHI kelganda hammasi allaqachon bajarilgan bo'lganmi.
   *
   * Tabrik "siz hozir tugatdingiz" degani. Sozlangan markazda panel qaytarilsa
   * (yoki "qaytadan o'rganish" tanlansa) darhol to'liq ekranli tabrik chiqib
   * kelishi noto'g'ri bo'lardi — u faqat qadam KO'Z OLDIDA bajarilganda
   * ko'rsatiladi.
   */
  const [completeAtLoad, setCompleteAtLoad] = useState<boolean | null>(null);
  useEffect(() => {
    if (!data) return;
    setCompleteAtLoad((cur) => (cur === null ? allRequiredDone : cur));
  }, [data, allRequiredDone]);

  const celebrating =
    visible && allRequiredDone && !data?.celebratedAt && completeAtLoad === false;

  // ── Tur boshqaruvi ──────────────────────────────────────────────────────
  const beginStep = useCallback((stepKey: string, walkthrough: boolean) => {
    const step = STEP_BY_KEY[stepKey];
    if (!step || step.stops.length === 0) {
      setTour(null);
      writeTour(null);
      return false;
    }
    const next: TourState = {
      stepKey,
      stopIdx: 0,
      paused: false,
      // Bajarilgan qadamni ko'rsatayotgan bo'lsak — tur o'zi to'xtamasin.
      replay: !!doneMapRef.current[stepKey] || walkthrough,
      walkthrough,
    };
    setTour(next);
    writeTour({ ...next, startedAt: Date.now() });
    return true;
  }, []);

  const startTour = useCallback(
    (stepKey: string) => {
      const step = STEP_BY_KEY[stepKey];
      if (!step) return;
      // Qadamning turi bo'lmasa (to'lov, davomat) — shunchaki sahifasiga.
      if (step.stops.length === 0) {
        router.push(step.href);
        return;
      }
      beginStep(stepKey, false);
    },
    [beginStep, router],
  );

  /** Ruxsati bor va turi bo'lgan qadamlar — to'liq yurish tartibi. */
  const walkOrder = useMemo(
    () => steps.filter((s) => s.stops.length > 0).map((s) => s.key),
    [steps],
  );
  const walkOrderRef = useRef<string[]>([]);
  useEffect(() => {
    walkOrderRef.current = walkOrder;
  }, [walkOrder]);

  const startWalkthrough = useCallback(() => {
    const first = walkOrderRef.current[0];
    if (first) beginStep(first, true);
  }, [beginStep]);

  const stopTour = useCallback(() => {
    setTour(null);
    writeTour(null);
  }, []);

  /** `Esc` bilan pauza qilingan turni o'sha joyidan davom ettiradi. */
  const resumeTour = useCallback(() => {
    setTour((cur) => {
      if (!cur) return cur;
      const next = { ...cur, paused: false };
      writeTour({ ...next, startedAt: Date.now() });
      return next;
    });
  }, []);

  const advance = useCallback(() => {
    setTour((cur) => {
      if (!cur) return cur;
      const step = STEP_BY_KEY[cur.stepKey];
      const nextIdx = cur.stopIdx + 1;

      if (!step || nextIdx >= step.stops.length) {
        // TO'LIQ YURISH: qadam tugadi — to'xtamaymiz, keyingisiga o'tamiz.
        if (cur.walkthrough) {
          const order = walkOrderRef.current;
          const nextKey = order[order.indexOf(cur.stepKey) + 1];
          if (nextKey) {
            const n: TourState = {
              stepKey: nextKey, stopIdx: 0, paused: false,
              replay: true, walkthrough: true,
            };
            writeTour({ ...n, startedAt: Date.now() });
            return n;
          }
        }
        writeTour(null);
        return null;
      }

      const next = { ...cur, stopIdx: nextIdx, paused: false };
      writeTour({ ...next, startedAt: Date.now() });
      return next;
    });
  }, []);

  const back = useCallback(() => {
    setTour((cur) => {
      if (!cur || cur.stopIdx === 0) return cur;
      const next = { ...cur, stopIdx: cur.stopIdx - 1, paused: false };
      writeTour({ ...next, startedAt: Date.now() });
      return next;
    });
  }, []);

  const currentStop = tour ? STEP_BY_KEY[tour.stepKey]?.stops[tour.stopIdx] ?? null : null;

  // ── Nishon bosilsa — turni surib boramiz ────────────────────────────────
  // Capture fazasida: sahifaning o'z `onClick` i modalni ochishidan OLDIN
  // biz ham eshitamiz. Shu tufayli 13 ta sahifa kodiga tegilmaydi.
  /**
   * Aniq to'xtashga o'tish. `idx` oxiridan oshsa — qadam tugadi
   * (to'liq yurishda keyingi qadamga o'tiladi).
   */
  const jump = useCallback((idx: number) => {
    setTour((cur) => {
      if (!cur) return cur;
      const step = STEP_BY_KEY[cur.stepKey];
      if (!step) return cur;

      if (idx < step.stops.length) {
        if (idx === cur.stopIdx) return cur;
        const next = { ...cur, stopIdx: idx, paused: false };
        writeTour({ ...next, startedAt: Date.now() });
        return next;
      }

      // Qadam tugadi
      if (cur.walkthrough) {
        const order = walkOrderRef.current;
        const nextKey = order[order.indexOf(cur.stepKey) + 1];
        if (nextKey) {
          const n: TourState = {
            stepKey: nextKey, stopIdx: 0, paused: false,
            replay: true, walkthrough: true,
          };
          writeTour({ ...n, startedAt: Date.now() });
          return n;
        }
      }
      writeTour(null);
      return null;
    });
  }, []);

  const jumpRef = useRef(jump);
  useEffect(() => {
    jumpRef.current = jump;
  }, [jump]);
  useEffect(() => {
    if (!tour || tour.paused) return;
    const step = STEP_BY_KEY[tour.stepKey];
    if (!step) return;
    let timer: ReturnType<typeof setTimeout> | null = null;

    /**
     * TUR FOYDALANUVCHIGA ERGASHADI, teskarisi emas.
     *
     * Ilgari faqat JORIY to'xtash nishoni kuzatilardi. Amalda odam qat'iy
     * ketma-ketlikda yurmaydi: xona nomini yozib, to'g'ridan-to'g'ri
     * "Saqlash" ni bosadi. O'shanda tur "Nom bering" to'xtashida qolib,
     * forma yopilgach nishonini yo'qotib osilib qolardi.
     *
     * Endi bosilgan element SHU QADAMNING istalgan to'xtashiga tegishli
     * bo'lsa, tur o'sha joydan davom etadi.
     */
    const stopIndexOf = (el: HTMLElement | null): number => {
      if (!el) return -1;
      const holder = el.closest("[data-tour]") as HTMLElement | null;
      const id = holder?.getAttribute("data-tour");
      if (!id) return -1;
      return step.stops.findIndex((st) => st.target === id);
    };

    const goTo = (idx: number) => {
      if (timer) clearTimeout(timer);
      // Modal ochilishi/DOM almashishi uchun bir kadr kutamiz.
      timer = setTimeout(() => jumpRef.current(idx), 60);
    };

    const onClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      const idx = stopIndexOf(el);
      if (idx < 0 || idx < tour.stopIdx) return; // orqadagi nishon — e'tiborsiz

      // MATN MAYDONI — bosish "bajardim" degani emas, yozish uchun fokus.
      if (el?.closest("input, textarea, [contenteditable='true']")) {
        if (idx > tour.stopIdx) goTo(idx); // faqat shu maydonga suriladi
        return;
      }
      // NATIVE <select> — bosish ro'yxatni ochadi; tanlov `change` da.
      if (el?.closest("select")) {
        if (idx > tour.stopIdx) goTo(idx);
        return;
      }
      goTo(idx + 1);
    };

    const onChange = (e: Event) => {
      const el = e.target as HTMLElement | null;
      const idx = stopIndexOf(el);
      if (idx < 0 || idx < tour.stopIdx) return;
      if (!el?.closest("select")) return;
      if ((el as HTMLSelectElement).value === "") return; // hali tanlanmagan
      goTo(idx + 1);
    };

    document.addEventListener("click", onClick, true);
    document.addEventListener("change", onChange, true);
    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("change", onChange, true);
    };
  }, [tour]);

  // ── Klaviatura ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!tour) return;
    const onKey = (e: KeyboardEvent) => {
      // Foydalanuvchi matn yozayotgan bo'lsa ← → kursorni ko'chiradi, turni
      // emas. Aks holda "1-xoan" ni tuzatmoqchi bo'lgan odam turni orqaga
      // surib yuborardi.
      const t = e.target as HTMLElement | null;
      const typing =
        !!t &&
        (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName ?? ""));
      if (typing && e.key !== "Escape") return;
      if (e.isComposing) return;

      if (e.key === "Escape") {
        // O'chirmaydi — PAUZA qiladi. Checklistda "Davom etish" qoladi.
        setTour((cur) => {
          if (!cur) return cur;
          const next = { ...cur, paused: true };
          writeTour({ ...next, startedAt: Date.now() });
          return next;
        });
      } else if (e.key === "ArrowRight") {
        advance();
      } else if (e.key === "ArrowLeft") {
        back();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [tour, advance, back]);

  // ── Qadam boshlanganda kerakli sahifaga o'tish ─────────────────────────
  //
  // `stopIdx === 0` sharti muhim: o'tish har qadam uchun BIR MARTA bo'ladi.
  // Aks holda foydalanuvchi tur davomida boshqa sahifaga o'tmoqchi bo'lsa,
  // effekt uni doim orqaga tortib turardi.
  const tourStepKey = tour?.stepKey;
  const tourStopIdx = tour?.stopIdx;
  const tourPaused = tour?.paused;
  useEffect(() => {
    if (!tourStepKey || tourPaused || tourStopIdx !== 0) return;
    const step = STEP_BY_KEY[tourStepKey];
    if (step && needsNavigation(step.href)) router.push(step.href);
  }, [tourStepKey, tourStopIdx, tourPaused, router]);

  // ── Marshrut o'zgarsa — holatni yangilaymiz (polling YO'Q) ──────────────
  useEffect(() => {
    void mutate();
  }, [pathname, mutate]);

  // ── Mobilda kontent pastdagi varaq ostida qolib ketmasin ────────────────
  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;
    if (tour && !tour.paused) main.setAttribute("data-tour-active", "1");
    else main.removeAttribute("data-tour-active");
    return () => main.removeAttribute("data-tour-active");
  }, [tour]);

  // ── Qadam bajarilgach turni o'zi to'xtatish ─────────────────────────────
  // Server "bajarildi" deganda to'xtaydi — tugma bosilganiga emas.
  useEffect(() => {
    // Takroriy o'rganishda (`replay`) to'xtatmaymiz — foydalanuvchi ataylab
    // allaqachon bajarilgan qadamni qayta ko'rmoqchi.
    if (tour && !tour.replay && doneMap[tour.stepKey]) stopTour();
  }, [tour, doneMap, stopTour]);

  // ── Server amallari ─────────────────────────────────────────────────────
  const run = useCallback(
    async (
      action: "hide" | "resume" | "restart" | "skip" | "unskip" | "celebrated",
      body?: { key: string },
    ) => {
      const ok = await onboardingAction(action, body);
      // Muvaffaqiyatsiz bo'lsa optimistik holat qaytariladi — LEKIN
      // `celebrated` bundan mustasno: tabrik oynasi butun ekranni egallaydi
      // va uni qaytarish foydalanuvchini panelda qamab qo'yardi. U oyna
      // o'zini mahalliy holatda yopadi (onboarding-celebration.tsx).
      if (!ok && action !== "celebrated") setLocalStatus(null);
      void mutate();
    },
    [mutate],
  );

  const value = useMemo<OnboardingCtxValue>(
    () => ({
      enabled: true,
      loading: isLoading,
      visible,
      status,
      steps,
      doneMap,
      skipped,
      requiredTotal: required.length,
      requiredDone,
      nextStep,
      celebrating,
      tour,
      startTour,
      startWalkthrough,
      stopTour,
      resumeTour,
      hide: () => {
        setLocalStatus("DISMISSED");
        stopTour();
        void run("hide");
      },
      resume: () => {
        setLocalStatus("ACTIVE");
        void run("resume");
      },
      restart: () => {
        setLocalStatus("ACTIVE");
        stopTour();
        // Sessiya boshidagi "allaqachon tugagan" belgisini tozalaymiz —
        // shundan keyin qadamlarni haqiqatan qaytadan bajarsa, tabrik
        // yana ko'rsatiladi.
        setCompleteAtLoad(null);
        void run("restart");
      },
      toggleSkip: (key, on) => void run(on ? "skip" : "unskip", { key }),
      celebrate: () => {
        setLocalStatus("DONE");
        void run("celebrated");
      },
      refresh: () => void mutate(),
    }),
    [
      isLoading, visible, steps, doneMap, skipped, required.length, requiredDone,
      nextStep, celebrating, status, tour, startTour, startWalkthrough, stopTour,
      resumeTour, run, mutate, doneMap,
    ],
  );

  // Holatni yuqoriga uzatamiz (kontekst provayderi `OnboardingMount` da).
  useEffect(() => {
    onValue(value);
  }, [value, onValue]);

  return (
    <>
      {/* Xavfli qism (o'lchash, portal, animatsiya) alohida chegarada:
          yiqilsa faqat o'zi yo'qoladi, dashboard qolaveradi. */}
      <OnboardingErrorBoundary fallback={null}>
        {tour && !tour.paused && currentStop && (
          <OnboardingSpotlight
            stop={currentStop}
            walk={
              tour.walkthrough
                ? { index: walkOrder.indexOf(tour.stepKey) + 1, total: walkOrder.length }
                : null
            }
            stepKey={tour.stepKey}
            stopIdx={tour.stopIdx}
            stopCount={STEP_BY_KEY[tour.stepKey]?.stops.length ?? 0}
            manualHint={STEP_BY_KEY[tour.stepKey]?.manualHint ?? ""}
            onNext={advance}
            onBack={back}
            onClose={stopTour}
          />
        )}
        {celebrating && <OnboardingCelebration />}
      </OnboardingErrorBoundary>
    </>
  );
}
