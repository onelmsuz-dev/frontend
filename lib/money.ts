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
/**
 * RAQAMNI GURUHLASH — QO'LDA, `Intl` SIZ.
 *
 * Ilgari `Intl.NumberFormat("uz-UZ")` ishlatilardi. Uning natijasi brauzer va
 * Node'dagi ICU ma'lumotiga bog'liq: "uz" lokali bor joyda `7 500 000`,
 * yo'q joyda (ko'p Chrome o'rnatishlari) inglizcha `7,500,000` chiqardi.
 * Natijada bir xil summa turli qurilmada turlicha ko'rinar, panelning o'zida
 * esa besh xil yozuv aralashib yurardi ("29,750,000 so'm", "UZS 3,500,000",
 * "29.8M", "1.7 mln", "900 ming").
 *
 * Endi BITTA qoida, hamma joyda bir xil:
 *   · minglar UZILMAS bo'shliq bilan ajratiladi — `7 500 000`;
 *   · kasr (bo'lsa) vergul bilan — `12,5`;
 *   · valyuta raqamdan KEYIN — `7 500 000 soʻm`.
 */
const NBSP = "\u00A0";
function guruhla(butun: string): string {
  return butun.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
}

/** Valyutasiz son: `7 500 000`, `12,5`. Yorliqda "so'm" alohida yozilgan joylar uchun. */
export function formatNumber(v: number | null | undefined): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return "0";
  const yax = Math.round(Math.abs(n) * 1000) / 1000;
  const [butun, kasr] = String(yax).split(".");
  const belgi = n < 0 && yax !== 0 ? "-" : "";
  return belgi + guruhla(butun) + (kasr ? `,${kasr}` : "");
}

const RAQAM = { format: (v: number) => formatNumber(Math.round(Number(v) || 0)) };

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

/**
 * QISQA SHAKL — grafik o'qi va tor ustunlar uchun: `29,8 mln`, `900 ming`.
 * To'liq summa sig'adigan joyda `formatCurrency` ishlatiladi; qisqasi faqat
 * joy tor bo'lganda. Kasr vergul bilan, ortiqcha `,0` yozilmaydi.
 */
export function formatCompact(v: number | null | undefined): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return "0";
  const a = Math.abs(n);
  const belgi = n < 0 ? "-" : "";
  if (a >= 1_000_000_000) return `${belgi}${String(Math.round(a / 100_000_000) / 10).replace(".", ",")} mlrd`;
  if (a >= 1_000_000) return `${belgi}${String(Math.round(a / 100_000) / 10).replace(".", ",")} mln`;
  if (a >= 1_000) return `${belgi}${Math.round(a / 1_000)} ming`;
  return belgi + String(Math.round(a));
}
