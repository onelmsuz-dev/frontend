/**
 * RASMNI YUBORISHDAN OLDIN KICHRAYTIRISH.
 *
 * Fayl va profil rasmi bazaga base64 data-URL sifatida yoziladi va
 * so'rov Vercel proksisi orqali o'tadi. Vercel 4.5 MB dan katta so'rovni
 * o'tkazmaydi, base64 esa hajmni ~1.33 barobar oshiradi — ya'ni ~3.3 MB
 * dan katta xom fayl umuman yetib bormaydi. Telefon kamerasidagi rasm
 * odatda 3–6 MB (2026-09-30, lokal sinov).
 *
 * Rasm uzun tomoni `maxSide` gacha kichraytiriladi va JPEG qilinadi —
 * pasport nusxasi o'qiladigan bo'lib qoladi, hajmi esa bir necha yuz KB.
 * Brauzer rasmni ocholmasa (masalan HEIC ba'zi brauzerlarda) — `null`,
 * chaqiruvchi asl faylni hajm chegarasi bilan yuboradi.
 */
export interface CompressedImage {
  dataUrl: string;
  /** Xom bayt hajmi (base64 emas). */
  size: number;
  type: string;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("rasm ochilmadi")); };
    img.src = url;
  });
}

export async function compressImage(
  file: File,
  { maxSide = 1600, quality = 0.82 }: { maxSide?: number; quality?: number } = {},
): Promise<CompressedImage | null> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml" || file.type === "image/gif") {
    return null;
  }
  let img: HTMLImageElement;
  try { img = await loadImage(file); } catch { return null; }

  const k = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * k));
  const h = Math.max(1, Math.round(img.naturalHeight * k));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  // Shaffof PNG qora fonga tushmasin — JPEG'da alfa yo'q.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const size = Math.floor((base64.length * 3) / 4);
  // Kichraytirish foyda bermasa (allaqachon kichik JPEG) — asl fayl yaxshiroq.
  if (size >= file.size && file.type === "image/jpeg") return null;
  return { dataUrl, size, type: "image/jpeg" };
}

export function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Proksidan o'tadigan XOM fayl chegarasi. base64 (×4/3) + JSON qobig'i
 * 4.5 MB dan oshmasligi uchun 3 MB.
 */
export const UPLOAD_MAX_BYTES = 3 * 1024 * 1024;
