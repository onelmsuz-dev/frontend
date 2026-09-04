/**
 * LID BOSQICHLARI — ranglar va navigatsiya, backend bilan SINXRON.
 *
 * `LeadStage.color` — semantik kalit (masalan "blue"), xom Tailwind
 * klassi emas. Bitta bosqich belgisi uch xil mos soyani (nuqta/matn/fon)
 * talab qiladi — shuning uchun BITTA qat'iy lug'at, uch joyda emas.
 *
 * DIQQAT: Tailwind klasslari SHABLON orqali qurilmagan
 * (`` `bg-${color}-500` `` emas) — statik skanerlash faqat to'liq
 * yozilgan klass nomlarini topadi. Har bir rang uchun har bir klass
 * ALOHIDA, TO'LIQ satr sifatida yozilgan.
 */

export const STAGE_COLORS = [
  "blue", "yellow", "purple", "green", "red",
  "gray", "indigo", "orange", "pink", "cyan",
] as const;
export type StageColor = (typeof STAGE_COLORS)[number];

interface HueStyle {
  /** Kichik nuqta — pipeline xulosasi, ustun sarlavhasi. */
  dot: string;
  /** Matn rangi — ustun sarlavhasi, funnel yorlig'i. */
  text: string;
  /** Ustun/panel foni. */
  headerBg: string;
  /** Kichik badge — dashboard ro'yxati, global qidiruv. */
  badge: string;
  /** Funnel/progress chizig'i. */
  bar: string;
}

export const STAGE_HUE_STYLES: Record<StageColor, HueStyle> = {
  blue: {
    dot: "bg-blue-500", text: "text-blue-700 dark:text-blue-300",
    headerBg: "bg-blue-50 dark:bg-blue-900/20",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    bar: "bg-blue-500",
  },
  yellow: {
    dot: "bg-yellow-500", text: "text-yellow-700 dark:text-yellow-300",
    headerBg: "bg-yellow-50 dark:bg-yellow-900/20",
    badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
    bar: "bg-yellow-500",
  },
  purple: {
    dot: "bg-purple-500", text: "text-purple-700 dark:text-purple-300",
    headerBg: "bg-purple-50 dark:bg-purple-900/20",
    badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    bar: "bg-purple-500",
  },
  green: {
    dot: "bg-green-500", text: "text-green-700 dark:text-green-300",
    headerBg: "bg-green-50 dark:bg-green-900/20",
    badge: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    bar: "bg-green-500",
  },
  red: {
    dot: "bg-red-500", text: "text-red-700 dark:text-red-300",
    headerBg: "bg-red-50 dark:bg-red-900/20",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    bar: "bg-red-500",
  },
  gray: {
    dot: "bg-gray-500", text: "text-gray-700 dark:text-gray-300",
    headerBg: "bg-gray-50 dark:bg-gray-900/20",
    badge: "bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300",
    bar: "bg-gray-500",
  },
  indigo: {
    dot: "bg-indigo-500", text: "text-indigo-700 dark:text-indigo-300",
    headerBg: "bg-indigo-50 dark:bg-indigo-900/20",
    badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
    bar: "bg-indigo-500",
  },
  orange: {
    dot: "bg-orange-500", text: "text-orange-700 dark:text-orange-300",
    headerBg: "bg-orange-50 dark:bg-orange-900/20",
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    bar: "bg-orange-500",
  },
  pink: {
    dot: "bg-pink-500", text: "text-pink-700 dark:text-pink-300",
    headerBg: "bg-pink-50 dark:bg-pink-900/20",
    badge: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
    bar: "bg-pink-500",
  },
  cyan: {
    dot: "bg-cyan-500", text: "text-cyan-700 dark:text-cyan-300",
    headerBg: "bg-cyan-50 dark:bg-cyan-900/20",
    badge: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
    bar: "bg-cyan-500",
  },
};

const FALLBACK_HUE: HueStyle = STAGE_HUE_STYLES.gray;

/** Noma'lum/eskirgan rang kaliti bilan ham sahifa buzilmasin. */
export function stageHue(color: string | null | undefined): HueStyle {
  return STAGE_HUE_STYLES[color as StageColor] ?? FALLBACK_HUE;
}

export type StageKind = "NORMAL" | "WON" | "LOST";

export interface StageLike {
  id: string;
  name: string;
  kind: StageKind;
  color: string;
  sortOrder: number;
}

/**
 * NAVIGATSIYA — backend `LeadStagesService`dagi bilan BIR XIL algoritm
 * (`resolveNext`/`resolvePrev`/`firstOfKind`). Ikkalasi mustaqil, lekin
 * sinxron: server oxirgi so'z, front faqat tugma yorlig'ini oldindan
 * ko'rsatish uchun ishlatadi.
 */
export function resolveNextStage<T extends StageLike>(stages: T[], current: StageLike): T | null {
  return stages
    .filter((s) => s.sortOrder > current.sortOrder && s.kind !== "LOST")
    .sort((a, b) => a.sortOrder - b.sortOrder)[0] ?? null;
}

export function resolvePrevStage<T extends StageLike>(stages: T[], current: StageLike): T | null {
  return stages
    .filter((s) => s.sortOrder < current.sortOrder && s.kind !== "LOST")
    .sort((a, b) => b.sortOrder - a.sortOrder)[0] ?? null;
}

export function firstStageOfKind<T extends StageLike>(stages: T[], kind: StageKind): T | null {
  return stages.filter((s) => s.kind === kind).sort((a, b) => a.sortOrder - b.sortOrder)[0] ?? null;
}

export function defaultStage<T extends StageLike>(stages: T[]): T | null {
  return firstStageOfKind(stages, "NORMAL");
}
