"use client";

import { Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboardingCtx } from "@/lib/contexts/onboarding-context";

/**
 * Sozlamalar → O'quv markaz: yopilgan yo'l ko'rsatuvchini qaytarish.
 *
 * Panel "Yopish" bilan berkitilgach, uni qaytarishning boshqa yo'li yo'q edi —
 * foydalanuvchi tasodifan bosgan bo'lsa, qadamlar butunlay yo'qolardi.
 * Faqat KERAK bo'lganda ko'rinadi: bayroq yoqilgan va panel yopilgan holatda.
 */
export function OnboardingRestoreCard() {
  const { enabled, visible, status, resume, requiredTotal } = useOnboardingCtx();

  // Faqat "Keyinroq" bosilgan holatda ko'rinadi.
  //   - bayroq o'chiq  → yo'q
  //   - panel ochiq    → yo'q (takror bo'lardi)
  //   - status DONE    → yo'q: tabrikdagi "bu panel boshqa ko'rinmaydi"
  //                      va'dasini buzmaslik uchun
  if (!enabled || visible || status !== "DISMISSED" || requiredTotal === 0) return null;

  return (
    <div className="glass-panel rounded-2xl border border-white/60 dark:border-white/10 p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-2xl shrink-0 grid place-items-center bg-indigo-100/70 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300">
        <Rocket className="w-4.5 h-4.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">
          Yo&apos;l ko&apos;rsatuvchi
        </p>
        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
          Sozlash qadamlari panelini dashboardga qaytarish
        </p>
      </div>
      <Button size="sm" variant="outline" className="h-8 text-[12px] shrink-0" onClick={resume}>
        Qayta ko&apos;rsatish
      </Button>
    </div>
  );
}
