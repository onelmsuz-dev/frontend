/**
 * SHRIFT O'LCHAMINI BITTA TUGMADAN BOSHQARISH.
 *
 * Loyihada shrift o'lchamlari 1800+ joyda QATTIQ px bilan yozilgan
 * (`text-[11px]`). Shu sababli `html { font-size }` ni o'zgartirish —
 * odatdagi yechim — bu yerda UMUMAN ishlamaydi: px rem'ga bog'liq emas.
 *
 * Shuning uchun o'lchamni KODDA emas, kompilyatsiya qilingan CSS da
 * o'zgartiramiz: har bir `font-size: Npx` → `calc(Npx * var(--font-scale, 1))`.
 * Natijada bitta o'zgaruvchi butun platformani kattalashtiradi va
 * kelajakda yozilgan har qanday yangi `text-[Npx]` ham AVTOMATIK
 * bo'ysunadi — ro'yxatni qo'lda yangilab yurish kerak emas.
 *
 * `--text-sm` kabi Tailwind mavzu o'zgaruvchilari ham shu yerda
 * ushlanadi: `text-sm` utiliti `font-size: var(--text-sm)` chiqaradi,
 * ya'ni qiymatni o'zgaruvchining O'ZIDA ko'paytirish kerak.
 *
 * FALLBACK `1` ATAYLAB: agar `--font-scale` biror sababga ko'ra
 * aniqlanmay qolsa, `calc()` yaroqsiz bo'lib font-size butunlay
 * yo'qolardi va matn meros o'lchamda chiqib ketardi.
 */

const UZUNLIK = /^-?\d*\.?\d+(px|rem|em)$/;
// `em` ALOHIDA: u ota elementning shriftiga nisbatan va allaqachon
// o'zi kattalashadi. DIQQAT: `"...rem".endsWith("em")` HAM rost —
// shuning uchun birlik regexdan olinadi, satr oxiridan emas.
const NISBIY = new Set(["em"]);

/** Mavzu o'zgaruvchilari orasidan FAQAT shrift o'lchami bo'lganlari. */
function shriftOzgaruvchisimi(prop) {
  // `--text-sm: .875rem` — ha. `--text-sm--line-height: calc(1.25/.875)` — yo'q,
  // u nisbat va o'zi kattalashadi. `--text-shadow-*` — umuman boshqa narsa.
  return /^--text-(xs|sm|base|lg|xl|[2-9]xl)$/.test(prop);
}

export default function fontScale() {
  return {
    postcssPlugin: "oneroom-font-scale",
    Declaration(decl) {
      const shrift = decl.prop === "font-size";
      if (!shrift && !shriftOzgaruvchisimi(decl.prop)) return;
      const v = decl.value.trim();
      const m = UZUNLIK.exec(v);              // calc(), var(), %, inherit — tegmaymiz
      if (!m || NISBIY.has(m[1])) return;
      decl.value = `calc(${v} * var(--font-scale, 1))`;
    },
  };
}
fontScale.postcss = true;
