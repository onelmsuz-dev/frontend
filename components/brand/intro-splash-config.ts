import type { INTRO_VARIANTS } from "./animated-logo";

/** `sessionStorage` kaliti: shu oynada kirish animatsiyasi ko'rsatilganmi. */
export const INTRO_KEY = "oneroom-intro";
/** `<html>` dagi atribut: "in" — parda ko'rinadi, "out" — so'nmoqda. */
export const INTRO_ATTR = "data-intro";

/** Qaysi kirish varianti o'ynaydi (`INTRO_VARIANTS` dan biri). */
export const INTRO_VARIANT: (typeof INTRO_VARIANTS)[number] = "draw";
/** Parda qancha turadi (ms) — tanlangan variant tugashiga yetarli bo'lsin. */
export const INTRO_HOLD_MS = 2700;
/** So'nish davomiyligi (ms) — CSS'dagi `transition` bilan bir xil. */
export const INTRO_FADE_MS = 400;
