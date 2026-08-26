// Butun sayt bo'ylab ishlatiladigan SEO konstantalari — bitta joyda,
// har bir landing sahifasida qayta yozilmasin.

// DIQQAT: `www` bilan — Vercel'da `oneroom.uz` (apex) ATAYLAB
// `www.oneroom.uz`ga 308 bilan qayta yo'naltiriladi (domen sozlamalarida
// shunday). Bu yerda `www`siz yozilsa, canonical/sitemap/JSON-LD real
// yakuniy URL bilan mos kelmay, Google uchun chalkash signal berardi —
// crawler oxir-oqibat www'ga tushadi-yu, sahifadagi canonical esa uni
// orqaga, qayta yo'naltiruvchi manzilga yuborardi.
export const SITE_URL = "https://www.oneroom.uz";
export const SITE_NAME = "OneRoom";
export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
