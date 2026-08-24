/**
 * CSV O'QISH/YOZISH — o'quvchilarni Excel va Google Sheets bilan almashish uchun.
 *
 * Nima uchun brauzerda, serverda emas:
 *  • yuklab olish `/api/*` proksisi orqali o'tadi, u esa faqat `content-type`
 *    ni uzatadi — `content-disposition` (fayl nomi) yo'qoladi va brauzer
 *    faylni sahifada ochib yuboradi;
 *  • ro'yxat allaqachon ekranda — qayta so'rov shart emas, foydalanuvchi
 *    ko'rib turgan filtrlangan holat aynan shundayligicha eksport bo'ladi.
 *
 * Ajratgich `;` — O'zbekistonda ishlatiladigan Excel lokalida `,` ustun
 * ajratgich sifatida qabul qilinmaydi va butun qator bitta katakka tushadi.
 * Boshiga UTF-8 BOM qo'yiladi, aks holda Excel "Alisher" ni "Ð�lisher" qiladi.
 */

const SEP = ";";
const BOM = "﻿";

/** Bitta katakni qalqonlaydi: qo'shtirnoq, ajratgich va yangi qatorni. */
function cell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  // CSV injection: `=` yoki `@` bilan boshlangan matnni Excel formula deb
  // bajarishga urinadi. Apostrof uni matnga aylantiradi.
  //
  // `+` va `-` ATAYLAB bu ro'yxatda yo'q: telefon raqamlari aynan shunday
  // boshlanadi va har bir raqam oldida `'` chiqib, jadval o'qib bo'lmas
  // holga kelardi. Telefonlar eksportda `+` siz, faqat raqam bilan
  // yoziladi (`exportPhone`) — shuning uchun bu yerga umuman tushmaydi.
  const safe = /^[=@]/.test(s) ? `'${s}` : s;
  return /["\n\r;]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/**
 * Telefonni eksport uchun tayyorlaydi: `+998901234567` → `998901234567`.
 *
 * Excel `+` bilan boshlangan katakni formula deb hisoblaydi va `+` ni yeb
 * yuboradi (`+998...` → `998...`), ya'ni ustun baribir buziladi. Uni oldindan
 * olib tashlaymiz — import `normalizePhone` orqali qaytarib qo'yadi.
 */
export function exportPhone(v: unknown): string {
  return String(v ?? "").replace(/\D/g, "");
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  return BOM + [headers, ...rows].map((r) => r.map(cell).join(SEP)).join("\r\n");
}

/** Matnni brauzerda fayl sifatida yuklab beradi. */
export function downloadFile(filename: string, content: string, mime = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Brauzerga yuklashni boshlashga ulgurish uchun bir oz kechiktiramiz.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * CSV yoki jadvaldan ko'chirilgan matnni qatorlarga ajratadi.
 *
 * Google Sheets/Excel'dan Ctrl+C qilinganda TAB bilan ajratilgan matn
 * keladi, faylda esa `;` yoki `,`. Uchalasi ham qo'llab-quvvatlanadi —
 * foydalanuvchi qaysi yo'l bilan kelganini o'ylab o'tirmasin.
 */
export function parseDelimited(text: string): string[][] {
  const src = text.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  if (!src.trim()) return [];

  const firstLine = src.split("\n")[0];
  const sep =
    firstLine.includes("\t") ? "\t"
    : firstLine.includes(";") ? ";"
    : ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];

    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else quoted = false;
      } else field += ch;
      continue;
    }

    if (ch === '"' && field === "") { quoted = true; continue; }
    if (ch === sep)  { row.push(field); field = ""; continue; }
    if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; continue; }
    field += ch;
  }
  row.push(field);
  rows.push(row);

  // Butunlay bo'sh qatorlarni tashlab yuboramiz (fayl oxiridagi yangi qator).
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/** Ustun sarlavhasini ichki maydon nomiga moslashtirish uchun kalit. */
function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/['`’]/g, "").replace(/[\s_-]+/g, "");
}

