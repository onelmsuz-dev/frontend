/**
 * MUZLATISH — "hozir muzlatilganmi?" degan savolga bitta javob.
 *
 * Muzlatish DAVR, holat emas (`EnrollmentStatus` ga qiymat qo'shilmagan):
 * a'zolik FAOL turadi, faqat `freezes` ro'yxatida bugunni qamragan
 * oraliq bo'ladi. Shu sababli ekranlar uni sezmasdi — muzlatilgan
 * o'quvchi ro'yxatda faolga o'xshab turar, to'lov oynasi ham indamasdi
 * (Doniyorjon, 2026-09-22). Endi hamma joy shu funksiyadan so'raydi.
 *
 * `to` — YARIM OCHIQ: o'sha kuni o'quvchi qaytadi (dvigateldagi
 * `isFrozenOn` bilan bir xil). Sanalar ISO satr yoki Date — faqat kun
 * qismi solishtiriladi.
 */
export interface FreezeLike {
  from: string | Date;
  to?: string | Date | null;
}

function kun(d: string | Date): string {
  return (typeof d === "string" ? d : d.toISOString()).slice(0, 10);
}

/** Bugun (yoki berilgan kun) muzlatish oralig'iga tushadimi. */
export function activeFreeze<T extends FreezeLike>(
  freezes: T[] | null | undefined, today: string = kun(new Date()),
): T | null {
  if (!freezes?.length) return null;
  return freezes.find((f) => kun(f.from) <= today && (f.to == null || kun(f.to) > today)) ?? null;
}

export function isFrozenNow(freezes: FreezeLike[] | null | undefined): boolean {
  return activeFreeze(freezes) !== null;
}

/** "10.10 gacha" / "ochiq muddatga" — belgi matni uchun. */
export function freezeUntilLabel(f: FreezeLike): string {
  if (!f.to) return "ochiq muddatga";
  const [y, m, d] = kun(f.to).split("-");
  return `${d}.${m}.${y} gacha`;
}
