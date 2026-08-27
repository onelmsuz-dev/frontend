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

/**
 * "5 daqiqa oldin", "2 soat oldin", "Kecha 14:30", "26.08.2026 09:15".
 *
 * Jurnal ro'yxati uchun: yaqin hodisa nisbiy vaqtda tezroq o'qiladi
 * ("hozirgina" bilan "3 kun oldin" ni bir qarashda ajratish mumkin), eski
 * hodisa esa aniq sana talab qiladi — "247 kun oldin" hech kimga hech narsa
 * demaydi.
 *
 * MARKAZ MINTAQASIDA hisoblanadi: brauzer boshqa mintaqada bo'lsa ham
 * markaz xodimi va egasi bir xil vaqtni ko'radi.
 */
export function fmtRelative(v: string | Date | null | undefined): string {
  if (!v) return "—";
  const d = toDate(v);
  if (isNaN(d.getTime())) return "—";

  const diff = Date.now() - d.getTime();

  // Kichik MANFIY farq — server va brauzer soatlari orasidagi bir necha
  // soniyalik nomuvofiqlik. Uni "kelajak" deb hisoblab to'liq sanaga
  // o'tkazsak, hozirgina yozilgan yozuv jurnalda "27.08.2026 14:03" bo'lib
  // ko'rinardi, ustidagi qatorlar esa "hozirgina" — ro'yxat buzilgandek
  // tuyulardi. Ikki daqiqagacha bardosh qilamiz.
  if (diff < -120_000)     return fmtDateTime(d);
  if (diff < 60_000)       return "hozirgina";
  if (diff < 3_600_000)    return `${Math.floor(diff / 60_000)} daqiqa oldin`;

  const today = businessDayKey(new Date());
  const then  = businessDayKey(d);
  if (then === today) {
    return diff < 86_400_000 && diff >= 3_600_000
      ? `${Math.floor(diff / 3_600_000)} soat oldin`
      : `Bugun ${fmtTime(d)}`;
  }

  // Kun soni KALENDAR kunlari bo'yicha, xom millisekunddan emas: 23 soat
  // oldingi hodisa boshqa kunga tushsa ham "0 kun oldin" bo'lib qolardi va
  // ustiga olib borilganda ko'rinadigan aniq sana bilan ziddiyatga tushardi.
  const days = calendarDaysBetween(then, today);
  if (days === 1)  return `Kecha ${fmtTime(d)}`;
  if (days < 7)    return `${days} kun oldin`;

  return fmtDateTime(d);
}

/** "26.08.2026 09:15" — markaz mintaqasida. */
export function fmtDateTime(v: string | Date | null | undefined): string {
  if (!v) return "—";
  const d = toDate(v);
  if (isNaN(d.getTime())) return "—";
  return `${formatUzDate(d)} ${fmtTime(d)}`;
}

/** "09:15" — markaz mintaqasida. */
export function fmtTime(v: string | Date): string {
  const d = toDate(v);
  if (isNaN(d.getTime())) return "";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: BUSINESS_TZ, hour: "2-digit", minute: "2-digit", hour12: false,
    }).format(d);
  } catch {
    const p = (n: number) => String(n).padStart(2, "0");
    return `${p(d.getHours())}:${p(d.getMinutes())}`;
  }
}

/** Markaz mintaqasidagi kun kaliti ("2026-08-26") — kunlarni solishtirish uchun. */
function businessDayKey(d: Date): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: BUSINESS_TZ, year: "numeric", month: "2-digit", day: "2-digit",
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

/** Ikki "YYYY-MM-DD" kalitini kalendar kunlarida ayiradi. */
function calendarDaysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
}
