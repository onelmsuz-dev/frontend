// O'zbekiston telefon raqami uchun umumiy format helperlari.
// `components/landing/contact-section.tsx` va `components/landing/lead-form.tsx`
// bir xil mantiqni ishlatadi — shu sabab bu yerga chiqarilgan.

/**
 * Kiritilgan/qo'yilgan matndan MILLIY 9 raqamni ajratadi.
 *
 * Odam ko'pincha to'liq raqamni nusxalab qo'yadi: "+998 90 123 45 67".
 * Oddiy `replace(/\D/g,"").slice(0,9)` undan "998901234" ni olardi va
 * maydonda "99 890 12 34" ko'rinardi.
 *
 * Prefiks faqat UZUNLIK mos kelganda kesiladi: "99" ham haqiqiy operator
 * kodi, ya'ni 998-12-34-56 degan raqam bor. Shartsiz kesilsa u buzilardi.
 * Backenddagi `parseUzPhone` bilan bir xil qoida.
 */
export function extractNationalDigits(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("998")) d = d.slice(3);
  else if (d.length === 10 && d.startsWith("8")) d = d.slice(1);
  return d.slice(0, 9);
}

/** Raqamlarni "90 123 45 67" ko'rinishida ko'rsatadi. */
export function toDisplayPhone(digits: string): string {
  const d = digits.slice(0, 9);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)} ${d.slice(2)}`;
  if (d.length <= 7) return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
  return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7)}`;
}

/**
 * Formatlangan matnda kursorni `digitsBefore` ta raqamdan keyingi joyga
 * qo'yadi. Shusiz har qanday o'rta-matn tahririda kursor oxiriga sakrab
 * ketardi: raqamni tuzatmoqchi bo'lgan odam har safar uni qayta topishga
 * majbur bo'lardi.
 */
export function caretForDigits(formatted: string, digitsBefore: number): number {
  if (digitsBefore <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) {
      seen++;
      if (seen === digitsBefore) return i + 1;
    }
  }
  return formatted.length;
}
