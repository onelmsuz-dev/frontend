import best from "@/content/blog/eng-yaxshi-crm.json";
import bestRu from "@/content/blog/eng-yaxshi-crm.ru.json";
import bestEn from "@/content/blog/eng-yaxshi-crm.en.json";
import excel from "@/content/blog/excel-yoki-crm.json";
import excelRu from "@/content/blog/excel-yoki-crm.ru.json";
import excelEn from "@/content/blog/excel-yoki-crm.en.json";
import crm from "@/content/blog/crm-tanlash.json";
import crmRu from "@/content/blog/crm-tanlash.ru.json";
import crmEn from "@/content/blog/crm-tanlash.en.json";
import type { Locale } from "@/lib/i18n/config";

/** Maqolaning bitta tildagi matnlari. Sana, muqova va slug — tilga bog'liq emas (manzil uch tilda bir xil). */
interface PostText {
  title: string;
  description: string;
  category: string;
  dateLabel: string;
  imageAlt: string;
  markdown: string;
  /** Maqola oxiridagi chaqiriq bloki uchun alohida matn; berilmasa blogning umumiy matni (`blog-ui.ts`) chiqadi. */
  cta?: { title: string; text: string; button: string };
}

interface RawPost {
  slug: string;
  date: string;
  author: string;
  image: string;
  imageWidth?: number;
  imageHeight?: number;
  text: Record<Locale, PostText>;
}

export interface Post extends PostText {
  slug: string;
  date: string;
  author: string;
  image: string;
  imageWidth?: number;
  imageHeight?: number;
  readingMinutes: number;
}

