/**
 * CHEK MANTIG'I — sinov (kanvas emas, unga beriladigan RAQAMLAR).
 *
 *   npx tsx scripts/verify-receipt-canvas.ts
 *
 * Qog'ozga chiqqan summa ekrandagidan farq qilsa, mijoz bilan bahsda
 * qog'oz yutadi va xatoni keyin tuzatib bo'lmaydi — shuning uchun
 * taqsimot mantig'i alohida qotiriladi.
 */
import { readFileSync } from "node:fs";
import { maydonlar, davrRoyxati, oyNomi } from "../lib/receipt-canvas";

let pass = 0, fail = 0;
const check = (label: string, ok: boolean, extra = "") => {
  if (ok) { pass++; console.log(`  ✅ ${label}`); }
  else { fail++; console.log(`  ❌ ${label}${extra ? ` — ${extra}` : ""}`); }
};
const raqam = (s: string) => Number(String(s).replace(/\D/g, ""));
const asos = { amount: 0, date: "2026-09-12", method: "NAQD" };

console.log("\n━━━ DAVR TAQSIMOTI ━━━\n");

let r = davrRoyxati({ ...asos, amount: 350000,
  periods: [{ month: "2026-09", amount: 350000 }], advance: 0 });
check("bitta oy — bitta qator", r.length === 1);
check("oy nomi o'zbekcha", r[0][0] === "sentabr 2026", r[0][0]);
check("summa to'g'ri", raqam(r[0][1]) === 350000, r[0][1]);

r = davrRoyxati({ ...asos, amount: 2000000, advance: 0, periods: [
  { month: "2026-08", amount: 1000000 }, { month: "2026-09", amount: 1000000 }] });
check("ikki oyni qoplagan to'lov — ikki qator", r.length === 2);
check("yig'indi to'lovga teng", r.reduce((a, x) => a + raqam(x[1]), 0) === 2000000);

r = davrRoyxati({ ...asos, amount: 500000,
  periods: [{ month: "2026-09", amount: 300000 }], advance: 200000 });
check("oldindan alohida qator", r.length === 2 && r[1][0] === "Oldindan to'lov");
check("davr + oldindan = to'lov", r.reduce((a, x) => a + raqam(x[1]), 0) === 500000);

r = davrRoyxati({ ...asos, amount: 400000, periods: [], advance: 0 });
check("davrsiz to'lov bo'sh qolmaydi", r.length === 1);
check("davrsizda TO'LIQ summa chiqadi", raqam(r[0][1]) === 400000, r[0][1]);

r = davrRoyxati({ ...asos, amount: 150000 });
check("periods umuman berilmasa ham qator bor",
  r.length === 1 && raqam(r[0][1]) === 150000);

r = davrRoyxati({ ...asos, amount: 100000,
  periods: [{ month: null, amount: 100000 }], advance: 0 });
check("davri yo'q qator tushunarli yoziladi", r[0][0] === "Davrsiz to'lov", r[0][0]);

r = davrRoyxati({ ...asos, amount: 350000,
  periods: [{ month: "2026-09", amount: 350000 }], advance: 0 });
check("oldindan 0 — ortiqcha qator yo'q", r.length === 1);

check("oy nomi: yanvar", oyNomi("2026-01") === "yanvar 2026");
check("oy nomi: dekabr", oyNomi("2026-12") === "dekabr 2026");
check("oy nomi: null", oyNomi(null) === "Davrsiz to'lov");

console.log("\n━━━ MAYDONLAR ━━━\n");

let m = maydonlar({
  ...asos, amount: 1,
  student: { name: "Ali Valiyev", phone: "998901234567" },
  courseName: "Matematika", groupName: "M-1", coursePrice: 500000,
  receivedBy: "Kassir",
});
const kalit = m.map((x) => x[0]);
check("talab qilingan maydonlar bor (ism, kurs, guruh, narx, sana, usul)",
  ["O'quvchi", "Kurs", "Guruh", "Kurs narxi", "Sana", "To'lov usuli"]
    .every((k) => kalit.includes(k)), kalit.join(", "));
check("to'lov usuli o'zbekchaga o'giriladi",
  m.find((x) => x[0] === "To'lov usuli")![1] === "Naqd");
check("kurs narxi pul ko'rinishida",
  raqam(m.find((x) => x[0] === "Kurs narxi")![1]) === 500000);

m = maydonlar({ ...asos, amount: 1, method: "CLICK", student: { name: "A" } });
check("bo'sh maydonlar chekda KO'RINMAYDI",
  !m.some((x) => ["Kurs", "Guruh", "Telefon", "Kurs narxi"].includes(x[0])),
  m.map((x) => x[0]).join(", "));
check("Click o'zbekchada", m.find((x) => x[0] === "To'lov usuli")![1] === "Click");
check("noma'lum usul o'z nomi bilan qoladi",
  maydonlar({ ...asos, amount: 1, method: "YANGI", student: { name: "A" } })
    .find((x) => x[0] === "To'lov usuli")![1] === "YANGI");

console.log("\n━━━ QOG'OZ: FAQAT SOF QORA VA OQ ━━━\n");

// Termal apparat kulrangni chop eta olmaydi — u nuqtalar to'riga
// (dither) aylanadi va qog'ozda xira chiqadi. 2026-09-19 gacha
// chekning yarmi kulrang edi (#888888 yorliqlar, #d8d8d8 chiziqlar)
// va markaz "sizniki ko'rinmayapti" deb shikoyat qildi.
//
// Bu tekshiruv chizish faylini O'QIYDI: kelajakda kimdir "biroz
// och qilaylik" deb kulrang qo'shsa, shu yerda ushlanadi.
const manba = readFileSync(
  new URL("../lib/receipt-canvas.ts", import.meta.url), "utf8");
const kod = manba
  .replace(/\/\*\*[\s\S]*?\*\//g, "")   // blok izohlar
  .replace(/\/\/.*$/gm, "");             // qator izohlar
const ranglar = [...kod.matchAll(/#[0-9a-fA-F]{3,8}/g)].map((m) => m[0]);
const begona = ranglar.filter((c) => c !== "#000000" && c !== "#ffffff");
check("chizishda kulrang qolmadi", begona.length === 0, begona.join(", "));
check("qora va oq doimiylari bor",
  /const QORA = "#000000"/.test(manba) && /const OQ\s*=\s*"#ffffff"/.test(manba));
check("punktir chiziq ishlatilmaydi (qog'ozda yo'qoladi)",
  !/setLineDash\(\[/.test(kod));

console.log(`\n${fail === 0 ? "✅" : "❌"} Jami: ${pass} o'tdi, ${fail} yiqildi\n`);
process.exit(fail === 0 ? 0 : 1);
