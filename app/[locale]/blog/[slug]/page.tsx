import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogArticle, articleMetadata } from "@/components/blog/blog-article";
import { getPosts } from "@/lib/blog/posts";
import { PREFIXED_LOCALES } from "@/lib/i18n/config";

export const dynamicParams = false;

export function generateStaticParams() {
  return PREFIXED_LOCALES.flatMap((locale) => getPosts(locale).map(({ slug }) => ({ locale, slug })));
}

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  return locale === "ru" || locale === "en" ? articleMetadata(slug, locale) : {};
}

/** Ruscha/inglizcha maqola (`/ru/blog/<slug>`, `/en/blog/<slug>`). O'zbekchasi — `app/blog/[slug]/page.tsx`. */
export default async function LocaleArticlePage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  if (locale !== "ru" && locale !== "en") notFound();
  return <BlogArticle slug={slug} locale={locale} />;
}
