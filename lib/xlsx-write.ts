/**
 * `.xlsx` YOZISH — kutubxonasiz (o'qigich `lib/xlsx.ts` bilan bir naqsh).
 *
 * NEGA CSV EMAS (Mudarris, 2026-10-05). Eksport CSV edi: boshida UTF-8 BOM
 * va `sep=;` qatori. Excel `sep=` ko'rsatmasini ko'rganda BOM'ni e'tiborsiz
 * qoldiradi va faylni Windows kodlashida (kirill lokalida cp1251) o'qiydi —
 * lotincha matn to'g'ri, kirillcha ism va guruh nomlari "РђР‘Р”..." bo'lib
 * chiqardi. Telefonlar esa son deb olinib 9,98955E+11 ko'rinardi; faylni
 * Excel'da saqlab qayta yuklasa oxirgi raqamlar butunlay yo'qolardi.
 *
 * Haqiqiy `.xlsx` ikkalasini ham yo'q qiladi: matn har doim Unicode,
 * katak turi (matn, son, sana) faylning o'zida yozilgan, lokal ajratgichi
 * va kodlash umuman ahamiyatsiz. Google Sheets ham uni to'g'ridan-to'g'ri
 * ochadi.
 *
 * TUZILISHI XlsxWriter (Python) chiqaradigan fayl bilan solishtirib
 * yozilgan — Excel "faylni tiklaymi?" deb so'ramasligi uchun: umumiy
 * satrlar jadvali (Excel o'zi shunday yozadi), qalin sarlavha, muzlatilgan
 * birinchi qator, filtr tugmalari, ustun kengligi va ustun uslubi (matn
 * ustuniga keyin yozilgan telefon ham matn bo'lib qoladi). ZIP siqilmagan
 * ("store") — bir necha yuz qatorli ro'yxat uchun hajm muammo emas.
 */

export type XlsxCell = string | number | null | undefined;

export interface XlsxColumn {
  header: string;
  /** Excel kengligi (belgilarda). Berilmasa mazmunga qarab hisoblanadi. */
  width?: number;
  /**
   * `text`  — doim matn, "@" formatida (telefon: Excel uni songa
   *           aylantirmasin, foydalanuvchi tahrirlasa ham);
   * `money` — son, "1 250 000" ko'rinishida;
   * `date`  — "YYYY-MM-DD" satri Excel sanasiga aylanadi (dd.mm.yyyy);
   * berilmasa — qiymat turiga qarab (son yoki matn).
   */
  type?: "text" | "money" | "date";
}

const MAX_CELL = 32767;               // Excel katakdagi eng ko'p belgi
const MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Uslublar tartibi — `STYLES` dagi `cellXfs` bilan bir xil. */
const S_HEADER = 1, S_TEXT = 2, S_MONEY = 3, S_DATE = 4;

