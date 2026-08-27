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

export type PayStatusKey = "TOLANDI" | "QARZDOR" | "SINOVDA" | "HISOBLANMAGAN";

export const PAY_STATUS_CFG: Record<PayStatusKey, { label: string; cls: string }> = {
  TOLANDI: { label: "To'langan", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  QARZDOR: { label: "Qarzdor",   cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  SINOVDA: { label: "Sinovda",   cls: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500" },
  // Guruhga biriktirilmagan o'quvchi: hisob umuman ochilmagan.
  HISOBLANMAGAN: {
    label: "Hisob yo'q",
    cls: "bg-neutral-100 text-neutral-400 dark:bg-neutral-800/60 dark:text-neutral-500",
  },
};

/**
 * Balansdan to'lov holatini aniqlaydi.
 *
 * UCH xil "balans 0" bor va ular BIR XIL EMAS:
 *   1. Guruhda o'qiyapti, qarzi yo'q      → "To'langan"
 *   2. Sinov darsida, hali hisoblanmagan  → "Sinovda"
 *   3. Guruhga umuman biriktirilmagan     → "Hisob yo'q"
 *
 * Uchinchisi ilgari "To'langan" bo'lib ko'rinardi va bu yolg'on edi:
 * o'quvchi hech narsa to'lagani yo'q, undan hali hech narsa hisoblanmagan.
 * Qarzdorlar ro'yxati toza ko'rinib, aslida hisob ochilmagan o'quvchilar
 * e'tibordan chetda qolardi.
 */
export function payStatusFromBalance(
  balance: number | null | undefined,
  enrollmentStatus?: string | null,
): PayStatusKey {
  if (enrollmentStatus === "SINOV") return "SINOVDA";
  // Guruhi yo'q (yangi / guruhsiz / ketgan) va balansi 0 — hisob ochilmagan.
  const noGroup =
    enrollmentStatus === "YANGI" ||
    enrollmentStatus === "GURUHSIZ" ||
    enrollmentStatus === "CHIQIB_KETGAN";
  if (noGroup && (balance ?? 0) === 0) return "HISOBLANMAGAN";
  return (balance ?? 0) < 0 ? "QARZDOR" : "TOLANDI";
}
