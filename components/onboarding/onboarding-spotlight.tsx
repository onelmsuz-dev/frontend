"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowDown, ArrowUp, ChevronLeft, MousePointerClick, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { TourStop } from "@/lib/onboarding/steps";
import { useIsDesktop, useTourTarget } from "./use-tour-target";

/** Teshik nishondan shuncha piksel kengroq — ramka nafas olsin. */
const PAD = 6;
const BUBBLE_W = 300;
const GAP = 14;

interface Props {
  stop: TourStop;
  stepKey: string;
  stopIdx: number;
  stopCount: number;
  manualHint: string;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

export function OnboardingSpotlight(props: Props) {
  const { stop, stopIdx, stopCount, manualHint, onNext, onBack, onClose } = props;
  const { rect, notFound } = useTourTarget(stop.target);
  const isDesktop = useIsDesktop();
  const [mounted, setMounted] = useState(false);
  /** Teshikdan tashqari bosilganda halqani qayta o'ynatish uchun. */
  const [nudge, setNudge] = useState(0);

  useEffect(() => setMounted(true), []);
  useEffect(() => setNudge(0), [stop.target]);

  // Nishondan tashqariga bosilsa — "yumshoq turtki": halqa qayta o'ynaydi va
  // pufakcha matni o'zgaradi. Hech narsa bloklanmaydi, tur ham yopilmaydi.
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest?.(`[data-tour="${stop.target}"]`)) return;
      // Pufakchaning o'zi bosilgani turtki emas.
      if (el?.closest?.("[data-onb-bubble]")) return;
      setNudge((n) => n + 1);
    };
    document.addEventListener("click", onDocClick, true);
    return () => document.removeEventListener("click", onDocClick, true);
  }, [stop.target]);

  if (!mounted) return null;

  // ── Nishon topilmadi: JIM QOLMAYMIZ ────────────────────────────────────
  // Foydalanuvchi qorong'i ekranda "nima bo'ldi" deb qolmasligi kerak.
  if (notFound) {
    return createPortal(
      <div className="fixed bottom-24 left-3 right-3 z-[70] lg:left-auto lg:right-6 lg:bottom-6 lg:w-[340px] onb-pop">
        <div className="glass-strong rounded-3xl border border-white/60 dark:border-white/10 p-4 shadow-xl">
          <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
            Sahifa o&apos;zgargan ko&apos;rinadi
          </p>
          <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-1">
            Qadamni qo&apos;lda bajaring: <b>{manualHint}</b>
          </p>
          <Button size="sm" className="mt-3 h-8 text-[12px] w-full" onClick={onClose}>
            Tushunarli
          </Button>
        </div>
      </div>,
      document.body,
    );
  }

  if (!rect) return null;

  const hole = {
    top: rect.top - PAD,
    left: rect.left - PAD,
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
  };
  // Modal ichidagi nishon `z-[100]` da — undan yuqoriga chiqamiz. Modal
  // fonni o'zi qoraytirgani uchun ikkinchi scrim ham chizilmaydi.
  const z = rect.inModal ? 101 : 60;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  /** Pufakcha pastdami yoki tepada — qayerda joy ko'proq bo'lsa. */
  const below = rect.top + rect.height + GAP + 190 < vh;
  const bubbleTop = below ? hole.top + hole.height + GAP : Math.max(12, hole.top - 190 - GAP);
  const bubbleLeft = Math.min(
    Math.max(12, rect.left + rect.width / 2 - BUBBLE_W / 2),
    vw - BUBBLE_W - 12,
  );

  const bubble = (
    <div
      role="dialog"
      aria-modal="false"
      aria-live="polite"
      data-onb-bubble=""
      className={cn(
        "onb-pop glass-strong rounded-3xl border border-white/60 dark:border-white/10 shadow-2xl p-4",
        isDesktop ? "fixed w-[300px]" : "fixed bottom-[92px] left-3 right-3",
      )}
      style={
        isDesktop
          ? { top: bubbleTop, left: bubbleLeft, zIndex: z + 3 }
          : { zIndex: z + 3 }
      }
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">
            {nudge > 0 ? "Shu tugmani bosing" : stop.title}
          </p>
          <p className="text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300 mt-1">
            {stop.body}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Turni yopish"
          className="shrink-0 w-7 h-7 rounded-xl grid place-items-center text-neutral-400
                     hover:bg-neutral-200/60 dark:hover:bg-white/10 hover:text-neutral-700
                     dark:hover:text-neutral-200"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-2 mt-3">
        {/* Qadam nuqtalari — foydalanuvchi qancha qolganini ko'rsin */}
        <div className="flex items-center gap-1 flex-1">
          {Array.from({ length: stopCount }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === stopIdx
                  ? "w-5 bg-indigo-600 dark:bg-indigo-400"
                  : i < stopIdx
                    ? "w-1.5 bg-emerald-500"
                    : "w-1.5 bg-neutral-300 dark:bg-neutral-600",
              )}
            />
          ))}
        </div>
        {stopIdx > 0 && (
          <button
            onClick={onBack}
            className="h-7 px-2 rounded-xl text-[11px] font-semibold text-neutral-500
                       hover:bg-neutral-200/60 dark:hover:bg-white/10 flex items-center gap-0.5"
          >
            <ChevronLeft className="w-3 h-3" />
            Ortga
          </button>
        )}
        {/* Ba'zi qadamlar bosish bilan emas, yozish bilan bajariladi (masalan
            xona nomi) — o'shanda foydalanuvchi qo'lda oldinga o'tsin. */}
        <button
          onClick={onNext}
          className="inline-flex items-center gap-1 h-7 px-2 rounded-xl text-[11px] font-semibold
                     text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
        >
          <MousePointerClick className="w-3.5 h-3.5" />
          {stopIdx + 1 === stopCount ? "Tugatish" : "Keyingi"}
        </button>
      </div>
    </div>
  );

  return createPortal(
    <>
      {/* Teshik + qoraytirish. pointer-events yo'q — ostidagi tugma bosiladi. */}
      <div
        className="onb-hole"
        data-scrim={rect.inModal ? "off" : "on"}
        style={{ ...hole, zIndex: z }}
      />
      {/* Pulsatsiyalovchi halqa */}
      <div key={`ring-${nudge}`} className="onb-ring" style={{ ...hole, zIndex: z + 1 }} />
      {/* Bosish ishorasi — nishon markazida */}
      <span
        className="onb-tap fixed rounded-full border-2 pointer-events-none"
        style={{
          zIndex: z + 2,
          width: 44,
          height: 44,
          top: rect.top + rect.height / 2 - 22,
          left: rect.left + rect.width / 2 - 22,
          borderColor: "rgba(var(--onb-ring), .9)",
        }}
      />
      {/* Strelka — pufakchadan nishonga qaraydi (faqat desktopda o'rinli) */}
      {isDesktop && (
        <span
          className="onb-arrow fixed pointer-events-none text-indigo-600 dark:text-indigo-300"
          style={{
            zIndex: z + 2,
            left: Math.min(Math.max(16, rect.left + rect.width / 2 - 10), vw - 36),
            top: below ? hole.top + hole.height + 2 : hole.top - 26,
          }}
        >
          {below ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
        </span>
      )}
      {/* DIQQAT: teshikdan tashqarini BLOKLAYDIGAN to'siqlar YO'Q.
          Ilgari 4 ta ko'rinmas div qo'yilgandi va ular formaning qolgan
          MAJBURIY maydonlarini ham bosib turardi: "Kurs nomi" yoritilganda
          "Narx" va "Davomiylik" ni to'ldirib bo'lmasdi, modalning "Bekor"
          tugmasi ham ishlamasdi. Endi qoplama sof VIZUAL: foydalanuvchi
          xohlagan joyini bosaveradi, noto'g'ri joyga bossa faqat halqa
          qayta pulsatsiyalaydi (quyidagi effekt). */}
      {bubble}
    </>,
    document.body,
  );
}
