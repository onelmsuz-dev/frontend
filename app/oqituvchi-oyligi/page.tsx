import type { Metadata } from "next";
import Script from "next/script";
import { Percent, Banknote, Clock, Users } from "lucide-react";
import { ClusterPage, type ClusterPageContent } from "@/components/landing/cluster-page";
import { SITE_URL, ORG_ID } from "@/lib/seo/site";

const PATH = "/oqituvchi-oyligi";
const TITLE = "O'qituvchilar Oyligini Hisoblash Dasturi — 4 xil usul | OneRoom";
const DESCRIPTION =
  "O'qituvchilar oyligini avtomatik hisoblash: foiz, belgilangan oylik, dars haqi yoki talaba ulushi — qaysi usulda ham xatosiz va vaqtsiz. Bepul sinab ko'ring.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "o'qituvchi oyligini hisoblash dasturi",
    "o'qituvchilar oyligini avtomatik hisoblash",
    "o'quv markazi oylik hisoblash",
    "o'qituvchi maoshi dasturi",
    "o'quv markazida o'qituvchilar oylikini hisoblash",
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
    question: "O'qituvchilar oyligini avtomatik hisoblash mumkinmi?",
    answer:
      "Ha. Har bir o'qituvchiga hisoblash usulini bir marta belgilaysiz — keyin oylik har oy tizim tomonidan avtomatik hisoblanadi, qo'lda kalkulyator bilan o'tirish shart emas.",
  },
  {
    question: "Qaysi hisoblash usullari mavjud — foiz yoki belgilangan summa?",
    answer:
      "To'rtta usul bor: tushumdan foiz (guruhga tushgan to'lovning belgilangan foizi), belgilangan oylik (qat'iy summa), dars haqi (har o'tilgan dars uchun) va talaba ulushi (har bir faol o'quvchi uchun belgilangan summa).",
  },
  {
    question: "O'qituvchi o'z oyligini qanday ko'radi?",
    answer:
      "Har bir o'qituvchi o'z shaxsiy kabinetida joriy oylik hisoblash usulini, joriy oy summasini va oldingi oylar tarixini istalgan vaqt ko'rishi mumkin — bu shaffoflikni oshiradi va ishonchsizlikni kamaytiradi.",
  },
  {
    question: "Turli o'qituvchiga turli hisoblash usulini qo'llash mumkinmi?",
    answer:
      "Ha, har bir o'qituvchi uchun alohida usul va stavka belgilanadi — masalan, bir o'qituvchiga foiz, boshqasiga esa dars haqi bo'yicha.",
  },
  {
    question: "Dars o'tilmasa, oylik qanday hisoblanadi?",
    answer:
      "\"Dars haqi\" usulida faqat davomat belgilangan, ya'ni haqiqatda o'tilgan darslar hisobga olinadi — o'tilmagan dars uchun to'lov hisoblanmaydi.",
  },
];

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "O'qituvchi oyligini hisoblash dasturi",
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
    { "@type": "ListItem", position: 2, name: "O'qituvchi oyligi", item: `${SITE_URL}${PATH}` },
  ],
};

const content: ClusterPageContent = {
  href: PATH,
  eyebrow: "O'qituvchi oyligi",
  h1: "O'qituvchilar oyligini hisoblash dasturi",
  subtitle:
    "Foiz, belgilangan oylik, dars haqi yoki talaba ulushi — qaysi usulni tanlasangiz ham, oylik har oy avtomatik va xatosiz hisoblanadi.",
  heroBullets: [
    "4 xil hisoblash usuli",
    "Har oy avtomatik hisoblanadi",
    "O'qituvchi o'z oyligini o'zi ko'radi",
  ],
  painHeading: "O'qituvchi oyligini qo'lda hisoblash nega xato qiladi?",
  painSubheading: "Har oy qaytariladigan qo'lda hisob-kitob — xato va nizolarning eng ko'p uchraydigan manbai.",
  painPoints: [
    {
      title: "Foizli hisob-kitob qo'lda osongina adashtiriladi",
      body: "Har bir guruhning tushumini alohida hisoblab, foizini chiqarish — bir nechta o'qituvchi bo'lganda xatoga juda moyil jarayon.",
    },
    {
      title: "Har oy qaytadan hisoblash vaqt oladi",
      body: "Administrator oy oxirida barcha o'qituvchilar uchun kalkulyator bilan bir necha soat o'tirishga majbur bo'ladi.",
    },
    {
      title: "O'qituvchi o'z oyligini tushunmaydi",
      body: "Hisob-kitob shaffof bo'lmasa, o'qituvchida \"to'g'ri hisoblanyaptimi\" degan shubha va ishonchsizlik paydo bo'ladi.",
    },
    {
      title: "Turli guruhda turli usul — chalkashish oshadi",
      body: "Ba'zi o'qituvchi foizda, ba'zisi belgilangan summada ishlasa, qo'lda kuzatish yanada murakkablashadi.",
    },
  ],
  featuresHeading: "OneRoom'da oylik qanday hisoblanadi",
  featuresSubheading: "To'rtta tayyor usul — markazingiz siyosatiga moslab tanlaysiz.",
  features: [
    {
      icon: Percent,
      title: "Tushumdan foiz",
      body: "O'qituvchi o'z guruhlariga oyda tushgan to'lovlarning belgilangan foizini oladi — hisob avtomatik amalga oshadi.",
    },
    {
      icon: Banknote,
      title: "Belgilangan oylik",
      body: "O'quvchilar soniga bog'liq bo'lmagan holda, har oy qat'iy summa to'lanadi.",
    },
    {
      icon: Clock,
      title: "Dars haqi",
      body: "Har o'tilgan (davomat belgilangan) dars uchun belgilangan summa avtomatik hisoblanadi.",
    },
    {
      icon: Users,
      title: "Talaba ulushi",
      body: "Guruhdagi har bir faol o'quvchi uchun belgilangan summa avtomatik qo'shib boriladi.",
    },
  ],
  steps: [
    { title: "O'qituvchiga hisoblash usulini belgilang", body: "Foiz, oylik, dars haqi yoki talaba ulushi — bir marta sozlanadi." },
    { title: "Darslar va to'lovlar tizimga tushadi", body: "Davomat va to'lovlar odatdagidek kiritilaveradi — qo'shimcha ish yo'q." },
    { title: "Oylik avtomatik hisoblanadi", body: "O'qituvchi joriy oylikni va tarixni o'z kabinetidan istalgan vaqt ko'radi." },
  ],
  faqHeading: "O'qituvchi oyligi bo'yicha ko'p so'raladigan savollar",
  faq,
  leadSource: "O'qituvchi oyligi sahifasi",
  leadHeading: "Oylik hisoblashni avtomatlashtiring",
  leadDescription: "Ism va telefon raqamingizni qoldiring — oylik hisoblash modulini 7 kunlik bepul sinov davomida ko'rsatamiz.",
  leadCta: "Bepul sinab ko'rish",
  leadNotePlaceholder: "Nechta o'qituvchingiz bor? (ixtiyoriy)",
};

export default function OqituvchiOyligiPage() {
  return (
    <>
      <Script id="schema-service-oylik" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <Script id="schema-faq-oylik" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Script id="schema-breadcrumb-oylik" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <ClusterPage {...content} />
    </>
  );
}
