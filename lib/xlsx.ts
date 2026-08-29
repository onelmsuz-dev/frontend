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
    out.push(unescapeXml(parts.join("")));
  }
  return out;
}

function unescapeXml(v: string): string {
  return v
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, "&");   // OXIRIDA — aks holda `&amp;lt;` buziladi
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
  const buf = new Uint8Array(await file.arrayBuffer());

  // Eski `.xls` — butunlay boshqa format, ZIP emas.
  if (buf[0] === 0xd0 && buf[1] === 0xcf) {
    throw new Error("Eski .xls formati qo'llab-quvvatlanmaydi — faylni .xlsx yoki .csv qilib saqlang");
  }
  if (!(buf[0] === 0x50 && buf[1] === 0x4b)) {
    throw new Error("Bu .xlsx fayl emas");
  }

  const entries = readCentralDirectory(buf);
  const byName = new Map(entries.map((e) => [e.name, e]));

  // Varaqlar `sheet1.xml` deb atalmasligi mumkin — birinchisini topamiz.
  const sheetEntry =
    byName.get("xl/worksheets/sheet1.xml") ??
    entries.filter((e) => /^xl\/worksheets\/.*\.xml$/.test(e.name))
           .sort((a, b) => a.name.localeCompare(b.name))[0];
  if (!sheetEntry) throw new Error("Faylda varaq topilmadi");

  const strEntry = byName.get("xl/sharedStrings.xml");
  const [sheetXml, strXml] = await Promise.all([
    inflate(buf, sheetEntry),
    strEntry ? inflate(buf, strEntry) : Promise.resolve(""),
  ]);
  const strings = strXml ? sharedStrings(strXml) : [];

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
        value = unescapeXml([...body.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)]
          .map((x) => x[1]).join(""));
      } else {
        const raw = body.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? "";
        // `t="s"` — umumiy satrlar jadvalidagi indeks, matnning o'zi emas.
        value = type === "s" ? (strings[Number(raw)] ?? "") : unescapeXml(raw);
      }
      cells[idx] = value.trim();
    }
    // Butunlay bo'sh qator o'tkazib yuboriladi.
    if (cells.some((c) => c !== "")) rows.push(cells);
  }
  return rows;
}

/** Fayl kengaytmasiga qarab `.xlsx` yoki matnli formatni o'qiydi. */
export async function readTable(
  file: File,
  parseText: (t: string) => string[][],
): Promise<string[][]> {
  const isXlsx = /\.xlsx$/i.test(file.name)
    || file.type.includes("spreadsheetml");
  if (isXlsx) return parseXlsx(file);
  return parseText(await file.text());
}
