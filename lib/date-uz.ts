/**
 * O'ZBEKCHA SANA — brauzer lokaliga TAYANMASDAN.
 *
 * `toLocaleDateString("uz-UZ", { month: "long" })` Chrome'da "M08" qaytaradi
 * (CLDR'da uz-UZ uchun oy nomlari raqamli shablonga tushib qolgan), Node'da
 * esa "Avgust". Ya'ni ekranda foydalanuvchi "27 M08" ni ko'rardi va bu nima
 * ekanini tushunmasdi. Shu sabab oy va hafta nomlari shu yerda — qaysi
 * brauzer bo'lishidan qat'i nazar bir xil ko'rinadi.
 */

export const UZ_MONTHS = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
] as const;

/** Qisqartma — tor joylar uchun (kalendar kataklari, kartochkalar). */
export const UZ_MONTHS_SHORT = [
  "Yan", "Fev", "Mar", "Apr", "May", "Iyn",
  "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek",
] as const;

export const UZ_WEEKDAYS = [
  "Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba",
] as const;

export const UZ_WEEKDAYS_SHORT = ["Yak", "Du", "Se", "Cho", "Pay", "Ju", "Sha"] as const;

/** "2026-08-27" yoki Date — ikkalasini ham qabul qiladi. */
function toDate(v: string | Date): Date {
  if (v instanceof Date) return v;
  // Sana-satr: kun chegarasi siljib ketmasligi uchun tush payti olinadi.
  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T12:00:00` : v);
}

/** "27-avgust" */
export function fmtDayMonth(v: string | Date): string {
  const d = toDate(v);
  return `${d.getDate()}-${UZ_MONTHS[d.getMonth()].toLowerCase()}`;
}

/** "27-avgust 2026" */
export function fmtFullDate(v: string | Date): string {
  const d = toDate(v);
  return `${fmtDayMonth(d)} ${d.getFullYear()}`;
}

/** "Avgust 2026" */
export function fmtMonthYear(v: string | Date): string {
  const d = toDate(v);
  return `${UZ_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "Payshanba" */
export function fmtWeekday(v: string | Date): string {
  return UZ_WEEKDAYS[toDate(v).getDay()];
}

/** "27 avg" — tor joylar uchun */
export function fmtShortDate(v: string | Date): string {
  const d = toDate(v);
  return `${d.getDate()} ${UZ_MONTHS_SHORT[d.getMonth()].toLowerCase()}`;
}
