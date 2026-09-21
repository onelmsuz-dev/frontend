import { notFound } from "next/navigation";
import { LangSync } from "@/components/landing/lang-sync";
import { PREFIXED_LOCALES } from "@/lib/i18n/config";

/**
 * RUSCHA (`/ru/...`) VA INGLIZCHA (`/en/...`) SAHIFALAR.
 *
 * O'zbekcha — asosiy til — prefikssiz manzillarda (`app/page.tsx`, `app/davomat/...`), ular O'ZGARMAGAN.
 * Bu daraxt faqat `ru` va `en` uchun: boshqa qiymatlar (`/uz`, `/foo`) 404 beradi.
 * Sahifalar oldindan yaratiladi (statik), SEO uchun tayyor HTML.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return PREFIXED_LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== "ru" && locale !== "en") notFound();

  return (
    <>
      {/* Birinchi yuklash: `<html lang>` bo'yashdan oldin o'rnatiladi (LangSync — keyingi navigatsiyalar uchun). */}
      <script dangerouslySetInnerHTML={{ __html: `document.documentElement.lang=${JSON.stringify(locale)};` }} />
      <LangSync locale={locale} />
      {children}
    </>
  );
}
