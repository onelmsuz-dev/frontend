import type { Metadata } from "next";
import Script from "next/script";
import { UserCheck, BarChart3, Target, Layers } from "lucide-react";
import { ClusterPage, type ClusterPageContent } from "@/components/landing/cluster-page";
import { SITE_URL, ORG_ID } from "@/lib/seo/site";

const PATH = "/hisobot";
const TITLE = "O'quv Markazi Hisobot Dasturi — Analitika va Statistika | OneRoom";
const DESCRIPTION =
  "O'quv markazi uchun hisobot dasturi: daromad, davomat, lidlar va o'qituvchi samaradorligi bo'yicha tayyor hisobotlar. Excel/PDF eksport. Bepul sinab ko'ring.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "o'quv markazi hisobot dasturi",
    "o'quv markazi hisobotlari",
    "o'quv markazi analitika",
    "o'quv markazi statistikasi",
    "o'quv markazi moliyaviy hisobot",
    "o'quv markazi daromad hisoboti",
    "o'quv markazi boshqaruv paneli",
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
    question: "O'quv markazi uchun qanday hisobotlar kerak?",
    answer:
      "Eng muhimlari: o'quvchilar harakati (kelgan/ketgan), davomat dinamikasi, moliyaviy hisobot (daromad va yig'ilish darajasi), lidlar voronkasi va o'qituvchi/kurs kesimidagi samaradorlik. OneRoom bularning barchasini avtomatik hisoblab beradi.",
  },
  {
    question: "Hisobotlarni Excelga eksport qilish mumkinmi?",
    answer:
      "Ha, hisobotlarni Excel yoki PDF formatida yuklab olish mumkin — bo'limlarga, investorlarga yoki hisobchiga yuborish uchun qulay.",
  },
  {
    question: "Hisobot qanday tez-tez yangilanadi?",
    answer:
      "Real vaqtda. Har bir yangi to'lov, davomat belgisi yoki yangi lid tizimga tushgan zahoti hisobotlarga ta'sir qiladi — qo'lda yangilash shart emas.",
  },
  {
    question: "Lid voronkasi nima va nima uchun kerak?",
    answer:
      "Lid voronkasi — qiziqqan mijozdan to'lovchi o'quvchigacha bo'lgan yo'lni bosqichma-bosqich ko'rsatadi. Bu qaysi bosqichda ko'proq mijoz yo'qolayotganini aniqlab, marketing va sotuv jarayonini yaxshilashga yordam beradi.",
  },
  {
    question: "O'qituvchilar samaradorligini qanday solishtiraman?",
    answer:
      "O'qituvchi kesimidagi hisobot har bir o'qituvchining guruhlari, o'quvchilar soni va davomat ko'rsatkichlarini bir joyda ko'rsatadi — obyektiv solishtirish uchun qulay.",
  },
];

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "O'quv markazi hisobot va analitika dasturi",
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
    { "@type": "ListItem", position: 2, name: "Hisobot va analitika", item: `${SITE_URL}${PATH}` },
  ],
};

const content: ClusterPageContent = {
  href: PATH,
  eyebrow: "Hisobot va analitika",
  h1: "O'quv markazi uchun hisobot dasturi",
  subtitle:
    "Tarqoq raqamlar o'rniga — daromad, davomat, lidlar va o'qituvchi samaradorligi bo'yicha tayyor hisobotlar, real vaqtda yangilanadi.",
  heroBullets: [
    "5+ tayyor hisobot turi",
    "Real vaqtda yangilanadi",
    "Excel va PDF eksport",
  ],
  painHeading: "Hisobotsiz boshqarish nega xavfli?",
  painSubheading: "Raqamsiz qabul qilingan qaror — ko'pincha noto'g'ri qaror.",
  painPoints: [
    {
      title: "Qaror his-tuyg'u asosida qabul qilinadi",
      body: "Aniq raqam bo'lmasa, direktor \"menimcha yaxshi ketyapti\" degan taxmin bilan ishlashga majbur bo'ladi.",
    },
    {
      title: "Qaysi kurs foyda keltirayotgani noma'lum",
      body: "Ba'zi kurslar zarar bilan ishlayotgan bo'lishi mumkin — lekin buni ko'rsatadigan hisobot bo'lmasa, bilib ham bo'lmaydi.",
    },
    {
      title: "O'qituvchilar samaradorligini solishtirib bo'lmaydi",
      body: "Kim yaxshi ishlayotgani, kimning guruhida davomat pastligi — obyektiv ma'lumotsiz aniqlash qiyin.",
    },
    {
      title: "Lidlar qayerda yo'qolayotgani ko'rinmaydi",
      body: "Marketingga sarflangan pul qanday natija berayotgani, qaysi bosqichda mijoz sovib ketayotgani noma'lum qoladi.",
    },
  ],
  featuresHeading: "OneRoom qanday hisobotlarni avtomatik tayyorlaydi",
  features: [
    {
      icon: UserCheck,
      title: "O'quvchilar harakati",
      body: "Yangi qo'shilgan, chiqib ketgan va faol o'quvchilar dinamikasi — istalgan davr uchun bir necha soniyada.",
    },
    {
      icon: BarChart3,
      title: "Davomat dinamikasi",
      body: "Guruh va davr bo'yicha davomat foizi — qaysi guruhda muammo borligini darhol ko'rasiz.",
    },
    {
      icon: Target,
      title: "Lid voronkasi",
      body: "Qiziqqan mijozdan to'lovchi o'quvchigacha bo'lgan yo'l — qaysi bosqichda ko'p lid yo'qolayotganini ko'rsatadi.",
    },
    {
      icon: Layers,
      title: "Kurs va o'qituvchi kesimi",
      body: "Har bir kurs va o'qituvchi bo'yicha daromad, o'quvchilar soni va samaradorlikni bir joyda solishtirasiz.",
    },
  ],
  faqHeading: "Hisobot bo'yicha ko'p so'raladigan savollar",
  faq,
  leadSource: "Hisobot sahifasi",
  leadHeading: "Hisobotlarni bir joyda ko'ring",
  leadDescription: "Ism va telefon raqamingizni qoldiring — hisobot va analitika modulini 7 kunlik bepul sinov davomida ko'rsatamiz.",
  leadCta: "Bepul sinab ko'rish",
  leadNotePlaceholder: "Hozir hisobotni qanday tayyorlaysiz? (ixtiyoriy)",
};

export default function HisobotPage() {
  return (
    <>
      <Script id="schema-service-hisobot" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <Script id="schema-faq-hisobot" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Script id="schema-breadcrumb-hisobot" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <ClusterPage {...content} />
    </>
  );
}
