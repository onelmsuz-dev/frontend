/**
 * To'lov holati — YAGONA MANBA.
 *
 * Tizimda ikki manba bor edi:
 *   1. `Student.balance` — hisoblanadigan, doim to'g'ri
 *   2. `StudentGroup.paymentStatus` — saqlangan, ESKIRADI
 *
 * `paymentStatus` faqat to'lov qabul qilinganda va kurs narxi yechilganda
 * yoziladi; chegirma (do'kon sovg'asi) yoki qo'lda balans tuzatishida esa
 * yangilanmaydi. Natijada bitta o'quvchi ro'yxatda "To'langan", profilida
 * "Qarzdor" ko'rinardi — bazada hozir 4 ta bunday zid yozuv bor.
 *
 * Shu sababli ko'rsatishda faqat `balance` ishlatiladi. Balans o'quvchi
 * bo'yicha yagona (guruh bo'yicha emas), demak barcha guruhda bir xil
 * holat ko'rinadi — bu modelga mos.
 */

export type PayStatusKey = "TOLANDI" | "QARZDOR" | "SINOVDA";

export const PAY_STATUS_CFG: Record<PayStatusKey, { label: string; cls: string }> = {
  TOLANDI: { label: "To'langan", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  QARZDOR: { label: "Qarzdor",   cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  SINOVDA: { label: "Sinovda",   cls: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500" },
};

/**
 * Balansdan to'lov holatini aniqlaydi.
 *
 * Sinov darsidagi o'quvchidan kurs narxi hali yechilmagan
 * (charge-on-activation) — balansi 0 bo'lgani uchun "To'langan" deyish
 * noto'g'ri bo'lardi, "Sinovda" ko'rsatiladi.
 */
export function payStatusFromBalance(
  balance: number | null | undefined,
  enrollmentStatus?: string | null,
): PayStatusKey {
  if (enrollmentStatus === "SINOV") return "SINOVDA";
  return (balance ?? 0) < 0 ? "QARZDOR" : "TOLANDI";
}
