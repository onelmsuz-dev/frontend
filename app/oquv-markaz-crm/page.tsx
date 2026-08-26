import type { Metadata } from "next";
import Script from "next/script";
import { Target, GraduationCap, Layers, Wallet, ClipboardCheck, BarChart3 } from "lucide-react";
import { ClusterPage, type ClusterPageContent } from "@/components/landing/cluster-page";
import { SITE_URL, ORG_ID } from "@/lib/seo/site";

const PATH = "/oquv-markaz-crm";
const TITLE = "O'quv Markazi uchun CRM — To'liq Boshqaruv Tizimi | OneRoom";
const DESCRIPTION =
  "O'quv markazlari uchun CRM: lidlardan to'lovgacha, davomatdan hisobotgacha — bitta tizimda. O'zbekiston o'quv markazlariga moslashtirilgan. 7 kunlik bepul sinov.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  // DIQQAT: "o'quv markaz uchun CRM" (yakka) va keng "boshqaruv tizimi/dasturi"
  // atamalari ataylab yo'q — ularni bosh sahifa (`app/page.tsx`) egallaydi.
  // Bu sahifa aniq CRM-mos so'rovlarni (ko'plik, narx, "eng yaxshi", tor
  // ta'lim atamalari) egallaydi — ikkalasi bir xil so'zga raqobatlashmasin.
  keywords: [
    "o'quv markazlari uchun CRM",
    "o'quv markazi CRM",
    "ta'lim markazi CRM",
    "O'zbekistonda o'quv markaz CRM",
    "o'quv markazi uchun dastur",
    "o'quv markazi online dastur",
    "o'quv markaz CRM narxi",
    "o'quv markaz uchun eng yaxshi CRM",
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
    question: "O'quv markazi uchun CRM nima va nima uchun kerak?",
    answer:
      "O'quv markazi uchun CRM — lidlar, o'quvchilar, to'lovlar, davomat va hisobotlarni bitta tizimda boshqarish imkonini beruvchi dastur. U Excel, daftar va bir nechta alohida dastur o'rnini bosadi, xatolarni kamaytiradi va vaqtni tejaydi.",
  },
  {
    question: "O'quv markaz CRM narxi qancha turadi?",
    answer:
      "OneRoom'da narx o'quvchilar soni va filiallar soniga qarab belgilanadi — 270 000 so'm/oydan boshlanadi. Aniq tarif va imkoniyatlarni bosh sahifadagi \"Narxlar\" bo'limida ko'rishingiz mumkin.",
  },
  {
    question: "O'quv markazi uchun bepul CRM bormi?",
    answer:
      "OneRoom doimiy bepul tarif taklif qilmaydi, lekin 7 kunlik bepul sinov davri mavjud — karta ma'lumoti kerak emas. Shu davrda barcha modullarni to'liq sinab ko'rishingiz mumkin.",
  },
  {
    question: "Qaysi CRM o'quv markazlar uchun eng yaxshi hisoblanadi?",
    answer:
      "Eng yaxshi tanlov — o'zbek tilida ishlaydigan, mahalliy to'lov va davomat jarayonlariga moslashtirilgan, Telegram/SMS integratsiyasi bo'lgan va narxi markaz hajmiga mos tizim. OneRoom aynan shu mezonlar asosida O'zbekiston o'quv markazlari uchun ishlab chiqilgan.",
  },
  {
    question: "CRM va LMS orasida farq bormi?",
    answer:
      "LMS ko'proq o'quv kontenti va onlayn darslarga qaratilgan bo'lsa, CRM markazning boshqaruv jarayonlariga — lidlar, to'lovlar, davomat, xodimlarga qaratilgan. OneRoom ikkalasining kerakli qismlarini birlashtirgan boshqaruv platformasi.",
  },
  {
    question: "OneRoom O'zbekiston sharoitiga moslashtirilganmi?",
    answer:
      "Ha — interfeys o'zbek tilida, to'lovlar so'mda, xabarnoma Telegram va mahalliy SMS orqali yuboriladi, texnik yordam ham o'zbek tilida ko'rsatiladi.",
  },
  {
    question: "CRM'ni qancha vaqtda ishga tushiraman?",
    answer:
      "Odatda 1–2 kun ichida asosiy ma'lumotlar (guruhlar, o'quvchilar, o'qituvchilar) kiritilib, tizim ishlay boshlaydi. Excel'dan ma'lumot ko'chirishda ham yordam beramiz.",
  },
];

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "O'quv markazi uchun CRM tizimi",
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
    { "@type": "ListItem", position: 2, name: "O'quv markazi uchun CRM", item: `${SITE_URL}${PATH}` },
  ],
};

