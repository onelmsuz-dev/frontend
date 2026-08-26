import type { Metadata } from "next";
import Script from "next/script";
import { MapPin, CalendarDays, Users, RefreshCw } from "lucide-react";
import { ClusterPage, type ClusterPageContent } from "@/components/landing/cluster-page";
import { SITE_URL, ORG_ID } from "@/lib/seo/site";

const PATH = "/guruh-boshqaruvi";
const TITLE = "O'quv Markazi Guruh Boshqaruvi Dasturi | OneRoom";
const DESCRIPTION =
  "O'quv markazida guruhlarni boshqarish dasturi: xona sig'imi avtomatik tekshiriladi, faol va kutilayotgan guruhlar bir joyda. Bepul sinab ko'ring.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "guruhlarni boshqarish dasturi",
    "o'quv markazi guruh boshqaruvi",
    "o'quv markazi o'quvchilari bazasi",
    "o'quv markazida o'quvchilarni qanday boshqarish",
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
    question: "O'quv markazida guruhlarni qanday boshqarish kerak?",
    answer:
      "Har bir guruhni kurs, o'qituvchi, xona va jadval bilan bitta tizimda yaratasiz. OneRoom guruh sig'imi, xona bandligi va sanalarni avtomatik tekshirib, xatoliklarning oldini oladi.",
  },
  {
    question: "Bitta xonaga bir vaqtda nechta guruh sig'adi?",
    answer:
      "Guruh yaratishda faqat sig'imi mos keladigan va shu vaqt oralig'ida band bo'lmagan xonalar taklif qilinadi — ortiqcha o'quvchi yozib qo'yish yoki ikkita guruhni bir xonaga to'qnashtirish imkonsiz.",
  },
  {
    question: "Guruh statusi qanday avtomatik yangilanadi?",
    answer:
      "Guruh holati (kutilmoqda, faol, tugagan) boshlanish va tugash sanasiga qarab tizim tomonidan kuzatiladi — qo'lda status o'zgartirishni unutish xavfi yo'qoladi.",
  },
  {
    question: "O'qituvchini guruhga qanday biriktiraman?",
    answer:
      "Guruh yaratish yoki tahrirlash formasida o'qituvchini tanlaysiz — bu tanlov darhol dars jadvali, davomat va oylik hisob-kitobiga ham aks etadi.",
  },
  {
    question: "Guruh nomi avtomatik beriladimi?",
    answer:
      "Ha, kurs va o'qituvchi tanlanganda tizim \"Kurs nomi — O'qituvchi\" formatida nom taklif qiladi — istasangiz o'zingiz o'zgartirishingiz mumkin.",
  },
];

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "O'quv markazi guruh boshqaruvi dasturi",
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
    { "@type": "ListItem", position: 2, name: "Guruh boshqaruvi", item: `${SITE_URL}${PATH}` },
  ],
};

const content: ClusterPageContent = {
  href: PATH,
  eyebrow: "Guruh boshqaruvi",
  h1: "O'quv markazi guruh boshqaruvi",
  subtitle:
    "Guruhlar, xonalar va o'quvchilar sig'imini bir joydan boshqaring — xona to'qnashuvi va ortiqcha yozuv tizim tomonidan avtomatik oldini olinadi.",
  heroBullets: [
    "Xona sig'imi avtomatik tekshiriladi",
    "Faol va kutilayotgan guruhlar bir joyda",
    "O'qituvchi va o'quvchilar biriktirilgan",
  ],
  painHeading: "Guruhlarni qog'ozda yoki bir nechta faylda yuritish nega xato beradi?",
  painPoints: [
    {
      title: "Xonaga sig'maydigan guruh yaratib qo'yasiz",
      body: "Sig'im qo'lda hisoblanganda, real xona kattaligidan ortiq o'quvchi yozib qo'yish oson uchraydigan xato.",
    },
    {
      title: "Qaysi guruh qachon boshlanishini eslab qolish qiyin",
      body: "Bir nechta guruh turli sanada boshlansa, buni qo'lda kuzatib borish administrator uchun qo'shimcha yuk.",
    },
    {
      title: "O'qituvchi va o'quvchi ma'lumotlari tarqoq",
      body: "Har bir guruh alohida faylda yuritilsa, kim qaysi guruhda ekanini tezda topish qiyinlashadi.",
    },
    {
      title: "Guruh statusini qo'lda yangilash unutiladi",
      body: "Tugagan guruh \"faol\" bo'lib qolaversa, hisobot va jadvalda noto'g'ri ma'lumot chiqaveradi.",
    },
  ],
  featuresHeading: "OneRoom'da guruh boshqaruvi qanday ishlaydi",
  features: [
    {
      icon: MapPin,
      title: "Xona sig'imi nazorati",
      body: "Guruh yaratishda faqat sig'imga mos, aktiv filial xonalari taklif qilinadi — ortiqcha o'quvchi yozib qo'yish imkonsiz.",
    },
    {
      icon: CalendarDays,
      title: "Faol va kutilayotgan guruhlar bir joyda",
      body: "Boshlanish sanasi hali kelmagan guruhlar ham ro'yxatda ko'rinadi — hech qaysi guruh e'tibordan chetda qolmaydi.",
    },
    {
      icon: Users,
      title: "O'quvchi va o'qituvchi biriktirish",
      body: "Har bir guruhga o'qituvchi va o'quvchilar bir joydan biriktiriladi — o'zgarish darhol jadval va davomatga ham aks etadi.",
    },
    {
      icon: RefreshCw,
      title: "Status avtomatik yangilanadi",
      body: "Guruh holati (kutilmoqda / faol / tugagan) boshlanish va tugash sanasiga qarab tizim tomonidan kuzatiladi.",
    },
  ],
  faqHeading: "Guruh boshqaruvi bo'yicha ko'p so'raladigan savollar",
  faq,
  leadSource: "Guruh boshqaruvi sahifasi",
  leadHeading: "Guruhlarni bir tizimga jamlang",
  leadDescription: "Ism va telefon raqamingizni qoldiring — guruh boshqaruvi modulini 7 kunlik bepul sinov davomida ko'rsatamiz.",
  leadCta: "Bepul sinab ko'rish",
  leadNotePlaceholder: "Nechta faol guruhingiz bor? (ixtiyoriy)",
};

export default function GuruhBoshqaruviPage() {
  return (
    <>
      <Script id="schema-service-guruh" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <Script id="schema-faq-guruh" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Script id="schema-breadcrumb-guruh" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <ClusterPage {...content} />
    </>
  );
}
