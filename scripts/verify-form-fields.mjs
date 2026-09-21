/**
 * "O'LIK MAYDON" QO'RIQCHISI.
 *
 * Bu xato turi loyihada TO'RT MARTA takrorlandi va har safar jimgina
 * o'tdi — forma maydonni yig'adi, serverga yuboradi, server uni
 * qo'llab-quvvatlaydi, LEKIN uni o'zgartiradigan tugma ekranda yo'q:
 *
 *   courseIds             chegirma kurs cheklovi — hech qachon saqlanmagan
 *   affectsTeacherSalary  "oyligidan ayirilmasin" katagi — ta'sirsiz
 *   billingProrate        "Birinchi oy" bloki — tasodifan o'chgan
 *   billingStart          "Sinov darslari uchun to'lov" — tugmalari
 *                         boshqa sozlamaniki bilan almashib ketgan
 *
 * Bunday holat O'ZINI KO'RSATMAYDI: ekran ishlayotgandek turadi,
 * saqlash "Saqlandi" deydi, qiymat esa serverdagicha qaytib keladi.
 * Faqat markaz "nega o'zgarmayapti" deb xabar berganda bilinadi.
 *
 * QOIDA: saqlash tanasiga tushadigan har bir holat o'zgaruvchisining
 * `setX(...)` chaqiruvi kamida IKKI joyda bo'lishi kerak — biri
 * serverdan yuklash effektida, kamida bittasi foydalanuvchi
 * harakatida. Faqat bittasi bo'lsa — maydonni o'zgartirib bo'lmaydi.
 */
import { readFileSync } from "node:fs";

const FAYLLAR = [
  "components/settings/billing-settings.tsx",
  "components/settings/discounts-section.tsx",
  "components/settings/appearance-section.tsx",
];

/**
 * ATAYLAB UI SIZ qoldirilgan maydonlar — sababi bilan.
 * Ro'yxat qisqa bo'lishi kerak; uzaysa, qoidaning o'zi buzilyapti.
 */
const ATAYLAB = {
  "billing-settings.tsx:advanceDays":
    "\"Oldindan N kun\" tanlovi 2026-09-15 da ataylab olib tashlangan " +
    "(u alohida rejim emas edi). Qiymat bazada saqlanadi va shu yerdan " +
    "o'zgarmasdan qaytadi — yo'qolib ketmasligi uchun yuboriladi.",
};

let xato = 0;
const ayt = (m) => { console.log(`  ❌ ${m}`); xato++; };

console.log("\n═══ FORMA MAYDONLARI: har biri o'zgartiriladimi ═══\n");

