import type { Metadata } from "next";
import Script from "next/script";
import { ClipboardCheck, Wallet, CalendarDays, BarChart3, Bot, Banknote } from "lucide-react";
import { ClusterPage, type ClusterPageContent } from "@/components/landing/cluster-page";
import { SITE_URL, ORG_ID } from "@/lib/seo/site";

const PATH = "/oquv-markazini-avtomatlashtirish";
const TITLE = "O'quv Markazini Avtomatlashtirish — Excel O'rniga Yagona Tizim | OneRoom";
const DESCRIPTION =
  "O'quv markazini avtomatlashtirish: davomat, to'lov, jadval, hisobot va xabarnoma — bittasi ham qog'oz yoki Excelda emas, bitta tizimda. Bepul sinab ko'ring.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "o'quv markaz avtomatlashtirish",
    "o'quv markazini avtomatlashtirish",
    "o'quv markazini qanday avtomatlashtirish",
    "o'quv markazi ishlarini avtomatlashtirish",
    "o'quv markazini Excelda boshqarish",
    "Excel o'rniga CRM",
    "o'quv markaz CRM kerakmi",
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
    question: "O'quv markazini qanday avtomatlashtirish mumkin?",
    answer:
      "Eng to'g'ri yo'l — barcha jarayonlarni (davomat, to'lov, jadval, hisobot, ota-onaga xabar) alohida vositalar o'rniga bitta tizimga jamlash. OneRoom aynan shu maqsadda ishlab chiqilgan — Excel, daftar va bir nechta Telegram guruhi o'rnini bitta platforma bosadi.",
  },
  {
    question: "Avtomatlashtirish uchun qancha vaqt kerak?",
    answer:
      "Ko'pchilik markaz 1–2 kun ichida asosiy ma'lumotlarni (guruhlar, o'quvchilar, o'qituvchilar) kiritib, ishlashni boshlaydi. To'liq jarayonlarga o'rganish odatda birinchi hafta davomida yakunlanadi.",
  },
  {
    question: "Excelda saqlangan ma'lumotlarni tizimga ko'chirish mumkinmi?",
    answer:
      "Ha, mavjud o'quvchilar, guruhlar va to'lovlar tarixini Excel fayllardan tizimga o'tkazishda yordam beramiz — ariza formasida \"Boshqa tizimdan ko'chirish\" mavzusini tanlab, biz bilan bog'laning.",
  },
  {
    question: "Xodimlar yangi tizimni tez o'rganadimi?",
    answer:
      "Interfeys o'zbek tilida va sodda tuzilgan — davomat belgilash, to'lov kiritish kabi kundalik amallarni administrator va o'qituvchilar bir necha daqiqada o'rganib oladi.",
  },
  {
    question: "Kichik markaz uchun ham avtomatlashtirish kerakmi?",
    answer:
      "Ha. Hatto 30–50 o'quvchisi bo'lgan markazda ham qo'lda hisob-kitob xato va vaqt yo'qotishga olib keladi — tizim kichik markazlarda ham xuddi shu darajada foyda beradi, ayniqsa o'sish boshlanganda.",
  },
];

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "O'quv markazini avtomatlashtirish xizmati",
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
    { "@type": "ListItem", position: 2, name: "To'liq avtomatlashtirish", item: `${SITE_URL}${PATH}` },
  ],
};

