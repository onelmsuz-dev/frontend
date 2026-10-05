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
 * YUKLAB OLISH endi `.xlsx` (`lib/xlsx-write.ts`): CSV kirill matnini va
 * telefonlarni Excel'da buzardi (2026-10-05, Mudarris). Bu yerdagi `toCsv`
 * faqat import oynasidagi matn maydoni uchun — o'qilgan jadvalni odam
 * ko'rib tuzatishi mumkin bo'lsin.
 *
 * O'QISH Excel qanday saqlamasin ishlaydi: UTF-8 (BOM bilan/siz),
 * Windows kirill (cp1251), "Unicode matn" (UTF-16) — `decodeText`; ilgari
 * buzilib saqlangan "РђР‘..." matn esa asliga qaytariladi — `repairTable`.
 */

const SEP = ";";

/**
 * Bitta katakni qalqonlaydi: qo'shtirnoq, ajratgich va yangi qatorni.
 *
 * `=`/`@` oldiga apostrof QO'YILMAYDI: bu matn endi Excel'ga bormaydi (faqat
 * import oynasidagi maydonga), apostrof esa tahrirdan keyin qiymatga
 * yopishib qolardi — "@vali_tg" telegram manzili "'@vali_tg" bo'lib saqlanardi.
 */
function cell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /["\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Jadvalni `;` bilan ajratilgan matnga aylantiradi — import oynasining matn
 * maydoni uchun (fayl sifatida yuklab berilmaydi).
 *
 * ILGARI boshida BOM va `sep=;` qatori bor edi va u Excel'ga yuklab
 * berilardi. Excel `sep=` ni ko'rganda BOM'ni e'tiborsiz qoldiradi va
 * faylni cp1251 deb o'qiydi — kirill matn "РђР‘..." bo'lib chiqardi.
 */
export function toCsv(headers: string[], rows: unknown[][]): string {
  return [headers, ...rows].map((r) => r.map(cell).join(SEP)).join("\r\n") + "\r\n";
}

/** Matn yoki Blob'ni brauzerda fayl sifatida yuklab beradi. */
export function downloadFile(filename: string, content: string | Blob, mime = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(typeof content === "string" ? new Blob([content], { type: mime }) : content);
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
  let src = text.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  if (!src.trim()) return [];

  // Excel uchun qo'yilgan `sep=;` ko'rsatmasi ma'lumot emas — tashlab yuboramiz
  // (o'zimiz yuklab bergan namunani qaytarib yuklash ishlashi uchun).
  const sepDirective = /^sep=(.)\n/i.exec(src);
  if (sepDirective) src = src.slice(sepDirective[0].length);
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
  return repairTable(rows.filter((r) => r.some((c) => c.trim() !== "")));
}

// ─── KODLASH ───────────────────────────────────────────────────────────

/**
 * Fayl baytlarini matnga — Excel qaysi kodlashda saqlamasin.
 *
 *  • BOM bo'lsa — UTF-8 yoki UTF-16 (Excel "Unicode matn" UTF-16LE yozadi);
 *  • baytlar to'g'ri UTF-8 bo'lsa — UTF-8;
 *  • aks holda Windows kirill (cp1251) — kirill lokalidagi Excel "CSV
 *    (ajratgich — vergul)" ni aynan shunday saqlaydi. Ilgari fayl doim
 *    UTF-8 deb o'qilardi va bunday fayldagi ismlar "�����" bo'lib qolardi.
 */
export function decodeText(bytes: Uint8Array): string {
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return new TextDecoder("utf-8").decode(bytes.subarray(3));
  }
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder("utf-16le").decode(bytes.subarray(2));
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder("utf-16be").decode(bytes.subarray(2));
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder("windows-1251").decode(bytes);
  }
}

/**
 * Excel buzilgan faylni qaysi kodlashda o'qigan bo'lishi mumkin — kompyuter
 * tiliga qarab: rus/o'zbek kirill (1251, "РђР‘"), ingliz (1252, "ÐÐ‘"),
 * o'zbek lotin (1254, "ĞĞ‘"). Tartib — O'zbekistonda uchrash tartibi.
 */
const KODLAR = ["windows-1251", "windows-1252", "windows-1254"];

