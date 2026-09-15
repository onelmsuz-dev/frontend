import { guruhNarxi, narxMatni } from "../lib/group-price";
let ok = 0, bad = 0;
// `toLocaleString("uz-UZ")` ming ajratgichi sifatida UZILMAS bo'shliq
// (U+00A0) qo'yadi — ko'zga oddiy bo'shliqdek ko'rinadi, lekin teng emas.
const norm = (v: any) => typeof v === "string" ? v.replace(/\u00A0/g, " ") : v;
const t = (l: string, got: any, want: any) => {
  const p = JSON.stringify(norm(got)) === JSON.stringify(norm(want));
  if (p) { ok++; console.log(`  ✅ ${l}`); } else { bad++; console.log(`  ❌ ${l} → ${JSON.stringify(got)} (kutilgan ${JSON.stringify(want)})`); }
};
const kurs = { price: 600000, lessonPrice: 50000, modulePrice: 720000, coursePrice: 6000000 };
t("oylik", narxMatni(guruhNarxi("OYLIK_KALENDAR", kurs)), "600 000 so'm / oylik");
t("individual ham oylik narx", narxMatni(guruhNarxi("INDIVIDUAL", kurs)), "600 000 so'm / oylik");
t("kunlik → dars narxi", narxMatni(guruhNarxi("KUNLIK", kurs)), "50 000 so'm / dars");
t("modul → modul narxi", narxMatni(guruhNarxi("MODUL", kurs)), "720 000 so'm / modul");
t("butun kurs", narxMatni(guruhNarxi("KURS_UCHUN", kurs)), "6 000 000 so'm / kurs");
t("rejim noma'lum → oylik", narxMatni(guruhNarxi(null, kurs)), "600 000 so'm / oylik");
t("kunlik narxi yo'q → oylikka tushadi",
  narxMatni(guruhNarxi("KUNLIK", { price: 600000 })), "600 000 so'm / oylik");
t("kelishilgan narx ustun",
  narxMatni(guruhNarxi("OYLIK_KALENDAR", kurs, 450000)), "450 000 so'm / oylik");
t("kelishilgan bayrog'i", guruhNarxi("OYLIK_KALENDAR", kurs, 450000)?.kelishilgan, true);
t("kelishilgan yo'q bo'lsa bayroq false", guruhNarxi("OYLIK_KALENDAR", kurs)?.kelishilgan, false);
t("kurs yo'q → null", guruhNarxi("OYLIK_KALENDAR", null), null);
t("narx 0 → null", guruhNarxi("OYLIK_KALENDAR", { price: 0 }), null);
t("override 0 e'tiborsiz", narxMatni(guruhNarxi("OYLIK_KALENDAR", kurs, 0)), "600 000 so'm / oylik");
console.log(`\n${bad === 0 ? "✅" : "❌"} ${ok} o'tdi, ${bad} yiqildi`);
process.exitCode = bad === 0 ? 0 : 1;
