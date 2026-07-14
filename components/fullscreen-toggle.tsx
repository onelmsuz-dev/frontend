"use client";

import { useEffect, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Panelni to'liq ekranda ochish/yopish (Fullscreen API). */
export function FullscreenToggle({ className }: { className?: string }) {
  const [isFull, setIsFull] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const sync = () => setIsFull(!!document.fullscreenElement);
    sync();
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  async function toggle() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      // Brauzer ruxsat bermasa (iOS Safari) — jimgina qoldiramiz
    }
  }

  if (!mounted) return <div className="w-8 h-8" />;

  return (
    <button
      type="button"
      onClick={toggle}
      title={isFull ? "To'liq ekrandan chiqish" : "To'liq ekran"}
      aria-label={isFull ? "To'liq ekrandan chiqish" : "To'liq ekran"}
      className={cn(
        "w-8 h-8 flex items-center justify-center rounded-lg transition-colors",
        "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100",
        "dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-800",
        className,
      )}
    >
      {isFull ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
    </button>
  );
}
