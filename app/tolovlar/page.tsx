import type { Metadata } from "next";
import Script from "next/script";
import { Wallet, TrendingUp, PieChart, Banknote } from "lucide-react";
import { ClusterPage, type ClusterPageContent } from "@/components/landing/cluster-page";
import { SITE_URL, ORG_ID } from "@/lib/seo/site";

const PATH = "/tolovlar";
const TITLE = "O'quv Markazi To'lov Tizimi — Moliyani Boshqarish Dasturi | OneRoom";
const DESCRIPTION =
  "O'quv markazi uchun to'lov tizimi: har bir to'lov o'quvchi kartochkasiga avtomatik yoziladi, kirim-chiqim va yig'ilish darajasi bitta ekranda. Excel o'rniga qulay CRM.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "o'quv markaz to'lov tizimi",
    "o'quv markazi to'lovlarini boshqarish",
    "o'quv markazida to'lov nazorati",
    "o'quv markazi moliya dasturi",
    "o'quv markazi moliyaviy hisob",
    "o'quv markazi daromad hisoblash",
    "o'quv markazi kassa nazorati",
    "o'quv markaz uchun Excel",
  ],
  alternates: { canonical: `${SITE_URL}${PATH}` },
  openGraph: {
    type: "website",
    locale: "uz_UZ",
    url: `${SITE_URL}${PATH}`,
    siteName: "OneRoom",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const faq = [
  {
    question: "O'quv markazida to'lov nazoratini qanday yo'lga qo'yish mumkin?",
    answer:
      "Eng samarali yo'l — barcha to'lovlarni bitta tizimga yozish. OneRoom'da har bir to'lov o'quvchi kartochkasiga avtomatik qayd etiladi, balans yangilanadi va administrator istalgan vaqt kim qancha to'laganini bir necha soniyada ko'radi.",
  },
  {
    question: "Excel o'rniga CRM ishlatish nima uchun yaxshiroq?",
    answer:
      "Exceldagi jadvalni qo'lda to'ldirish xato va unutishga olib keladi, bir nechta odam ishlaganda esa fayl versiyalari chalkashib ketadi. CRM'da barcha to'lov, balans va qarzdorlik real vaqtda, hamma uchun bir xil ma'lumot bilan yuritiladi.",
  },
  {
    question: "To'lovlar qanday qabul qilinadi — naqd va onlaynmi?",
    answer:
      "Ha, administrator to'lovni naqd, karta yoki bank o'tkazmasi sifatida kiritishi mumkin — tizim usul bo'yicha ham statistikani alohida yuritadi.",
  },
  {
    question: "Kim qancha to'laganini qanday tekshiraman?",
    answer:
      "Moliya bo'limida \"Kirim\" bo'limi orqali istalgan davr, guruh yoki o'quvchi bo'yicha filtrlab, barcha to'lovlar tarixini ko'rasiz.",
  },
  {
    question: "Oylik moliyaviy hisobotni qanday olaman?",
    answer:
      "Tizim kirim, chiqim va yig'ilish darajasini avtomatik hisoblab, Hisobotlar bo'limida tayyor ko'rinishda taqdim etadi — qo'lda hisob-kitob qilish shart emas.",
  },
];

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "O'quv markazi to'lov va moliya boshqaruvi dasturi",
  provider: { "@id": ORG_ID },
  areaServed: "UZ",
  url: `${SITE_URL}${PATH}`,
  description: DESCRIPTION,
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Bosh sahifa", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "To'lovlar boshqaruvi", item: `${SITE_URL}${PATH}` },
  ],
};

const content: ClusterPageContent = {
  href: PATH,
  eyebrow: "To'lovlar boshqaruvi",
  h1: "O'quv markazi uchun to'lov tizimi",
  subtitle:
    "Har bir to'lov o'quvchi kartochkasiga avtomatik yoziladi. Kirim, chiqim va yig'ilish darajasi — bitta ekranda, real vaqtda.",
  heroBullets: [
    "To'lov kiritish — 10 soniya",
    "Naqd, karta va o'tkazma bir joyda",
    "Yig'ilish darajasi avtomatik hisoblanadi",
  ],
  painHeading: "To'lovlarni qog'ozda yoki Excelda yuritish qanday muammo keltiradi?",
  painSubheading: "Bitta xato yozuv — butun oyning hisobotini buzib qo'yishi mumkin.",
  painPoints: [
    {
      title: "Kim qachon to'laganini eslab qolish qiyin",
      body: "Bir necha administrator ishlaganda, kim qaysi to'lovni qayerga yozganini kuzatish deyarli imkonsiz bo'lib qoladi.",
    },
    {
      title: "Kassa va jadvaldagi raqamlar mos kelmay qoladi",
      body: "Qo'lda kiritilgan Excel fayli va real kassadagi pul orasida farq paydo bo'ladi — sababini topish soatlab vaqt oladi.",
    },
    {
      title: "Qaysi to'lov usuli ko'proq ishlatilayotgani noma'lum",
      body: "Naqd, karta yoki o'tkazma bo'yicha taqsimot bo'lmasa, kassa jarayonini yaxshilash uchun qaror qabul qilib bo'lmaydi.",
    },
    {
      title: "Oy oxirida moliyaviy hisobot tayyorlash kunlab davom etadi",
      body: "Barcha to'lov va xarajatlarni qo'lda yig'ib, jamlab chiqish — administratorning eng ko'p vaqt yeydigan vazifasi.",
    },
  ],
  featuresHeading: "OneRoom'da to'lovlar qanday boshqariladi",
  featuresSubheading: "Qabul qilishdan tortib hisobotgacha — bitta tizimda.",
  features: [
    {
      icon: Wallet,
      title: "Har bir to'lov o'quvchi kartochkasida",
      body: "To'lov kiritilgan zahoti o'quvchi balansi yangilanadi — kim qancha to'lagani va qancha qarzi borligi doim ko'rinib turadi.",
    },
    {
      icon: Banknote,
      title: "Kirim va chiqimlar bitta joyda",
      body: "Barcha tushum va xarajat toifalari ajratilib, markazning haqiqiy moliyaviy holati istalgan kunda bir qarashda ko'rinadi.",
    },
    {
      icon: TrendingUp,
      title: "Yig'ilish darajasini kuzating",
      body: "Oy bo'yicha to'lovlarning necha foizi yig'ilganini ko'rasiz — ko'rsatkich pasaysa, tizim qarzdorlar ro'yxatini avtomatik taklif qiladi.",
    },
    {
      icon: PieChart,
      title: "To'lov usullari bo'yicha tahlil",
      body: "Naqd, karta yoki bank o'tkazmasi — qaysi usul ko'proq ishlatilayotganini ko'rib, kassa jarayonini optimallashtirasiz.",
    },
  ],
  faqHeading: "To'lovlar bo'yicha ko'p so'raladigan savollar",
  faq,
  leadSource: "To'lovlar sahifasi",
  leadHeading: "To'lov nazoratini tartibga soling",
  leadDescription: "Ism va telefon raqamingizni qoldiring — to'lov modulini 7 kunlik bepul sinov davomida sizga ko'rsatamiz.",
  leadCta: "Bepul sinab ko'rish",
  leadNotePlaceholder: "Hozir to'lovlarni qanday yuritasiz? (ixtiyoriy)",
};

export default function TolovlarPage() {
  return (
    <>
      <Script id="schema-service-tolovlar" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <Script id="schema-faq-tolovlar" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Script id="schema-breadcrumb-tolovlar" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <ClusterPage {...content} />
    </>
  );
}
