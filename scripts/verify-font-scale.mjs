/**
 * SHRIFT SOZLAMASI HAQIQATAN ISHLAYAPTIMI.
 *
 * Bu mexanizm ko'rinmas: agar plagin jim qolsa, sozlama saqlanadi,
 * tugma yonadi — lekin ekranda HECH NARSA o'zgarmaydi. Xato faqat
 * odam "kattalashmadi-ku" deganda bilinadi. Shuning uchun sinov.
 *
 * Aynan shu yerda bir marta tuzoqqa tushilgan: `".875rem".endsWith("em")`
 * ROST, ya'ni "em ni chetlab o't" degan tekshiruv BARCHA rem
 * qiymatlarini ham chetlab o'tgan va Tailwind'ning `text-sm`,
 * `text-xs` kabi o'lchamlari kattalashmay qolgan edi.
 */
import postcss from "postcss";
import fontScale from "./postcss-font-scale.mjs";

let pass = 0, fail = 0;
const check = (l, ok, x = "") => {
  if (ok) { pass++; console.log(`  ✅ ${l}`); }
  else { fail++; console.log(`  ❌ ${l}${x ? `\n     ${x}` : ""}`); }
};

const run = (css) => postcss([fontScale()]).process(css, { from: undefined }).css;

console.log("\n═══ SHRIFT O'LCHAMI PLAGINI ═══\n");

const px = run(".text-\\[11px\\]{font-size:11px}");
check("qattiq px kattalashadi", px.includes("calc(11px * var(--font-scale, 1))"), px);

const kasr = run("a{font-size:12.5px}");
check("kasrli px ham", kasr.includes("calc(12.5px * var(--font-scale, 1))"), kasr);

const rem = run(":root{--text-sm:.875rem}");
check("Tailwind mavzu o'zgaruvchisi (rem) ham — `endsWith('em')` tuzog'i",
  rem.includes("calc(.875rem * var(--font-scale, 1))"), rem);

const lh = run(":root{--text-sm--line-height:calc(1.25 / .875)}");
check("qator balandligiga TEGILMAYDI (u nisbat, o'zi kattalashadi)",
  !lh.includes("--font-scale"), lh);

const em = run("a{font-size:1.5em}");
check("`em` ga tegilmaydi (allaqachon nisbiy)", !em.includes("--font-scale"), em);

const hisob = run("a{font-size:calc(1rem + 2px)}");
check("tayyor calc() ga tegilmaydi", !hisob.includes("--font-scale"), hisob);

const ozg = run("a{font-size:var(--x)}");
check("var() ga tegilmaydi", !ozg.includes("--font-scale"), ozg);

const foiz = run("a{font-size:120%}");
check("foizga tegilmaydi", !foiz.includes("--font-scale"), foiz);

const boshqa = run(":root{--text-shadow-sm:1px}");
check("shriftga aloqasiz `--text-*` o'zgaruvchi tegilmaydi",
  !boshqa.includes("--font-scale"), boshqa);

const ikki = run("a{font-size:calc(11px * var(--font-scale, 1))}");
check("IKKI MARTA ko'paytirilmaydi",
  ikki.match(/font-scale/g).length === 1, ikki);

// Pastki mobil menyu — ko'paytirgich CHEGARALANGAN.
// U 5 ta teng ustun; to'liq kattalashtirilsa "O'quvchilar" katakni
// kengaytirib menyuni yorib chiqardi (375px da har katak ~62px).
const menyu = run(".bottom-nav-label{font-size:calc(10px * min(var(--font-scale, 1), 1.15))}");
check("pastki menyu chegarasiga TEGILMAYDI (tayyor calc)",
  !menyu.includes("--font-scale, 1))  *"), menyu);

console.log(`\n${fail === 0 ? "✅" : "❌"} ${pass}/${pass + fail}\n`);
process.exit(fail === 0 ? 0 : 1);
