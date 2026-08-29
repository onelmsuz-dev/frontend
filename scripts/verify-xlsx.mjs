/**
 * `.xlsx` O'QIGICHNI TEKSHIRISH.
 *
 *     npm run verify:xlsx
 *
 * Sinov fayllarini O'ZI yasaydi — na Excel, na kutubxona kerak.
 * ZIP yozuvchisi shu yerda, chunki o'qigich haqiqiy siqilgan baytlarda
 * sinalishi kerak: qo'lda yozilgan XML bilan sinash ZIP qatlamini
 * umuman tekshirmasdan qoldirardi.
 *
 * ENG MUHIM SINOV — 9-bo'lim. Haqiqiy Excel bo'sh katakni
 * `<c r="D2" s="2"/>` deb yozadi va bu qolip o'qigichni adashtirishi
 * mumkin: bir vaqtlar u keyingi katakni yutib yuborib, "9-A" o'rniga
 * ichki jadval indeksi "9" ni yozardi. Men yasagan dastlabki sinov
 * fayllari bunday katak yozmagani uchun xato ko'rinmagan edi.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// ─── ZIP YOZISH ────────────────────────────────────────────────────────

const CRC = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c >>> 0;
  }
  return t;
})();
const crc32 = (b) => {
  let c = 0xffffffff;
  for (const x of b) c = CRC[(c ^ x) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

async function deflateRaw(bytes) {
  const s = new Blob([bytes]).stream()
    .pipeThrough(new CompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(s).arrayBuffer());
}

/** Oddiy ZIP yozuvchi: siqilgan (8) yoki siqilmagan (0). */
async function makeZip(files, method = 8) {
  const enc = new TextEncoder();
  const chunks = [], central = [];
  let offset = 0;

  for (const [name, text] of files) {
    const raw  = enc.encode(text);
    const data = method === 8 ? await deflateRaw(raw) : raw;
    const nm   = enc.encode(name);

    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true);
    lh.setUint16(8, method, true);
    lh.setUint32(14, crc32(raw), true);
    lh.setUint32(18, data.length, true); lh.setUint32(22, raw.length, true);
    lh.setUint16(26, nm.length, true);
    chunks.push(new Uint8Array(lh.buffer), nm, data);

    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true);
    ch.setUint16(6, 20, true); ch.setUint16(10, method, true);
    ch.setUint32(16, crc32(raw), true);
    ch.setUint32(20, data.length, true); ch.setUint32(24, raw.length, true);
    ch.setUint16(28, nm.length, true); ch.setUint32(42, offset, true);
    central.push(new Uint8Array(ch.buffer), nm);

    offset += 30 + nm.length + data.length;
  }

  const cSize = central.reduce((n, c) => n + c.length, 0);
  const eo = new DataView(new ArrayBuffer(22));
  eo.setUint32(0, 0x06054b50, true);
  eo.setUint16(8, files.length, true); eo.setUint16(10, files.length, true);
  eo.setUint32(12, cSize, true); eo.setUint32(16, offset, true);

  const all = [...chunks, ...central, new Uint8Array(eo.buffer)];
  const out = new Uint8Array(all.reduce((n, c) => n + c.length, 0));
  let p = 0; for (const c of all) { out.set(c, p); p += c.length; }
  return out;
}

// ─── SINOV FAYLLARI ────────────────────────────────────────────────────

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const sst = (list) =>
  `<?xml version="1.0"?><sst count="${list.length}">` +
  list.map((s) => `<si><t>${esc(s)}</t></si>`).join("") + `</sst>`;
const sheet = (rows) =>
  `<?xml version="1.0"?><worksheet><sheetData>${rows.join("")}</sheetData></worksheet>`;
const CT = '<?xml version="1.0"?><Types/>';
const WB = '<?xml version="1.0"?><workbook><sheets><sheet name="Lidlar"/></sheets></workbook>';

const STRINGS = ["Ism", "Telefon", "Manba", "Maktab", "Sinf", "Ali Valiyev",
  "+998901112233", "Maktab tashrifi", "12-maktab", "9-A", "Nodira & Co",
  "Zebo <Test>", "Instagram", "Bo'sh telefonli"];

const s = (L, n, i) => `<c r="${L}${n}" t="s"><v>${i}</v></c>`;
const num = (L, n, v) => `<c r="${L}${n}"><v>${v}</v></c>`;
const inl = (L, n, v) => `<c r="${L}${n}" t="inlineStr"><is><t>${esc(v)}</t></is></c>`;

