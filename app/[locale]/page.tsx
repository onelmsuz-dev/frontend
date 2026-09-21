import type { Metadata } from "next";
import Script from "next/script";
import { notFound } from "next/navigation";
import { ApplyProvider } from "@/components/landing/apply-dialog";
import { HomeLanding } from "@/components/landing/home/home-landing";
import { PREFIXED_LOCALES } from "@/lib/i18n/config";
import { homeMetadata, homeSchemas } from "@/lib/i18n/home-seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return PREFIXED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "ru" && locale !== "en") return {};
  return homeMetadata(locale);
}

/** Ruscha (`/ru`) va inglizcha (`/en`) bosh sahifa. O'zbekchasi — `app/page.tsx`. */
export default async function LocaleHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== "ru" && locale !== "en") notFound();

  return (
    <>
      {Object.entries(homeSchemas(locale)).map(([id, schema]) => (
        <Script key={id} id={`${id}-${locale}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      {/* `page` — Telegramga boradigan xabardagi manba yorlig'i (administratorlar uchun, o'zbekcha + til) */}
      <ApplyProvider page={`Bosh sahifa [${locale.toUpperCase()}]`}>
        <HomeLanding locale={locale} />
      </ApplyProvider>
    </>
  );
}
