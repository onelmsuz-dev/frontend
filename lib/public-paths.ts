/**
 * OCHIQ SAHIFALAR — login talab QILMAYDIGAN yo'llar, bitta manba.
 *
 * Uni ikki joy o'qiydi:
 *   - `proxy.ts` (middleware) — bu yo'llarni login'ga yo'naltirmaydi;
 *   - `SessionWatcher` (brauzer) — bu yo'llarda muddati tugagan sessiya odamni
 *     `/login?muddat=1` ga HAYDAMAYDI.
 *
 * Nega bitta fayl: ilgari ro'yxat faqat `proxy.ts` da edi, `SessionWatcher` esa
 * `Providers` orqali HAMMA sahifada (bosh sahifa ham) ishlardi. Brauzerda oldingi
 * kirishdan muddati o'tgan sessiya qolgan bo'lsa, bosh sahifani ochgan odam
 * login'ga tushib qolardi. Ro'yxat ikki joyda alohida yuritilsa yana ajralib ketadi.
 *
 * Tamoyil: login talabi faqat SHAXSIY kabinetlarda (`/dashboard`, `/panel`,
 * `/admode` va boshqa ilova sahifalari). Yangi ilova sahifasi bu ro'yxatga
 * tushmaydi, ya'ni sukut bo'yicha HIMOYALANGAN. Yangi ochiq sahifa (landing, blog)
 * shu yerga qo'shiladi.
 *
 * Fayl ataylab kichik va yon ta'sirsiz: edge middleware ham, brauzer ham import qiladi.
 */
import { CLUSTER_PAGES } from "@/lib/seo/cluster-pages";

const PUBLIC_EXACT = new Set<string>([
  "/",                                   // bosh sahifa
  ...CLUSTER_PAGES.map((p) => p.href),   // SEO yechim sahifalari (/davomat, /oquv-markaz-crm...)
  "/ads",                                // reklama so'rovnomasi
  "/target",                             // markazning ochiq ariza sahifasi (Instagram reklamasi)
  "/testgpt",                            // tajriba sahifasi (noindex)
  // Next.js o'zi generatsiya qiladigan metadata yo'llari
  "/robots.txt",
  "/sitemap.xml",
  "/opengraph-image",
  "/twitter-image",
]);

/** Ostidagi hamma sahifa ham ochiq (`/blog`, `/blog/maqola-nomi`). */
const PUBLIC_PREFIXES = ["/blog"];

export function isPublicPath(pathname: string): boolean {
  // "/davomat/" ham "/davomat" bilan bir xil.
  const path = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  if (PUBLIC_EXACT.has(path)) return true;
  return PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}
