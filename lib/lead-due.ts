/**
 * LID QO'NG'IROG'INING VAQT HOLATI — kartochka rangini shu hal qiladi.
 *
 * Uch holat, uchtasi ham bir qarashda farqlanishi kerak:
 *   • `kutilmoqda` — vaqti hali kelmagan, tegmaslik mumkin;
 *   • `keldi`      — AYNAN HOZIR shu bilan shug'ullanish kerak (sariq);
 *   • `kechikkan`  — vaqti o'tib ketgan (qizil).
 *
 * "Kechikkan" chegarasi — belgilangan vaqtdan KECHIKISH_SOAT o'tgach.
 * Ilgari KUN bo'yicha edi (ertasi kunigacha qizil bo'lmasdi) va Doniyorjon
 * "qizilga o'tmadi" deb topdi: bugun 10:00 ga qo'yilgani kechqurun ham
 * "navbatda" ko'rinardi. Aniq soat bo'yicha (9:01 da qizil) ham yaramaydi —
 * operator hali telefonni ko'targancha "kechikkan" bo'lardi. Ikki soat —
 * "15:00 dedi, 17:00 bo'ldi, hali qilinmadi" — o'rtacha yo'l.
 * Backend (`dueToday.overdue`) ham AYNAN shu qoidada.
 */

import { fmtShortDate } from "./date-uz";
export type DueHolat = "yoq" | "kutilmoqda" | "keldi" | "kechikkan";

/** Belgilangan vaqtdan necha soat o'tgach "kechikkan" — backend bilan bir xil. */
export const KECHIKISH_SOAT = 2;

export function dueHolat(nextContactAt?: string | null, now = new Date()): DueHolat {
  if (!nextContactAt) return "yoq";
  const t = new Date(nextContactAt);
  if (Number.isNaN(t.getTime())) return "yoq";

  if (t.getTime() < now.getTime() - KECHIKISH_SOAT * 3_600_000) return "kechikkan";
  return t <= now ? "keldi" : "kutilmoqda";
}

/** Kartochkadagi matn: "Bugun 15:00", "Ertaga 10:30", "17-sen 15:00". */
export function dueMatn(nextContactAt: string, now = new Date()): string {
  const t = new Date(nextContactAt);
  const bugun = new Date(now); bugun.setHours(0, 0, 0, 0);
  const kun = new Date(t);     kun.setHours(0, 0, 0, 0);
  const farq = Math.round((kun.getTime() - bugun.getTime()) / 86_400_000);

  const soat = `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
  if (farq === 0)  return `Bugun ${soat}`;
  if (farq === 1)  return `Ertaga ${soat}`;
  if (farq === -1) return `Kecha ${soat}`;
  return `${fmtShortDate(t)} ${soat}`;
}
