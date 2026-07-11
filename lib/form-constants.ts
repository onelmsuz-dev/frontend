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

/** "YYYY-MM-DD" bugungi sana (input[type=date] uchun). */
export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}
