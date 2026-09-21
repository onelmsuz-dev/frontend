import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClusterRoute, clusterMetadata } from "@/components/landing/cluster-route";
import { PREFIXED_LOCALES } from "@/lib/i18n/config";
import { CLUSTER_SLUGS } from "@/lib/i18n/clusters";

export const dynamicParams = false;

export function generateStaticParams() {
  return PREFIXED_LOCALES.flatMap((locale) => CLUSTER_SLUGS.map((slug) => ({ locale, slug })));
}

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (locale !== "ru" && locale !== "en") return {};
  return clusterMetadata(slug, locale);
}

/** Ruscha (`/ru/<sahifa>`) va inglizcha (`/en/<sahifa>`) yechim sahifalari. O'zbekchasi — `app/<sahifa>/page.tsx`. */
export default async function LocaleClusterPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  if ((locale !== "ru" && locale !== "en") || !CLUSTER_SLUGS.includes(slug)) notFound();
  return <ClusterRoute slug={slug} locale={locale} />;
}
