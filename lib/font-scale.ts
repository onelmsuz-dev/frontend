/**
 * SHRIFT O'LCHAMI — bitta joyda saqlanadigan bilim.
 *
 * Qiymatlarning O'ZI CSS da (`app/globals.css` dagi `--font-scale`), bu
 * yerda faqat nom va uni `<html>` ga qo'yish. Kod bilan CSS bir-biriga
 * faqat shu uchta satr orqali tegadi.
 */

export type FontScale = "STANDART" | "ORTA" | "KATTA" | "JUDA_KATTA";

export const FONT_KEY = "oneroom-font";

export const FONT_OPTIONS: { v: FontScale; label: string; hint: string }[] = [
  { v: "STANDART", label: "Standart", hint: "Hozirgi ko'rinish" },
  { v: "ORTA",     label: "O'rta",    hint: "12% kattaroq" },
  { v: "KATTA",    label: "Katta",    hint: "25% kattaroq" },
  { v: "JUDA_KATTA", label: "Juda katta", hint: "40% kattaroq" },
];

/**
 * EKRANGA QO'LLASH — `<html data-font="KATTA">`, CSS shundan o'qiydi.
 *
 * `STANDART` da atribut BUTUNLAY olib tashlanadi, `data-font="STANDART"`
 * deb qoldirilmaydi: keraksiz holat bo'lardi va "atribut bor, demak
 * sozlangan" degan xulosa yolg'on chiqardi.
 *
 * `localStorage` GA TEGMAYDI — u faqat SAQLANGAN tanlovni eslaydi.
 * Sinab ko'rish uchun aynan shu funksiya ishlatiladi.
 */
export function previewFontScale(v: FontScale) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  if (v === "STANDART") delete el.dataset.font;
  else el.dataset.font = v;
}

/**
 * SAQLANGAN tanlovni qo'llash — ekranga ham, `localStorage` ga ham.
 *
 * `localStorage` keyingi ochilishda kerak: sahifa `/api/me` javobini
 * kutmasdan darhol to'g'ri o'lchamda chiziladi.
 *
 * DIQQAT — SINAB KO'RISH UCHUN BUNI ISHLATMANG. Ilgari sozlamalardagi
 * jonli ko'rish shu funksiyani chaqirardi va saqlanmagan tanlov
 * `localStorage` ga tushib qolardi: xodim boshqa bo'limga o'tsa shrift
 * kattaligicha qolar, "Ko'rinish" ga qaytsa esa "Standart" turardi —
 * ekran bir narsani, sozlama boshqa narsani ko'rsatardi
 * (egasi xabar berdi, 2026-09-21).
 */
export function applyFontScale(v: FontScale) {
  previewFontScale(v);
  try { localStorage.setItem(FONT_KEY, v); } catch { /* private rejim */ }
}
