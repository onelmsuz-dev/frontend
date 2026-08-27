/**
 * O'ZBEKCHA SANA — brauzer lokaliga TAYANMASDAN.
 *
 * `toLocaleDateString("uz-UZ", { month: "long" })` Chrome'da "M08" qaytaradi
 * (CLDR'da uz-UZ uchun oy nomlari raqamli shablonga tushib qolgan), Node'da
 * esa "Avgust". Ya'ni ekranda foydalanuvchi "27 M08" ni ko'rardi va bu nima
 * ekanini tushunmasdi. Shu sabab oy va hafta nomlari shu yerda — qaysi
 * brauzer bo'lishidan qat'i nazar bir xil ko'rinadi.
 */

/** Markaz mintaqasi — sanalar shu bo'yicha ko'rsatiladi. */
export const BUSINESS_TZ = "Asia/Tashkent";

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

/**
 * "27.08.2026" — jadval va ro'yxatlar uchun.
 *
 * `toLocaleDateString("uz-UZ")` brauzerga qarab turlicha ishlaydi; bu yerda
 * natija hamma joyda bir xil. Bo'sh qiymatda tire qaytadi.
 */
export function formatUzDate(v: string | Date | null | undefined): string {
  if (!v) return "—";
  const d = toDate(v);
  if (isNaN(d.getTime())) return "—";
  // MARKAZ MINTAQASIDA ko'rsatiladi, brauzernikida emas.
  //
  // Kalendar sanasida vaqt yo'q, lekin bazada u aniq lahza sifatida yotadi.
  // Brauzerning mintaqasiga qarab chizilsa, boshqa mintaqadagi noutbukda
  // o'sha sana bir kun oldin/keyin bo'lib ko'rinardi — markaz xodimi va
  // egasi bir xil ma'lumotni turlicha ko'rardi.
  const p = (n: number) => String(n).padStart(2, "0");
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: BUSINESS_TZ, year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(d);
    const get = (t: string) => parts.find(x => x.type === t)?.value ?? "";
    return `${get("day")}.${get("month")}.${get("year")}`;
  } catch {
    return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
  }
}
