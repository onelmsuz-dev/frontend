"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check, ChevronDown, ChevronUp, Lock, Rocket, Play, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useOnboardingCtx } from "@/lib/contexts/onboarding-context";
import { STEP_BY_KEY } from "@/lib/onboarding/steps";

const COLLAPSE_LS = "oneroom.onb.collapsed";

/**
 * DASHBOARD TEPASIDAGI SOZLASH PANELI.
 *
 * shadcn `Card` ISHLATILMAYDI: `[data-slot="card"]` global uslubi radius va
 * fonni majburan almashtiradi. `components/ui/progress.tsx` ham ishlatilmaydi
 * — uning treki `h-1` va uni almashtirib bo'lmaydi.
 */
export function OnboardingChecklist() {
  const {
    enabled, visible, loading, steps, doneMap, skipped,
    requiredTotal, requiredDone, nextStep, tour, startTour, resumeTour,
    hide, toggleSkip,
  } = useOnboardingCtx();

  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();

  // localStorage render PAYTIDA emas, effektda — gidratsiya nomuvofiqligi
  // bo'lmasin (server "yozilgan", mijoz "yig'ilgan" chizardi).
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_LS) === "1");
    } catch {
      // shaxsiy rejim — yozilgan holatda qolaveradi
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(COLLAPSE_LS, next ? "1" : "0");
      } catch {
        // e'tiborsiz
      }
      return next;
    });
  }

  if (!enabled || !visible || loading) return null;
  if (requiredTotal === 0) return null;

  const pct = requiredTotal === 0 ? 0 : Math.round((requiredDone / requiredTotal) * 100);
  const allDone = requiredDone === requiredTotal;
  // Majburiylar tugagach 2-faza ochiladi.
  const shown = allDone ? steps : steps.filter((s) => s.required);

  const isBlocked = (key: string) =>
    (STEP_BY_KEY[key]?.dependsOn ?? []).some((d) => !doneMap[d]);

  const blockedBy = (key: string) => {
    const dep = (STEP_BY_KEY[key]?.dependsOn ?? []).find((d) => !doneMap[d]);
    return dep ? STEP_BY_KEY[dep]?.title : null;
  };

  return (
    <div className="glass-panel rounded-2xl border border-white/60 dark:border-white/10 p-4 sm:p-5">
      {/* ── Sarlavha ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl shrink-0 grid place-items-center bg-indigo-100/70 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300">
          <Rocket className="w-4.5 h-4.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold text-neutral-900 dark:text-neutral-100 truncate">
            {allDone ? "Sozlash tugadi" : "Markazni ishga tushiramiz"}
          </p>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
            {requiredDone}/{requiredTotal} bajarildi
            {!allDone && nextStep && (
              <span className="hidden sm:inline"> · Keyingi: {nextStep.title}</span>
            )}
          </p>
        </div>

        {/* Pauza qilingan tur — `Esc` bosilgach qaytishning yagona yo'li.
            Bu holda panel yig'ilgan-yozilganidan qat'i nazar ko'rinadi. */}
        {tour?.paused ? (
          <Button size="sm" className="h-8 text-[12px]" onClick={resumeTour}>
            <Play className="w-3 h-3 mr-1" />
            Davom etish
          </Button>
        ) : (
          collapsed && nextStep && (
            <Button
              size="sm"
              className="h-8 text-[12px] hidden sm:flex"
              onClick={() => startTour(nextStep.key)}
            >
              <Play className="w-3 h-3 mr-1" />
              Boshlash
            </Button>
          )
        )}
        <button
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Ochish" : "Yig'ish"}
          className="shrink-0 w-8 h-8 rounded-xl grid place-items-center text-neutral-400
                     hover:bg-white/60 dark:hover:bg-white/10 hover:text-neutral-700 dark:hover:text-neutral-200"
        >
          {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {/* ── Progress ─────────────────────────────────────────────────────── */}
      <div className="mt-3 h-2 rounded-full bg-neutral-200/70 dark:bg-white/10 overflow-hidden">
        <div
          className="onb-fill h-full rounded-full bg-gradient-to-r from-indigo-600 to-emerald-500"
          style={{ "--onb-to": `${pct}%`, width: `${pct}%` } as React.CSSProperties}
        />
      </div>

      {/* ── Qadamlar ─────────────────────────────────────────────────────── */}
      {!collapsed && (
        <div className="mt-4 space-y-1">
          {shown.map((s, i) => {
            const done = !!doneMap[s.key];
            const isSkipped = skipped.includes(s.key);
            const blocked = !done && isBlocked(s.key);
            const active = !done && !blocked && !isSkipped && nextStep?.key === s.key;
            const Icon = s.icon;

            return (
              <div
                key={s.key}
                className={cn(
                  "rounded-2xl px-3 py-2.5 transition-colors",
                  active && "bg-white/70 dark:bg-white/[0.07] ring-1 ring-indigo-300/60 dark:ring-indigo-400/30",
                )}
              >
                <div className="flex items-center gap-3">
                  {/* Holat belgisi */}
                  <div
                    className={cn(
                      "w-7 h-7 rounded-xl shrink-0 grid place-items-center text-[11px] font-bold",
                      done
                        ? "onb-check bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
                        : blocked
                          ? "bg-neutral-200/70 text-neutral-400 dark:bg-white/5 dark:text-neutral-500"
                          : active
                            ? "bg-indigo-600 text-white"
                            : "bg-neutral-200/70 text-neutral-500 dark:bg-white/5 dark:text-neutral-400",
                    )}
                  >
                    {done ? (
                      <Check className="w-4 h-4" />
                    ) : blocked ? (
                      <Lock className="w-3.5 h-3.5" />
                    ) : (
                      i + 1
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-[13px] font-semibold truncate",
                        done
                          ? "text-neutral-400 dark:text-neutral-500 line-through decoration-1"
                          : blocked
                            ? "text-neutral-400 dark:text-neutral-500"
                            : "text-neutral-900 dark:text-neutral-100",
                      )}
                    >
                      {done ? s.doneTitle : s.title}
                      {isSkipped && !done && (
                        <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-md
                                         bg-neutral-200/70 text-neutral-500 dark:bg-white/10 dark:text-neutral-400">
                          keyinroq
                        </span>
                      )}
                      {!s.required && !done && (
                        <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-md
                                         bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          qo&apos;shimcha
                        </span>
                      )}
                    </p>
                    {active && (
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {s.hint}
                      </p>
                    )}
                    {blocked && (
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Avval «{blockedBy(s.key)}» qadamini bajaring
                      </p>
                    )}
                  </div>

                  {!done && !blocked && !active && (
                    <button
                      onClick={() => (s.stops.length ? startTour(s.key) : router.push(s.href))}
                      className="shrink-0 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400
                                 hover:underline flex items-center gap-0.5"
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Faol qadam — asosiy amal shu yerda */}
                {active && (
                  <div className="flex items-center gap-2 mt-2.5 pl-10">
                    <Button
                      size="sm"
                      className="h-8 text-[12px]"
                      onClick={() => (s.stops.length ? startTour(s.key) : router.push(s.href))}
                    >
                      {s.stops.length > 0 && <Play className="w-3 h-3 mr-1" />}
                      {s.cta}
                    </Button>
                    <button
                      onClick={() => toggleSkip(s.key, true)}
                      className="text-[11px] font-semibold text-neutral-400 hover:text-neutral-600
                                 dark:hover:text-neutral-300"
                    >
                      Keyinroq
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={hide}
              title="Sozlamalar → O'quv markaz bo'limidan qayta ochish mumkin"
              className="text-[11px] font-semibold text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
            >
              Yopish
            </button>
            {skipped.length > 0 && (
              <button
                // KETMA-KET: server `skipped` ni o'qib-o'zgartirib-yozadi.
                // Bir vaqtda yuborilsa oxirgi javob g'olib bo'lib, qolgan
                // kalitlar surilgan holatda qolib ketardi.
                onClick={async () => {
                  for (const k of skipped) await toggleSkip(k, false);
                }}
                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Keyinroqqa surilganlarni qaytarish
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
