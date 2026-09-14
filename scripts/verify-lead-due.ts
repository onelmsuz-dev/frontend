/**
 * LID QO'NG'IROG'I VAQT HOLATI — sinov.
 *
 *   npx tsx scripts/verify-lead-due.ts
 *
 * Rang mantig'i kichik, lekin xato qilsa taxta yolg'on gapiradi:
 * shoshilinch qo'ng'iroq kulrang bo'lib ko'zdan qochadi yoki hali
 * vaqti kelmagani qizil bo'lib bekorga vahima soladi.
 */
import { dueHolat, dueMatn } from "../lib/lead-due";

let pass = 0, fail = 0;
const check = (label: string, ok: boolean, extra = "") => {
  if (ok) { pass++; console.log(`  ✅ ${label}`); }
  else { fail++; console.log(`  ❌ ${label}${extra ? ` — ${extra}` : ""}`); }
};

// Barqaror "hozir": 2026-09-17, payshanba, soat 14:00.
const hozir = new Date(2026, 8, 17, 14, 0, 0);
const d = (y: number, m: number, day: number, h = 0, min = 0) =>
  new Date(y, m - 1, day, h, min).toISOString();

console.log("\n━━━ HOLAT ━━━\n");

check("sana yo'q — belgi ham yo'q", dueHolat(null, hozir) === "yoq");
check("buzuq sana — belgi yo'q", dueHolat("salom", hozir) === "yoq");

check("bugun 15:00 (hali kelmagan) — kutilmoqda",
  dueHolat(d(2026, 9, 17, 15, 0), hozir) === "kutilmoqda");
check("bugun 13:00 (1 soat o'tdi) — KELDI, hali qizil emas",
  dueHolat(d(2026, 9, 17, 13, 0), hozir) === "keldi",
  dueHolat(d(2026, 9, 17, 13, 0), hozir));
check("aynan hozir (14:00) — KELDI",
  dueHolat(d(2026, 9, 17, 14, 0), hozir) === "keldi");
check("bugun 12:00 (aynan 2 soat) — hali KELDI (chegara qat'iy)",
  dueHolat(d(2026, 9, 17, 12, 0), hozir) === "keldi",
  dueHolat(d(2026, 9, 17, 12, 0), hozir));
check("bugun 11:59 (2 soatdan ko'p) — KECHIKKAN",
  dueHolat(d(2026, 9, 17, 11, 59), hozir) === "kechikkan",
  dueHolat(d(2026, 9, 17, 11, 59), hozir));
check("bugun 09:00 — KECHIKKAN (kun ichida ham qizil bo'ladi)",
  dueHolat(d(2026, 9, 17, 9, 0), hozir) === "kechikkan");
check("kecha 23:59 — KECHIKKAN",
  dueHolat(d(2026, 9, 16, 23, 59), hozir) === "kechikkan");
check("bir hafta oldin — KECHIKKAN",
  dueHolat(d(2026, 9, 10, 12, 0), hozir) === "kechikkan");

check("ertaga 09:00 — kutilmoqda",
  dueHolat(d(2026, 9, 18, 9, 0), hozir) === "kutilmoqda");
check("keyingi oy — kutilmoqda",
  dueHolat(d(2026, 10, 5, 12, 0), hozir) === "kutilmoqda");

console.log("\n━━━ MATN ━━━\n");

check("bugun — \"Bugun 15:00\"",
  dueMatn(d(2026, 9, 17, 15, 0), hozir) === "Bugun 15:00",
  dueMatn(d(2026, 9, 17, 15, 0), hozir));
check("ertaga — \"Ertaga 10:30\"",
  dueMatn(d(2026, 9, 18, 10, 30), hozir) === "Ertaga 10:30",
  dueMatn(d(2026, 9, 18, 10, 30), hozir));
check("kecha — \"Kecha ...\"",
  dueMatn(d(2026, 9, 16, 16, 0), hozir).startsWith("Kecha "),
  dueMatn(d(2026, 9, 16, 16, 0), hozir));
check("uzoq sana — kun va oy ko'rinadi",
  /\d/.test(dueMatn(d(2026, 9, 25, 15, 0), hozir))
    && dueMatn(d(2026, 9, 25, 15, 0), hozir).includes("15:00"),
  dueMatn(d(2026, 9, 25, 15, 0), hozir));
check("soat ikki xonali (09:05)",
  dueMatn(d(2026, 9, 17, 9, 5), hozir) === "Bugun 09:05",
  dueMatn(d(2026, 9, 17, 9, 5), hozir));
check("yarim tun 00:00 to'g'ri yoziladi",
  dueMatn(d(2026, 9, 17, 0, 0), hozir) === "Bugun 00:00",
  dueMatn(d(2026, 9, 17, 0, 0), hozir));

console.log(`\n${fail === 0 ? "✅" : "❌"} Jami: ${pass} o'tdi, ${fail} yiqildi\n`);
process.exit(fail === 0 ? 0 : 1);
