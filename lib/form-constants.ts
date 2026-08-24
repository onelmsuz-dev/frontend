// Teacher / Student / Group formalari uchun umumiy konstantalar.

export const GENDER_OPTIONS = [
  { value: "MALE", label: "Erkak" },
  { value: "FEMALE", label: "Ayol" },
] as const;

export type Gender = (typeof GENDER_OPTIONS)[number]["value"];

// O'quvchi qayerdan kelgani (Manba)
export const SOURCE_OPTIONS = [
  "Instagram",
  "Telegram",
  "Tanish tavsiyasi",
  "Banner / reklama",
  "Do'st / qarindosh",
  "O'zi kelgan",
  "Boshqa",
] as const;

// Dars kunlari — value backend nextClassDate() bilan mos (to'liq uz nomi).
export const WEEKDAYS = [
  { value: "DUSHANBA", label: "Dushanba", short: "Du" },
  { value: "SESHANBA", label: "Seshanba", short: "Se" },
  { value: "CHORSHANBA", label: "Chorshanba", short: "Ch" },
  { value: "PAYSHANBA", label: "Payshanba", short: "Pa" },
  { value: "JUMA", label: "Juma", short: "Ju" },
  { value: "SHANBA", label: "Shanba", short: "Sh" },
  { value: "YAKSHANBA", label: "Yakshanba", short: "Ya" },
] as const;

export const WEEKDAY_SHORT: Record<string, string> = Object.fromEntries(
  WEEKDAYS.map((d) => [d.value, d.short]),
);

export const WEEKDAY_LABEL: Record<string, string> = Object.fromEntries(
  WEEKDAYS.map((d) => [d.value, d.label]),
);

// Ko'p ishlatiladigan jadval shablonlari (tez tanlash uchun)
export const SCHEDULE_PRESETS = [
  { label: "Toq kunlar", days: ["DUSHANBA", "CHORSHANBA", "JUMA"] },
  { label: "Juft kunlar", days: ["SESHANBA", "PAYSHANBA", "SHANBA"] },
  { label: "Har kuni", days: ["DUSHANBA", "SESHANBA", "CHORSHANBA", "PAYSHANBA", "JUMA", "SHANBA"] },
] as const;

/**
 * "YYYY-MM-DD" bugungi sana (input[type=date] uchun).
 *
 * `toISOString()` UTC qaytaradi: Toshkentda (UTC+5) tunda 00:00–05:00 oralig'ida
 * KECHAGI sana chiqib qolardi — shu sababli yarim tundan keyin ochilgan guruh
 * kechagi kun bilan yaratilardi.
 */
export function todayStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Davomat darsdan necha daqiqa OLDIN belgilanishi mumkin.
 * Backenddagi `ATTENDANCE_GRACE_MINUTES` bilan bir xil bo'lishi shart — aks
 * holda server qabul qiladigan vaqtda interfeys "Dars hali boshlanmadi" deb
 * tugmalarni yopib turadi.
 */
export const ATTENDANCE_GRACE_MINUTES = 15;
