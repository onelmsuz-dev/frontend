/**
 * SHRIFT O'LCHAMI — bitta joyda saqlanadigan bilim.
 *
 * Qiymatlarning O'ZI CSS da (`app/globals.css` dagi `--font-scale`), bu
 * yerda faqat nom va uni `<html>` ga qo'yish. Kod bilan CSS bir-biriga
 * faqat shu uchta satr orqali tegadi.
 */

export type FontScale = "STANDART" | "ORTA" | "KATTA";

export const FONT_KEY = "oneroom-font";

export const FONT_OPTIONS: { v: FontScale; label: string; hint: string }[] = [
  { v: "STANDART", label: "Standart", hint: "Hozirgi ko'rinish" },
  { v: "ORTA",     label: "O'rta",    hint: "12% kattaroq" },
  { v: "KATTA",    label: "Katta",    hint: "25% kattaroq" },
];

/**
 * `<html data-font="KATTA">` — CSS shundan o'qiydi.
 *
 * `STANDART` da atribut BUTUNLAY olib tashlanadi, `data-font="STANDART"`
 * deb qoldirilmaydi: keraksiz holat bo'lardi va "atribut bor, demak
 * sozlangan" degan xulosa yolg'on chiqardi.
 *
 * `localStorage` ga ham yozamiz — keyingi ochilishda sahifa
 * `/api/me` javobini kutmasdan darhol to'g'ri o'lchamda chiziladi.
 */
export function applyFontScale(v: FontScale) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  if (v === "STANDART") delete el.dataset.font;
  else el.dataset.font = v;
  try { localStorage.setItem(FONT_KEY, v); } catch { /* private rejim */ }
}
