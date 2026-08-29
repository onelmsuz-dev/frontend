/**
 * LID IMPORTI USTUN MOSLASHTIRGICHI.
 *
 *     npm run verify:import
 *
 * Bu yerda tekshiriladigan asosiy narsa — MAKTAB TASHRIFI ro'yxati.
 * Unda telefon ko'pincha yo'q va test ballari alohida ustunlarda
 * turadi. Ilgari bunday ro'yxatning yarmi importda rad etilardi.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dir = mkdtempSync(join(tmpdir(), "leadmap-"));
let mapLeadRows, parseDelimited;
try {
  const js = join(dir, "csv.mjs");
  execFileSync("npx", ["esbuild", "lib/csv.ts", "--format=esm",
    "--target=node20", "--outfile=" + js], { stdio: "pipe" });
  ({ mapLeadRows, parseDelimited } = await import(js));
} finally {
  // Import tugagach papka kerak emas.
  process.on("exit", () => rmSync(dir, { recursive: true, force: true }));
}

let pass=0, fail=0;
const ok=(l,c,x="")=>{ c?(pass++,console.log("  ✅ "+l)):(fail++,console.log("  ❌ "+l+" "+x)); };
const eq=(l,g,w)=>ok(l+" = "+JSON.stringify(w), JSON.stringify(g)===JSON.stringify(w), "→ "+JSON.stringify(g));

console.log("\n1) MAKTAB TASHRIFI — telefonsiz, ball bilan");
const r1 = mapLeadRows([
  ["Ism","Maktab","Sinf","Matematika","Ona tili","Manzil"],
  ["Ali Valiyev","12-maktab","9-A","85","70","Chilonzor"],
  ["Zebo Qodirova","12-maktab","9-A","92","88","Yunusobod"],
]);
eq("tanilgan ustunlar", r1.matched.sort(), ["grade","name","school"]);
eq("ball ustunlari", r1.scoreColumns, ["Matematika","Ona tili"]);
ok("Manzil ball emas (matn)", !r1.scoreColumns.includes("Manzil"));
eq("1-qator", r1.rows[0], {name:"Ali Valiyev",school:"12-maktab",grade:"9-A",scores:{Matematika:85,"Ona tili":70}});
ok("telefonsiz qator qabul qilindi", r1.rows.length===2, "→ "+r1.rows.length);

console.log("\n2) ODDIY RO'YXAT — ism + telefon");
const r2 = mapLeadRows([["Ism","Telefon"],["Ali","+998901112233"],["Zebo","998907778899"]]);
eq("2 ta lid", r2.rows.length, 2);
eq("telefon o'qildi", r2.rows[0], {name:"Ali",phone:"+998901112233"});
eq("ball ustuni yo'q", r2.scoreColumns, []);

console.log("\n3) SARLAVHASIZ — Ctrl+V bilan ikki ustun");
const r3 = mapLeadRows([["Ali","998901112233"],["Zebo","998907778899"]]);
ok("sarlavhasiz aniqlandi", r3.headerless);
eq("birinchi ustun ism", r3.rows[0].name, "Ali");
eq("ikkinchi ustun telefon", r3.rows[0].phone, "998901112233");

console.log("\n4) ISMSIZ QATOR TASHLANADI");
const r4 = mapLeadRows([["Ism","Telefon"],["","998901112233"],["Ali",""]]);
eq("faqat ismi bori qoldi", r4.rows.length, 1);
eq("qolgani", r4.rows[0].name, "Ali");

console.log("\n5) RUSCHA SARLAVHA");
const r5 = mapLeadRows([["ФИО","Телефон","Школа","Класс"],["Иван","998901112233","5-школа","7-Б"]]);
eq("ruscha tanildi", r5.matched.sort(), ["grade","name","phone","school"]);
eq("qiymatlar", r5.rows[0], {name:"Иван",phone:"998901112233",school:"5-школа",grade:"7-Б"});

console.log("\n6) BALL USTUNI — bo'sh kataklari bo'lsa ham son");
const r6 = mapLeadRows([["Ism","Fizika"],["Ali","80"],["Zebo",""],["Olim","95"]]);
eq("Fizika ball deb olindi", r6.scoreColumns, ["Fizika"]);
eq("bo'sh katak ballsiz qoldi", r6.rows[1].scores, undefined);
eq("vergulli son", mapLeadRows([["Ism","Ball"],["Ali","7,5"]]).rows[0].scores, {Ball:7.5});

console.log("\n7) ARALASH USTUN BALL EMAS");
eq("aralash ustun tashlandi",
   mapLeadRows([["Ism","Daraja"],["Ali","80"],["Zebo","yuqori"]]).scoreColumns, []);

console.log("\n8) CSV MATNIDAN");
eq("csv o'qildi",
   mapLeadRows(parseDelimited("Ism;Telefon;Maktab\nAli;998901112233;12-maktab")).rows[0],
   {name:"Ali",phone:"998901112233",school:"12-maktab"});

console.log(`\n${fail===0?"✅":"❌"} ${pass} ta o'tdi, ${fail} ta yiqildi`);
process.exitCode = fail===0?0:1;