/** XML 1.0 da taqiqlangan belgilar (Excel bunday faylni "buzilgan" deydi). */
const XML_BAD = /[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g;

function esc(s: string): string {
  return s.replace(XML_BAD, "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * Matn turidagi qiymatlar (ST_Xstring) ichida `_x0041_` kabi bo'lak Excel
 * uchun BELGI KODI ("A"). Haqiqiy shunday matn `_x005F_` bilan himoyalanadi
 * (Excel va XlsxWriter ham shunday qiladi) — aks holda "fayl_x0041_nomi"
 * izohi Excel'da "faylAnomi" bo'lib ochilardi.
 */
function xstr(s: string): string {
  // Oldinga qarash (lookahead) bilan: "_x0041_x0042_" dagi IKKALA bo'lak
  // ham himoyalanadi — oddiy almashtirish birinchisining oxirgi "_" sini
  // yutib, ikkinchisini Excel'da "B" qilib qoldirardi.
  return esc(s.replace(/_(?=x[0-9A-Fa-f]{4}_)/g, "_x005F_"));
}

/** 0 → "A", 26 → "AA". */
function colName(i: number): string {
  let s = "";
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

/** Varaq nomi: 31 belgi, `[]:*?/\` taqiqlangan, apostrof bilan boshlanmaydi/tugamaydi. */
function sheetName(name: string): string {
  const s = name.replace(XML_BAD, "").replace(/[[\]:*?/\\]/g, " ").replace(/\s+/g, " ")
    .trim().slice(0, 31).replace(/^'+|'+$/g, "").trim();
  return s || "Varaq1";
}

/** "2026-09-15" → Excel sana raqami (1899-12-30 dan beri kunlar). */
function dateSerial(v: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = new Date(Date.UTC(y, mo - 1, d));
  // "2026-13-45" kabi mavjud bo'lmagan sana JS'da jimgina keyingi oyga
  // suriladi — bunday qiymat sana emas, matn bo'lib qolsin.
  if (t.getUTCFullYear() !== y || t.getUTCMonth() !== mo - 1 || t.getUTCDate() !== d) return null;
  const n = Math.round((t.getTime() - Date.UTC(1899, 11, 30)) / 86_400_000);
  return n > 60 ? n : null;           // 1900-03-01 dan oldin Excel kalendari boshqacha
}

/** Umumiy satrlar jadvali: har bir noyob matn bir marta yoziladi. */
class Strings {
  private index = new Map<string, number>();
  readonly list: string[] = [];
  count = 0;
  id(s: string): number {
    this.count++;
    let i = this.index.get(s);
    if (i === undefined) { i = this.list.length; this.index.set(s, i); this.list.push(s); }
    return i;
  }
  xml(): string {
    const items = this.list.map((s) => {
      const keep = /^\s|\s$|\n/.test(s) ? ` xml:space="preserve"` : "";
      return `<si><t${keep}>${xstr(s)}</t></si>`;
    }).join("");
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`
      + `<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${this.count}" uniqueCount="${this.list.length}">`
      + items + `</sst>`;
  }
}

function colStyle(col: XlsxColumn): number {
  return col.type === "text" ? S_TEXT : col.type === "money" ? S_MONEY : col.type === "date" ? S_DATE : 0;
}

function cellXml(ref: string, v: XlsxCell, col: XlsxColumn, sst: Strings): string {
  if (v === null || v === undefined || v === "") return "";
  const st = colStyle(col);
  const s = st ? ` s="${st}"` : "";

  if (col.type === "date" && typeof v === "string") {
    const n = dateSerial(v);
    if (n !== null) return `<c r="${ref}"${s}><v>${n}</v></c>`;
  }
  if (typeof v === "number" && col.type !== "text") {
    return Number.isFinite(v) ? `<c r="${ref}"${s}><v>${v}</v></c>` : "";
  }
  const text = String(v).replace(XML_BAD, "").slice(0, MAX_CELL);
  if (!text) return "";
  return `<c r="${ref}"${s} t="s"><v>${sst.id(text)}</v></c>`;
}

function widthOf(col: XlsxColumn, i: number, rows: XlsxCell[][]): number {
  if (col.width) return col.width;
  let w = col.header.length + 3;      // filtr tugmasiga joy
  for (const r of rows.slice(0, 500)) {
    const v = r[i];
    w = Math.max(w, col.type === "date" ? 10 : typeof v === "number" ? String(Math.round(v)).length * 1.3 : String(v ?? "").length);
  }
  return Math.min(60, Math.max(8, Math.ceil(w) + 2));
}

function sheetXml(columns: XlsxColumn[], rows: XlsxCell[][], sst: Strings, filterRef: string): string {
  const lastRow = rows.length + 1;
  const cols = columns.map((c, i) => {
    const st = colStyle(c);
    return `<col min="${i + 1}" max="${i + 1}" width="${widthOf(c, i, rows)}"${st ? ` style="${st}"` : ""} customWidth="1"/>`;
  }).join("");
  const head = `<row r="1">${columns.map((c, i) =>
    `<c r="${colName(i)}1" s="${S_HEADER}" t="s"><v>${sst.id(c.header)}</v></c>`).join("")}</row>`;
  const body = rows.map((r, ri) => {
    const n = ri + 2;
    return `<row r="${n}">${columns.map((c, ci) => cellXml(`${colName(ci)}${n}`, r[ci], c, sst)).join("")}</row>`;
  }).join("");
  // Matn ustunidagi "+998..." ni Excel "son matn sifatida saqlangan" deb
  // har katakda yashil uchburchak bilan belgilaydi — ataylab shunday.
  const textCols = columns.map((c, i) => (c.type === "text" ? `${colName(i)}2:${colName(i)}${Math.max(lastRow, 2)}` : ""))
    .filter(Boolean).join(" ");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`
    + `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" `
    + `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">`
    + `<dimension ref="A1:${filterRef.split(":")[1]}"/>`
    + `<sheetViews><sheetView tabSelected="1" workbookViewId="0">`
    + `<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>`
    + `<selection pane="bottomLeft"/>`
    + `</sheetView></sheetViews>`
    + `<sheetFormatPr defaultRowHeight="15"/>`
    + `<cols>${cols}</cols>`
    + `<sheetData>${head}${body}</sheetData>`
    + `<autoFilter ref="${filterRef}"/>`
    + `<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>`
    + (textCols ? `<ignoredErrors><ignoredError sqref="${textCols}" numberStoredAsText="1"/></ignoredErrors>` : "")
    + `</worksheet>`;
}

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`
  + `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">`
  + `<numFmts count="1"><numFmt numFmtId="164" formatCode="dd.mm.yyyy"/></numFmts>`
  + `<fonts count="2"><font><sz val="11"/><name val="Calibri"/><family val="2"/></font>`
  + `<font><b/><sz val="11"/><name val="Calibri"/><family val="2"/></font></fonts>`
  + `<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>`
  + `<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>`
  + `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>`
  + `<cellXfs count="5">`
  + `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>`
  + `<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>`
  + `<xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>`
  + `<xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>`
  + `<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>`
  + `</cellXfs>`
  + `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>`
  + `<dxfs count="0"/>`
  + `</styleSheet>`;

function workbookXml(name: string, filterRef: string): string {
  // Filtr diapazoni formulada: varaq nomi apostrofga olinadi, ichidagi
  // apostrof ikkilanadi — "O'quvchilar" → 'O''quvchilar'!$A$1:$K$9.
  const abs = filterRef.split(":").map((r) => r.replace(/^([A-Z]+)(\d+)$/, "$$$1$$$2")).join(":");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`
    + `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" `
    + `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">`
    + `<bookViews><workbookView/></bookViews>`
    + `<sheets><sheet name="${xstr(name)}" sheetId="1" r:id="rId1"/></sheets>`
    + `<definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">`
    + xstr(`'${name.replace(/'/g, "''")}'!${abs}`)
    + `</definedName></definedNames>`
    + `</workbook>`;
}

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`
  + `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">`
  + `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>`
  + `<Default Extension="xml" ContentType="application/xml"/>`
  + `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>`
  + `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
  + `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>`
  + `<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>`
  + `</Types>`;

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`
  + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`
  + `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>`
  + `</Relationships>`;

const WORKBOOK_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`
  + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`
  + `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>`
  + `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`
  + `<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>`
  + `</Relationships>`;

// ─── ZIP ("store", siqilmagan) ─────────────────────────────────────────

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function zipStore(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const enc = new TextEncoder();
  // DOS sana/vaqti: 1980-01-01 00:00 (XlsxWriter ham shunday — arxiv ichidagi
  // yozuvlar sanasi Excel uchun ahamiyatsiz).
  const dosTime = 0, dosDate = (1 << 5) | 1;
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;

  for (const f of files) {
    const name = enc.encode(f.name);
    const crc = crc32(f.data);
    const local = new Uint8Array(30 + name.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);            // kerakli versiya (2.0)
    lv.setUint16(6, 0, true);             // bayroqlar
    lv.setUint16(8, 0, true);             // store
    lv.setUint16(10, dosTime, true);
    lv.setUint16(12, dosDate, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, f.data.length, true);
    lv.setUint32(22, f.data.length, true);
    lv.setUint16(26, name.length, true);
    lv.setUint16(28, 0, true);
    local.set(name, 30);
    locals.push(local, f.data);

    const cen = new Uint8Array(46 + name.length);
    const cv = new DataView(cen.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);            // yaratgan versiya
    cv.setUint16(6, 20, true);            // kerakli versiya
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, dosTime, true);
    cv.setUint16(14, dosDate, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, f.data.length, true);
    cv.setUint32(24, f.data.length, true);
    cv.setUint16(28, name.length, true);
    cv.setUint16(30, 0, true);            // extra
    cv.setUint16(32, 0, true);            // izoh
    cv.setUint16(34, 0, true);            // disk
    cv.setUint16(36, 0, true);            // ichki atributlar
    cv.setUint32(38, 0, true);            // tashqi atributlar
    cv.setUint32(42, offset, true);
    cen.set(name, 46);
    centrals.push(cen);

    offset += local.length + f.data.length;
  }

  const cdSize = centrals.reduce((s, c) => s + c.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, cdSize, true);
  ev.setUint32(16, offset, true);

  const parts = [...locals, ...centrals, end];
  const out = new Uint8Array(parts.reduce((s, p) => s + p.length, 0));
  let p = 0;
  for (const part of parts) { out.set(part, p); p += part.length; }
  return out;
}

/** `.xlsx` baytlari — sinov uchun ham ochiq. */
export function buildXlsxBytes(sheet: string, columns: XlsxColumn[], rows: XlsxCell[][]): Uint8Array {
  if (columns.length === 0) throw new Error("Ustun yo'q");
  const name = sheetName(sheet);
  const filterRef = `A1:${colName(columns.length - 1)}${rows.length + 1}`;
  const sst = new Strings();
  // Varaq AVVAL quriladi — umumiy satrlar jadvali shu jarayonda to'ladi.
  const sheetPart = sheetXml(columns, rows, sst, filterRef);
  const enc = new TextEncoder();
  return zipStore([
    { name: "[Content_Types].xml",        data: enc.encode(CONTENT_TYPES) },
    { name: "_rels/.rels",                data: enc.encode(ROOT_RELS) },
    { name: "xl/workbook.xml",            data: enc.encode(workbookXml(name, filterRef)) },
    { name: "xl/_rels/workbook.xml.rels", data: enc.encode(WORKBOOK_RELS) },
    { name: "xl/styles.xml",              data: enc.encode(STYLES) },
    { name: "xl/sharedStrings.xml",       data: enc.encode(sst.xml()) },
    { name: "xl/worksheets/sheet1.xml",   data: enc.encode(sheetPart) },
  ]);
}

/** Brauzerda yuklab olinadigan `.xlsx` Blob. */
export function buildXlsx(sheet: string, columns: XlsxColumn[], rows: XlsxCell[][]): Blob {
  const bytes = buildXlsxBytes(sheet, columns, rows);
  return new Blob([bytes as BlobPart], { type: MIME });
}
