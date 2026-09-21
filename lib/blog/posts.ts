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
}

interface RawPost {
  slug: string;
  date: string;
  author: string;
  image: string;
  text: Record<Locale, PostText>;
}

export interface Post extends PostText {
  slug: string;
  date: string;
  author: string;
  image: string;
  readingMinutes: number;
}

const RAW: RawPost[] = [
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