/** Kodlash belgisi → bayt (0x80–0xFF), brauzerning o'z dekoderidan quriladi. */
const jadvallar = new Map<string, Map<string, number> | null>();
function teskariJadval(kod: string): Map<string, number> | null {
  if (!jadvallar.has(kod)) {
    let m: Map<string, number> | null = null;
    try {
      const dec = new TextDecoder(kod);
      m = new Map();
      for (let b = 0x80; b <= 0xff; b++) {
        const ch = dec.decode(new Uint8Array([b]));
        if (ch.length === 1 && ch !== "\uFFFD" && !m.has(ch)) m.set(ch, b);
      }
    } catch { /* brauzer bu kodlashni bilmaydi — o'tkazib yuboriladi */ }
    jadvallar.set(kod, m);
  }
  return jadvallar.get(kod) ?? null;
}

const UTF8 = new TextDecoder("utf-8");
let bufer = new Uint8Array(256);

/**
 * Bitta katak: UTF-8 baytlari `map` kodlashida o'qilib qolgan bo'lsa
 * ("РђР‘..."), asl matnni qaytaradi, aks holda `null`.
 *
 * Shart: matnni o'sha kodlash baytlariga TO'LIQ aylantirib bo'lsin VA
 * natija to'g'ri UTF-8 bo'lsin. Haqiqiy kirill matn deyarli hech qachon
 * o'tmaydi: "Қ", "Ғ", "Ҳ" cp1251 da yo'q, ketma-ket harflar esa yaroqsiz
 * UTF-8 beradi ("МОҲРЎЗА", "Петров" o'zgarmaydi).
 *
 * UTF-8 tuzilishi QO'LDA tekshiriladi, `fatal` dekoderning istisnosi bilan
 * emas: haqiqiy kirill jadvalda har katak shu yerda rad etiladi va 5000
 * qatorli faylda matn maydonidagi har tugma bosish ~200 ms kechikardi.
 */
function undoMojibake(s: string, map: Map<string, number>): string | null {
  if (bufer.length < s.length + 1) bufer = new Uint8Array((s.length + 1) * 2);
  let n = 0, kerak = 0, past = 0x80, yuqori = 0xbf;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    const b = c < 0x80 ? c : map.get(s[i]);
    if (b === undefined) return null;
    if (kerak > 0) {
      if (b < past || b > yuqori) return null;
      kerak--; past = 0x80; yuqori = 0xbf;
    } else if (b >= 0x80) {
      if (b >= 0xc2 && b <= 0xdf) kerak = 1;
      else if (b >= 0xe0 && b <= 0xef) { kerak = 2; if (b === 0xe0) past = 0xa0; else if (b === 0xed) yuqori = 0x9f; }
      else if (b >= 0xf0 && b <= 0xf4) { kerak = 3; if (b === 0xf0) past = 0x90; else if (b === 0xf4) yuqori = 0x8f; }
      else return null;               // yolg'iz davom bayti yoki noto'g'ri bosh bayt
    }
    bufer[n++] = b;
  }
  // KATAK OXIRIDAGI "Р". U UTF-8 da D0 A0, A0 esa bo'linmas bo'shliq (NBSP)
  // bo'lib ko'rinadi va ko'p joyda katak chetidan kesib tashlanadi —
  // САРВАР, АНВАР, ЖАСУР kabi ismlarda yolg'iz D0 qolardi.
  if (kerak === 1 && bufer[n - 1] === 0xd0) { bufer[n++] = 0xa0; kerak = 0; }
  if (kerak !== 0) return null;
  const out = UTF8.decode(bufer.subarray(0, n));
  // Boshqaruv belgisi chiqsa — bu matn emas, tasodifiy moslik.
  return /[\u0080-\u009f]/.test(out) ? null : out;
}

/**
 * Tiklangan katak qanchalik "ishonarli": har harf 1 ball; 3 baytli ketma-ketlik
 * ("вЂ™" → ’) va lotin harflari orasidagi tutuq belgisi ("OК»rinboyev" →
 * Oʻrinboyev) 3 ball — haqiqiy matnda bunday bo'lak uchramaydi.
 */
