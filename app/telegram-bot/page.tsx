import type { Metadata } from "next";
import Script from "next/script";
import { Bot, Zap, FileText, ShieldCheck } from "lucide-react";
import { ClusterPage, type ClusterPageContent } from "@/components/landing/cluster-page";
import { SITE_URL, ORG_ID } from "@/lib/seo/site";

const PATH = "/telegram-bot";
const TITLE = "O'quv Markazi uchun Telegram Bot va SMS Xabarnoma | OneRoom";
const DESCRIPTION =
  "O'quv markazi uchun Telegram bot va SMS xabarnoma tizimi: ota-onalarga davomat va to'lov haqida avtomatik xabar. Shablonlar, 3 auditoriya. Bepul sinab ko'ring.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "o'quv markazi Telegram bot",
    "o'quv markazi uchun Telegram bot",
    "o'quvchilar uchun Telegram bot",
    "ota-onalar Telegram boti",
    "o'quv markazi SMS xabarnoma",
    "davomat SMS xabarnoma",
    "to'lov haqida SMS",
    "ota-onaga davomat xabari",
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
    question: "O'quv markazi uchun Telegram bot qanday ishlaydi?",
    answer:
      "OneRoom'ga ulangan Telegram bot davomat, to'lov va qarzdorlik kabi voqealar bo'yicha ota-onaga, o'quvchiga yoki o'qituvchiga avtomatik xabar yuboradi — administrator qo'lda yozmaydi.",
  },
  {
    question: "Ota-onaga qanday xabarlar avtomatik boradi?",
    answer:
      "Eng ko'p ishlatiladigani: farzandi darsga kelmagani, to'lov muddati yaqinlashgani va qarz paydo bo'lgani haqidagi xabarlar. Bu xabarlar tegishli voqea sodir bo'lgan zahoti avtomatik yuboriladi.",
  },
  {
    question: "SMS va Telegram orasida qanday farq bor — ikkalasi ham ishlatiladimi?",
    answer:
      "Ha, OneRoom ikkalasini ham qo'llab-quvvatlaydi. Telegram bepul va tezroq, SMS esa Telegramdan foydalanmaydigan ota-onalar uchun zaxira kanal sifatida ishlatiladi.",
  },
  {
    question: "Ommaviy xabar yuborish uchun shablon yaratish mumkinmi?",
    answer:
      "Ha, tez-tez yuboriladigan xabarlar uchun shablon yaratib, keyin o'quvchilar, ota-onalar yoki o'qituvchilar guruhiga bir necha bosishda qayta yuborishingiz mumkin.",
  },
  {
    question: "Xabar yetib borganini qanday bilaman?",
    answer:
      "Har bir yuborilgan xabarning holati (yetkazildi / yetkazilmadi) tizimda saqlanadi — kimga xabar bormaganini alohida ko'rish mumkin.",
  },
];

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "O'quv markazi Telegram bot va SMS xabarnoma tizimi",
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
    { "@type": "ListItem", position: 2, name: "Telegram bot va SMS", item: `${SITE_URL}${PATH}` },
  ],
};

const content: ClusterPageContent = {
  href: PATH,
  eyebrow: "Telegram va SMS",
  h1: "O'quv markazi uchun Telegram bot va SMS xabarnoma",
  subtitle:
    "Ota-onalarga davomat, to'lov va qarzdorlik haqida xabar qo'lda emas, avtomatik boradi — Telegram bot va SMS orqali.",
  heroBullets: [
    "Ota-onalarga avtomatik xabar",
    "O'quvchi, ota-ona, o'qituvchi — 3 auditoriya",
    "Shablon orqali ommaviy xabar",
  ],
  painHeading: "Ota-onalar bilan qo'lda bog'lanish nega samarasiz?",
  painPoints: [
    {
      title: "Ota-onalar bilan bog'lanish ko'p vaqt oladi",
      body: "Har bir kelmagan o'quvchi haqida qo'lda qo'ng'iroq qilish yoki yozish — kunlik ishlarni bosib ketadigan vazifa.",
    },
    {
      title: "Har bir xabarni alohida yozish charchatadi",
      body: "Bir xil mazmundagi xabarni o'nlab ota-onaga qo'lda yozish — vaqt va e'tiborni behuda sarflaydi.",
    },
    {
      title: "Muhim xabar yetib bormay qoladi",
      body: "Telefon band, raqam noto'g'ri yoki administrator unutib qoladi — natijada ota-ona to'lov yoki davomat haqida bexabar qoladi.",
    },
    {
      title: "Qaysi xabar yuborilgani kuzatilmaydi",
      body: "Qo'lda yuborilgan xabarlarning tarixi qolmaydi — kimga xabar borgani, kimga bormagani noma'lum bo'lib qoladi.",
    },
  ],
  featuresHeading: "OneRoom'da xabarnoma qanday ishlaydi",
  features: [
    {
      icon: Bot,
      title: "3 auditoriyaga yo'naltirilgan xabar",
      body: "O'quvchi, ota-ona va o'qituvchilarga alohida yoki birgalikda xabar yuborish mumkin.",
    },
    {
      icon: Zap,
      title: "Avtomatik triggerlar",
      body: "Davomat belgilanganda yoki to'lov muddati yaqinlashganda xabar qo'lda emas, avtomatik ketadi.",
    },
    {
      icon: FileText,
      title: "Tayyor shablonlar",
      body: "Tez-tez yuboriladigan xabarlar uchun shablon yaratib, keyin bir necha bosishda qayta ishlatasiz.",
    },
    {
      icon: ShieldCheck,
      title: "Yuborilgan xabarlar tarixi",
      body: "Qaysi xabar kimga, qachon yuborilgani va yetib borgan-bormagani tizimda saqlanadi.",
    },
  ],
  faqHeading: "Telegram bot va SMS bo'yicha ko'p so'raladigan savollar",
  faq,
  leadSource: "Telegram bot sahifasi",
  leadHeading: "Xabarnomani avtomatlashtiring",
  leadDescription: "Ism va telefon raqamingizni qoldiring — Telegram bot va SMS modulini 7 kunlik bepul sinov davomida ko'rsatamiz.",
  leadCta: "Bepul sinab ko'rish",
  leadNotePlaceholder: "Hozir ota-onalar bilan qanday bog'lanasiz? (ixtiyoriy)",
};

export default function TelegramBotPage() {
  return (
    <>
      <Script id="schema-service-telegram" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <Script id="schema-faq-telegram" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Script id="schema-breadcrumb-telegram" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <ClusterPage {...content} />
    </>
  );
}