const MAIN = [
  `<row r="1">${s("A",1,0)}${s("B",1,1)}${s("C",1,2)}${s("D",1,3)}${s("E",1,4)}</row>`,
  `<row r="2">${s("A",2,5)}${s("B",2,6)}${s("C",2,7)}${s("D",2,8)}${s("E",2,9)}</row>`,
  // D yo'q — ustunlar siljimasligi kerak
  `<row r="3">${s("A",3,10)}${num("B",3,"998901234567")}${s("C",3,12)}${s("E",3,9)}</row>`,
  // telefonsiz — maktab tashrifida odatiy hol
  `<row r="4">${s("A",4,13)}${s("C",4,7)}${s("D",4,8)}</row>`,
  `<row r="5">${s("A",5,11)}${inl("B",5,"+998 90 555 66 77")}${s("C",5,12)}</row>`,
  `<row r="6"></row>`,
];

// ─── SINOVLAR ──────────────────────────────────────────────────────────

let pass = 0, fail = 0;
const ok = (l, c, x = "") => { c ? (pass++, console.log("  ✅ " + l))
                                 : (fail++, console.log("  ❌ " + l + " " + x)); };
const eq = (l, g, w) => ok(`${l} = ${JSON.stringify(w)}`,
  JSON.stringify(g) === JSON.stringify(w), `→ ${JSON.stringify(g)}`);