const content: ClusterPageContent = {
  href: PATH,
  eyebrow: "O'quv markazi uchun CRM",
  h1: "O'quv markazi uchun CRM",
  subtitle:
    "Lidlardan to'lovgacha, davomatdan hisobotgacha — o'quv markazingizning barcha jarayoni bitta tizimda. O'zbekiston o'quv markazlari uchun maxsus moslashtirilgan.",
  heroBullets: [
    "Lidlardan to'lovgacha — bitta tizim",
    "O'zbek tilida interfeys va yordam",
    "7 kunlik bepul sinov, karta kerak emas",
  ],
  painHeading: "O'quv markazi uchun nega maxsus CRM kerak?",
  painSubheading: "Umumiy CRM'lar savdo bo'limi uchun yaratilgan — ta'lim markazining o'ziga xos jarayonlarini hisobga olmaydi.",
  painPoints: [
    {
      title: "Umumiy CRM'lar ta'lim jarayoniga moslanmagan",
      body: "Guruh, dars jadvali, davomat va o'qituvchi oyligi kabi tushunchalar odatiy savdo CRM'ida umuman yo'q — ularni \"moslashtirish\" ko'p vaqt va pul yeydi.",
    },
    {
      title: "Lidlar, o'quvchilar va to'lovlar turli tizimda yuritiladi",
      body: "Marketing Excelda, to'lov daftarda, xabar Telegramda — ma'lumot tarqoq bo'lgani sayin umumiy manzarani ko'rish qiyinlashadi.",
    },
    {
      title: "Xodimlar bir nechta dastur orasida chalg'iydi",
      body: "Administrator va o'qituvchilar kunlik ishni bir necha ilovada bajarishga majbur bo'ladi — bu xato va vaqt yo'qotishga olib keladi.",
    },
    {
      title: "O'sish bilan boshqaruv murakkablashadi",
      body: "Yangi filial yoki ko'proq o'quvchi qo'shilganda, qo'lda yoki moslashtirilmagan tizim bilan ishlash imkonsiz bo'lib qoladi.",
    },
  ],
  featuresHeading: "OneRoom CRM nimalarni o'z ichiga oladi",
  featuresSubheading: "Bitta tizim — bitta login, barcha jarayon.",
  features: [
    { icon: Target, title: "Lidlar va sotuv voronkasi", body: "Qiziqqan mijozdan to'lovchi o'quvchigacha — CRM lidlarni bosqichma-bosqich kuzatadi." },
    { icon: GraduationCap, title: "O'quvchilar bazasi", body: "Har bir o'quvchining shaxsiy ma'lumoti, guruhi, to'lov tarixi va davomati bitta kartochkada." },
    { icon: Layers, title: "Kurslar va guruhlar", body: "Barcha kurslaringizni, narxlarini va guruhlarini bir joydan boshqarasiz." },
    { icon: Wallet, title: "To'lov va qarzdorlik", body: "Har bir to'lov avtomatik qayd etiladi, qarzdorlar tizim tomonidan o'zi aniqlanadi." },
    { icon: ClipboardCheck, title: "Davomat nazorati", body: "Har bir darsda kim keldi, kim kelmadi — bir necha soniyada, ota-onaga avtomatik xabar bilan." },
    { icon: BarChart3, title: "Hisobot va analitika", body: "Daromad, davomat va lidlar bo'yicha tayyor hisobotlar real vaqtda yangilanadi." },
  ],
  faqHeading: "O'quv markazi CRM'i bo'yicha ko'p so'raladigan savollar",
  faq,
  leadSource: "CRM pillar sahifasi",
  leadHeading: "O'quv markazingiz uchun CRM'ni sinab ko'ring",
  leadDescription: "Ism va telefon raqamingizni qoldiring — markazingizga mos yechimni ko'rsatamiz va 7 kunlik bepul sinovni boshlaymiz.",
  leadCta: "Bepul konsultatsiya olish",
  leadNotePlaceholder: "Nechta o'quvchi va filialingiz bor? (ixtiyoriy)",
};

export default function OquvMarkazCrmPage() {
  return (
    <>
      <Script id="schema-service-crm" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <Script id="schema-faq-crm" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Script id="schema-breadcrumb-crm" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <ClusterPage {...content} />
    </>
  );
}