function ball(u: string): number {
  let n = 0;
  for (const ch of u) {
    const cp = ch.codePointAt(0)!;
    if (cp >= 0x80) n += cp >= 0x800 ? 3 : 1;
  }
  if (/[A-Za-z][\u02bb\u02bc\u2018\u2019][A-Za-z]/.test(u)) n += 3;
  return n;
}

/**
 * Jadvaldagi "РђР‘Р”РЈ..." → "АБДУ..." — buzilgan kirill (va lotin "ʻ")
 * matnni asliga qaytaradi.
 *
 * Bunday matn eski CSV eksportni Excel'da ochib, o'zgartirib, qayta
 * saqlaganda (yoki ekrandan nusxalaganda) paydo bo'ladi.
 *
 * QAROR BUTUN JADVAL BO'YICHA: bitta katak 3+ ball bersa yoki jami 6+ bo'lsa
 * — fayl buzilgan, shunda qisqa kataklar ham ("Рђ" → "А", sinf harfi)
 * tiklanadi. Bunday dalil bo'lmasa hech narsaga tegilmaydi: ikki harfli
 * haqiqiy matn ("УЎ") tasodifan to'g'ri UTF-8 bo'lib qolishi mumkin.
 * Bitta jadval bitta kodlashda buzilgan bo'ladi — eng ko'p ball bergani olinadi.
 */
export function repairTable(table: string[][]): string[][] {
  const nomzod: [number, number][] = [];
  table.forEach((r, i) => r.forEach((c, j) => { if (c && /[^\x00-\x7f]/.test(c)) nomzod.push([i, j]); }));
  if (nomzod.length === 0) return table;
  // Har bir kodlash sinab ko'riladi va ENG KO'P tiklagani olinadi: lotin
  // "ʻ" 1252 da ham, 1254 da ham bir xil tiklanadi, kirill esa faqat o'z
  // kodlashida — birinchi mosini olsak, kirill kataklar buzuq qolardi.
  let eng: [number, number, string][] | null = null, engJami = 0;
  for (const kod of KODLAR) {
    const map = teskariJadval(kod);
    if (!map) continue;
    let max = 0, jami = 0;
    const tuzat: [number, number, string][] = [];
    for (const [i, j] of nomzod) {
      const c = table[i][j];
      const u = undoMojibake(c, map);
      if (u === null || u === c) continue;
      tuzat.push([i, j, u]);
      const b = ball(u);
      if (b > max) max = b;
      jami += b;
    }
    if ((max >= 3 || jami >= 6) && jami > engJami) { eng = tuzat; engJami = jami; }
  }
  if (!eng) return table;
  const out = table.map((r) => r.slice());
  for (const [i, j, u] of eng) out[i][j] = u;
  return out;
}

// ─── TELEFON ──────────────────────────────────────────────────────────

/**
 * EXCEL BUZGAN TELEFON. Excel telefonni son deb olib CSV'ga saqlasa,
 * ekrandagi ko'rinishni yozadi: "9,98955E+11" — oxirgi raqamlar YO'QOLGAN
 * va ularni tiklab bo'lmaydi. Ilgari bunday qiymatdan raqamlar terib
 * olinardi ("99895511") va qator jimgina "to'liq emas" bo'lardi; lidda esa
 * telefon maydoniga shu axlat yozilardi.
 *
 * Ilmiy yozuv faqat BARCHA xonalar saqlangan bo'lsa tiklanadi
 * ("9.98901234567E+11" → "998901234567" — `.xlsx` ichida shunday
 * uchrashi mumkin). Kasr qismi daraja ko'rsatkichidan qisqa bo'lsa —
 * raqam buzilgan.
 *
 * @returns `value` — tiklangan yoki o'zgarmagan qiymat; `broken` — raqamlar
 *   yo'qolgan, qiymat ishlatilmasin.
 */
