/**
 * BOSH SAHIFA SEO — ruscha va inglizcha (metadata + JSON-LD).
 *
 * O'zbekcha manba: `app/page.tsx` (o'zgarmagan). Bu yerda xuddi shu tuzilma tarjima qilingan.
 * DIQQAT: tarif narxlari `components/landing/home/content.ts` va `app/page.tsx` dagi `offers` bilan
 * bir xil bo'lishi shart — Google structured data'ni ko'rinadigan matn bilan solishtiradi.
 * Bo'lmagan da'volar (reyting, "500+ markaz" kabi tasdiqlanmagan raqamlar) ATAYLAB yozilmagan.
 */
import type { Metadata } from "next";
import { ORG_ID, SITE_URL, WEBSITE_ID, CONTACT_PHONE } from "@/lib/seo/site";
import { alternatesFor, absoluteUrl, openGraphLocale, type Locale } from "./config";
import { getHomeContent } from "@/components/landing/home/content-i18n";

type Lang = Exclude<Locale, "uz">;

const T = {
  ru: {
    title: "OneRoom — LMS и CRM для учебных центров | Узбекистан",
    description:
      "OneRoom — платформа управления для учебных центров Узбекистана. Управляйте учениками, платежами, расписанием, посещаемостью и отчётами в одной системе. Начните бесплатно.",
    keywords: [
      "OneRoom",
      "CRM для учебного центра",
      "система управления учебным центром",
      "программа для учебного центра",
      "платформа управления учебным центром",
      "LMS для учебных центров",
    ],
    ogTitle: "OneRoom — LMS и CRM для учебных центров",
    ogDescription: "Ученики, платежи, расписание и посещаемость — на одном экране. Платформа для учебных центров Узбекистана.",
    twTitle: "OneRoom — LMS и CRM для учебных центров",
    twDescription: "Ученики, платежи, расписание и посещаемость в одной платформе. Начните бесплатно.",
    orgDescription:
      "OneRoom — платформа LMS и CRM, разработанная специально для учебных центров Узбекистана. Позволяет управлять учениками, платежами, расписанием, посещаемостью и отчётами в одной системе.",
    softwareDescription:
      "OneRoom — полная платформа управления для учебных центров. Модули: регистрация учеников, учёт платежей, расписание занятий, контроль посещаемости, CRM и отчёты.",
    featureList: [
      "Управление учениками и CRM",
      "Платежи и финансовая отчётность",
      "Расписание занятий и управление кабинетами",
      "Контроль посещаемости и QR-код",
      "Уведомления через Telegram-бот",
      "Управление несколькими филиалами",
      "Экспорт в Excel и PDF",
      "Отчёты в реальном времени",
    ],
    offers: [
      "Тариф Starter — до 200 учеников, 1 филиал",
      "Тариф Business — до 500 учеников, 3 филиала",
      "Тариф Premium — до 1000 учеников, 8 филиалов",
    ],
    siteDescription: "Платформа LMS и CRM для учебных центров",
    breadcrumbHome: "Главная",
    knowsAbout: "Управление учебным центром",
  },
  en: {
    title: "OneRoom — LMS and CRM for Learning Centers | Uzbekistan",
    description:
      "OneRoom is a management platform for learning centers in Uzbekistan. Manage students, payments, schedules, attendance and reports in a single system. Start for free.",
    keywords: [
      "OneRoom",
      "CRM for learning centers",
      "learning center management system",
      "learning center software",
      "education center management platform",
      "LMS for learning centers",
    ],
    ogTitle: "OneRoom — LMS and CRM for Learning Centers",
    ogDescription: "Students, payments, schedules and attendance on one screen. A platform for learning centers in Uzbekistan.",
    twTitle: "OneRoom — LMS and CRM for Learning Centers",
    twDescription: "Students, payments, schedules and attendance in a single platform. Start for free.",
    orgDescription:
      "OneRoom is an LMS and CRM platform built specifically for learning centers in Uzbekistan. It lets you manage students, payments, schedules, attendance and reports in a single system.",
    softwareDescription:
      "OneRoom is a complete management platform for learning centers. Modules include student registration, payment tracking, class scheduling, attendance control, CRM and reports.",
    featureList: [
      "Student management and CRM",
      "Payments and financial reporting",
      "Class schedule and room management",
      "Attendance control and QR code",
      "Telegram bot notifications",
      "Multi-branch management",
      "Excel and PDF export",
      "Real-time reports",
    ],
    offers: [
      "Starter plan — up to 200 students, 1 branch",
      "Business plan — up to 500 students, 3 branches",
      "Premium plan — up to 1,000 students, 8 branches",
    ],
    siteDescription: "LMS and CRM platform for learning centers",
    breadcrumbHome: "Home",
    knowsAbout: "Learning center management",
  },
} as const;

