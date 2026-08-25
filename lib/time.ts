/**
 * BIZNES VAQTI (Toshkent, UTC+5) — brauzer tomonida.
 *
 * Backend barcha sana/vaqt qarorlarini `Asia/Tashkent` bo'yicha qabul qiladi
 * (backend/src/common/time.ts). Interfeys esa qurilma soatidan foydalanardi:
 * xodimning noutbuki boshqa mintaqada bo'lsa (yoki soati noto'g'ri bo'lsa)
 * ekran "dars boshlandi" deb ochilar, server esa rad etardi — va aksincha.
 *
 * Bu yerdagi funksiyalar qurilma sozlamasiga BOG'LIQ EMAS.
 *
 * DIQQAT: guruhning `startTime`/`endTime` qiymatlari ("09:00") — devor soati,
 * ular hech qanday konversiya talab qilmaydi va shundayligicha ko'rsatiladi.
 */
export const BUSINESS_TZ = "Asia/Tashkent";

const fmt = new Intl.DateTimeFormat("en-CA", {
  timeZone:  BUSINESS_TZ,
  year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

function parts(at: Date) {
  const p = Object.fromEntries(fmt.formatToParts(at).map(x => [x.type, x.value]));
  return {
    year: Number(p.year), month: Number(p.month), day: Number(p.day),
    hour: Number(p.hour), minute: Number(p.minute),
  };
}

/** Toshkentdagi kalendar sana: "YYYY-MM-DD". */
export function businessTodayStr(at: Date = new Date()): string {
  const p = parts(at);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/**
 * Toshkentdagi bugungi kun — LOKAL yarim tundagi Date.
 *
 * Sana taqqoslash va kalendar ko'rinishlari uchun: `d.getDate()`,
 * `d.getDay()` kabi lokal metodlar shu obyekt ustida to'g'ri ishlaydi.
 */
export function businessToday(at: Date = new Date()): Date {
  const p = parts(at);
  return new Date(p.year, p.month - 1, p.day);
}

/** Toshkentda kun boshidan o'tgan daqiqalar (0..1439). */
export function businessMinutesOfDay(at: Date = new Date()): number {
  const p = parts(at);
  return p.hour * 60 + p.minute;
}

/** "YYYY-MM-DD" ko'rinishidagi kalendar sana (mahalliy Date obyektidan). */
export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
