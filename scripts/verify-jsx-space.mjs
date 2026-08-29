/**
 * JSX BO'SHLIQ XATOSI.
 *
 *     npm run verify:jsx
 *
 * Kompilyator (SWC) nuqsoni: JSX matni KO'P QATORLI element ichida
 * bo'lsa VA ichida HTML belgisi (`&apos;` kabi) bo'lsa, matndan
 * OLDINGI BO'SHLIQ yo'qoladi.
 *
 *     <span>
 *       {n} ta lid qo&apos;shildi     →  "3ta lid qo'shildi"
 *     </span>
 *
 * Ikkala shart ham kerak — bu tajriba bilan tekshirilgan:
 *
 *     bir qatorda,  belgi bor   →  "3 SINOVA o'qildi"   ✓
 *     ko'p qatorda, belgi bor   →  "3SINOVB o'qildi"    ✗
 *     ko'p qatorda, belgi yo'q  →  "3 SINOVC oqildi"    ✓
 *
 * Shuning uchun "har doim `{" "}` yozing" degan qoida emas — aynan
 * shu qo'shilish xavfli.
 *
 * YECHIM: bo'shliqni aniq yozish — `{n}{" "}ta lid qo&apos;shildi`.
 *
 * Buni ko'z bilan topib bo'lmaydi: kodda bo'shliq TURADI, faqat
 * ekranda yo'qoladi. Shuning uchun tekshiruv avtomat.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ENT = /&(?:apos|quot|amp|lt|gt|laquo|raquo|nbsp|hellip|mdash|ndash|#\d+);/;
// `}` yoki `>` dan keyin bo'shliq + matn, QATOR OXIRIGACHA.
// Qator oxirigacha borishi — matn keyingi qatorga o'tishini bildiradi,
// ya'ni kompilyator uni kesish yo'liga tushadi.
const PAT = /(\}|>)( +)([^<>{}]+)$/;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name === ".git") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith(".tsx")) out.push(p);
  }
  return out;
}

const hits = [];
for (const file of walk(".")) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    const st = line.trim();
    if (st.startsWith("//") || st.startsWith("*") || st.startsWith("/*")) return;
    const m = PAT.exec(line.replace(/\r$/, ""));
    if (m && ENT.test(m[3])) hits.push({ file, line: i + 1, text: st });
  });
}

if (hits.length === 0) {
  console.log("✅ JSX bo'shliq xatosi topilmadi");
  process.exit(0);
}

console.log(`❌ ${hits.length} ta joyda bo'shliq yo'qoladi:\n`);
for (const h of hits) {
  console.log(`  ${h.file}:${h.line}`);
  console.log(`    ${h.text.slice(0, 110)}`);
}
console.log(`\n  Tuzatish: bo'shliqni {" "} bilan aniq yozing.`);
console.log(`  Masalan:  {n} ta lid  →  {n}{" "}ta lid`);
process.exit(1);
