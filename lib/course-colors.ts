/**
 * KURS RANGI → jadval blokining uslubi.
 *
 * Kurs sozlamalarida rang `bg-yellow-500` ko'rinishida saqlanadi (bitta
 * to'liq rang), jadval bloki uchun esa fon + chegara + matn kerak.
 *
 * Ilgari jadval `Group.color` ni olardi, uning bazadagi STANDART qiymati
 * esa ko'k — shuning uchun kurs rangi sariq qilib qo'yilsa ham hamma blok
 * bir xil ko'k chiqardi.
 *
 * BU FAYLDA, sahifada EMAS: palitradan endi uch joy foydalanadi —
 * jadval sahifasi (kun/hafta/oy), xonalar panjarasi va yon panel.
 * Nusxa ko'chirilsa ular vaqt o'tib bir-biridan uzoqlashardi va bir
 * guruh ikki ekranda ikki xil rangda ko'rinardi.
 */
const COURSE_BLOCK_COLORS: Record<string, string> = {
  blue:    "bg-blue-100 border-blue-400 text-blue-800 dark:bg-blue-900/40 dark:border-blue-500 dark:text-blue-200",
  green:   "bg-green-100 border-green-400 text-green-800 dark:bg-green-900/40 dark:border-green-500 dark:text-green-200",
  amber:   "bg-amber-100 border-amber-400 text-amber-900 dark:bg-amber-900/40 dark:border-amber-500 dark:text-amber-200",
  yellow:  "bg-yellow-100 border-yellow-400 text-yellow-900 dark:bg-yellow-900/40 dark:border-yellow-500 dark:text-yellow-200",
  purple:  "bg-purple-100 border-purple-400 text-purple-800 dark:bg-purple-900/40 dark:border-purple-500 dark:text-purple-200",
  red:     "bg-red-100 border-red-400 text-red-800 dark:bg-red-900/40 dark:border-red-500 dark:text-red-200",
  cyan:    "bg-cyan-100 border-cyan-400 text-cyan-900 dark:bg-cyan-900/40 dark:border-cyan-500 dark:text-cyan-200",
  pink:    "bg-pink-100 border-pink-400 text-pink-800 dark:bg-pink-900/40 dark:border-pink-500 dark:text-pink-200",
  emerald: "bg-emerald-100 border-emerald-400 text-emerald-900 dark:bg-emerald-900/40 dark:border-emerald-500 dark:text-emerald-200",
  orange:  "bg-orange-100 border-orange-400 text-orange-900 dark:bg-orange-900/40 dark:border-orange-500 dark:text-orange-200",
  indigo:  "bg-indigo-100 border-indigo-400 text-indigo-800 dark:bg-indigo-900/40 dark:border-indigo-500 dark:text-indigo-200",
  sky:     "bg-sky-100 border-sky-400 text-sky-800 dark:bg-sky-900/40 dark:border-sky-500 dark:text-sky-200",
  teal:    "bg-teal-100 border-teal-400 text-teal-800 dark:bg-teal-900/40 dark:border-teal-500 dark:text-teal-200",
  rose:    "bg-rose-100 border-rose-400 text-rose-800 dark:bg-rose-900/40 dark:border-rose-500 dark:text-rose-200",
  violet:  "bg-violet-100 border-violet-400 text-violet-800 dark:bg-violet-900/40 dark:border-violet-500 dark:text-violet-200",
  lime:    "bg-lime-100 border-lime-400 text-lime-900 dark:bg-lime-900/40 dark:border-lime-500 dark:text-lime-200",
};

/** "bg-yellow-500" → blok uslubi; noma'lum bo'lsa null. */
export function courseBlockColor(courseColor?: string | null): string | null {
  const hue = /^bg-([a-z]+)-\d{2,3}$/.exec(String(courseColor ?? ""))?.[1];
  return hue ? (COURSE_BLOCK_COLORS[hue] ?? null) : null;
}

export const GROUP_COLORS = [
  "bg-blue-100 border-blue-400 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  "bg-green-100 border-green-400 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  "bg-purple-100 border-purple-400 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  "bg-orange-100 border-orange-400 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  "bg-pink-100 border-pink-400 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300",
  "bg-yellow-100 border-yellow-400 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
];

/** Guruh bloki uchun tayyor uslub — kurs rangi, bo'lmasa palitradan. */
export function blockColorFor(
  g: { course?: { color?: string | null } | null; color?: string | null },
  index: number,
): string {
  return courseBlockColor(g.course?.color)
    ?? (g.color && COURSE_BLOCK_COLORS[String(g.color)])
    ?? GROUP_COLORS[index % GROUP_COLORS.length];
}