const content: ClusterPageContent = {
  href: PATH,
  eyebrow: "To'liq avtomatlashtirish",
  h1: "O'quv markazini avtomatlashtirish",
  subtitle:
    "Excel, daftar va bir nechta Telegram guruhi o'rniga — davomat, to'lov, jadval, hisobot va xabarnoma bitta tizimda ishlaydi.",
  heroBullets: [
    "Excel va qog'oz jurnaldan voz keching",
    "Barcha jarayon bitta tizimda",
    "1–2 kunda ishga tushirasiz",
  ],
  painHeading: "Qo'lda boshqarish markaz o'sishiga qanday to'siq bo'ladi?",
  painSubheading: "O'quvchi soni ko'paygani sayin, tarqoq vositalar bilan boshqarish ekspоnensial ravishda qiyinlashadi.",
  painPoints: [
    {
      title: "Har bir jarayon uchun alohida vosita",
      body: "Davomat daftarda, to'lov Excelda, xabar Telegram guruhida — bittasi ikkinchisiga bog'lanmagan, ma'lumot doim tarqoq.",
    },
    {
      title: "O'quvchi soni oshgani sayin xatolar ko'payadi",
      body: "50 o'quvchida qo'lda boshqarish mumkin bo'lsa, 300 o'quvchida bir xil usul allaqachon xato va nazoratsizlik manbaiga aylanadi.",
    },
    {
      title: "Yangi xodimni o'qitish vaqt oladi",
      body: "Har birida o'ziga xos \"tizim\" bo'lgan bir nechta Excel fayli va daftarni yangi administratorga tushuntirish kunlab davom etadi.",
    },
    {
      title: "Markaz kattalashsa, nazorat qo'ldan chiqadi",
      body: "Yangi filial ochilganda, qo'lda boshqarish endi umuman ishlamay qoladi — direktor umumiy manzarani yo'qotadi.",
    },
  ],
  featuresHeading: "OneRoom qaysi jarayonlarni avtomatlashtiradi",
  featuresSubheading: "Har biri alohida modul, lekin bitta tizimda — birgalikda ishlaydi.",
  features: [
    { icon: ClipboardCheck, title: "Davomat", body: "Har bir darsda kim keldi, kim kelmadi — bir necha soniyada belgilanadi, ota-onaga avtomatik xabar ketadi." },
    { icon: Wallet, title: "To'lov va qarzdorlik", body: "Har bir to'lov o'quvchi kartochkasiga yoziladi, qarzdorlar avtomatik aniqlanadi." },
    { icon: CalendarDays, title: "Dars jadvali", body: "Xona va o'qituvchi to'qnashuvisiz haftalik jadval avtomatik shakllanadi." },
    { icon: BarChart3, title: "Hisobot va analitika", body: "Daromad, davomat va lidlar bo'yicha tayyor hisobotlar real vaqtda yangilanadi." },
    { icon: Bot, title: "Ota-onaga xabarnoma", body: "Telegram va SMS orqali davomat, to'lov va qarz haqida avtomatik xabar." },
    { icon: Banknote, title: "O'qituvchi oyligi", body: "Foiz, oylik, dars haqi yoki talaba ulushi — qaysi usulda ham avtomatik hisoblanadi." },
  ],
  steps: [
    { title: "Joriy jarayonlaringizni ko'rib chiqamiz", body: "Qisqa suhbat davomida markazingiz hozir qanday ishlashini tushunamiz." },
    { title: "Ma'lumotlaringizni tizimga o'tkazamiz", body: "Mavjud o'quvchilar, guruhlar va to'lovlar tarixini Excel yoki daftardan ko'chirishda yordam beramiz." },
    { title: "Jamoangizni o'qitamiz", body: "Administrator va o'qituvchilar 1 kun ichida kundalik ishlarni mustaqil bajara boshlaydi." },
  ],
  faqHeading: "Avtomatlashtirish bo'yicha ko'p so'raladigan savollar",
  faq,
  leadSource: "Avtomatlashtirish sahifasi",
  leadHeading: "Markazingizni avtomatlashtiring",
  leadDescription: "Ism va telefon raqamingizni qoldiring — joriy jarayonlaringizni ko'rib chiqib, qanday o'tish mumkinligini ko'rsatamiz.",
  leadCta: "Bepul konsultatsiya olish",
  leadNotePlaceholder: "Hozir qaysi vositalardan foydalanasiz? (ixtiyoriy)",
};

export default function AvtomatlashtirishPage() {
  return (
    <>
      <Script id="schema-service-avtomatlashtirish" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <Script id="schema-faq-avtomatlashtirish" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Script id="schema-breadcrumb-avtomatlashtirish" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <ClusterPage {...content} />
    </>
  );
}
