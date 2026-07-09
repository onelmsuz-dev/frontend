import type { Metadata } from "next";
import Script from "next/script";
import { LandingHeader } from "@/components/landing/landing-header";
import { HeroSection } from "@/components/landing/hero-section";
import { StatsSection } from "@/components/landing/stats-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { FaqSection } from "@/components/landing/faq-section";
import { faqItems } from "@/components/landing/faq-data";
import { CtaSection } from "@/components/landing/cta-section";
import { LandingFooter } from "@/components/landing/landing-footer";

// ─── SEO Metadata ──────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "OneRoom — O'quv Markazlar uchun LMS va CRM Tizimi | O'zbekiston",
  description:
    "OneRoom — O'zbekistondagi o'quv markazlar uchun №1 boshqaruv platformasi. O'quvchilar, to'lovlar, jadval, davomot va hisobotlarni bitta tizimda boshqaring. Bepul boshlang.",
  keywords: [
    "o'quv markaz boshqaruvi",
    "LMS O'zbekiston",
    "CRM o'quv markaz",
    "o'quvchilar boshqaruvi",
    "to'lov kuzatuvi o'quv markaz",
    "dars jadvali tizimi",
    "davomot nazorati",
    "OneRoom",
    "ta'lim markaz dasturi",
  ],
  authors: [{ name: "OneRoom", url: "https://oneroom.uz" }],
  creator: "OneRoom",
  publisher: "OneRoom",
  metadataBase: new URL("https://oneroom.uz"),
  alternates: {
    canonical: "https://oneroom.uz",
  },
  openGraph: {
    type: "website",
    locale: "uz_UZ",
    url: "https://oneroom.uz",
    siteName: "OneRoom",
    title: "OneRoom — O'quv Markazlar uchun LMS va CRM Tizimi",
    description:
      "O'zbekistondagi 500+ o'quv markaz ishongan platforma. O'quvchilar, to'lovlar, jadval va davomatni bitta ekrandan boshqaring.",
    images: [
      {
        url: "https://oneroom.uz/og-image.png",
        width: 1200,
        height: 630,
        alt: "OneRoom — O'quv Markaz Boshqaruv Platformasi",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OneRoom — O'quv Markazlar uchun LMS va CRM",
    description:
      "O'quvchilar, to'lovlar, jadval va davomatni bitta platformada. Bepul boshlang.",
    images: ["https://oneroom.uz/og-image.png"],
    creator: "@oneroomuz",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// ─── JSON-LD Structured Data (SEO + AEO + GEO) ────────────────────────────────
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://oneroom.uz/#organization",
  name: "OneRoom",
  alternateName: "One Room",
  url: "https://oneroom.uz",
  logo: {
    "@type": "ImageObject",
    url: "https://oneroom.uz/logo.png",
    width: 200,
    height: 60,
  },
  description:
    "OneRoom — O'zbekistondagi o'quv markazlar uchun maxsus ishlab chiqilgan LMS va CRM platforma. O'quvchilar, to'lovlar, jadval, davomot va hisobotlarni bitta tizimda boshqarish imkonini beradi.",
  foundingDate: "2024",
  foundingLocation: {
    "@type": "Place",
    addressLocality: "Toshkent",
    addressCountry: "UZ",
  },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Toshkent",
    addressCountry: "UZ",
  },
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: "+998-71-234-56-78",
      contactType: "customer service",
      availableLanguage: ["Uzbek", "Russian"],
    },
    {
      "@type": "ContactPoint",
      email: "support@oneroom.uz",
      contactType: "technical support",
    },
  ],
  sameAs: [
    "https://t.me/oneroomuz",
    "https://instagram.com/oneroom.uz",
    "https://youtube.com/@oneroomuz",
  ],
  knowsAbout: [
    "Learning Management System",
    "CRM for Education",
    "Student Management Software",
    "Online Education Platform",
    "O'quv markaz boshqaruvi",
  ],
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": "https://oneroom.uz/#software",
  name: "OneRoom",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Education Management Software",
  operatingSystem: "Web, iOS, Android",
  url: "https://oneroom.uz",
  description:
    "OneRoom — o'quv markazlar uchun to'liq boshqaruv platformasi. O'quvchilar ro'yxatga olish, to'lovlar kuzatuvi, dars jadvali, davomot nazorati, CRM va hisobotlar modullari mavjud.",
  featureList: [
    "O'quvchilar boshqaruvi va CRM",
    "To'lovlar va moliya hisoboti",
    "Dars jadvali va xona boshqaruvi",
    "Davomot nazorati va QR kod",
    "Telegram bot bildirishnomalari",
    "Ko'p filialli boshqaruv",
    "Excel va PDF eksport",
    "Real vaqt hisobotlari",
  ],
  screenshot: "https://oneroom.uz/screenshot.png",
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    ratingCount: "312",
    bestRating: "5",
    worstRating: "1",
  },
  offers: [
    {
      "@type": "Offer",
      name: "Starter",
      price: "0",
      priceCurrency: "UZS",
      description: "Bepul tarif — 50 tagacha o'quvchi, 1 filial",
    },
    {
      "@type": "Offer",
      name: "Pro",
      price: "299000",
      priceCurrency: "UZS",
      billingIncrement: "P1M",
      description: "Pro tarif — 500 tagacha o'quvchi, 3 filial",
    },
    {
      "@type": "Offer",
      name: "Enterprise",
      price: "699000",
      priceCurrency: "UZS",
      billingIncrement: "P1M",
      description: "Enterprise tarif — cheksiz o'quvchilar va filiallar",
    },
  ],
  provider: {
    "@id": "https://oneroom.uz/#organization",
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://oneroom.uz/#website",
  url: "https://oneroom.uz",
  name: "OneRoom",
  description: "O'quv markazlar uchun LMS va CRM platforma",
  inLanguage: "uz",
  publisher: {
    "@id": "https://oneroom.uz/#organization",
  },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://oneroom.uz/search?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Bosh sahifa",
      item: "https://oneroom.uz",
    },
  ],
};

export default function LandingPage() {
  return (
    <>
      {/* Structured Data — SEO, AEO, GEO */}
      <Script
        id="schema-organization"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Script
        id="schema-software"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <Script
        id="schema-website"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <Script
        id="schema-faq"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Script
        id="schema-breadcrumb"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="min-h-screen overflow-x-hidden bg-white">
        <LandingHeader />
        <main id="main-content">
          <HeroSection />
          <StatsSection />
          <FeaturesSection />
          <HowItWorksSection />
          <PricingSection />
          <TestimonialsSection />
          <FaqSection />
          <CtaSection />
        </main>
        <LandingFooter />
      </div>
    </>
  );
}
