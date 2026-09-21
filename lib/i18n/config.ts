/**
 * OCHIQ SAYT TILLARI (o'zbek — asosiy, rus, ingliz).
 *
 * URL tuzilmasi (SEO uchun):
 *   - O'zbekcha — ASOSIY til, prefikssiz: `/`, `/davomat`, `/blog`. Mavjud manzillar O'ZGARMAGAN.
 *   - Ruscha — `/ru`, `/ru/davomat`, `/ru/blog/...`
 *   - Inglizcha — `/en`, `/en/davomat`, `/en/blog/...`
 * Sahifa manzillari (slug) uch tilda bir xil: `/davomat` ↔ `/ru/davomat` ↔ `/en/davomat`.
 *
 * Bu fayl ataylab kichik va yon ta'sirsiz: edge middleware (`proxy.ts` orqali
 * `lib/public-paths.ts`), server va brauzer komponentlari import qiladi.
 */
import { SITE_URL } from "@/lib/seo/site";

export const LOCALES = ["uz", "ru", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "uz";

/** URL'da prefiks bor tillar (asosiy til prefikssiz). */
export const PREFIXED_LOCALES = ["ru", "en"] as const;

export const LOCALE_META: Record<Locale, { name: string; short: string; og: string }> = {
  uz: { name: "O‘zbekcha", short: "UZ", og: "uz_UZ" },
  ru: { name: "Русский", short: "RU", og: "ru_RU" },
  en: { name: "English", short: "EN", og: "en_US" },
};

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** Manzil boshidagi `/ru` yoki `/en` bo'yicha til; prefiks yo'q bo'lsa — o'zbekcha. */
export function localeFromPathname(pathname: string | null | undefined): Locale {
  const first = (pathname ?? "/").split("/")[1];
  return first === "ru" || first === "en" ? first : DEFAULT_LOCALE;
}

/** `/ru/davomat` → `/davomat`, `/ru` → `/`. Prefikssiz manzil o'zgarmaydi. */
export function stripLocale(pathname: string): string {
  const m = pathname.match(/^\/(?:ru|en)(\/.*)?$/);
  return m ? (m[1] ?? "/") : pathname;
}

/** Til uchun manzil: (`/davomat`, ru) → `/ru/davomat`; (`/`, en) → `/en`; uz — o'zgarmaydi. */
export function localizePath(path: string, locale: Locale): string {
  const base = stripLocale(path);
  if (locale === DEFAULT_LOCALE) return base;
  return base === "/" ? `/${locale}` : `/${locale}${base}`;
}

/** Absolyut URL. Bosh sahifa (uz) — `SITE_URL` aynan o'zi (oxirida `/`siz): canonical o'zgarmasligi uchun. */
export function absoluteUrl(path: string, locale: Locale): string {
  const p = localizePath(path, locale);
  return p === "/" ? SITE_URL : `${SITE_URL}${p}`;
}

/**
 * Metadata `alternates`: o'z canonical'i + barcha tillarga `hreflang` (+ `x-default` = o'zbekcha).
 * `path` — tilsiz manzil (`/davomat`); `locale` — hozirgi sahifa tili.
 */
export function alternatesFor(path: string, locale: Locale = DEFAULT_LOCALE) {
  return {
    canonical: absoluteUrl(path, locale),
    languages: {
      uz: absoluteUrl(path, "uz"),
      ru: absoluteUrl(path, "ru"),
      en: absoluteUrl(path, "en"),
      "x-default": absoluteUrl(path, "uz"),
    },
  };
}

/** OpenGraph: joriy til + boshqa tillar (`alternateLocale`). */
export function openGraphLocale(locale: Locale) {
  return {
    locale: LOCALE_META[locale].og,
    alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => LOCALE_META[l].og),
  };
}