const RAW: RawPost[] = [
  {
    slug: "oquv-markazlari-uchun-eng-yaxshi-crm",
    date: "2026-10-10",
    author: "OneRoom",
    image: "/blog/eng-yaxshi-crm.jpg",
    imageWidth: 1536,
    imageHeight: 864,
    text: {
      uz: {
        title: "O‘quv markazi uchun eng yaxshi CRM: O‘zbekistonda 6 tizim",
        description: "OneRoom, Modme, Soff CRM, EduTizim, amoCRM va Bitrix24: narx, bepul sinov va imkoniyatlar taqqoslashi. 2026-yil oktabr holatiga ochiq manbalardan.",
        category: "CRM va boshqaruv",
        dateLabel: "10-oktabr, 2026",
        imageAlt: "Sinfxonadagi noutbukda OneRoom boshqaruv paneli, yonida OneRoom va boshqa CRM tizimlarining taqqoslash kartochkalari",
        markdown: best.markdown,
        cta: {
          title: "OneRoom’ni 7 kun bepul sinab ko‘ring.",
          text: "Ariza qoldiring: mutaxassis siz bilan bog‘lanadi va tizimni markazingizga moslab sozlaydi. Karta ma’lumoti so‘ralmaydi.",
          button: "Ariza qoldirish",
        },
      },
      ru: {
        title: "Лучшая CRM для учебного центра: 6 систем в Узбекистане",
        description: "OneRoom, Modme, Soff CRM, EduTizim, amoCRM и Bitrix24: сравнение цен, бесплатного периода и возможностей. По открытым данным на октябрь 2026 года.",
        category: "CRM и управление",
        dateLabel: "10 октября 2026",
        imageAlt: "Ноутбук с панелью управления OneRoom в учебном классе, рядом карточки сравнения OneRoom и других CRM-систем",
        markdown: bestRu.markdown,
        cta: {
          title: "Попробуйте OneRoom 7 дней бесплатно.",
          text: "Оставьте заявку: специалист свяжется с вами и настроит систему под ваш центр. Данные карты не запрашиваются.",
          button: "Оставить заявку",
        },
      },
      en: {
        title: "Best CRM for Learning Centers: 6 Systems in Uzbekistan",
        description: "OneRoom, Modme, Soff CRM, EduTizim, amoCRM and Bitrix24 compared on pricing, free trials and features. Based on public data as of October 2026.",
        category: "CRM & management",
        dateLabel: "October 10, 2026",
        imageAlt: "A laptop showing the OneRoom dashboard in a classroom, next to comparison cards for OneRoom and other CRM systems",
        markdown: bestEn.markdown,
        cta: {
          title: "Try OneRoom free for 7 days.",
          text: "Submit a request: a specialist will contact you and set the system up for your center. No card details are asked for.",
          button: "Submit a request",
        },
      },
    },
  },
  {
    slug: "excel-yoki-crm",
    date: "2026-09-30",
    author: "OneRoom",
    image: "/blog/excel-yoki-crm.png",
    imageWidth: 1677,
    imageHeight: 938,
    text: {
      uz: {
        title: "Excel yoki CRM: o‘quv markazi qachon tizimga o‘tishi kerak?",
        description: "O‘quv markaziga Excel yetarlimi yoki CRM kerakmi? Kundalik vazifalar taqqoslanishi, bir haftalik tekshiruv jadvali va qaror qabul qilish mezonlari.",
        category: "CRM va boshqaruv",
        dateLabel: "30-sentabr, 2026",
        imageAlt: "Excel jadvallari va OneRoom boshqaruv kartochkalari taqqoslangan, ‘Excelmi yoki CRM?’ yozuvli tasvir",
        markdown: excel.markdown,
      },
      ru: {
        title: "Excel или CRM: когда учебному центру пора переходить на систему?",
        description: "Достаточно ли учебному центру Excel? Сравнение задач, таблица наблюдений на неделю и критерии решения о переходе на CRM.",
        category: "CRM и управление",
        dateLabel: "30 сентября 2026",
        imageAlt: "Таблицы Excel и карточки управления OneRoom с надписью на узбекском ‘Excelmi yoki CRM?’",
        markdown: excelRu.markdown,
      },
      en: {
        title: "Excel or CRM: When Should a Learning Center Switch?",
        description: "Is Excel enough for your learning center? Compare everyday tasks, use a one-week observation table and decide when to try a CRM.",
        category: "CRM & management",
        dateLabel: "September 30, 2026",
        imageAlt: "Excel spreadsheets beside OneRoom management cards, with the Uzbek heading ‘Excelmi yoki CRM?’",
        markdown: excelEn.markdown,
      },
    },
  },
  {
    slug: "oquv-markazi-crm-tanlash",
    date: "2026-09-21",
    author: "OneRoom",
    image: "/blog/crm-tanlash.png",
    text: {
      uz: {
        title: "O‘quv markazi uchun CRM tanlash: xariddan oldin beriladigan 12 savol",
        description: "To‘lov, davomat, o‘qituvchi oyligi va tarifni qanday tekshirish kerak? Markazingizga mos tizimni tanlash uchun amaliy qo‘llanma.",
        category: "CRM va boshqaruv",
        dateLabel: "21-sentabr, 2026",
        imageAlt: "OneRoom logotipi va CRM, LMS, Moliya yozuvli ko‘k yo‘nalish belgilari",
        markdown: crm.markdown,
      },
      ru: {
        title: "Как выбрать CRM для учебного центра: 12 вопросов перед покупкой",
        description: "Как проверить платежи, посещаемость, зарплату преподавателей и тариф? Практическое руководство по выбору системы для вашего центра.",
        category: "CRM и управление",
        dateLabel: "21 сентября 2026",
        // Muqova rasmidagi yozuvlar hozircha o'zbekcha — alt matn rasmdagini aynan tasvirlaydi.
        imageAlt: "Логотип OneRoom и синие указатели-стрелки с надписями CRM, LMS, Moliya",
        markdown: crmRu.markdown,
      },
      en: {
        title: "CRM for a Learning Center: 12 Questions to Ask Before You Buy",
        description: "How do you check payments, attendance, teacher pay and pricing? A practical guide to choosing the right system for your center.",
        category: "CRM & management",
        dateLabel: "September 21, 2026",
        imageAlt: "OneRoom logo and blue direction signs reading CRM, LMS, Moliya",
        markdown: crmEn.markdown,
      },
    },
  },
];

function view(p: RawPost, locale: Locale): Post {
  const text = p.text[locale];
  return {
    slug: p.slug,
    date: p.date,
    author: p.author,
    image: p.image,
    imageWidth: p.imageWidth,
    imageHeight: p.imageHeight,
    ...text,
    readingMinutes: Math.ceil(text.markdown.split(/\s+/).length / 200),
  };
}

/** Maqolalar (yangisi birinchi) — tanlangan tilda. */
export function getPosts(locale: Locale = "uz"): Post[] {
  return RAW.map((p) => view(p, locale));
}

/** O'zbekcha maqolalar (sitemap va eski import'lar uchun). */
export const posts: Post[] = getPosts("uz");

export function getPost(slug: string, locale: Locale = "uz"): Post | undefined {
  const raw = RAW.find((p) => p.slug === slug);
  return raw ? view(raw, locale) : undefined;
}

export function getSections(markdown: string) {
  return markdown.split("\n").filter((line) => line.startsWith("## ")).map((line, index) => ({
    id: `bolim-${index + 1}`, title: line.slice(3),
  }));
}
