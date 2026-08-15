/**
 * Butun ilova uchun yagona SWR fetcher.
 *
 * Nima uchun kerak: ilgari har bir hook o'z fetcher'ini yozardi va ko'pchiligi
 * `fetch(url).then(r => r.json())` edi. Bunda 401/403/404 javoblari ham
 * "muvaffaqiyat" sanalib, xato tanasi (`{ error: "..." }`) ma'lumot o'rnida
 * komponentga borardi — sahifa xato ko'rsatish o'rniga bo'sh chizilardi.
 *
 * Bundan ham yomoni: agar so'rov HTML sahifaga yo'naltirilsa (masalan
 * middleware login sahifasiga 302 qilsa), `fetch` uni avtomatik kuzatadi va
 * javob **200 text/html** bo'lib keladi. `r.ok` true bo'lgani uchun hech
 * qanday xato ko'tarilmaydi. Aynan shu sabab o'quvchi panelining butun
 * ma'lumoti (profil, guruhlar, to'lovlar, davomat, gamifikatsiya) jimgina
 * bo'sh ko'rinib turgan edi.
 *
 * Shuning uchun bu yerda UCH narsa tekshiriladi:
 *   1. javob sahifaga yo'naltirilmaganmi (`redirected` yoki HTML content-type),
 *   2. HTTP status muvaffaqiyatlimi,
 *   3. tana haqiqatan JSON'mi.
 * Har qanday chetlanish `Error` bo'lib qaytadi va UI aniq sabab ko'rsatadi.
 */

export interface ApiError extends Error {
  /** HTTP status — UI 403/404 uchun alohida matn ko'rsatishi mumkin. */
  status?: number;
  /** Sessiya tugagani (login sahifasiga yo'naltirilgan) belgisi. */
  sessionExpired?: boolean;
}

function apiError(message: string, status?: number, sessionExpired = false): ApiError {
  const err = new Error(message) as ApiError;
  if (status !== undefined) err.status = status;
  if (sessionExpired) err.sessionExpired = true;
  return err;
}

// `T = any` — ATAYLAB. Ko'p hooklar `useSWR(url, fetcher)` ni tip bermasdan
// chaqiradi; `unknown` bo'lsa ular butun ilova bo'ylab tipni yo'qotardi. Bu
// fayl ish tipini emas, ISHLASH XAVFSIZLIGINI ta'minlaydi.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function jsonFetcher<T = any>(url: string): Promise<T> {
  let r: Response;
  try {
    r = await fetch(url, { headers: { accept: "application/json" } });
  } catch {
    throw apiError("Serverga ulanib bo'lmadi — internetni tekshiring");
  }

  const ctype = r.headers.get("content-type") ?? "";
  const isJson = ctype.includes("application/json");

  // Sahifaga yo'naltirilgan: JSON kutayotgan joyda HTML keldi.
  if (!isJson) {
    throw apiError(
      "Sessiya tugagan ko'rinadi — sahifani yangilab, qaytadan kiring",
      r.status,
      true,
    );
  }

  let data: unknown;
  try {
    data = await r.json();
  } catch {
    throw apiError("Serverdan noto'g'ri javob keldi", r.status);
  }

  if (!r.ok) {
    const msg = (data as { error?: string } | null)?.error;
    throw apiError(msg ?? `So'rov bajarilmadi (${r.status})`, r.status);
  }

  return data as T;
}

/**
 * Hooklar uchun GENERIK BO'LMAGAN variant.
 *
 * `useSWR(url, fetcher)` tip parametrisiz chaqirilganda TypeScript generik
 * funksiyadan `T` ni chiqara olmaydi va uni `unknown`/`{}` deb oladi — natijada
 * o'nlab sahifada tip xatosi paydo bo'ladi. Shu sabab bu yerda tip aniq
 * `Promise<any>` qilib mahkamlanadi; tip kerak bo'lsa `useSWR<Turi>(...)`
 * yoki to'g'ridan-to'g'ri `jsonFetcher<Turi>` ishlatiladi.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fetcher: (url: string) => Promise<any> = jsonFetcher;