for (const f of FAYLLAR) {
  let src;
  try { src = readFileSync(new URL(`../${f}`, import.meta.url), "utf8"); }
  catch { console.log(`  ⚠️  ${f} topilmadi — o'tkazildi`); continue; }

  const nom = f.split("/").pop();

  // `const [x, setX] = useState` juftliklari
  const holatlar = [...src.matchAll(/const \[(\w+),\s*(set\w+)\]\s*=\s*useState/g)]
    .map((m) => ({ ozgaruvchi: m[1], setter: m[2] }));

  /**
   * SAQLASH TANASI. Ikki naqsh uchraydi:
   *   fetch(..., { body: JSON.stringify({ ... }) })
   *   const body = editId ? { ... } : { ... };  keyin JSON.stringify(body)
   * Ikkalasini ham qamraymiz — qavslar bo'yicha, regex bilan emas:
   * ichki obyektlar regexni jimgina qirqib tashlardi va maydon
   * "yuborilmagan" deb o'tkazib yuborilardi.
   */
  const bolak = (boshIdx) => {
    let i = src.indexOf("(", boshIdx);
    if (i < 0) return "";
    let chuqur = 0;
    for (let j = i; j < src.length; j++) {
      const c = src[j];
      if (c === "(" || c === "{" || c === "[") chuqur++;
      else if (c === ")" || c === "}" || c === "]") {
        chuqur--;
        if (chuqur === 0) return src.slice(i + 1, j);
      }
    }
    return src.slice(i);
  };

  const hududlar = [];
  for (const m of src.matchAll(/JSON\.stringify/g)) hududlar.push(bolak(m.index));
  for (const m of src.matchAll(/const body\s*=/g)) {
    // `const body = ... ;` — nuqtali vergulgacha
    const oxir = src.indexOf(";", m.index);
    hududlar.push(src.slice(m.index, oxir < 0 ? src.length : oxir));
  }
  const tana = hududlar.join("\n");

  // `useEffect(...)` hududlari — ular "foydalanuvchi harakati" emas.
  const effektlar = [...src.matchAll(/useEffect\s*\(/g)]
    .map((m) => { const t = bolak(m.index + 9); return [m.index, m.index + t.length]; });
  const effektdami = (i) => effektlar.some(([a, b]) => i >= a && i <= b);

  const tashqarida = (setter) => {
    let n = 0;
    for (const m of src.matchAll(new RegExp(`\\b${setter}\\b`, "g"))) {
      // E'lon qatori: `const [x, setX] = useState`
      const qator = src.slice(src.lastIndexOf("\n", m.index) + 1,
                              src.indexOf("\n", m.index));
      if (/const \[/.test(qator) && /useState/.test(qator)) continue;
      if (effektdami(m.index)) continue;
      n++;
    }
    return n;
  };

  let tekshirildi = 0;
  for (const { ozgaruvchi, setter } of holatlar) {
    // `kalit: ozgaruvchi` yoki qisqartma `{ ozgaruvchi, }`
    const yuborilgan = new RegExp(`\\b${ozgaruvchi}\\b`).test(tana);
    if (!yuborilgan) continue;
    tekshirildi++;

    /**
     * `setX(` YETARLI EMAS: setter ko'pincha HAVOLA sifatida
     * uzatiladi — `<DatePicker onChange={setStartsAt} />`. Shuning
     * uchun `useEffect` bloklaridan TASHQARIDAGI har qanday
     * ishlatilishni sanaymiz (e'lon qatorining o'zi hisobga
     * olinmaydi). Effekt ichidagisi — serverdan yuklash, u
     * foydalanuvchi harakati emas.
     */
    const marta = tashqarida(setter);
    const kalit = `${nom}:${ozgaruvchi}`;
    if (marta >= 1) continue;
    if (ATAYLAB[kalit]) {
      console.log(`  ⏭️  ${kalit} — ataylab UI siz`);
      continue;
    }
    ayt(`${kalit} serverga YUBORILADI, lekin ${setter}() effektdan tashqarida `
      + `${marta} marta ishlatilgan — ya'ni uni o'zgartiradigan tugma yo'q.`);
  }
  /**
   * NOL MAYDON — ✅ EMAS.
   *
   * Bu "hammasi joyida" degani emas, "qo'riqchi bu faylda hech
   * narsani ko'rmadi" degani. Masalan saqlash tanasida hosila
   * qiymat turgan bo'lsa (`uiFontScale: tanlov`, bu yerda `tanlov`
   * — `useState` emas, undan hisoblangan) qo'riqchi uni topa
   * olmaydi. Yashil belgi qo'yilsa, qamrov yo'qligi qamrov bordek
   * ko'rinardi.
   */
  console.log(tekshirildi === 0
    ? `  ⚠️  ${nom} — maydon topilmadi (qo'riqchi bu faylni qoplamayapti)`
    : `  ✅ ${nom} — ${tekshirildi} ta maydon tekshirildi`);
}

console.log(xato === 0
  ? "\n✅ O'lik maydon topilmadi\n"
  : `\n❌ ${xato} ta o'lik maydon\n`);
process.exit(xato === 0 ? 0 : 1);
