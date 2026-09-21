// Bosh sahifaning kontenti: ma'lumotlar (tariflar, imkoniyatlar, qadamlar) va matnlar.
// Barcha bo'limlar shu yerdan o'qiydi — narx yoki matnni o'zgartirish uchun faqat shu fayl.
//
// DIQQAT: tarif narxlari `app/page.tsx`dagi JSON-LD `offers` bilan bir xil bo'lishi shart —
// Google structured data'ni ko'rinadigan matn bilan solishtiradi.
import {
  Users, CreditCard, CalendarDays, ClipboardCheck, BarChart3, UserPlus, Building2, Bell,
} from "lucide-react";

export { faqItems } from "@/components/landing/faq-data";
export { CLUSTER_PAGES } from "@/lib/seo/cluster-pages";
export { CONTACT_PHONE, CONTACT_PHONE_DISPLAY } from "@/lib/seo/site";

export const pillars = [
  {
    image: "/landing/pillars/speed.png",
    eyebrow: "Istalgan qurilmada",
    title: "Ishingiz doim yoningizda",
    description: "Telefon, planshet yoki kompyuterdan kiring — ishni qolgan joyingizdan davom ettiring.",
  },
  {
    image: "/landing/pillars/security.png",
    eyebrow: "Ishonchli himoya",
    title: "Ma’lumotlaringiz xavfsiz",
    description: "Ma’lumotlar shifrlanadi va zaxira nusxalari muntazam yaratiladi.",
  },
  {
    image: "/landing/pillars/browser.png",
    eyebrow: "Darhol ishlaydi",
    title: "Yuklab olish shart emas",
    description: "Brauzerni oching va ishni boshlang. Yangilanishlar avtomatik yetib keladi.",
  },
  {
    image: "/landing/pillars/support.png",
    eyebrow: "Savolingiz bo‘lsa",
    title: "Yordam — o‘zbek tilida",
    description: "Jamoamiz ish vaqtida savollaringizga o‘zbek tilida amaliy yordam beradi.",
  },
];