/**
 * Sarlavha qatoridagi nomlarni ichki maydonlarga bog'laydi.
 * Uzbekcha, ruscha va inglizcha variantlar qabul qilinadi — markazlarning
 * tayyor jadvallari har xil nomlangan bo'ladi.
 */
const HEADER_ALIASES: Record<string, string[]> = {
  name:        ["ism", "ismi", "ismfamiliya", "fio", "oquvchi", "name", "fullname", "имя", "фио"],
  phone:       ["telefon", "telefonraqam", "raqam", "tel", "phone", "телефон"],
  parentPhone: ["otaona", "otaonatelefoni", "otaonatel", "otatelefoni", "ota", "parentphone", "родитель"],
  parentName:  ["otaonaismi", "otaismi", "parentname", "родительимя"],
  school:      ["maktab", "school", "школа"],
  source:      ["manba", "source", "источник"],
  gender:      ["jins", "jinsi", "gender", "пол"],
  groupName:   ["guruh", "guruhi", "guruhnomi", "group", "groupname", "группа"],
};

export interface MappedRow {
  name: string;
  phone: string;
  parentPhone?: string;
  parentName?: string;
  school?: string;
  source?: string;
  gender?: "MALE" | "FEMALE";
  groupName?: string;
}

export interface MapResult {
  rows: MappedRow[];
  /** Tanilgan ustunlar — foydalanuvchiga "nima o'qildi" ni ko'rsatish uchun. */
  matched: string[];
  /** Sarlavha qatori topilmadi — birinchi qator ham ma'lumot deb olindi. */
  headerless: boolean;
}

/**
 * Ajratilgan qatorlarni import so'rovi uchun obyektlarga aylantiradi.
 *
 * Sarlavha topilmasa (odam shunchaki "Ism | Telefon" ustunlarini nusxalagan
 * bo'lsa) birinchi ikkita ustun ism va telefon deb qabul qilinadi — bu eng
 * ko'p uchraydigan holat va foydalanuvchini "avval sarlavha qo'shing" deb
 * qaytarib yuborish keraksiz to'siq bo'lardi.
 */
export function mapRows(table: string[][]): MapResult {
  if (table.length === 0) return { rows: [], matched: [], headerless: false };

  const header = table[0].map(normalizeHeader);
  const colOf: Record<string, number> = {};
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    const idx = header.findIndex((h) => aliases.includes(h));
    if (idx >= 0) colOf[field] = idx;
  }

  const hasHeader = colOf.name !== undefined || colOf.phone !== undefined;
  const body = hasHeader ? table.slice(1) : table;
  const pick = (r: string[], field: string, fallback?: number) => {
    const i = colOf[field] ?? fallback;
    return i === undefined ? "" : (r[i] ?? "").trim();
  };

  const rows: MappedRow[] = body
    .map((r) => {
      const gender = pick(r, "gender").toLowerCase();
      const row: MappedRow = {
        name:  pick(r, "name", hasHeader ? undefined : 0),
        phone: pick(r, "phone", hasHeader ? undefined : 1),
      };
      const parentPhone = pick(r, "parentPhone", hasHeader ? undefined : 2);
      if (parentPhone) row.parentPhone = parentPhone;
      const parentName = pick(r, "parentName");
      if (parentName) row.parentName = parentName;
      const school = pick(r, "school");
      if (school) row.school = school;
      const source = pick(r, "source");
      if (source) row.source = source;
      const groupName = pick(r, "groupName");
      if (groupName) row.groupName = groupName;
      if (/^(erkak|male|m|о?м|муж)/.test(gender)) row.gender = "MALE";
      else if (/^(ayol|female|f|ж|жен)/.test(gender)) row.gender = "FEMALE";
      return row;
    })
    .filter((r) => r.name || r.phone);

  return {
    rows,
    matched: Object.keys(colOf),
    headerless: !hasHeader,
  };
}