export function rescuePhone(raw: string): { value: string; broken: boolean } {
  // SON FORMATI: "998901234567,00", "998 901 234 567,00", "998,901,234,567.00"
  // — ustunni "Son" formatiga o'tkazib saqlanganda. Raqamlar to'liq, faqat
  // kasr nollari ortiqcha: ular qolsa 14 xonali "raqam" chiqib, o'quvchi
  // rad etilardi, lid esa takror tekshiruvidan o'tib ketardi. Guruhlar
  // UCHTADAN bo'lishi shart — "90.123.45.00" kabi nuqtali telefon tegilmaydi.
  const son = /^\s*(\d+|\d{1,3}(?:[\s\u00a0\u202f,.']\d{3})+)[.,]0+\s*$/.exec(raw ?? "");
  if (son) return { value: son[1].replace(/\D/g, ""), broken: false };

  const m = /^\s*(\d+)(?:[.,](\d*))?\s*[eE]\s*\+?\s*(\d{1,2})\s*$/.exec(raw ?? "");
  if (!m) return { value: raw, broken: false };
  const frac = m[2] ?? "";
  // m[1].m[2] × 10^m[3] butun va to'liq bo'lishi uchun kasr qismi aynan
  // daraja ko'rsatkichicha xonali bo'lishi kerak. (`.xlsx` dagi son katak
  // `lib/xlsx.ts` da oldindan butun raqamga aylantiriladi — bu yerga
  // faqat ekrandan ko'chgan, yaxlitlangan ko'rinish keladi.)
  if (frac.length === Number(m[3])) return { value: (m[1] + frac).replace(/^0+(?=\d)/, ""), broken: false };
  return { value: "", broken: true };
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
  /**
   * Excel buzgan telefon ("9,98955E+11") — asl ko'rinishi, ekranda
   * ko'rsatish uchun. Bunday qator YUBORILMAYDI: raqamlar yo'qolgan, ota-ona
   * telefoni bo'lsa ham keyin to'g'ri fayl bilan qayta yuklanganda o'quvchi
   * "dublikat" deb o'tkazib yuborilib, ota-ona raqami hech qachon tushmasdi.
   */
  brokenPhone?: string;
  /** Excel buzgan OTA-ONA telefoni — qator xuddi shunday yuborilmaydi. */
  brokenParentPhone?: string;
  parentPhone?: string;
  parentName?: string;
  school?: string;
  source?: string;
  gender?: "MALE" | "FEMALE";
  groupName?: string;
}

export interface MapResult {
  rows: MappedRow[];
  /** Telefoni (o'zi yoki ota-onasiniki) Excel'da buzilgan qatorlar soni. */
  brokenPhones: number;
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
  if (table.length === 0) return { rows: [], matched: [], headerless: false, brokenPhones: 0 };

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
      const phoneRaw = pick(r, "phone", hasHeader ? undefined : 1);
      const phone = rescuePhone(phoneRaw);
      const row: MappedRow = {
        name:  pick(r, "name", hasHeader ? undefined : 0),
        phone: phone.value,
      };
      if (phone.broken) row.brokenPhone = phoneRaw;
      const parentRaw = pick(r, "parentPhone", hasHeader ? undefined : 2);
      const parentPhone = rescuePhone(parentRaw);
      if (parentPhone.broken) row.brokenParentPhone = parentRaw;
      else if (parentPhone.value) row.parentPhone = parentPhone.value;
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
    .filter((r) => r.name || r.phone || r.brokenPhone);

  return {
    rows,
    matched: Object.keys(colOf),
    headerless: !hasHeader,
    brokenPhones: rows.filter((r) => r.brokenPhone || r.brokenParentPhone).length,
  };
}

// ─── LIDLAR ────────────────────────────────────────────────────────────

/** Lid importidagi bitta qator. */
export interface MappedLead {
  name: string;
  phone?: string;
  /** Excel buzgan telefon — bunday qator yuborilmaydi (`MappedRow.brokenPhone`). */
  brokenPhone?: string;
  school?: string;
  grade?: string;
  note?: string;
  /** Fan ballari — maktab tashrifida test o'tkazilgan bo'lsa. */
  scores?: Record<string, number>;
}

const LEAD_ALIASES: Record<string, string[]> = {
  name:   ["ism", "ismi", "ismfamiliya", "fio", "oquvchi", "bola", "name", "fullname", "имя", "фио"],
  phone:  ["telefon", "telefonraqam", "raqam", "tel", "phone", "телефон"],
  school: ["maktab", "maktabi", "school", "школа"],
  grade:  ["sinf", "sinfi", "klass", "grade", "class", "класс"],
  note:   ["izoh", "izohi", "eslatma", "note", "comment", "примечание"],
};

/**
 * MAKTAB TASHRIFI RO'YXATINI O'QIYDI.
 *
 * O'quvchi importidan farqi ikkita va ikkalasi ham ataylab:
 *
 *  • TELEFON MAJBURIY EMAS. Maktabda ro'yxat yig'ilganda bolalarning
 *    ko'pida telefon bo'lmaydi. Majburiy qilsak, 300 kishilik ro'yxatning
 *    yarmi umuman tizimga kirmasdi — ya'ni eng qimmatli lid manbasi
 *    yo'qolardi.
 *
 *  • TANILMAGAN SONLI USTUNLAR BALL deb olinadi. Maktabda test
 *    o'tkazilsa, jadvalda "Matematika", "Ona tili" kabi ustunlar
 *    bo'ladi. Ularni tashlab yuborsak, markaz kuchli o'quvchini
 *    ajrata olmasdi.
 *
 * Sarlavha topilmasa, birinchi ikki ustun ism va telefon deb olinadi.
 */
export function mapLeadRows(table: string[][]): {
  rows: MappedLead[]; matched: string[]; scoreColumns: string[]; headerless: boolean; brokenPhones: number;
} {
  if (table.length === 0) {
    return { rows: [], matched: [], scoreColumns: [], headerless: false, brokenPhones: 0 };
  }

  const header = table[0].map(normalizeHeader);
  const colOf: Record<string, number> = {};
  for (const [field, aliases] of Object.entries(LEAD_ALIASES)) {
    const idx = header.findIndex((h) => aliases.includes(h));
    if (idx >= 0) colOf[field] = idx;
  }

  const hasHeader = colOf.name !== undefined || colOf.phone !== undefined;
  const body = hasHeader ? table.slice(1) : table;
  const used = new Set(Object.values(colOf));

  // Ball ustunlari: sarlavhasi bor, tanilmagan va qiymatlari SON.
  // "Sonmi" degan savolga bitta qatorga qarab javob bermaymiz — bo'sh
  // bo'lmagan qiymatlarning hammasi son bo'lishi kerak, aks holda
  // "Manzil" kabi ustun ham ballga aylanib ketardi.
  const scoreColumns: { idx: number; label: string }[] = [];
  if (hasHeader) {
    for (let i = 0; i < table[0].length; i++) {
      if (used.has(i)) continue;
      const label = (table[0][i] ?? "").trim();
      if (!label) continue;
      const vals = body.map((r) => (r[i] ?? "").trim()).filter((v) => v !== "");
      if (vals.length > 0 && vals.every((v) => /^\d+([.,]\d+)?$/.test(v))) {
        scoreColumns.push({ idx: i, label });
      }
    }
  }

  const pick = (r: string[], field: string, fallback?: number) => {
    const i = colOf[field] ?? fallback;
    return i === undefined ? "" : (r[i] ?? "").trim();
  };

  const rows: MappedLead[] = body
    .map((r) => {
      const row: MappedLead = { name: pick(r, "name", hasHeader ? undefined : 0) };
      const phoneRaw = pick(r, "phone", hasHeader ? undefined : 1);
      const phone = rescuePhone(phoneRaw);
      if (phone.broken) row.brokenPhone = phoneRaw;
      else if (phone.value) row.phone = phone.value;
      const school = pick(r, "school");
      if (school) row.school = school;
      const grade = pick(r, "grade");
      if (grade) row.grade = grade;
      const note = pick(r, "note");
      if (note) row.note = note;

      const scores: Record<string, number> = {};
      for (const c of scoreColumns) {
        const v = (r[c.idx] ?? "").trim().replace(",", ".");
        if (v !== "") scores[c.label] = Number(v);
      }
      if (Object.keys(scores).length > 0) row.scores = scores;
      return row;
    })
    .filter((r) => r.name.trim() !== "");

  return {
    rows,
    matched: Object.keys(colOf),
    scoreColumns: scoreColumns.map((c) => c.label),
    headerless: !hasHeader,
    brokenPhones: rows.filter((r) => r.brokenPhone).length,
  };
}
