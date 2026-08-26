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
    if (v) setTour({ stepKey: v.stepKey, stopIdx: v.stopIdx, paused: v.paused });
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

  const serverStatus = data?.status ?? "ACTIVE";
  const status: "ACTIVE" | "DISMISSED" | "DONE" =
    (localStatus as "ACTIVE" | "DISMISSED" | "DONE" | null) ?? serverStatus;

  // Server bizning optimistik holatimizni tasdiqlagach — mahalliy ustunlikni
  // olib tashlaymiz, aks holda keyingi haqiqiy o'zgarish ko'rinmay qolardi.
  useEffect(() => {
    if (localStatus && serverStatus === localStatus) setLocalStatus(null);
  }, [localStatus, serverStatus]);

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
  const celebrating = visible && allRequiredDone && !data?.celebratedAt;

  // ── Tur boshqaruvi ──────────────────────────────────────────────────────
  const startTour = useCallback(
    (stepKey: string) => {
      const step = STEP_BY_KEY[stepKey];
      if (!step) return;
      const next: TourState = { stepKey, stopIdx: 0, paused: false };
      setTour(step.stops.length > 0 ? next : null);
      if (step.stops.length > 0) {
        writeTour({ ...next, startedAt: Date.now() });
      }
      // Sahifa boshqa bo'lsa — o'tkazamiz. Modalni O'ZIMIZ ochmaymiz:
      // tugmani foydalanuvchi bosishi kerak, o'rgatishning mohiyati shu.
      const target = step.href.split("?")[0];
      if (pathname !== target) router.push(step.href);
    },
    [pathname, router],
  );

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
  const currentTarget = currentStop?.target ?? null;

  // ── Nishon bosilsa — keyingi nishonga ───────────────────────────────────
  // Capture fazasida: sahifaning o'z `onClick` i modalni ochishidan OLDIN
  // biz ham eshitamiz. Shu tufayli 13 ta sahifa kodiga tegilmaydi.
  const advanceRef = useRef(advance);
  // Render paytida ref yozish React qoidalariga zid — effektda yangilaymiz.
  useEffect(() => {
    advanceRef.current = advance;
  }, [advance]);
  const isLastStop =
    !!tour && tour.stopIdx + 1 >= (STEP_BY_KEY[tour.stepKey]?.stops.length ?? 0);

  useEffect(() => {
    if (!currentTarget) return;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const bump = () => {
      // Bir nishon ikki marta bosilsa ikkita taymer qo'yilib, tur bitta
      // to'xtashni sakrab o'tardi.
      if (timer) clearTimeout(timer);
      // Modal ochilishi/DOM almashishi uchun bir kadr kutamiz.
      timer = setTimeout(() => advanceRef.current(), 60);
    };

    const onClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      const hit = el?.closest?.(`[data-tour="${currentTarget}"]`);
      if (!hit) return;

      // MATN MAYDONI — bosish "bajardim" degani emas, yozish uchun fokus.
      // Aks holda "Kurs nomi" ni yozmoqchi bo'lgan foydalanuvchi inputga
      // bosishi bilan tur keyingi to'xtashga sakrab ketardi.
      if (el?.closest("input, textarea, [contenteditable='true']")) return;

      // NATIVE <select> — bosish ro'yxatni OCHADI, tanlash keyin bo'ladi.
      // Oldinga o'tish `change` da (quyida).
      if (el?.closest("select")) return;

      // OXIRGI to'xtashda klik bilan tugatmaymiz: "Saqlash" bosilib, forma
      // xato bersa (masalan telefon to'ldirilmagan) tur o'lib qolardi.
      // Yakunni server hal qiladi — `doneMap` effekti.
      if (isLastStop) return;

      bump();
    };

    // Select uchun: haqiqiy tanlov qilinganda oldinga o'tamiz.
    const onChange = (e: Event) => {
      const el = e.target as HTMLElement | null;
      if (!el?.closest?.(`[data-tour="${currentTarget}"]`)) return;
      if (!el.closest("select")) return;
      if ((el as HTMLSelectElement).value === "") return; // "Tanlang..." — hali tanlanmagan
      if (isLastStop) return;
      bump();
    };

    document.addEventListener("click", onClick, true);
    document.addEventListener("change", onChange, true);
    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("change", onChange, true);
    };
  }, [currentTarget, isLastStop]);

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
    if (tour && doneMap[tour.stepKey]) stopTour();
  }, [tour, doneMap, stopTour]);

  // ── Server amallari ─────────────────────────────────────────────────────
  const run = useCallback(
    async (
      action: "hide" | "resume" | "skip" | "unskip" | "celebrated",
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
      toggleSkip: (key, on) => void run(on ? "skip" : "unskip", { key }),
      celebrate: () => {
        setLocalStatus("DONE");
        void run("celebrated");
      },
      refresh: () => void mutate(),
    }),
    [
      isLoading, visible, steps, doneMap, skipped, required.length, requiredDone,
      nextStep, celebrating, status, tour, startTour, stopTour, resumeTour, run, mutate,
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
