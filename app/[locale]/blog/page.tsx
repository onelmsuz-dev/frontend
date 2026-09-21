import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogIndex, blogIndexMetadata } from "@/components/blog/blog-index";
import { PREFIXED_LOCALES } from "@/lib/i18n/config";

export const dynamicParams = false;

export function generateStaticParams() {
  return PREFIXED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return locale === "ru" || locale === "en" ? blogIndexMetadata(locale) : {};
}

/** Ruscha (`/ru/blog`) va inglizcha (`/en/blog`) blog. O'zbekchasi — `app/blog/page.tsx`. */
export default async function LocaleBlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== "ru" && locale !== "en") notFound();
  return <BlogIndex locale={locale} />;
}