export const features = [
  {
    icon: UserPlus,
    title: "CRM va Lidlar",
    description:
      "Yangi mijozlarni kuzatib boring: qo'ng'iroq, demo, shartnoma — har bir bosqichni nazorat qiling.",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  {
    icon: Users,
    title: "O'quvchilar bazasi",
    description:
      "Har bir o'quvchi haqida to'liq ma'lumot: guruh, kurs, to'lov tarixi va davomot — bir joyda.",
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-100",
  },
  {
    icon: CreditCard,
    title: "Moliya va To'lovlar",
    description:
      "Oylik to'lovlarni kuzating, qarzdorlarni avtomatik aniqlang. Kassa hisoboti bir zumda tayyor.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
  },
  {
    icon: CalendarDays,
    title: "Dars Jadvali",
    description:
      "Xona va o'qituvchilar bo'yicha jadval tuzing. Ziddiyatlarni oldini olish uchun aqlli tekshiruv.",
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-100",
  },
  {
    icon: ClipboardCheck,
    title: "Davomot nazorati",
    description:
      "Har darsda davomatni belgilang. Ota-onalarga real vaqtda xabar yuboring. QR kod orqali belgilash.",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-100",
  },
  {
    icon: BarChart3,
    title: "Hisobotlar va Tahlil",
    description:
      "Daromad, o'quvchilar soni, davomot foizi — grafik shaklda. PDF va Excel eksport.",
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    border: "border-cyan-100",
  },
  {
    icon: Building2,
    title: "Ko'p filial boshqaruvi",
    description:
      "Bir akkountdan barcha filiallarni boshqaring. Har bir filial uchun alohida hisobot.",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-100",
  },
  {
    icon: Bell,
    title: "Avtomatik bildirishnomalar",
    description:
      "To'lov eslatmalari, dars bekor qilish xabarlari — barchasi Telegram bot orqali avtomatik.",
    color: "text-pink-600",
    bg: "bg-pink-50",
    border: "border-pink-100",
  },
];

export const steps = [
  {
    number: "01",
    title: "Ariza qoldirasiz",
    description:
      "Ismingiz, telefon raqamingiz va markaz nomini yuborasiz. Mutaxassisimiz siz bilan bog‘lanadi.",
    badge: "1 daqiqalik ariza",
  },
  {
    number: "02",
    title: "Sozlab beramiz",
    description:
      "OneRoom’ni filiallaringiz, kurslaringiz va ish tartibingizga moslab birga sozlaymiz.",
    badge: "Markazingizga mos",
  },
  {
    number: "03",
    title: "Ma’lumotlarni kiritasiz",
    description:
      "O‘quvchilar, guruhlar va to‘lov ma’lumotlarini qo‘lda yoki Excel orqali tizimga qo‘shasiz.",
    badge: "Excel orqali oson",
  },
  {
    number: "04",
    title: "Boshqaruvni boshlaysiz",
    description:
      "Davomat, to‘lovlar, dars jadvali va hisobotlarni bitta joydan boshqarishni boshlaysiz.",
    badge: "Hammasi bir joyda",
  },
];

export const plans = [
  {
    name: "Starter",
    price: "270,000",
    period: "so'm/oy",
    description: "Kichik o'quv markazlar uchun boshlash uchun ideal",
    limits: [
      "0–200 o'quvchi",
      "1 ta filial",
      "3 tagacha admin",
    ],
    features: [
      "Guruh va darslar boshqaruvi",
      "To'lov va qarzdorlik nazorati",
      "Davomat boshqaruvi",
      "Analytics",
      "Telegram Bot",
      "Server hosting",
      "Ma'lumotlarni zaxiralash",
      "Tizim yangilanishlari",
      "Ish vaqtida texnik yordam",
    ],
    cta: "Ariza qoldirish",
    highlight: false,
  },
  {
    name: "Business",
    price: "570,000",
    period: "so'm/oy",
    description: "O'sib borayotgan o'quv markazlar uchun — eng ko'p tanlangan",
    limits: [
      "201–500 o'quvchi",
      "3 tagacha filial",
      "5 tagacha admin",
    ],
    features: [
      "Guruh va darslar boshqaruvi",
      "To'lov va qarzdorlik nazorati",
      "Davomat boshqaruvi",
      "Analytics",
      "Telegram Bot",
      "API integratsiyasi",
      "Server hosting",
      "Ma'lumotlarni zaxiralash",
      "Tizim yangilanishlari",
      "Ustuvor texnik yordam",
    ],
    cta: "Ariza qoldirish",
    highlight: true,
    badge: "Eng mashhur",
  },
  {
    name: "Premium",
    price: "870,000",
    period: "so'm/oy",
    description: "Yirik o'quv markaz tarmoqlari uchun to'liq yechim",
    limits: [
      "501–1000 o'quvchi",
      "8 tagacha filial",
      "12 tagacha admin",
    ],
    features: [
      "Guruh va darslar boshqaruvi",
      "To'lov va qarzdorlik nazorati",
      "Davomat boshqaruvi",
      "Analytics",
      "Telegram Bot",
      "API integratsiyasi",
      "Server hosting",
      "Ma'lumotlarni zaxiralash",
      "Tizim yangilanishlari",
      "24/7 texnik yordam",
    ],
    cta: "Ariza qoldirish",
    highlight: false,
  },
];

export const hero = {
  titleLine1: "Kamroq ish.",
  titleLine2: "Ko‘proq",
  titleAccent: "ta’lim.",
  // SEO matni: birinchi jumla — bosh sahifaga biriktirilgan asosiy kalit so'z iborasi
  // ("o'quv markaz uchun CRM", "boshqaruv tizimi"); qolgani klaster sahifalar mavzulari (davomat,
  // to'lov, qarzdorlik, jadval) va "Excel o'rniga" ehtiyoji. H1 esa brend shiori.
  leadStrong: "OneRoom — o'quv markaz uchun CRM va boshqaruv tizimi.",
  lead: "Davomat, to'lov, qarzdorlik va dars jadvalini bitta dasturda yuriting — Excel va daftarsiz.",
  // Ko'rinmaydi, lekin rasmning tavsifi sifatida asosiy kalit so'z iborasini tashiydi (SEO + ekran o'quvchi).
  imageAlt: "OneRoom — o'quv markazlari uchun CRM va boshqaruv tizimi: ta’limga yangi imkoniyatlar ochuvchi ko‘k shisha portal",
};

export const featuresCopy = {
  eyebrow: "Imkoniyatlar",
  titleStart: "Markaz boshqaruvi uchun",
  titleAccent: "to'liq yechim",
  lead:
    "OneRoom — o'nlab alohida dasturlarni almashtiruvchi yagona platforma. O'rnatish shart emas, brauzerdan ishlaydi.",
};

export const solutionsCopy = {
  eyebrow: "Yechimlar",
  title: "Har bir jarayon uchun alohida yechim",
  lead: "Har bir modul haqida batafsil o'qing — qanday ishlashini, qaysi muammoni yechishini ko'ring.",
};

export const howCopy = {
  eyebrow: "Qanday ishlaydi",
  title: "4 qadamda ishga tushiring",
};

export const pricingCopy = {
  eyebrow: "Narxlar",
  title: "Sizning o'quv markazingizga mos narx",
  lead:
    "Hamma tarifda 7 kunlik bepul sinov. Karta kerak emas. Istalgan vaqt o'zgartirish yoki bekor qilish mumkin.",
  customTitle: "1000+ o'quvchi yoki maxsus ehtiyojlar?",
  customBody:
    "Cheksiz filiallar, cheksiz admin, API integratsiya, maxsus subdomen dizayni, ma'lumotlarni ko'chirish yordami va SLA kafolat. Narx kelishuv asosida belgilanadi.",
  customCta: "Sales bilan bog'lanish",
};

export const firstCopy = {
  title: "OneRoom'ni bepul sinab ko'ring",
  body: "Markazingizni birga sozlaymiz. Barcha imkoniyatlardan 7 kun bepul foydalaning.",
};

export const faqCopy = {
  eyebrow: "Ko'p so'raladigan savollar",
  title: "Savollaringiz bormi?",
  lead: "Kerakli javobni toping yoki bizga Telegram orqali yozing.",
};

export const contactCopy = {
  eyebrow: "Bog'lanish",
  title: "Ariza qoldiring",
  lead: "Raqamingizni qoldiring — siz bilan bog'lanamiz.",
};

export const links = {
  telegram: "https://t.me/oneroomuz",
  telegramHandle: "@oneroomuz",
  email: "support@oneroom.uz",
  sales: "https://t.me/oneroomuz",
};
