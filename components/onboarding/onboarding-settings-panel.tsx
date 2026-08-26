"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check, Play, RotateCcw, Rocket, Eye, AlertTriangle, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useOnboardingCtx } from "@/lib/contexts/onboarding-context";
import { STEP_BY_KEY } from "@/lib/onboarding/steps";

/**
 * SOZLAMALAR → YO'L KO'RSATUVCHI.
 *
 * Ikki xil ehtiyojni qoplaydi va ular ATAYLAB ajratilgan:
 *
 *   1. "Qayta o'rganish" — istalgan qadamni qaytadan ko'rsatish. Hech narsani
 *      o'zgartirmaydi: shunchaki strelka yana yo'l boshlaydi. Bajarilgan
 *      qadam uchun ham ishlaydi.
 *   2. "Noldan boshlash" — panelni boshlang'ich holatiga qaytarish. Bu ham
 *      MA'LUMOTGA TEGMAYDI: xona, kurs, guruh — hammasi joyida qoladi,
 *      faqat sozlash paneli qaytadan ochiladi.
 */
export function OnboardingSettingsPanel() {
  const {
    enabled, status, steps, doneMap, requiredDone, requiredTotal,
    startTour, startWalkthrough, restart, resume,
  } = useOnboardingCtx();
  const router = useRouter();
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [done, setDone] = useState(false);

  // Bayroq o'chiq bo'lsa bo'lim umuman ko'rsatilmaydi.
  if (!enabled) return null;

  const pct = requiredTotal === 0 ? 0 : Math.round((requiredDone / requiredTotal) * 100);
  const shown = steps;

  const isBlocked = (key: string) =>
    (STEP_BY_KEY[key]?.dependsOn ?? []).some((d) => !doneMap[d]);

  function replay(key: string) {
    const step = STEP_BY_KEY[key];
    if (!step) return;
    if (step.stops.length === 0) {
      router.push(step.href);
      return;
    }
    startTour(key); // sahifaga o'tishni turning o'zi bajaradi
  }

  const STATUS_LABEL: Record<string, string> = {
    ACTIVE: "Panel dashboardda ko'rinib turibdi",
    DISMISSED: "Panel yopilgan",
    DONE: "Sozlash tugallangan",
  };

  return (
    <div className="space-y-4">
      {/* ── Holat ─────────────────────────────────────────────────────── */}
      <div className="glass-panel rounded-2xl border border-white/60 dark:border-white/10 p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl shrink-0 grid place-items-center bg-indigo-100/70 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300">
            <Rocket className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100">
              Yo&apos;l ko&apos;rsatuvchi
            </p>
            <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5">
              {STATUS_LABEL[status] ?? ""} · {requiredDone}/{requiredTotal} qadam bajarilgan
            </p>
          </div>
        </div>

        <div className="mt-4 h-2 rounded-full bg-neutral-200/70 dark:bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-emerald-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          {/* ASOSIY amal: butun yo'lni boshidan oxirigacha ko'rsatadi. */}
          <Button size="sm" className="h-9 text-[12px] gap-1.5" onClick={startWalkthrough}>
            <Play className="w-3.5 h-3.5" />
            Boshidan ko&apos;rsating
          </Button>
          {status !== "ACTIVE" && (
            <Button size="sm" variant="outline" className="h-9 text-[12px] gap-1.5"
              onClick={() => { resume(); setDone(true); }}>
              <Eye className="w-3.5 h-3.5" />
              Panelni qaytarish
            </Button>
          )}
          <Button size="sm" variant="outline" className="h-9 text-[12px] gap-1.5"
            onClick={() => setConfirmRestart(true)}>
            <RotateCcw className="w-3.5 h-3.5" />
            Noldan boshlash
          </Button>
          {done && (
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              Bajarildi — dashboardga qarang
            </span>
          )}
        </div>

        <p className="text-[11px] text-neutral-400 mt-3">
          Hech biri ma&apos;lumotga tegmaydi — xona, kurs, guruh va
          o&apos;quvchilar joyida qoladi.
        </p>
      </div>

      {/* ── Qadamlar: har birini qaytadan ko'rsatish ──────────────────── */}
      <div className="glass-panel rounded-2xl border border-white/60 dark:border-white/10 p-5">
        <p className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">
          Qadamlarni qaytadan o&apos;rganish
        </p>
        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
          Istalgan qadamni tanlang — tizim strelka bilan boshidan ko&apos;rsatib
          beradi. Bajarilgan qadamlar uchun ham ishlaydi.
        </p>

        <div className="mt-4 space-y-1">
          {shown.map((s, i) => {
            const isDone = !!doneMap[s.key];
            const blocked = !isDone && isBlocked(s.key);
            const Icon = s.icon;
            return (
              <div
                key={s.key}
                className="flex items-center gap-3 rounded-2xl px-3 py-2.5 hover:bg-white/60 dark:hover:bg-white/[0.06]"
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-xl shrink-0 grid place-items-center",
                    isDone
                      ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
                      : blocked
                        ? "bg-neutral-200/70 text-neutral-400 dark:bg-white/5 dark:text-neutral-500"
                        : "bg-indigo-100/70 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300",
                  )}
                >
                  {isDone ? <Check className="w-4 h-4" />
                    : blocked ? <Lock className="w-3.5 h-3.5" />
                    : <Icon className="w-4 h-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                    {i + 1}. {s.title}
                    {!s.required && (
                      <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-md
                                       bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        qo&apos;shimcha
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                    {blocked ? "Avval oldingi qadamlarni bajaring" : s.hint}
                  </p>
                </div>

                <Button
                  size="sm" variant="outline" disabled={blocked}
                  className="h-8 text-[12px] gap-1.5 shrink-0"
                  onClick={() => replay(s.key)}
                >
                  <Play className="w-3 h-3" />
                  Ko&apos;rsatib bering
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Noldan boshlash tasdig'i ──────────────────────────────────── */}
      <Modal
        open={confirmRestart}
        onClose={() => setConfirmRestart(false)}
        title="Sozlashni noldan boshlaymizmi?"
        footer={
          <>
            <Button className="flex-1 h-9 text-[13px]"
              onClick={() => { restart(); setConfirmRestart(false); setDone(true); }}>
              Ha, boshlansin
            </Button>
            <Button variant="outline" className="h-9 px-4 text-[13px]"
              onClick={() => setConfirmRestart(false)}>Bekor</Button>
          </>
        }>
        <p className="text-[13px] text-neutral-600 dark:text-neutral-300">
          Sozlash paneli dashboardda qaytadan ochiladi va qadamlar boshidan
          ko&apos;rsatiladi.
        </p>
        <p className="text-[12px] text-emerald-700 dark:text-emerald-400 mt-2 flex items-start gap-1.5">
          <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          Hech qanday ma&apos;lumot o&apos;chirilmaydi: xonalar, kurslar,
          guruhlar, o&apos;quvchilar va to&apos;lovlar joyida qoladi.
        </p>
        <p className="text-[11px] text-neutral-400 mt-2 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          Bajarilgan qadamlar baribir ✓ bo&apos;lib turadi — ular haqiqiy
          ma&apos;lumotdan hisoblanadi.
        </p>
      </Modal>
    </div>
  );
}
