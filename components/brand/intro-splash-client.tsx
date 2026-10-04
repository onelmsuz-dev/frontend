"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { AnimatedLogo } from "./animated-logo";
import { INTRO_ATTR, INTRO_FADE_MS, INTRO_HOLD_MS, INTRO_KEY, INTRO_VARIANT } from "./intro-splash-config";
import styles from "./intro-splash.module.css";

export function IntroSplashOverlay() {
  const [done, setDone] = useState(false);

  useLayoutEffect(() => {
    const root = document.documentElement;
    let seen = true;
    try {
      seen = sessionStorage.getItem(INTRO_KEY) !== null;
      sessionStorage.setItem(INTRO_KEY, "1");
    } catch {
      // Private rejim: sessionStorage yo'q — animatsiyasiz davom etamiz.
    }
    // Login'dan `router` bilan o'tilganda server skripti ishlamaydi — shu yerda yoqamiz.
    if (!seen) root.setAttribute(INTRO_ATTR, "in");
    if (!root.hasAttribute(INTRO_ATTR)) {
      const t = setTimeout(() => setDone(true), 0);
      return () => clearTimeout(t);
    }

    const fade = setTimeout(() => root.setAttribute(INTRO_ATTR, "out"), INTRO_HOLD_MS);
    const end = setTimeout(() => {
      root.removeAttribute(INTRO_ATTR);
      setDone(true);
    }, INTRO_HOLD_MS + INTRO_FADE_MS);
    return () => {
      clearTimeout(fade);
      clearTimeout(end);
      root.removeAttribute(INTRO_ATTR);
    };
  }, []);

  if (done) return null;
  return (
    <div className={styles.overlay} aria-hidden="true">
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