export function homeMetadata(locale: Lang): Metadata {
  const t = T[locale];
  const url = absoluteUrl("/", locale);
  return {
    title: t.title,
    description: t.description,
    keywords: [...t.keywords],
    authors: [{ name: "OneRoom", url: SITE_URL }],
    creator: "OneRoom",
    publisher: "OneRoom",
    alternates: alternatesFor("/", locale),
    openGraph: {
      type: "website",
      ...openGraphLocale(locale),
      url,
      siteName: "OneRoom",
      title: t.ogTitle,
      description: t.ogDescription,
    },
    twitter: { card: "summary_large_image", title: t.twTitle, description: t.twDescription, creator: "@oneroomuz" },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
    },
  };
}

/** JSON-LD bloklari (id → obyekt). Kalitlar `app/page.tsx` dagi id'lar bilan bir xil. */
export function homeSchemas(locale: Lang): Record<string, unknown> {
  const t = T[locale];
  const url = absoluteUrl("/", locale);
  const copy = getHomeContent(locale);
  const prices = ["270000", "570000", "870000"];
  const names = ["Starter", "Business", "Premium"];
  return {
    "schema-organization": {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": ORG_ID,
      name: "OneRoom",
      alternateName: "One Room",
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png`, width: 200, height: 60 },
      description: t.orgDescription,
      foundingDate: "2024",
      address: { "@type": "PostalAddress", addressLocality: locale === "ru" ? "Ташкент" : "Tashkent", addressCountry: "UZ" },
      contactPoint: [
        { "@type": "ContactPoint", telephone: CONTACT_PHONE, contactType: "customer service", availableLanguage: ["Uzbek", "Russian"] },
        { "@type": "ContactPoint", email: "support@oneroom.uz", contactType: "technical support" },
      ],
      sameAs: ["https://t.me/oneroomuz", "https://instagram.com/oneroom.uz"],
      knowsAbout: ["Learning Management System", "CRM for Education", "Student Management Software", t.knowsAbout],
    },
    "schema-software": {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#software`,
      name: "OneRoom",
      applicationCategory: "BusinessApplication",
      applicationSubCategory: "Education Management Software",
      operatingSystem: "Web",
      url,
      inLanguage: locale,
      description: t.softwareDescription,
      featureList: [...t.featureList],
      offers: names.map((name, i) => ({
        "@type": "Offer",
        name,
        price: prices[i],
        priceCurrency: "UZS",
        billingIncrement: "P1M",
        description: t.offers[i],
      })),
      provider: { "@id": ORG_ID },
    },
    "schema-website": {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${WEBSITE_ID}-${locale}`,
      url,
      name: "OneRoom",
      description: t.siteDescription,
      inLanguage: locale,
      publisher: { "@id": ORG_ID },
    },
    "schema-faq": {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: locale,
      mainEntity: copy.faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
    "schema-breadcrumb": {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [{ "@type": "ListItem", position: 1, name: t.breadcrumbHome, item: url }],
    },
  };
}
