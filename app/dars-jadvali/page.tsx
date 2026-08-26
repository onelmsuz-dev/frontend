import type { Metadata } from "next";
import Script from "next/script";
import { CalendarDays, MapPin, Clock, Zap } from "lucide-react";
import { ClusterPage, type ClusterPageContent } from "@/components/landing/cluster-page";
import { SITE_URL, ORG_ID } from "@/lib/seo/site";

const PATH = "/dars-jadvali";
const TITLE = "O'quv Markazi Dars Jadvali Tizimi — Xona To'qnashuvisiz | OneRoom";
const DESCRIPTION =
  "O'quv markazi dars jadvali dasturi: barcha guruhlar bitta haftalik jadvalda, xona va o'qituvchi to'qnashuvi avtomatik oldini olinadi. Bepul sinab ko'ring.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "o'quv markazi dars jadvali",
    "dars jadvali tuzish dasturi",
    "o'quv markazi dars jadvali tizimi",
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
    question: "O'quv markazi dars jadvalini qanday tuzish kerak?",
    answer:
      "Har bir guruhga hafta kunlari, vaqt va xona belgilanadi — tizim bularni avtomatik haftalik jadvalga joylashtiradi. Qog'ozda yoki alohida Excel faylida yuritishga hojat qolmaydi.",
  },
  {
    question: "Ikkita guruh bitta xonaga to'qnashib qolmasligiga qanday ishonch hosil qilaman?",
    answer:
      "Yangi dars qo'shilganda yoki vaqt o'zgartirilganda, tizim tanlangan xona va o'qituvchining o'sha vaqtda band emasligini avtomatik tekshiradi.",
  },
  {
    question: "O'qituvchi bandligini qanday tekshiraman?",
    answer:
      "Jadval bo'limida o'qituvchi bo'yicha filtrlab, uning barcha guruhlari va dars vaqtlarini bitta ekranda ko'rasiz — ikkita darsni bir vaqtga rejalashtirish imkonsiz bo'ladi.",
  },
  {
    question: "Jadval o'quvchilarga qanday ko'rsatiladi?",
    answer:
      "Har bir o'quvchi o'z shaxsiy kabinetida faqat o'zi a'zo bo'lgan guruhlarning dars vaqtini ko'radi.",
  },
  {
    question: "Guruh vaqtini o'zgartirsam, jadval avtomatik yangilanadimi?",
    answer:
      "Ha, guruh sozlamalarida vaqt yoki xona o'zgartirilsa, umumiy jadval va davomat ro'yxati darhol yangi ma'lumot bilan yangilanadi.",
  },
];

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "O'quv markazi dars jadvali dasturi",
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
    { "@type": "ListItem", position: 2, name: "Dars jadvali", item: `${SITE_URL}${PATH}` },
  ],
};

const content: ClusterPageContent = {
  href: PATH,
  eyebrow: "Dars jadvali",
  h1: "O'quv markazi dars jadvali tizimi",
  subtitle:
    "Barcha guruhlar bitta haftalik jadvalda. Xona va o'qituvchi to'qnashuvi tizim tomonidan avtomatik oldini olinadi.",
  heroBullets: [
    "Haftalik jadval bir ekranda",
    "Xona va o'qituvchi to'qnashuvi bo'lmaydi",
    "Guruh sanasiga qarab avtomatik ko'rinadi",
  ],
  painHeading: "Qog'ozdagi yoki Exceldagi jadval nega tez-tez chalkashadi?",
  painPoints: [
    {
      title: "Ikkita guruh bir xonaga to'qnashib qoladi",
      body: "Qo'lda rejalashtirishda xona bandligini kuzatib borish qiyin — bir vaqtning o'zida ikkita guruh bitta xonaga tushib qoladi.",
    },
    {
      title: "O'qituvchining ikki joyda darsi chiqib qoladi",
      body: "Bir o'qituvchiga bir vaqtda ikki guruh biriktirilishi — qog'oz jadvalda ko'zdan qochib qoladigan tipik xato.",
    },
    {
      title: "Jadvalni yangilash unutiladi",
      body: "Guruh vaqti o'zgarsa, buni har bir joyda — devordagi jadval, Excel, Telegramda — qayta yozish kerak bo'ladi, biri unutilib qoladi.",
    },
    {
      title: "Yangi o'quvchiga jadvalni tushuntirish vaqt oladi",
      body: "Markazga yangi kelgan o'quvchiga qaysi kuni, qaysi xonada darsi borligini har safar qo'lda tushuntirish kerak bo'ladi.",
    },
  ],
  featuresHeading: "OneRoom'da dars jadvali qanday ishlaydi",
  features: [
    {
      icon: CalendarDays,
      title: "Haftalik ko'rinish",
      body: "Barcha guruhlar hafta kunlari va soatlari bo'yicha bitta jadvalda — kim qachon darsda ekani bir qarashda ko'rinadi.",
    },
    {
      icon: MapPin,
      title: "Xona va vaqt to'qnashuvi nazorati",
      body: "Yangi dars qo'shishda tizim xona va o'qituvchining band vaqtlarini avtomatik tekshiradi.",
    },
    {
      icon: Clock,
      title: "Guruh sanasiga mos ko'rinish",
      body: "Dars bloklari faqat guruh boshlangan va tugagan sanalar oralig'ida ko'rsatiladi — hali boshlanmagan yoki tugagan guruh jadvalni chalkashtirmaydi.",
    },
    {
      icon: Zap,
      title: "Tezkor qo'shish",
      body: "Yangi o'qituvchi yoki kursni jadval ichidan, alohida formaga o'tmasdan qo'shish mumkin.",
    },
  ],
  faqHeading: "Dars jadvali bo'yicha ko'p so'raladigan savollar",
  faq,
  leadSource: "Dars jadvali sahifasi",
  leadHeading: "Jadvalni bir tizimga jamlang",
  leadDescription: "Ism va telefon raqamingizni qoldiring — dars jadvali modulini 7 kunlik bepul sinov davomida ko'rsatamiz.",
  leadCta: "Bepul sinab ko'rish",
  leadNotePlaceholder: "Nechta xona va o'qituvchingiz bor? (ixtiyoriy)",
};

export default function DarsJadvaliPage() {
  return (
    <>
      <Script id="schema-service-jadval" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <Script id="schema-faq-jadval" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Script id="schema-breadcrumb-jadval" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <ClusterPage {...content} />
    </>
  );
}
