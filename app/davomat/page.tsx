import type { Metadata } from "next";
import Script from "next/script";
import { ClipboardCheck, MessageSquare, Users, BarChart3 } from "lucide-react";
import { ClusterPage, type ClusterPageContent } from "@/components/landing/cluster-page";
import { SITE_URL, ORG_ID } from "@/lib/seo/site";

const PATH = "/davomat";
const TITLE = "O'quv Markazi Davomat Dasturi — Elektron Davomat Nazorati | OneRoom";
const DESCRIPTION =
  "O'quv markazi uchun davomat dasturi: har bir darsda kim keldi, kim kelmadi — bir necha soniyada. Kelmagan o'quvchi uchun ota-onaga avtomatik xabar. Bepul sinab ko'ring.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "o'quv markaz davomat dasturi",
    "o'quvchilar davomatini yuritish",
    "o'quvchi davomat tizimi",
    "o'quv markazida davomat",
    "davomatni avtomatlashtirish",
    "o'quvchilar davomatini nazorat qilish",
    "online davomat tizimi",
    "elektron davomat tizimi",
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
    question: "O'quv markazida davomatni qanday yuritish kerak?",
    answer:
      "Eng ishonchli yo'l — qog'oz jurnal o'rniga elektron davomat tizimi. O'qituvchi har bir dars boshida guruh ro'yxatini ochadi va har bir o'quvchi uchun \"Keldi\", \"Kelmadi\", \"Kech keldi\" yoki \"Sababli\" statusini belgilaydi. Ma'lumot darhol saqlanadi va yo'qolmaydi.",
  },
  {
    question: "Davomatni kim belgilaydi — administrator yoki o'qituvchi?",
    answer:
      "OneRoom'da har bir o'qituvchi o'z hisobidan faqat o'ziga biriktirilgan guruhlarning davomatini belgilaydi. Administrator esa barcha guruhlar bo'yicha davomatni ko'rish va kerak bo'lsa tuzatish huquqiga ega.",
  },
  {
    question: "Ota-onaga davomat haqida qanday xabar boradi?",
    answer:
      "O'quvchi darsga kelmasa yoki sababsiz qoldirsa, ota-onaga Telegram bot yoki SMS orqali avtomatik xabar yuboriladi — administrator yoki o'qituvchi qo'lda qo'ng'iroq qilishi shart emas.",
  },
  {
    question: "Kechikkan o'quvchi qanday hisoblanadi?",
    answer:
      "Dars boshlanish vaqtidan keyingi belgilangan daqiqa oralig'ida kelgan o'quvchi avtomatik \"Kech keldi\" deb belgilanadi. Bu chegara markazingiz qoidasiga moslab sozlanadi.",
  },
  {
    question: "Davomat statistikasi qayerda ko'rinadi?",
    answer:
      "Hisobotlar bo'limida har bir guruh, o'quvchi va oy kesimida davomat foizi va dinamikasi avtomatik hisoblanadi — qaysi o'quvchi tez-tez darsni qoldirayotganini darhol ko'rasiz.",
  },
  {
    question: "OneRoom'da davomatni yuritishni bepul sinab ko'rish mumkinmi?",
    answer:
      "Ha, 7 kunlik bepul sinov davrida davomat moduli ham to'liq ochiq — karta ma'lumoti kerak emas. Pastdagi forma orqali ariza qoldiring, biz o'zimiz bog'lanamiz.",
  },
];

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "O'quv markazi davomat nazorati dasturi",
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
    { "@type": "ListItem", position: 2, name: "Davomat nazorati", item: `${SITE_URL}${PATH}` },
  ],
};

