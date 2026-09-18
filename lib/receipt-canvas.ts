/**
 * CHEKNI KANVASGA CHIZISH — yuklash, jo'natish va PDF uchun yagona manba.
 *
 * NEGA `html2canvas` EMAS. Ikki sabab, ikkalasi ham jiddiy:
 *   1. Loyiha Tailwind v4 da va ranglar `oklch()` bilan yoziladi —
 *      `html2canvas` bu funksiyani tushunmaydi va chizishda yiqiladi.
 *   2. Ekran nusxasi qog'ozga mo'ljallanmagan: soya, shaffoflik, qorong'i
 *      rejim — hammasi chekka tushib, bosib chiqarilganda iflos ko'rinadi.
 *
 * Kanvasga o'zimiz chizsak, matn brauzerning o'z shriftlari bilan
 * chiziladi — ya'ni kirill ham, o'zbek lotin ham, `ʻ` belgisi ham
 * to'g'ri chiqadi. PDF kutubxonasiga shrift joylash muammosi ham
 * yo'qoladi: unga tayyor RASM beriladi.
 */

import { formatUzDate } from "./date-uz";

const OYLAR = ["yanvar", "fevral", "mart", "aprel", "may", "iyun",
               "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];

export interface ReceiptData {
  receiptLabel?: string | null;
  code?: string | null;
  date: string;
  amount: number;
  method: string;
  note?: string | null;
  student?: { name?: string | null; phone?: string | null } | null;
  groupName?: string | null;
  courseName?: string | null;
  coursePrice?: number | null;
  receivedBy?: string | null;
  organization?: { name?: string | null } | null;
  periods?: { month: string | null; amount: number }[];
  advance?: number;
}

const USUL: Record<string, string> = {
  NAQD: "Naqd", KARTA: "Karta", BANK: "Bank o'tkazmasi",
  CLICK: "Click", PAYME: "Payme",
};

const pul = (v: number) => `${new Intl.NumberFormat("uz-UZ").format(Math.round(v))} so'm`;

export function oyNomi(m: string | null): string {
  if (!m) return "Davrsiz to'lov";
  const [y, mm] = m.split("-").map(Number);
  return `${OYLAR[mm - 1] ?? m} ${y}`;
}

function sana(v: string): string {
  // `toLocaleDateString("uz-UZ")` ATAYLAB ishlatilmaydi: o'zbek lokali
  // yo'q brauzerda u jimgina amerikacha tartibga (oy/kun/yil) tushib
  // ketardi — chekda esa bu mijoz bilan bahsga olib borishi mumkin.
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : formatUzDate(d);
}

/** Chek eni (CSS px). 58 mm termal qog'ozga ham, A4 ga ham mos keladi. */
const EN = 380;
const CHET = 26;
const SCALE = 3;            // qog'ozda va Retina ekranda tiniq chiqsin

/**
 * MATN MIQYOSI — chekdagi yozuv kattaligi.
 *
 * Chek RASM bo'lib chiqadi va qog'oz kengligiga siqiladi. Ya'ni
 * qog'ozdagi harf balandligi `shrift / EN × qog'oz kengligi` ga teng —
 * shriftning o'zi emas, uning CHEK KENGLIGIGA NISBATI hal qiladi.
 *
 * Eski qiymatda asosiy matn 12px edi: 80 mm qog'ozda 12/380×80 ≈
 * 2.5 mm, 58 mm da esa atigi 1.8 mm. Odatdagi chek matni 3–3.5 mm,
 * shuning uchun markaz "boshqa cheklar yaxshi chiqyapti, buniki
 * ko'rinmayapti" deb xabar berdi (M Bakhtiyarovna, 2026-09-17).
 *
 * 1.35 → asosiy matn 16px, 80 mm da ≈ 3.4 mm. Chetlar (`CHET`)
 * ATAYLAB kattalashtirilmadi: ular o'sha joyda qolsa, o'sgan matn
 * uchun ko'proq joy qoladi.
 */
const K = 1.35;

/** Miqyoslangan shrift o'lchami. */
const O = (n: number) => Math.round(n * K);

/** Miqyoslangan vertikal qadam — matn kattalashsa qatorlar ham siyraklashadi. */
const Q = (n: number) => Math.round(n * K);

/**
 * Chekni kanvasga chizadi va kanvasni qaytaradi.
 * `qrDataUrl` — ixtiyoriy; berilmasa QR chizilmaydi, kod matni qoladi.
 */
export async function drawReceipt(
  d: ReceiptData,
  qrDataUrl?: string,
): Promise<HTMLCanvasElement> {
  const qr = qrDataUrl ? await rasmYukla(qrDataUrl).catch(() => null) : null;

  // Balandlikni OLDIN hisoblaymiz — kanvas o'lchami chizishdan oldin
  // ma'lum bo'lishi kerak, aks holda chizilgan narsa o'chib ketadi.
  const qatorlar = maydonlar(d);
  const davrlar = davrRoyxati(d);
  // BALANDLIK CHIZISH BILAN BIR XIL MIQYOSDA hisoblanadi — aks holda
  // matn kattalashib, kanvasning pastidan chiqib ketardi.
  let h = CHET;
  h += Q(78);                                   // sarlavha bloki
  h += qatorlar.length * Q(22) + Q(10);         // maydonlar
  h += Q(26) + davrlar.length * Q(20) + Q(12);  // "qaysi davr uchun"
  h += Q(46);                                   // JAMI
  if (d.note) h += Q(24);
  if (d.code) h += qr ? Q(122) : Q(40);
  h += CHET;

  const c = document.createElement("canvas");
  c.width = EN * SCALE;
  c.height = Math.round(h) * SCALE;
  const g = c.getContext("2d");
  if (!g) throw new Error("Kanvas ochilmadi");
  g.scale(SCALE, SCALE);

  // Chek HAR DOIM oq fonda — qorong'i rejim qog'ozga ko'chmasin.
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, EN, h);
  g.textBaseline = "top";

  const F = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
  let y = CHET;

  // ─── Sarlavha ──────────────────────────────────────────────────────
  g.fillStyle = "#111111";
  g.font = `bold ${O(16)}px ${F}`;
  markaz(g, d.organization?.name ?? "", EN / 2, y);
  y += Q(22);
  g.fillStyle = "#777777";
  g.font = `${O(10)}px ${F}`;
  markaz(g, "TO'LOV CHEKI", EN / 2, y);
  y += Q(16);
  g.fillStyle = "#111111";
  g.font = `bold ${O(19)}px ${F}`;
  markaz(g, d.receiptLabel ?? "—", EN / 2, y);
  y += Q(28);
  punktir(g, CHET, y, EN - CHET);
  y += Q(12);

  // ─── Maydonlar ─────────────────────────────────────────────────────
  for (const [k, v] of qatorlar) {
    // QIYMAT AVVAL: uning kengligi o'lchanib, yorliqqa qolgan joy
    // hisoblanadi. Matn kattalashgach yorliq bilan qiymat bir-birining
    // ustiga chiqib ketishi mumkin edi — chekda bu o'qib bo'lmaydigan
    // qatorga aylanardi.
    g.font = `600 ${O(12)}px ${F}`;
    const vw = g.measureText(v).width;
    g.fillStyle = "#111111";
    ong(g, v, EN - CHET, y);

    g.font = `${O(12)}px ${F}`;
    g.fillStyle = "#888888";
    g.fillText(qisqart(g, k, EN - CHET * 2 - vw - Q(8)), CHET, y);
    y += Q(22);
  }
  y += Q(10);
  punktir(g, CHET, y, EN - CHET);
  y += Q(12);

  // ─── Qaysi davr uchun ──────────────────────────────────────────────
  g.fillStyle = "#888888";
  g.font = `${O(10)}px ${F}`;
  g.fillText("QAYSI DAVR UCHUN", CHET, y);
  y += Q(16);
  for (const [nom, summa] of davrlar) {
    g.font = `600 ${O(12)}px ${F}`;
    const sw = g.measureText(summa).width;
    g.fillStyle = "#111111";
    ong(g, summa, EN - CHET, y);

    g.font = `${O(12)}px ${F}`;
    g.fillStyle = "#333333";
    g.fillText(qisqart(g, nom, EN - CHET * 2 - sw - Q(8)), CHET, y);
    y += Q(20);
  }
  y += Q(12);

  // ─── JAMI ──────────────────────────────────────────────────────────
  g.strokeStyle = "#111111";
  g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(CHET, y); g.lineTo(EN - CHET, y); g.stroke();
  y += Q(10);
  g.fillStyle = "#111111";
  g.font = `bold ${O(13)}px ${F}`;
  g.fillText("JAMI", CHET, y + Q(4));
  g.font = `bold ${O(20)}px ${F}`;
  ong(g, pul(d.amount), EN - CHET, y);
  y += Q(36);

  if (d.note) {
    g.fillStyle = "#888888";
    g.font = `${O(10)}px ${F}`;
    g.fillText(`Izoh: ${qisqart(g, d.note, EN - CHET * 2)}`, CHET, y);
    y += Q(24);
  }

  // ─── Originallik kodi ──────────────────────────────────────────────
  if (d.code) {
    if (qr) {
      const o = Q(76);
      g.drawImage(qr, (EN - o) / 2, y, o, o);
      y += o + Q(8);
    }
    g.fillStyle = "#333333";
    g.font = `${O(11)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    markaz(g, d.code, EN / 2, y);
    y += Q(16);
    g.fillStyle = "#aaaaaa";
    g.font = `${O(9)}px ${F}`;
    markaz(g, "Chek haqiqiyligini shu kod bo'yicha tekshirish mumkin", EN / 2, y);
  }

  return c;
}

/** Eksport QILINGAN — sinov aynan shu mantiqni tekshiradi (qog'ozga
 *  noto'g'ri raqam chiqishi eng qimmat xato). */
export function maydonlar(d: ReceiptData): [string, string][] {
  const r: [string, string][] = [];
  if (d.student?.name)  r.push(["O'quvchi", d.student.name]);
  if (d.student?.phone) r.push(["Telefon", d.student.phone]);
  if (d.courseName)     r.push(["Kurs", d.courseName]);
  if (d.groupName)      r.push(["Guruh", d.groupName]);
  if (d.coursePrice)    r.push(["Kurs narxi", pul(d.coursePrice)]);
  r.push(["Sana", sana(d.date)]);
  r.push(["To'lov usuli", USUL[d.method] ?? d.method]);
  if (d.receivedBy)     r.push(["Qabul qildi", d.receivedBy]);
  return r;
}

export function davrRoyxati(d: ReceiptData): [string, string][] {
  const r: [string, string][] = (d.periods ?? []).map(
    (p) => [oyNomi(p.month), pul(p.amount)] as [string, string]);
  if ((d.advance ?? 0) > 0) r.push(["Oldindan to'lov", pul(d.advance!)]);
  if (r.length === 0) r.push(["Oldindan to'lov", pul(d.amount)]);
  return r;
}

function markaz(g: CanvasRenderingContext2D, t: string, x: number, y: number) {
  const w = g.measureText(t).width;
  g.fillText(t, x - w / 2, y);
}

function ong(g: CanvasRenderingContext2D, t: string, x: number, y: number) {
  g.fillText(t, x - g.measureText(t).width, y);
}

function qisqart(g: CanvasRenderingContext2D, t: string, max: number): string {
  if (g.measureText(t).width <= max) return t;
  let s = t;
  while (s.length > 4 && g.measureText(`${s}…`).width > max) s = s.slice(0, -1);
  return `${s}…`;
}

function punktir(g: CanvasRenderingContext2D, x1: number, y: number, x2: number) {
  g.strokeStyle = "#d8d8d8";
  g.lineWidth = 1;
  g.setLineDash([3, 3]);
  g.beginPath(); g.moveTo(x1, y); g.lineTo(x2, y); g.stroke();
  g.setLineDash([]);
}

function rasmYukla(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
}

/** Kanvasni PNG `Blob` ga aylantiradi. */
export function canvasBlob(c: HTMLCanvasElement): Promise<Blob> {
  return new Promise((res, rej) =>
    c.toBlob((b) => (b ? res(b) : rej(new Error("Rasm yasalmadi"))), "image/png"));
}

/**
 * PDF yasaydi. `jspdf` DINAMIK import qilinadi — u ~350 KB va faqat
 * tugma bosilganda yuklanadi, oddiy sahifa ochilishiga qo'shilmaydi.
 */
export async function receiptPdf(c: HTMLCanvasElement): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  // Sahifa AYNAN chek o'lchamida — A4 ning yarmi bo'sh qolib, chekni
  // varaq o'rtasida yo'qotmasin.
  const enMm = 80;
  const balMm = (c.height / c.width) * enMm;
  const doc = new jsPDF({ unit: "mm", format: [enMm, balMm], orientation: "portrait" });
  doc.addImage(c.toDataURL("image/png"), "PNG", 0, 0, enMm, balMm);
  return doc.output("blob");
}

/** Faylni foydalanuvchi kompyuteriga saqlash. */
export function saqla(blob: Blob, nom: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nom;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Darhol bo'shatsak, ba'zi brauzerlar faylni ulgurmay qoladi.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
