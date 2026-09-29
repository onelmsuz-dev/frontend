/**
 * PUL SUMMASI — TOR KARTADA SINA OLADIGAN SHAKLDA.
 *
 * `Intl` ning `style: "currency"` varianti guruh ajratgichi sifatida ham,
 * valyuta so'zidan oldin ham UZILMAS bo'shliq (U+00A0) qo'yadi:
 *
 *     7[NBSP]500[NBSP]000[NBSP]soʻm
 *
 * Ya'ni butun satr brauzer uchun BITTA bo'linmas so'z. Tor ustunga
 * sig'masa u o'ralmaydi — kartadan tashqariga chiqib ketadi va yonidagi
 * kartaning ustiga tushadi (mobil dashboard, "Oylik daromad", 2026-09-17).
 *
 * Shuning uchun:
 *   · raqam ICHIDAGI uzilmas bo'shliqlar SAQLANADI — "7 500 000" hech
 *     qachon "7 500" va "000" bo'lib ikkiga bo'linmasligi kerak;
 *   · "soʻm" dan oldin esa ODDIY bo'shliq qo'yiladi — kerak bo'lsa u
 *     pastki qatorga tushadi va karta butun qoladi.
 *
 * Valyuta so'zi `Intl` dan olinadi, qo'lda yozilmaydi — lokal ma'lumot
 * manba bo'lib qolsin.
 */
const RAQAM = new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 0 });

/**
 * "soʻm" QO'LDA YOZILGAN — `Intl`dan OLINMAYDI.
 *
 * Ilgari `style: "currency"` bilan `Intl`ning o'zi tanlagan so'z
 * ishlatilardi. Bu so'z Node'ning ICU ma'lumotiga bog'liq: to'liq ICU'da
 * "soʻm", qisqartirilganida (`small-icu` — ko'p standart Node
 * o'rnatishlarida shunday) "UZS" chiqadi. Server (Node) va brauzer har xil
 * ICU'ga ega bo'lsa, SSR va CSR matni bir-biriga zid chiqib, React
 * "hydration mismatch" xatosi berardi — sahifa bir lahza noto'g'ri
 * ko'rinib, keyin qayta chizilardi.
 */
const VALYUTA = "soʻm";

export function formatCurrency(v: number): string {
  return `${RAQAM.format(v)} ${VALYUTA}`;
}
