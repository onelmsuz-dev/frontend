"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { PartyPopper, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboardingCtx } from "@/lib/contexts/onboarding-context";

/**
 * Barcha majburiy qadamlar bajarilgach — bir martalik tabrik.
 *
 * "Yopish" bosilganda status `DONE` bo'ladi va panel BOSHQA QAYTMAYDI: keyin
 * oxirgi o'quvchi arxivlansa ham checklist tirilib chiqmaydi.
 */
export function OnboardingCelebration() {
  const { celebrate, steps, doneMap } = useOnboardingCtx();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  /**
   * "Yopish" bosilgach oyna DARHOL yo'qoladi — server javobini kutmasdan.
   *
   * Bu oyna butun ekranni egallaydi va har bir sahifada chiziladi. Agar
   * yopilish faqat server javobiga bog'liq bo'lsa, so'rov muvaffaqiyatsiz
   * bo'lganda foydalanuvchi paneldan umuman chiqa olmay qolardi.
   */
  const [closed, setClosed] = useState(false);

  useEffect(() => setMounted(true), []);

  // Esc — chiqishning yana bir yo'li.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setClosed(true); celebrate(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [celebrate]);

  if (!mounted || closed) return null;

  const close = () => { setClosed(true); celebrate(); };

  // Keyingi tavsiya: 2-fazadan bajarilmagan birinchisi.
  const nextOptional = steps.find((s) => !s.required && !doneMap[s.key]);

  return createPortal(
    <div className="fixed inset-0 z-[110] grid place-items-center p-4">
      <div className="absolute inset-0 bg-neutral-900/50 dark:bg-black/70" onClick={close} />
      <div className="onb-pop relative w-full max-w-[380px] glass-strong rounded-3xl border border-white/60 dark:border-white/10 p-6 text-center shadow-2xl">
        {/* Uchqunlar — faqat bezak, `aria-hidden` */}
        <div aria-hidden className="absolute inset-x-0 top-6 flex justify-center gap-6 pointer-events-none">
          {[0, 1, 2, 3].map((i) => (
            <Sparkles
              key={i}
              className="onb-spark w-4 h-4 text-amber-400"
              style={{ animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </div>

        <div className="w-14 h-14 mx-auto rounded-2xl grid place-items-center bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
          <PartyPopper className="w-7 h-7" />
        </div>
        <h2 className="mt-4 text-[17px] font-bold text-neutral-900 dark:text-neutral-100">
          Tayyor — markazingiz ishga tushdi
        </h2>
        <p className="mt-1.5 text-[13px] text-neutral-600 dark:text-neutral-300">
          Endi davomat belgilash, to&apos;lov qabul qilish va hisobotlar ishlaydi.
        </p>

        <div className="mt-5 flex flex-col gap-2">
          {nextOptional && (
            <Button
              className="h-10 text-[13px]"
              onClick={() => {
                close();
                router.push(nextOptional.href);
              }}
            >
              {nextOptional.title}
            </Button>
          )}
          <Button variant="outline" className="h-10 text-[13px]" onClick={close}>
            Yopish
          </Button>
        </div>
        <p className="mt-3 text-[11px] text-neutral-400">
          Bu panel boshqa ko&apos;rinmaydi.
        </p>
      </div>
    </div>,
    document.body,
  );
}