const content: ClusterPageContent = {
  href: PATH,
  eyebrow: "Davomat nazorati",
  h1: "O'quv markazi uchun davomat dasturi",
  subtitle:
    "Qog'oz jurnal o'rniga — har bir darsda kim keldi, kim kelmadi, kim kech qoldi, bir necha soniyada belgilanadi. Ota-onaga xabar avtomatik ketadi.",
  heroBullets: [
    "1 daqiqada butun guruh belgilanadi",
    "Kelmagan o'quvchi uchun avtomatik xabar",
    "Oy oxirida tayyor davomat hisoboti",
  ],
  painHeading: "Qog'oz jurnal bilan davomat yuritish nega qiyin?",
  painSubheading:
    "Ko'pchilik o'quv markazi hali ham daftar yoki Exceldan foydalanadi — va aynan shu yerda muammolar boshlanadi.",
  painPoints: [
    {
      title: "Daftar yo'qoladi, ma'lumot tarqoq qoladi",
      body: "Har bir o'qituvchida alohida jurnal — markaz direktori umumiy manzarani faqat oy oxirida, qo'lda yig'ib ko'ra oladi.",
    },
    {
      title: "Kim kelmaganini ota-ona kech biladi",
      body: "Bola darsni qoldirgani haqida ota-ona bir necha kundan keyin, ba'zan umuman bilmay qoladi — bu markazga ishonchni pasaytiradi.",
    },
    {
      title: "Oy oxirida hisob-kitob soatlab vaqt oladi",
      body: "Davomat foizini, kim necha marta qoldirganini qo'lda hisoblash — administratorning butun kunini yeb qo'yadigan ish.",
    },
    {
      title: "Kechikish va sababli holatlar aniq qayd etilmaydi",
      body: "Daftarda faqat \"keldi/kelmadi\" bor, kech kelgan yoki sababli sabab bilan qoldirganlar boshqalar bilan bir xil ko'rinadi.",
    },
  ],
  featuresHeading: "OneRoom'da davomat qanday ishlaydi",
  featuresSubheading: "Bitta tizim — belgilashdan tortib ota-onaga xabar yuborishgacha.",
  features: [
    {
      icon: ClipboardCheck,
      title: "4 xil status — aniq rasm",
      body: "Keldi, kelmadi, kech keldi yoki sababli — har bir o'quvchi holati bitta bosishda belgilanadi. Kechikish uchun daqiqa chegarasi markazingizga moslab sozlanadi.",
    },
    {
      icon: MessageSquare,
      title: "Ota-onaga avtomatik xabar",
      body: "O'quvchi darsga kelmasa, ota-onaga Telegram bot yoki SMS orqali darhol xabar ketadi — qo'lda qo'ng'iroq qilish shart emas.",
    },
    {
      icon: Users,
      title: "Guruh bo'yicha tezkor belgilash",
      body: "O'qituvchi darsni ochadi, guruh ro'yxati avtomatik chiqadi va bir necha soniyada barcha o'quvchilar holati belgilanadi.",
    },
    {
      icon: BarChart3,
      title: "Davomat dinamikasi hisobotda",
      body: "Har bir guruh, o'quvchi va oy bo'yicha davomat foizi Hisobotlar bo'limida avtomatik ko'rinadi — kim tez-tez qoldirayotganini darhol bilasiz.",
    },
  ],
  steps: [
    { title: "Guruhni va sanani tanlang", body: "O'qituvchi yoki administrator kunlik dars jadvalidan tegishli guruhni ochadi." },
    { title: "Har bir o'quvchi statusini belgilang", body: "Keldi, kelmadi, kech keldi yoki sababli — bir marta bosish yetarli." },
    { title: "Saqlang — xabar avtomatik ketadi", body: "Kelmagan o'quvchi ota-onasiga Telegram yoki SMS orqali darhol xabar yuboriladi." },
  ],
  faqHeading: "Davomat bo'yicha ko'p so'raladigan savollar",
  faq,
  leadSource: "Davomat sahifasi",
  leadHeading: "Davomatni raqamlashtirib ko'ring",
  leadDescription: "Ism va telefon raqamingizni qoldiring — davomat modulini sizga 7 kunlik bepul sinov davomida ko'rsatamiz.",
  leadCta: "Bepul sinab ko'rish",
  leadNotePlaceholder: "Nechta guruh va o'quvchingiz bor? (ixtiyoriy)",
};

export default function DavomatPage() {
  return (
    <>
      <Script id="schema-service-davomat" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <Script id="schema-faq-davomat" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Script id="schema-breadcrumb-davomat" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <ClusterPage {...content} />
    </>
  );
}
