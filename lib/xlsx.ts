/**
 * `.xlsx` FAYLNI O'QISH — kutubxonasiz.
 *
 * Ilgari import oynasi faylni `await f.text()` bilan o'qirdi. `.xlsx` esa
 * ZIP arxiv: uni matn sifatida o'qish xato ham bermaydi, shunchaki
 * ma'nosiz belgilar qaytaradi va natija bo'sh chiqadi. Foydalanuvchi
 * "hech narsa topilmadi" degan xabarni ko'rib, faylni aybdor deb
 * o'ylardi.
 *
 * NEGA KUTUBXONA EMAS. Bizga faqat O'QISH kerak: bitta varaq, matn va
 * son. Bu ish brauzerning o'z `DecompressionStream` i bilan bajariladi va
 * u barcha zamonaviy brauzerlarda bor. Excel yozish, formulalar, uslublar
 * kerak emas — kutubxona esa o'sha hammasini olib keladi.
 *
 * QAMROV: siqilgan (deflate) va siqilmagan (store) yozuvlar, umumiy
 * satrlar jadvali (`sharedStrings`), inline satrlar. Parol bilan
 * himoyalangan yoki `.xls` (eski binar format) qo'llab-quvvatlanmaydi —
 * ular uchun aniq xato beriladi.
 */

import { decodeText, repairTable } from "./csv";

/** ZIP ichidagi bitta fayl. */
interface ZipEntry {
  name: string;
  /** 0 = siqilmagan, 8 = deflate. */
  method: number;
  /** Ma'lumot boshlanadigan joy (lokal sarlavhadan keyin). */
  offset: number;
  compressedSize: number;
}

/** ZIP markaziy katalogini o'qiydi. */
function readCentralDirectory(buf: Uint8Array): ZipEntry[] {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);

  // "End of central directory" imzosi — oxiridan qidiriladi, chunki
  // undan keyin izoh bo'lishi mumkin.
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 65558; i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("Bu ZIP arxiv emas");

  const count = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true);

  const out: ZipEntry[] = [];
  for (let i = 0; i < count; i++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const method   = dv.getUint16(p + 10, true);
    const compSize = dv.getUint32(p + 20, true);
    const nameLen  = dv.getUint16(p + 28, true);
    const extraLen = dv.getUint16(p + 30, true);
    const cmtLen   = dv.getUint16(p + 32, true);
    const local    = dv.getUint32(p + 42, true);
    const name = new TextDecoder().decode(buf.subarray(p + 46, p + 46 + nameLen));

    out.push({ name, method, offset: local, compressedSize: compSize });
    p += 46 + nameLen + extraLen + cmtLen;
  }
  return out;
}

/** Bitta yozuvni ochadi. */
async function inflate(buf: Uint8Array, e: ZipEntry): Promise<string> {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  // Lokal sarlavha: nom va qo'shimcha maydonlar uzunligi shu yerda —
  // markaziy katalogdagilardan FARQ qilishi mumkin, shuning uchun
  // aynan shu yerdan o'qiladi.
  const nameLen  = dv.getUint16(e.offset + 26, true);
  const extraLen = dv.getUint16(e.offset + 28, true);
  const start = e.offset + 30 + nameLen + extraLen;
  const data = buf.subarray(start, start + e.compressedSize);

  if (e.method === 0) return new TextDecoder().decode(data);
  if (e.method !== 8) throw new Error(`Qo'llab-quvvatlanmaydigan siqish usuli (${e.method})`);

  // ESKI BRAUZER. `DecompressionStream` Safari'da 16.4 dan (2023-mart)
  // bor. Tekshirmasak, "DecompressionStream is not defined" degan
  // xato chiqib, foydalanuvchi aybni FAYLDA deb o'ylardi — va uni
  // qayta-qayta saqlab ko'raverardi.
  if (typeof DecompressionStream === "undefined") {
    throw new Error(
      "Brauzeringiz eski — .xlsx ni o'qiy olmaydi. " +
      "Brauzerni yangilang yoki faylni CSV qilib saqlab yuklang.",
    );
  }

  // `deflate-raw` — ZIP ichidagi ma'lumot aynan shu ko'rinishda,
  // zlib sarlavhasisiz.
  const stream = new Blob([data as BlobPart]).stream()
    .pipeThrough(new DecompressionStream("deflate-raw"));
  return new Response(stream).text();
}

