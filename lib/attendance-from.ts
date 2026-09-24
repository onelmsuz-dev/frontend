/**
 * O'QUVCHI QAYSI KUNDAN DAVOMATGA KIRADI — server bilan bir xil qoida
 * (`attendance.service.ts` → `attendanceFrom`).
 *
 * Guruhga qo'shilgan kun va markazga qabul qilingan kundan KECHROG'I.
 * Undan oldingi darsga davomat belgilanmaydi (Doniyorjon, 2026-09-24:
 * bugun qo'shilgan o'quvchiga o'tgan kunlarning davomati yozilib qolardi).
 * Sanalar kun o'zligida (UTC yarim tuni) keladi — faqat "YYYY-MM-DD" qismi olinadi.
 */
export function attendanceFrom(
  sgJoinedAt?: string | null, studentJoinedAt?: string | null,
): string | null {
  const a = sgJoinedAt ? String(sgJoinedAt).slice(0, 10) : null;
  const b = studentJoinedAt ? String(studentJoinedAt).slice(0, 10) : null;
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}

/** "2026-09-24" → "24.09.2026". */
export function kunUz(d: string): string {
  return d.split("-").reverse().join(".");
}
