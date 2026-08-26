import type { Metadata } from "next";
import Script from "next/script";
import { AlertTriangle, ListChecks, MessageSquare, TrendingUp } from "lucide-react";
import { ClusterPage, type ClusterPageContent } from "@/components/landing/cluster-page";
import { SITE_URL, ORG_ID } from "@/lib/seo/site";

const PATH = "/qarzdorlik";
const TITLE = "O'quv Markazi Qarzdorlik Nazorati — Avtomatik Qarzdorlar Ro'yxati | OneRoom";
const DESCRIPTION =
  "O'quv markazida qarzdorlikni nazorat qilish dasturi: qarzdor o'quvchilar avtomatik aniqlanadi, ota-onaga eslatma bir tugma bilan yuboriladi. Bepul sinab ko'ring.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "o'quv markazi qarzdorlik",
    "o'quv markazi qarzdorlik nazorati",
    "o'quvchilar qarzdorligini nazorat qilish",
    "o'quv markazida qarzdorlikni qanday nazorat qilish",
    "qarzdorlik hisoboti",
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
    question: "O'quv markazida qarzdorlikni qanday nazorat qilish mumkin?",
    answer:
      "Eng samarali yo'l — qarzdorlarni qo'lda emas, avtomatik aniqlaydigan tizimdan foydalanish. OneRoom balansi manfiy bo'lgan har bir o'quvchini avtomatik \"qarzdor\" sifatida belgilaydi va umumiy qarz miqdorini real vaqtda ko'rsatadi.",
  },
  {
    question: "Qarzdor o'quvchi qanday aniqlanadi?",
    answer:
      "Har bir o'quvchining to'lov balansi tizimda kuzatiladi. Balans manfiy bo'lib, o'quvchi guruhdan hali chiqib ketmagan bo'lsa, u avtomatik qarzdorlar ro'yxatiga tushadi.",
  },
  {
    question: "Qarzdorlikni kamaytirish uchun nima qilish kerak?",
    answer:
      "Birinchi qadam — qarzdorlarni vaqtida ko'rish. OneRoom eng katta qarzdorlarni ustuvor tartibda ko'rsatadi va ularga avtomatik eslatma yuborish imkonini beradi — bu qarz to'lanish ehtimolini sezilarli oshiradi.",
  },
  {
    question: "Ota-onaga qarz haqida eslatma qanday boradi?",
    answer:
      "Administrator qarzdorlar ro'yxatidan bir necha bosish bilan Telegram bot yoki SMS orqali to'lov eslatmasini yuboradi — har bir ota-onaga alohida qo'ng'iroq qilish shart emas.",
  },
  {
    question: "Qarzdorlik hisobotini qayerdan olaman?",
    answer:
      "Moliya bo'limidagi \"Qarzdorlar\" bo'limi va Hisobotlar bo'limi umumiy qarz summasi, qarzdorlar soni va davr bo'yicha dinamikani avtomatik ko'rsatadi.",
  },
];

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "O'quv markazi qarzdorlik nazorati dasturi",
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
    { "@type": "ListItem", position: 2, name: "Qarzdorlik nazorati", item: `${SITE_URL}${PATH}` },
  ],
};

const content: ClusterPageContent = {
  href: PATH,
  eyebrow: "Qarzdorlik nazorati",
  h1: "O'quv markazi uchun qarzdorlik nazorati",
  subtitle:
    "Qarzdor o'quvchilarni qo'lda qidirmang — tizim ularni avtomatik aniqlaydi va eslatma yuborishni bir tugmaga tushiradi.",
  heroBullets: [
    "Qarzdorlar ro'yxati avtomatik yangilanadi",
    "Eng katta qarzdorlar bir joyda",
    "Eslatma — bir necha bosishda",
  ],
  painHeading: "Qarzdorlikni nazorat qilmaslik markazga qanday zarar keltiradi?",
  painSubheading: "Ko'rinmagan qarz — yig'ilmagan pul. Har oy shu tarzda daromad yo'qotiladi.",
  painPoints: [
    {
      title: "Qarzdor o'quvchini vaqtida payqamaysiz",
      body: "Bir necha o'nlab o'quvchi orasida kim to'lamaganini qo'lda kuzatish deyarli imkonsiz — qarz oylab to'planib qoladi.",
    },
    {
      title: "To'lamagan o'quvchi darsda qatnashishda davom etadi",
      body: "Nazorat bo'lmasa, qarz o'sib boraveradi va oxir-oqibat markaz undan umuman voz kechishga majbur bo'ladi.",
    },
    {
      title: "Umumiy qarz miqdori noma'lum bo'lib qoladi",
      body: "Direktor markazning haqiqiy moliyaviy holatini bilmasdan qaror qabul qiladi — bu xavfli.",
    },
    {
      title: "Eslatma berish bitta odamning xotirasiga bog'liq",
      body: "Agar administrator unutsa yoki band bo'lsa, hech kim ota-onaga qarz haqida eslatmaydi.",
    },
  ],
  featuresHeading: "OneRoom qarzdorlikni qanday nazorat qiladi",
  features: [
    {
      icon: AlertTriangle,
      title: "Qarzdorlar avtomatik aniqlanadi",
      body: "Balansi manfiy bo'lgan har bir o'quvchi tizim tomonidan avtomatik \"qarzdor\" sifatida belgilanadi — qo'lda hisoblash shart emas.",
    },
    {
      icon: ListChecks,
      title: "Eng katta qarzdorlar ro'yxati",
      body: "Kim eng ko'p qarzga botganini bir qarashda ko'rasiz va ustuvor tartibda ish yuritasiz.",
    },
    {
      icon: MessageSquare,
      title: "Avtomatik eslatma xabari",
      body: "Qarzdor o'quvchi ota-onasiga Telegram yoki SMS orqali to'lov eslatmasini bir necha bosishda yuborasiz.",
    },
    {
      icon: TrendingUp,
      title: "Yig'ilish darajasi ogohlantiradi",
      body: "To'lov yig'ilish foizi pasaysa, tizim buni darhol ko'rsatib, qarzdorlar ro'yxatini tekshirishni taklif qiladi.",
    },
  ],
  steps: [
    { title: "Qarzdorlar bo'limini oching", body: "Moliya bo'limida qarzdor o'quvchilar avtomatik ro'yxatga tushgan bo'ladi." },
    { title: "Ro'yxatni ko'rib chiqing", body: "Eng katta qarzdorlar birinchi o'rinda — qayerdan boshlashni darhol bilasiz." },
    { title: "Eslatma yuboring", body: "Bir necha bosish bilan Telegram yoki SMS orqali ota-onaga to'lov eslatmasi ketadi." },
  ],
  faqHeading: "Qarzdorlik bo'yicha ko'p so'raladigan savollar",
  faq,
  leadSource: "Qarzdorlik sahifasi",
  leadHeading: "Qarzdorlikni nazoratga oling",
  leadDescription: "Ism va telefon raqamingizni qoldiring — qarzdorlik moduli qanday ishlashini 7 kunlik bepul sinov davomida ko'rsatamiz.",
  leadCta: "Bepul sinab ko'rish",
  leadNotePlaceholder: "Hozir qancha o'quvchingiz qarzdor? (ixtiyoriy)",
};

export default function QarzdorlikPage() {
  return (
    <>
      <Script id="schema-service-qarzdorlik" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <Script id="schema-faq-qarzdorlik" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Script id="schema-breadcrumb-qarzdorlik" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <ClusterPage {...content} />
    </>
  );
}
