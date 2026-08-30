/**
 * TO'LOV USULLARI — FRONTENDDAGI YAGONA MANBA.
 *
 * Ilgari bu ro'yxat SAKKIZ joyda alohida yozilgan edi: to'lov qabul
 * qilish oynasi, o'quvchi kartochkasi, to'lovni tahrirlash, moliya
 * filtri, boshqaruv paneli, hisobot ranglari, o'quvchi paneli.
 * Ikkitasi ham bir xil shaklda emasdi — biri `Record`, biri
 * `[{v,l}]`, uchtasi oddiy massiv.
 *
 * Va ular ALLAQACHON ajralib ketgan edi: `NAQD` to'rt faylda "Naqd",
 * bittasida "Naqd pul". Ya'ni "yangi usul qo'shsak, hamma joyga
 * qo'shamiz" rejasi shu kod bazasida allaqachon yiqilgan.
 *
 * Endi ro'yxat shu yerda. Yangi usul qo'shish — bitta qator.
 *
 * ESKI QIYMATLAR (`CLICK`, `PAYME`) ro'yxatdan olindi, lekin
 * O'CHIRILMADI: bazada eski to'lovlar bo'lishi mumkin va ular ekranda
 * "CLICK" degan xom yozuv emas, chiroyli nom bilan ko'rinishi kerak.
 * Yangi to'lovda esa tanlab bo'lmaydi.
 */

export interface PaymentMethodInfo {
  value: string;
  /** To'liq nomi — ochiluvchi ro'yxat va tafsilotlar uchun. */
  label: string;
  /** Qisqa nomi — tugma va nishonchalar uchun. */
  short: string;
  /** Tailwind sinflari — nishoncha uchun. */
  cls: string;
  /** Diagramma uchun HEX rang. */
  hex: string;
  /** Yangi to'lovda tanlanmaydi. */
  legacy?: boolean;
}

export const PAYMENT_METHODS: PaymentMethodInfo[] = [
  {
    value: "NAQD", label: "Naqd pul", short: "Naqd",
    cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    hex: "#10b981",
  },
  {
    value: "KARTA", label: "Kartaga o'tkazma", short: "Karta",
    cls: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
    hex: "#6366f1",
  },
  {
    value: "BANK", label: "Bank hisob raqamiga ko'chirma", short: "Bank",
    cls: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
    hex: "#0ea5e9",
  },
  // ─── Eski: tanlanmaydi, lekin o'qiladi ───
  {
    value: "CLICK", label: "Click", short: "Click", legacy: true,
    cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    hex: "#f59e0b",
  },
  {
    value: "PAYME", label: "Payme", short: "Payme", legacy: true,
    cls: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
    hex: "#06b6d4",
  },
];

/** Yangi to'lovda tanlash mumkin bo'lganlari. */
export const SELECTABLE_METHODS = PAYMENT_METHODS.filter((m) => !m.legacy);

const BY_VALUE = new Map(PAYMENT_METHODS.map((m) => [m.value, m]));

/**
 * Tanilmagan qiymat kelsa — XOM QIYMATNING O'ZI qaytariladi.
 *
 * Bo'sh satr qaytarish xavfli: bazada kelajakda paydo bo'ladigan
 * qiymat ekrandan butunlay yo'qolib, to'lov "usulsiz" ko'rinardi.
 * Xunukroq bo'lsa ham, ko'rinib turgani afzal.
 */
export function methodLabel(v: string | null | undefined): string {
  if (!v) return "—";
  return BY_VALUE.get(v)?.label ?? v;
}

export function methodShort(v: string | null | undefined): string {
  if (!v) return "—";
  return BY_VALUE.get(v)?.short ?? v;
}

export function methodCls(v: string | null | undefined): string {
  return BY_VALUE.get(v ?? "")?.cls
    ?? "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300";
}

export function methodHex(v: string | null | undefined): string {
  return BY_VALUE.get(v ?? "")?.hex ?? "#94a3b8";
}

/**
 * Tanlagich uchun ustunlar soni — QATTIQ YOZILMAYDI.
 *
 * Ilgari `grid-cols-4` qo'lda yozilgandi va aynan to'rtta usulga
 * moslangandi. Uchtaga tushganda bo'sh katak qolardi, beshtaga
 * chiqqanda esa qatorga sig'masdi.
 */
export function methodGridCls(count: number): string {
  if (count <= 2) return "grid-cols-2";
  if (count === 3) return "grid-cols-3";
  return "grid-cols-2 sm:grid-cols-4";
}