/** XML dan barcha `<t>` matnlarini tartib bilan oladi. */
function sharedStrings(xml: string): string[] {
  const out: string[] = [];
  // Har bir `<si>` — bitta satr; uning ichida bir necha `<t>` bo'lishi
  // mumkin (formatlangan matn bo'laklari) va ular BIRLASHTIRILADI.
  for (const si of xml.match(/<si>[\s\S]*?<\/si>/g) ?? []) {
    // `<rPh>` — yapon o'qilishi uchun qo'shimcha matn. Uni tashlamasak,
    // asosiy matnga yopishib ketardi.
    const clean = si.replace(/<rPh[\s\S]*?<\/rPh>/g, "");
    const parts = [...clean.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((m) => m[1]);
    out.push(xstring(unescapeXml(parts.join(""))));
  }
  return out;
}

/**
 * `_x000D_` → CR, `_x005F_` → "_": Excel matnga (ST_Xstring) XML'ga
 * sig'maydigan belgilarni shunday yozadi, haqiqiy "_x0041_" matnini esa
 * `_x005F_x0041_` qilib himoyalaydi. Faqat MATN kataklarga qo'llanadi.
 */
function xstring(v: string): string {
  return v.replace(/_x([0-9A-Fa-f]{4})_/g, (_, h: string) => String.fromCharCode(parseInt(h, 16)));
}

function unescapeXml(v: string): string {
  return v
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, "&");   // OXIRIDA — aks holda `&amp;lt;` buziladi
}

/**
 * SANA KATAKLARI. Excel sanani SON qilib saqlaydi (46280 = 2026-09-15),
 * sana ekanini esa faqat katak uslubi aytadi. Uslubga qaramasak, sana
 * ustuni "46280" bo'lib kelardi va lid importi uni BALL deb lid
 * kartochkasiga yozardi (target lidlar eksportidagi "Sana" ustuni).
 *
 * @returns har bir `cellXfs` indeksi uchun "sana formatimi".
 */
function sanaUslublari(stylesXml: string): boolean[] {
  const maxsus = new Map<number, string>();
  for (const m of stylesXml.matchAll(/<numFmt\b[^>]*?numFmtId="(\d+)"[^>]*?formatCode="([^"]*)"/g)) {
    maxsus.set(Number(m[1]), unescapeXml(m[2]));
  }
  const xfs = /<cellXfs\b[^>]*>([\s\S]*?)<\/cellXfs>/.exec(stylesXml)?.[1] ?? "";
  return [...xfs.matchAll(/<xf\b([^>]*)/g)].map((m) => {
    const id = Number(/numFmtId="(\d+)"/.exec(m[1])?.[1] ?? 0);
    // O'rnatilgan sana formatlari: 14 (sana), 15-17 (kun-oy-yil qisqartmalari),
    // 22 (sana va vaqt). Faqat vaqt (18-21, 45-47) — sana emas.
    if ([14, 15, 16, 17, 22].includes(id)) return true;
    const kod = maxsus.get(id);
    if (!kod) return false;
    // Qo'shtirnoqdagi matn, `\x` va [Red]/[$-409] kabi bo'laklar olib
    // tashlanadi; qolganida kun yoki yil bo'lsa — sana.
    const toza = kod.replace(/"[^"]*"/g, "").replace(/\\./g, "").replace(/\[[^\]]*\]/g, "").toLowerCase();
    return /[dy]/.test(toza);
  });
}

