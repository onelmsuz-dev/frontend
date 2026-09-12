/**
 * SESSIYA MUDDATI — bitta joydan boshqariladi.
 *
 * Bu fayl ATAYLAB kichik va yon ta'sirsiz: uni ham edge middleware
 * (`proxy.ts`), ham server (`auth.config.ts`), ham brauzer komponenti
 * (`SessionWatcher`) import qiladi. Agar belgi `auth.config.ts` da qolsa,
 * mijoz to'plamiga butun auth sozlamasi tortilardi.
 */

/**
 * Sessiya HAQIQATAN tugagani. Faqat shu qiymat foydalanuvchini login
 * sahifasiga chiqaradi — backendning vaqtinchalik nosozligi chiqarmaydi.
 */
export const SESSION_EXPIRED = "SessionExpired";

/** 401 kelganda tarqatiladigan hodisa nomi. */
export const UNAUTHORIZED_EVENT = "oneroom:unauthorized";

let oxirgiTurtki = 0;

/**
 * API 401 qaytardi — sessiya holatini QAYTA TEKSHIRISHNI so'raymiz.
 *
 * DIQQAT: bu yerda to'g'ridan-to'g'ri `signOut` QILINMAYDI. 401 har doim
 * ham "sessiya o'ldi" degani emas (backend qayta ishga tushayotgan,
 * rate-limit urgan bo'lishi mumkin). Shuning uchun faqat NextAuth'dan
 * sessiyani yangilashni so'raymiz; u refresh'ni sinaydi va agar
 * haqiqatan tugagan bo'lsa `error` qo'yadi — chiqarish qarorini
 * {@link SESSION_EXPIRED} ni ko'rgan kuzatuvchi qabul qiladi.
 *
 * Bitta sahifada o'nlab so'rov barobar 401 olishi mumkin, shuning uchun
 * turtki 10 soniyada bir martadan ko'p bo'lmaydi.
 */
export function nudgeSessionCheck() {
  if (typeof window === "undefined") return;
  const hozir = Date.now();
  if (hozir - oxirgiTurtki < 10_000) return;
  oxirgiTurtki = hozir;
  window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
}
