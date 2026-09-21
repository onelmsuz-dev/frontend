/**
 * OCHIQ SAHIFALAR QO'RIQCHISI.
 *
 *     npm run verify:ochiq
 *
 * Login talabi faqat shaxsiy kabinetlarda. Bosh sahifa, yechim sahifalari va blog
 * sessiya holatidan qat'i nazar ochiq qolishi kerak — aks holda brauzerda muddati
 * o'tgan sessiya qolgan mehmon bosh sahifadan `/login?muddat=1` ga tushib ketadi
 * (2026-09-21 da shunday bo'lgan).
 *
 * Uch narsa tekshiriladi:
 *   1. ochiq yo'llar ochiq, shaxsiy kabinet yo'llari HIMOYALANGAN (prefiks ortiqcha
 *      ushlamasligi ham: `/blogger` ochiq emas);
 *   2. har bir klaster sahifa ochiq;
 *   3. `proxy.ts` ham, `SessionWatcher` ham ro'yxatni shu manbadan oladi — ikki joyda
 *      alohida ro'yxat yuritilmasin (aks holda yana ajralib ketadi).
 */
import { readFileSync } from "node:fs";
import { isPublicPath } from "../lib/public-paths";
import { CLUSTER_PAGES } from "../lib/seo/cluster-pages";

let ok = 0, bad = 0;
const t = (label: string, got: unknown, want: unknown) => {
  if (got === want) { ok++; console.log(`  ✅ ${label}`); }
  else { bad++; console.log(`  ❌ ${label} → ${got} (kutilgan ${want})`); }
};

console.log("Ochiq yo'llar:");
for (const p of ["/", "/ads", "/target", "/blog", "/blog/birinchi-maqola", "/davomat/", "/robots.txt", "/sitemap.xml"])
  t(p, isPublicPath(p), true);

console.log("Klaster sahifalar:");
for (const c of CLUSTER_PAGES) t(c.href, isPublicPath(c.href), true);

console.log("Shaxsiy kabinet (himoyalangan):");
for (const p of [
  "/dashboard", "/students", "/students/12", "/teachers", "/courses", "/groups", "/attendance",
  "/finance", "/settings", "/leads", "/sms", "/panel", "/panel/profile", "/admode", "/admode/users", "/login",
])
  t(p, isPublicPath(p), false);

console.log("Prefiks ortiqcha ushlamasligi:");
for (const p of ["/blogger", "/davomatx", "/targetx", "/adsx"]) t(p, isPublicPath(p), false);

console.log("Yagona manba:");
for (const f of ["proxy.ts", "components/auth/session-watcher.tsx"]) {
  const src = readFileSync(new URL(`../${f}`, import.meta.url), "utf8");
  t(`${f} lib/public-paths dan oladi`, /from "@\/lib\/public-paths"/.test(src), true);
}

console.log(`\n${bad === 0 ? "✅" : "❌"} ${ok} o'tdi, ${bad} yiqildi`);
process.exitCode = bad === 0 ? 0 : 1;
