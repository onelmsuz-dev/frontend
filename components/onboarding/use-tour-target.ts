"use client";

import { useEffect, useRef, useState } from "react";

export interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
  /** Nishon modal ichidami — spotlight z-index'i shunga qarab ko'tariladi. */
  inModal: boolean;
}

/** Nishonni topib bo'lmasa — shuncha vaqtdan keyin taslim bo'lamiz. */
const GIVE_UP_MS = 4000;

/**
 * `data-tour="..."` nishonining ekrandagi o'rnini kuzatadi.
 *
 * Nishon hali DOM'da bo'lmasligi mumkin (modal ochilmagan, sahifa yuklanmoqda)
 * — shuning uchun `MutationObserver` bilan kutamiz. 4 soniyada topilmasa
 * `notFound` qaytadi va chaqiruvchi turni JIMGINA emas, matnli ko'rsatma bilan
 * to'xtatadi: foydalanuvchi qorong'i ekranda qolib ketmasin.
 */
export function useTourTarget(targetId: string) {
  // Nishon o'zgarganda holat ham birga almashsin — shuning uchun `id` bitta
  // obyektda saqlanadi. Aks holda eski nishonning rect'i bir kadr ko'rinardi.
  const [state, setState] = useState<{ id: string; rect: TargetRect | null; notFound: boolean }>(
    { id: targetId, rect: null, notFound: false },
  );
  const scrolledFor = useRef<string | null>(null);

  useEffect(() => {

    let raf = 0;
    let giveUp = 0;
    let cancelled = false;

    /**
     * Bir xil `data-tour` ikkita elementda bo'lishi mumkin (mobil va desktop
     * variantlari, masalan TopHeader'dagi tugma) — ko'rinib turganini olamiz.
     */
    const pick = (): HTMLElement | null => {
      const all = Array.from(
        document.querySelectorAll<HTMLElement>(`[data-tour="${targetId}"]`),
      );
      return all.find((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      }) ?? null;
    };

    const measure = () => {
      raf = 0;
      if (cancelled) return;
      const el = pick();
      if (!el) {
        setState((p) => (p.id === targetId && p.rect === null ? p : { id: targetId, rect: null, notFound: false }));
        return;
      }
      const r = el.getBoundingClientRect();
      const next: TargetRect = {
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height,
        // Modal ichidagi nishon `z-[100]` qatlamida turadi — spotlight undan
        // ham yuqoriga chiqishi kerak, aks holda ko'rinmay qoladi.
        inModal: !!el.closest('[data-slot="modal-overlay"], [data-onb-modal]'),
      };
      setState((p) =>
        p.id === targetId &&
        p.rect &&
        p.rect.top === next.top && p.rect.left === next.left &&
        p.rect.width === next.width && p.rect.height === next.height &&
        p.rect.inModal === next.inModal
          ? p
          : { id: targetId, rect: next, notFound: false },
      );

      // Bir marta ko'rinish maydoniga surib qo'yamiz — har o'lchashda emas,
      // aks holda foydalanuvchi skroll qilolmasdi.
      if (scrolledFor.current !== targetId) {
        scrolledFor.current = targetId;
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        el.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
      }
    };

    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(measure);
    };

    schedule();

    const mo = new MutationObserver(schedule);
    mo.observe(document.body, { childList: true, subtree: true, attributes: true });

    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("scroll", schedule);

    giveUp = window.setTimeout(() => {
      if (!cancelled && !pick()) {
        setState({ id: targetId, rect: null, notFound: true });
        if (process.env.NODE_ENV !== "production") {
          console.warn(`[tour] nishon topilmadi: ${targetId}`);
        }
      }
    }, GIVE_UP_MS);

    return () => {
      cancelled = true;
      mo.disconnect();
      if (raf) cancelAnimationFrame(raf);
      window.clearTimeout(giveUp);
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("scroll", schedule);
    };
  }, [targetId]);

  // Nishon endigina o'zgargan bo'lsa (effekt hali ishlamagan) eski rect
  // qaytmasligi kerak.
  const fresh = state.id === targetId;
  return { rect: fresh ? state.rect : null, notFound: fresh ? state.notFound : false };
}

/** `lg:` breakpoint (1024px) — `hooks/use-mobile.ts` dagi 768 bilan mos emas. */
export function useIsDesktop(): boolean {
  const [desktop, setDesktop] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return desktop;
}
