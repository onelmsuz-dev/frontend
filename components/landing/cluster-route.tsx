import type { Metadata } from "next";
import Script from "next/script";
import { getClusterEntry } from "@/lib/i18n/clusters";
import { getClusterMeta } from "@/lib/i18n/cluster-meta";
import { absoluteUrl, alternatesFor, openGraphLocale, type Locale } from "@/lib/i18n/config";
import { getUi } from "@/lib/i18n/ui";
import { ORG_ID, SITE_URL } from "@/lib/seo/site";
import { ClusterPage, type ClusterPageContent } from "./cluster-page";

/**
 * RUSCHA / INGLIZCHA YECHIM SAHIFALARI (`/ru/davomat`, `/en/davomat`...).
 *
 * O'zbekcha sahifalar (`app/davomat/page.tsx`...) o'z matn va JSON-LD'ini o'zida saqlaydi va o'zgarmagan;
 * ruscha/inglizcha uchun matn `lib/i18n/clusters/*.ts` da, metadata va JSON-LD shu yerda quriladi
 * (tuzilma o'zbekcha sahifalar bilan bir xil: Service + FAQPage + BreadcrumbList).
 */
type Lang = Exclude<Locale, "uz">;

export function clusterMetadata(slug: string, locale: Lang): Metadata {
  const entry = getClusterEntry(slug, locale);
  if (!entry) return {};
  const { doc } = entry;
  const url = absoluteUrl(`/${slug}`, locale);
  const ogImage = `${SITE_URL}/${locale}/opengraph-image`;
  return {
    title: doc.title,
    description: doc.description,
    keywords: doc.keywords,
    alternates: alternatesFor(`/${slug}`, locale),
    openGraph: {
      type: "website",
      ...openGraphLocale(locale),
      url,
      siteName: "OneRoom",
      title: doc.title,
      description: doc.description,
      // Bo'sh qoldirilsa (o'zbekcha yechim sahifalaridagidek) havola rasmsiz chiqadi: aniq ko'rsatiladi.
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title: doc.title, description: doc.description, images: [ogImage] },
  };
}

export function ClusterRoute({ slug, locale }: { slug: string; locale: Lang }) {
  const entry = getClusterEntry(slug, locale);
  if (!entry) return null;
  const { doc, icons, leadSource } = entry;
  const path = `/${slug}`;
  const url = absoluteUrl(path, locale);
  const meta = getClusterMeta(locale).find((p) => p.href === path);

  const service = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: doc.serviceType,
    provider: { "@id": ORG_ID },
    areaServed: "UZ",
    url,
    inLanguage: locale,
    description: doc.description,
  };
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: locale,
    mainEntity: doc.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: getUi(locale).cluster.home, item: absoluteUrl("/", locale) },
      { "@type": "ListItem", position: 2, name: meta?.navLabel ?? doc.h1, item: url },
    ],
  };

  const content: ClusterPageContent = {
    href: path,
    locale,
    eyebrow: doc.eyebrow,
    h1: doc.h1,
    subtitle: doc.subtitle,
    heroBullets: doc.heroBullets,
    painHeading: doc.painHeading,
    painSubheading: doc.painSubheading,
    painPoints: doc.painPoints,
    featuresHeading: doc.featuresHeading,
    featuresSubheading: doc.featuresSubheading,
    features: doc.features.map((f, i) => ({ icon: icons[i], ...f })),
    steps: doc.steps,
    faqHeading: doc.faqHeading,
    faq: doc.faq,
    leadSource,
    leadHeading: doc.leadHeading,
    leadDescription: doc.leadDescription,
    leadCta: doc.leadCta,
  };

  return (
    <>
      <Script id={`schema-service-${slug}-${locale}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(service) }} />
      <Script id={`schema-faq-${slug}-${locale}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
      <Script id={`schema-breadcrumb-${slug}-${locale}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <ClusterPage {...content} />
    </>
  );
}
