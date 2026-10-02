"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFeature } from "@/lib/hooks/useFeatures";

/**
 * AI YORDAMCHI TUGMASI — pastki o'ng burchakda, har sahifada.
 *
 * Bayroq (`ai-assistant`) yoqilmagan markazda umuman chizilmaydi. Oyna kodi
 * birinchi ochilganda yuklanadi — tugma bosilmaguncha sahifaga hech narsa
 * qo'shilmaydi. Bir marta ochilgan oyna yopilganda ham xotirada qoladi:
 * yozilayotgan javob uzilmaydi.
 */
const AssistantPanel = dynamic(() => import("./assistant-panel").then((m) => m.AssistantPanel), { ssr: false });

export function AssistantLauncher() {
  const on = useFeature("ai-assistant");
  const [open, setOpen] = useState(false);
  const [yuklandi, setYuklandi] = useState(false);
  const yop = useCallback(() => setOpen(false), []);

  if (on !== true) return null;

  return (
    <>
      {yuklandi && <AssistantPanel open={open} onClose={yop} />}
      <button
        type="button"
        aria-label={open ? "Yordamchini yopish" : "OneRoom yordamchi"}
        title={open ? undefined : "OneRoom yordamchi"}
        onClick={() => { setYuklandi(true); setOpen((o) => !o); }}
        className={cn(
          "fixed z-[65] right-4 bottom-[92px] lg:bottom-6 lg:right-6",
          "w-12 h-12 lg:w-14 lg:h-14 rounded-full grid place-items-center text-white",
          "bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500",
          "shadow-lg shadow-indigo-500/35 ring-4 ring-white/60 dark:ring-white/10",
          "transition-transform duration-200 hover:scale-105 active:scale-95",
          open && "max-lg:hidden",
        )}
      >
        {open
          ? <X className="w-5 h-5 lg:w-6 lg:h-6" />
          : <Sparkles className="w-5 h-5 lg:w-6 lg:h-6" />}
      </button>
    </>
  );
}