const dir = mkdtempSync(join(tmpdir(), "xlsx-"));
try {
  // `lib/xlsx.ts` ni ishga tushirish uchun JS ga aylantiramiz.
  const js = join(dir, "xlsx.mjs");
  execFileSync("npx", ["esbuild", "lib/xlsx.ts", "--format=esm",
    "--target=node20", "--outfile=" + js], { stdio: "pipe" });
  const { parseXlsx, readTable } = await import(js);

  const base = [["[Content_Types].xml", CT], ["xl/workbook.xml", WB],
                ["xl/sharedStrings.xml", sst(STRINGS)]];
  const blob = async (files, m) => new Blob([await makeZip(files, m)]);

  console.log("\n1) ASOSIY HOLAT");
  const r = await parseXlsx(await blob([...base, ["xl/worksheets/sheet1.xml", sheet(MAIN)]]));
  eq("sarlavha", r[0], ["Ism", "Telefon", "Manba", "Maktab", "Sinf"]);
  eq("to'liq qator", r[1], ["Ali Valiyev", "+998901112233", "Maktab tashrifi", "12-maktab", "9-A"]);
  ok("bo'sh qator tashlandi (5 qator)", r.length === 5, "→ " + r.length);

  console.log("\n2) BO'SH KATAK USTUNNI SILJITMAYDI");
  eq("D bo'sh", r[2][3], "");
  eq("E o'z joyida", r[2][4], "9-A");
  eq("son matn bo'ldi", r[2][1], "998901234567");

  console.log("\n3) TELEFONSIZ QATOR");
  eq("ism", r[3][0], "Bo'sh telefonli");
  eq("telefon bo'sh", r[3][1], "");
  eq("manba", r[3][2], "Maktab tashrifi");

  console.log("\n4) XML BELGILARI");
  eq("& ochildi", r[2][0], "Nodira & Co");
  eq("< > ochildi", r[4][0], "Zebo <Test>");
  eq("inline satr", r[4][1], "+998 90 555 66 77");

  console.log("\n5) BOSHQA YOZILISH USULLARI");
  const stored = await parseXlsx(await blob([...base, ["xl/worksheets/sheet1.xml", sheet(MAIN)]], 0));
  eq("siqilmagan (stored)", stored[1][0], "Ali Valiyev");
  const odd = await parseXlsx(await blob([...base, ["xl/worksheets/mySheet.xml", sheet(MAIN)]]));
  eq("varaq nomi sheet1 emas", odd[1][0], "Ali Valiyev");
  const noSst = await parseXlsx(await blob([["[Content_Types].xml", CT],
    ["xl/worksheets/sheet1.xml", sheet([
      `<row r="1">${inl("A",1,"Ism")}${inl("B",1,"Telefon")}</row>`,
      `<row r="2">${inl("A",2,"Inline Odam")}${inl("B",2,"+998933334455")}</row>`])]]));
  eq("sharedStrings yo'q", noSst[1], ["Inline Odam", "+998933334455"]);

  console.log("\n6) KATTA FAYL");
  const bigRows = [`<row r="1">${s("A",1,0)}${s("B",1,1)}</row>`];
  for (let i = 2; i <= 801; i++)
    bigRows.push(`<row r="${i}">${inl("A",i,"Odam "+i)}${num("B",i,"99890"+String(i).padStart(7,"0"))}</row>`);
  const t0 = process.hrtime.bigint();
  const big = await parseXlsx(await blob([...base, ["xl/worksheets/sheet1.xml", sheet(bigRows)]]));
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  eq("801 qator", big.length, 801);
  eq("oxirgi qator", big[800], ["Odam 801", "998900000801"]);
  ok(`tez (${ms.toFixed(0)} ms)`, ms < 1000, ms + "ms");

  console.log("\n7) BUZUQ FAYLLAR — aniq xato");
  for (const [bytes, label, want] of [
    [new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, ...new Array(200).fill(0)]), "eski .xls", ".xls"],
    [new TextEncoder().encode("bu umuman zip emas".repeat(20)), "axlat", ".xlsx fayl emas"],
  ]) {
    let msg = "";
    try { await parseXlsx(new Blob([bytes])); } catch (e) { msg = e.message; }
    ok(`${label} → "${msg}"`, msg.includes(want), msg || "XATO BERILMADI");
  }
  {
    let msg = "";
    try { await parseXlsx(await blob([["[Content_Types].xml", CT]])); }
    catch (e) { msg = e.message; }
    ok(`varaqsiz fayl → "${msg}"`, msg.includes("varaq topilmadi"), msg || "XATO BERILMADI");
  }

  console.log("\n8) readTable — kengaytmaga qarab yo'naltiradi");
  const csvParse = (t) => t.trim().split("\n").map((l) => l.split(","));
  eq("csv yo'li", await readTable(new File(["a,b\nc,d"], "x.csv"), csvParse),
     [["a", "b"], ["c", "d"]]);
  const xb = await makeZip([...base, ["xl/worksheets/sheet1.xml", sheet(MAIN)]]);
  eq("xlsx yo'li", (await readTable(new File([xb], "lidlar.xlsx"), csvParse))[1][0], "Ali Valiyev");
  eq("kengaytmasiz, MIME bo'yicha",
     (await readTable(new File([xb], "noext",
       { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
       csvParse))[1][0], "Ali Valiyev");

  console.log("\n9) HAQIQIY EXCEL YOZUVI — o'zi yopiladigan katak");
  // Excel bo'sh, lekin uslubli katakni `<c r="B2" s="2"/>` deb yozadi.
  // Agar o'qigich bunda to'xtamasa, keyingi katakni yutib yuboradi.
  const EX_SST = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="8">
<si><t>Ism</t></si><si><t>Telefon</t></si><si><t>Manba</t></si>
<si><t>Maktab</t></si><si><t>Sinf</t></si>
<si><r><rPr><b/></rPr><t xml:space="preserve">Ali </t></r><r><t>Valiyev</t></r></si>
<si><t>9-A</t></si><si><t>Instagram</t></si></sst>`;
  const EX_SH = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:E3"/><sheetData>
<row r="1" spans="1:5" x14ac:dyDescent="0.25"><c r="A1" s="1" t="s"><v>0</v></c><c r="B1" s="1" t="s"><v>1</v></c><c r="C1" s="1" t="s"><v>2</v></c><c r="D1" s="1" t="s"><v>3</v></c><c r="E1" s="1" t="s"><v>4</v></c></row>
<row r="2" spans="1:5"><c r="A2" t="s"><v>5</v></c><c r="B2" s="2"/><c r="C2" t="s"><v>7</v></c><c r="D2" s="2"/><c r="E2" t="s"><v>6</v></c></row>
<row r="3" spans="1:5"><c r="A3" t="str"><f>CONCATENATE("Zebo"," Q.")</f><v>Zebo Q.</v></c><c r="B3"><v>998901234567</v></c><c r="C3" s="3"/></row>
</sheetData></worksheet>`;
  const ex = await parseXlsx(await blob([["[Content_Types].xml", CT],
    ["xl/sharedStrings.xml", EX_SST], ["xl/worksheets/sheet1.xml", EX_SH]]));
  eq("sarlavha", ex[0], ["Ism", "Telefon", "Manba", "Maktab", "Sinf"]);
  eq("bo'sh kataklar ustunni siljitmadi", ex[1],
     ["Ali Valiyev", "", "Instagram", "", "9-A"]);
  eq("boy matn birlashtirildi", ex[1][0], "Ali Valiyev");
  eq("formula natijasi", ex[2][0], "Zebo Q.");
  eq("son katak", ex[2][1], "998901234567");
} finally {
  rmSync(dir, { recursive: true, force: true });
}

console.log(`\n${fail === 0 ? "✅" : "❌"} ${pass} ta o'tdi, ${fail} ta yiqildi`);
process.exitCode = fail === 0 ? 0 : 1;
