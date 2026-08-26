import type { Metadata } from "next";
import Script from "next/script";
import { SITE_URL, ORG_ID, WEBSITE_ID } from "@/lib/seo/site";
import { LandingHeader } from "@/components/landing/landing-header";
import { HeroSection } from "@/components/landing/hero-section";
import { StatsSection } from "@/components/landing/stats-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { SolutionsSection } from "@/components/landing/solutions-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { FaqSection } from "@/components/landing/faq-section";
import { faqItems } from "@/components/landing/faq-data";
import { CtaSection } from "@/components/landing/cta-section";
import { ContactSection } from "@/components/landing/contact-section";
import { LandingFooter } from "@/components/landing/landing-footer";

// ─── SEO Metadata ──────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "OneRoom — O'quv Markazlar uchun LMS va CRM Tizimi | O'zbekiston",
  description:
    "OneRoom — O'zbekistondagi o'quv markazlar uchun №1 boshqaruv platformasi. O'quvchilar, to'lovlar, jadval, davomot va hisobotlarni bitta tizimda boshqaring. Bepul boshlang.",
  // DIQQAT: bu ro'yxat ataylab qisqa va faqat ENG KENG/brend darajasidagi
  // atamalarni o'z ichiga oladi. Davomat, to'lov, qarzdorlik, hisobot va
  // "CRM narxi/eng yaxshi CRM" каби aniq-mos atamalar tegishli cluster
  // sahifalarga (`/davomat`, `/tolovlar`, ..., `/oquv-markaz-crm`) berilgan —
  // aks holda bosh sahifa o'z cluster sahifalari bilan bir xil so'zga
  // raqobatlashib, ikkalasi ham pastroq chiqib qolardi (keyword cannibalization).
  keywords: [
    "OneRoom",
    "o'quv markaz uchun CRM",
    "o'quv markazi boshqaruv tizimi",
    "o'quv markazini boshqarish dasturi",
    "o'quv markazi dasturi",
    "o'quv markazi boshqaruv platformasi",
  ],
  authors: [{ name: "OneRoom", url: SITE_URL }],
  creator: "OneRoom",
  publisher: "OneRoom",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "uz_UZ",
    url: SITE_URL,
    siteName: "OneRoom",
    title: "OneRoom — O'quv Markazlar uchun LMS va CRM Tizimi",
    description:
      "O'zbekistondagi 500+ o'quv markaz ishongan platforma. O'quvchilar, to'lovlar, jadval va davomatni bitta ekrandan boshqaring.",
    // `images` ataylab yo'q — `app/opengraph-image.tsx` file-convention rasmi
    // avtomatik ishlatiladi. Bu yerda qo'yilsa, o'sha generatsiyani bosib ketardi.
  },
  twitter: {
    card: "summary_large_image",
    title: "OneRoom — O'quv Markazlar uchun LMS va CRM",
    description:
      "O'quvchilar, to'lovlar, jadval va davomatni bitta platformada. Bepul boshlang.",
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
  "@id": ORG_ID,
  name: "OneRoom",
  alternateName: "One Room",
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/logo.png`,
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
  "@id": `${SITE_URL}/#software`,
  name: "OneRoom",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Education Management Software",
  operatingSystem: "Web",
  url: SITE_URL,
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
  // DIQQAT: `aggregateRating` ataylab YO'Q. Real baholar yig'ilmagunicha
  // soxta reyting qo'shish Google'ning structured-data siyosatiga zid va
  // qo'lda tekshiruvda saytga jarima keltirishi mumkin.
  // DIQQAT: raqamlar `components/landing/pricing-section.tsx` bilan bir xil
  // bo'lishi shart — Google structured data'ni ko'rinadigan matn bilan
  // solishtiradi, mos kelmasa rich snippet rad etilishi mumkin.
  offers: [
    {
      "@type": "Offer",
      name: "Starter",
      price: "270000",
      priceCurrency: "UZS",
      billingIncrement: "P1M",
      description: "Starter tarif — 200 tagacha o'quvchi, 1 filial",
    },
    {
      "@type": "Offer",
      name: "Business",
      price: "570000",
      priceCurrency: "UZS",
      billingIncrement: "P1M",
      description: "Business tarif — 500 tagacha o'quvchi, 3 filial",
    },
    {
      "@type": "Offer",
      name: "Premium",
      price: "870000",
      priceCurrency: "UZS",
      billingIncrement: "P1M",
      description: "Premium tarif — 1000 tagacha o'quvchi, 8 filial",
    },
  ],
  provider: {
    "@id": ORG_ID,
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  url: SITE_URL,
  name: "OneRoom",
  description: "O'quv markazlar uchun LMS va CRM platforma",
  inLanguage: "uz",
  publisher: {
    "@id": ORG_ID,
  },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
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
      item: SITE_URL,
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
          <SolutionsSection />
          <HowItWorksSection />
          <PricingSection />
          <TestimonialsSection />
          <FaqSection />
          <CtaSection />
          <ContactSection />
        </main>
        <LandingFooter />
      </div>
    </>
  );
}