/** Excel sana raqami → "dd.mm.yyyy" (ilovadagi ko'rinish bilan bir xil). */
function sanaMatni(seriya: number, y1904: boolean): string {
  const kun = Math.floor(seriya);
  const t = Date.UTC(y1904 ? 1904 : 1899, y1904 ? 0 : 11, y1904 ? 1 : 30) + kun * 86_400_000;
  const d = new Date(t);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getUTCDate())}.${p(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}`;
}

/** "C7" → 2 (nol asosli ustun raqami). */
function colIndex(ref: string): number {
  const letters = ref.match(/^[A-Z]+/)?.[0] ?? "A";
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

/**
 * `.xlsx` faylning BIRINCHI varag'ini qatorlar jadvaliga aylantiradi.
 *
 * Bo'sh kataklar bo'sh satr bo'lib qoladi — ustunlar joyidan
 * siljib ketmasin.
 */
export async function parseXlsx(file: File | Blob): Promise<string[][]> {
  return parseXlsxBytes(new Uint8Array(await file.arrayBuffer()));
}

/** Eski `.xls` (OLE) imzosi — butunlay boshqa format, ZIP emas. */
const isOle = (b: Uint8Array) => b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0;
const isZip = (b: Uint8Array) => b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04;
const XLS_XATO = "Eski .xls formati qo'llab-quvvatlanmaydi — Excel'da \"Saqlash\" → \"Excel kitobi (.xlsx)\" qilib qayta saqlang";

async function parseXlsxBytes(buf: Uint8Array): Promise<string[][]> {
  if (isOle(buf)) throw new Error(XLS_XATO);
  if (!isZip(buf)) throw new Error("Bu .xlsx fayl emas");

  const entries = readCentralDirectory(buf);
  const byName = new Map(entries.map((e) => [e.name, e]));

  // Varaqlar `sheet1.xml` deb atalmasligi mumkin — birinchisini topamiz.
  const sheetEntry =
    byName.get("xl/worksheets/sheet1.xml") ??
    entries.filter((e) => /^xl\/worksheets\/.*\.xml$/.test(e.name))
           .sort((a, b) => a.name.localeCompare(b.name))[0];
  if (!sheetEntry) throw new Error("Faylda varaq topilmadi");

  const strEntry = byName.get("xl/sharedStrings.xml");
  const styEntry = byName.get("xl/styles.xml");
  const wbEntry  = byName.get("xl/workbook.xml");
  const [sheetXml, strXml, styXml, wbXml] = await Promise.all([
    inflate(buf, sheetEntry),
    strEntry ? inflate(buf, strEntry) : Promise.resolve(""),
    styEntry ? inflate(buf, styEntry) : Promise.resolve(""),
    wbEntry  ? inflate(buf, wbEntry)  : Promise.resolve(""),
  ]);
  const strings = strXml ? sharedStrings(strXml) : [];
  const sanaXf = styXml ? sanaUslublari(styXml) : [];
  const y1904 = /<workbookPr\b[^>]*\bdate1904="(1|true)"/.test(wbXml);

  const rows: string[][] = [];
  for (const rowXml of sheetXml.match(/<row[^>]*>[\s\S]*?<\/row>/g) ?? []) {
    const cells: string[] = [];
    // O'ZI YOPILADIGAN KATAK. Haqiqiy Excel bo'sh, lekin uslubi bor
    // katakni `<c r="D3" s="2"/>` deb yozadi. Oddiy `<c ...>...</c>`
    // qolipi bunday katakda to'xtamay, KEYINGI katakni ham yutib
    // yuborardi: "9-A" o'rniga umumiy satrlar jadvalining "9" indeksi
    // yozilib, yonidagi ustun butunlay yo'qolardi. Sinov fayllarim
    // bunday katak yozmagani uchun bu xato faqat haqiqiy Excel
    // faylida ko'rinardi.
    for (const m of rowXml.matchAll(/<c([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = m[1], body = m[2] ?? "";
      const ref  = attrs.match(/r="([A-Z]+\d+)"/)?.[1];
      const type = attrs.match(/t="([^"]+)"/)?.[1];
      const idx  = ref ? colIndex(ref) : cells.length;
      while (cells.length < idx) cells.push("");

      let value = "";
      if (type === "inlineStr") {
        value = xstring(unescapeXml([...body.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)]
          .map((x) => x[1]).join("")));
      } else {
        const raw = body.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? "";
        // `t="s"` — umumiy satrlar jadvalidagi indeks, matnning o'zi emas.
        value = type === "s" ? (strings[Number(raw)] ?? "") : unescapeXml(raw);
        if ((!type || type === "n") && raw !== "") {
          const son = Number(raw);
          const uslub = Number(attrs.match(/\bs="(\d+)"/)?.[1] ?? 0);
          if (sanaXf[uslub] && Number.isFinite(son) && son >= 1 && son < 2958466) {
            value = sanaMatni(son, y1904);
          } else if (/e/i.test(raw) && Number.isSafeInteger(son)) {
            // ANIQ SON ilmiy yozuvda: Java/POI kabi yozuvchilar 998901234560
            // ni "9.9890123456E11" deb saqlaydi. `.xlsx` dagi son katak
            // doim aniq — uni raqamga aylantiramiz, aks holda telefon
            // "Excel buzgan" deb rad etilardi.
            value = String(son);
          }
        }
      }
      // FAQAT oddiy bo'shliqlar kesiladi. JS `trim()` bo'linmas bo'shliqni
      // (NBSP) ham kesadi, eski eksportdagi buzilgan "Р" esa aynan "Р"+NBSP:
      // САРВАР, АНВАР kabi ismlar tiklanmay qolardi.
      cells[idx] = value.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g, "");
    }
    // Butunlay bo'sh qator o'tkazib yuboriladi.
    if (cells.some((c) => c !== "")) rows.push(cells);
  }
  return rows;
}

/**
 * Faylni jadvalga aylantiradi: `.xlsx` yoki matn (CSV, TSV).
 *
 * Tur KENGAYTMAGA emas, faylning ICHIGA qarab aniqlanadi: Excel'dan
 * "oquvchilar.csv" deb saqlangan, aslida esa `.xlsx` (yoki eski `.xls`)
 * bo'lgan fayllar uchraydi. Matn esa `decodeText` bilan o'qiladi — ilgari
 * doim UTF-8 deb olinardi va Excel kirill lokalida (cp1251) saqlagan
 * CSV'dagi ismlar "�����" bo'lib qolardi.
 *
 * Har ikki yo'lda jadval `repairTable` dan o'tadi: eski CSV eksportni
 * Excel'da ochib saqlagan fayllarda "РђР‘..." ko'rinishidagi buzilgan
 * kirill matn bor (`lib/xlsx-write.ts` dagi izohga qarang).
 */
export async function readTable(
  file: File,
  parseText: (t: string) => string[][],
): Promise<string[][]> {
  const buf = new Uint8Array(await file.arrayBuffer());
  if (isOle(buf)) throw new Error(XLS_XATO);
  if (isZip(buf)) return repairTable(await parseXlsxBytes(buf));
  if (/\.xlsx$/i.test(file.name)) throw new Error("Fayl buzilgan yoki .xlsx emas — Excel'da ochib qayta saqlang");
  const text = decodeText(buf);
  // Boshqa tizimlar ".xls" deb ko'pincha HTML yoki XML jadval beradi —
  // uni CSV deb o'qisak teglar "ism" bo'lib chiqardi.
  if (/^\s*</.test(text)) {
    throw new Error("Bu fayl HTML/XML jadval — Excel'da ochib, \"Excel kitobi (.xlsx)\" qilib saqlang");
  }
  return parseText(text);
}
