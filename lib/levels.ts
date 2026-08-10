/**
 * Daraja hisobi — backenddagi `common/gamification.ts` bilan bir xil zinapoya.
 *
 * Sozlamalar javobi (`/api/gamification/settings`) `levels` ro'yxatini ham
 * qaytaradi, lekin daraja kerak bo'lgan har joyda o'sha so'rovni kutib
 * o'tirmaslik uchun mahalliy nusxa saqlanadi. Zinapoya o'zgarsa ikkalasini
 * ham yangilash kerak.
 */

export interface LevelDef { level: number; name: string; minXp: number }

export const LEVELS: LevelDef[] = [
  { level: 1,  name: "Yangi boshlovchi", minXp: 0 },
  { level: 2,  name: "Izlanuvchi",       minXp: 250 },
  { level: 3,  name: "Faol",             minXp: 600 },
  { level: 4,  name: "Tirishqoq",        minXp: 1100 },
  { level: 5,  name: "Ishonchli",        minXp: 1800 },
  { level: 6,  name: "Tajribali",        minXp: 2700 },
  { level: 7,  name: "Ustoz shogirdi",   minXp: 3900 },
  { level: 8,  name: "Mahoratli",        minXp: 5500 },
  { level: 9,  name: "Yetakchi",         minXp: 7500 },
  { level: 10, name: "Legenda",          minXp: 10000 },
];

export interface LevelInfo {
  level: number;
  name: string;
  minXp: number;
  nextXp: number | null;
  progress: number;
}

export function levelFromXp(xpRaw: number): LevelInfo {
  const xp = Math.max(0, Math.floor(xpRaw || 0));

  let idx = 0;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXp) { idx = i; break; }
  }

  const cur = LEVELS[idx];
  const next = LEVELS[idx + 1] ?? null;
  const progress = next
    ? Math.min(100, Math.round(((xp - cur.minXp) / (next.minXp - cur.minXp)) * 100))
    : 100;

  return { level: cur.level, name: cur.name, minXp: cur.minXp, nextXp: next?.minXp ?? null, progress };
}
