"use client";

/**
 * TABLAR — SIRPANUVCHI FON VA SILLIQ O'TISH.
 *
 * Panelda o'nga yaqin joyda tab qatori bor edi va har biri o'zicha yozilgan:
 * birida pastki chiziq, birida oq plitka; bosilganda fon bir tabda o'chib,
 * ikkinchisida yonardi, kontent esa keskin almashardi (egasi, 2026-10-05).
 *
 * Bu faylda ikki bo'lak — hammasi shulardan foydalanadi:
 *
 *   `TabGlide`  — tab qatorining qobig'i. Tanlangan tabning FONI bitta
 *                 element: u tabdan tabga sirpanib o'tadi (chap menyudagi
 *                 belgi bilan bir xil egri chiziq). Tugmalar o'zi fon
 *                 chizmaydi — faqat `data-tab-active` qo'yadi va matn rangini
 *                 almashtiradi (`tabCls` / `segCls`).
 *   `TabPanel`  — tab kontenti. `k` o'zgarganda yangi kontent yengil
 *                 ko'tarilib, xiralikdan ochilib keladi.
 *
 * IKKI KO'RINISH (`variant`):
 *   "soft"    — sahifa tablari: och binafsha plitka (chap menyudagi faol band
 *               bilan bir xil rang).
 *   "segment" — kulrang idish ichidagi kalit (filtrlar, ko'rinish tanlash):
 *               oq plitka, yengil soya.
 *
 * `prefers-reduced-motion` yoqilgan bo'lsa harakat o'chadi.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const EASE = "ease-[cubic-bezier(0.22,0.9,0.24,1)]";

type Rect = { x: number; y: number; w: number; h: number };

export function TabGlide({
  variant = "soft", className, children, watch, ...rest
}: {
  variant?: "soft" | "segment";
  /** Tanlangan tab qiymati — o'zgarganda fon qayta o'lchanadi. */
  watch?: unknown;
} & React.HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  // Birinchi o'lchovgacha harakat yo'q — sahifa ochilganda fon chap burchakdan
  // "uchib kelmasin", darhol o'z joyida paydo bo'lsin.
  const [tayyor, setTayyor] = useState(false);

  const measure = useCallback(() => {
    const root = ref.current;
    const el = root?.querySelector<HTMLElement>('[data-tab-active="true"]');
    if (!root || !el) { setRect(null); return; }
    const next = { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight };
    setRect((p) => (p && p.x === next.x && p.y === next.y && p.w === next.w && p.h === next.h ? p : next));
  }, []);

  useLayoutEffect(measure, [measure, watch, children]);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    // Eni o'zgarsa (ekran, shrift yuklanishi, sanoqlar kelishi) — qayta o'lchash.
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    Array.from(root.children).forEach((c) => ro.observe(c));
    const id = requestAnimationFrame(() => setTayyor(true));
    return () => { ro.disconnect(); cancelAnimationFrame(id); };
  }, [measure, children]);

  return (
    <div ref={ref} {...rest} className={cn("relative", className)}>
      <span aria-hidden
        className={cn(
          "pointer-events-none absolute left-0 top-0 z-0 motion-reduce:transition-none",
          tayyor && `transition-[transform,width,height,opacity] duration-300 ${EASE}`,
          variant === "soft"
            ? "rounded-xl bg-indigo-100/80 dark:bg-indigo-400/15"
            : "rounded-lg bg-white shadow-sm dark:bg-neutral-700",
        )}
        style={rect
          ? { transform: `translate(${rect.x}px, ${rect.y}px)`, width: rect.w, height: rect.h, opacity: 1 }
          : { opacity: 0 }}
      />
      {children}
    </div>
  );
}

/** Sahifa tabi tugmasi (`variant="soft"`). Fonni `TabGlide` chizadi. */
export const tabCls = (active: boolean, extra?: string) => cn(
  "relative z-[1] flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 h-9 text-[12.5px] font-semibold transition-colors duration-200",
  active
    ? "text-indigo-700 dark:text-indigo-200"
    : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200",
  extra,
);

/** Kalit tugmasi (`variant="segment"`). Fonni `TabGlide` chizadi. */
export const segCls = (active: boolean, extra?: string) => cn(
  "relative z-[1] shrink-0 whitespace-nowrap rounded-lg transition-colors duration-200",
  active
    ? "text-neutral-900 dark:text-neutral-100"
    : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200",
  extra,
);

/**
 * Tab kontenti. `k` — tanlangan tab; o'zgarganda blok qayta o'rnatiladi va
 * kirish animatsiyasi ishlaydi. Faqat `opacity` va `transform` — joylashuv
 * qayta hisoblanmaydi, katta jadvallarda ham silliq.
 */
export function TabPanel({ k, className, children }: { k: string | number; className?: string; children: React.ReactNode }) {
  return (
    <div key={k} className={cn("animate-in fade-in-0 slide-in-from-bottom-2 duration-300 ease-out motion-reduce:animate-none", className)}>
      {children}
    </div>
  );
}

/** `key`siz holatlar uchun (element o'zi `hidden` ↔ ko'rinadigan almashsa) — xuddi shu kirish animatsiyasi. */
export const TAB_IN = "animate-in fade-in-0 slide-in-from-bottom-2 duration-300 ease-out motion-reduce:animate-none";
