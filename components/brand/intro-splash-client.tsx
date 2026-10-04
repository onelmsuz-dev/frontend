"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatedLogo } from "./animated-logo";
import { INTRO_FADE_MS, INTRO_HOLD_MS, INTRO_ID, INTRO_KEY, INTRO_VARIANT } from "./intro-splash-config";
import styles from "./intro-splash.module.css";

/**
 * Shu sahifa yuklanishida parda qachongacha turishi kerak (ms, `performance.now()`).
 * Modul darajasida: React daraxtni qayta qursa ham (hidratsiya xatosi) parda
 * "ko'rilgan" deb yopilib qolmaydi, boshlagan joyidan davom etadi.
 */
let playUntil = 0;

export function IntroSplashOverlay() {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"show" | "out" | "done">("show");

  useLayoutEffect(() => {
    let seen = true;
    try {
      seen = sessionStorage.getItem(INTRO_KEY) !== null;
      sessionStorage.setItem(INTRO_KEY, "1");
    } catch {
      // Private rejim: sessionStorage yo'q — animatsiyasiz davom etamiz.
    }
    const now = performance.now();
    if (!seen) playUntil = now + INTRO_HOLD_MS;
    const left = playUntil - now;

    if (left <= 0) {
      // Ko'rgan odam: birinchi chizilishdan OLDIN yashiramiz, keyin DOM'dan olamiz.
      if (ref.current) ref.current.style.display = "none";
      const t = setTimeout(() => setPhase("done"), 0);
      return () => clearTimeout(t);
    }
    const fade = setTimeout(() => setPhase("out"), left);
    const end = setTimeout(() => setPhase("done"), left + INTRO_FADE_MS);
    return () => {
      clearTimeout(fade);
      clearTimeout(end);
    };
  }, []);

  if (phase === "done") return null;
  return (
    <div
      ref={ref}
      id={INTRO_ID}
      className={phase === "out" ? `${styles.overlay} ${styles.out}` : styles.overlay}
      aria-hidden="true"
      // Server skripti ko'rgan odamda `display:none` qo'yadi — React buni xato demasin.
      suppressHydrationWarning
    >
      <AnimatedLogo variant={INTRO_VARIANT} size={168} />
    </div>
  );
}

/** `/login` da turadi: qayta kirgan odam kirish animatsiyasini yana ko'rsin. */
export function IntroReset() {
  useEffect(() => {
    try {
      sessionStorage.removeItem(INTRO_KEY);
    } catch {
      // sessionStorage yo'q — o'chiradigan narsa ham yo'q.
    }
  }, []);
  return null;
}
