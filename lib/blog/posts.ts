import crm from "@/content/blog/crm-tanlash.json";

export const posts = [
  {
    slug: "oquv-markazi-crm-tanlash",
    title: "O‘quv markazi uchun CRM tanlash: xariddan oldin beriladigan 12 savol",
    description: "To‘lov, davomat, o‘qituvchi oyligi va tarifni qanday tekshirish kerak? Markazingizga mos tizimni tanlash uchun amaliy qo‘llanma.",
    category: "CRM va boshqaruv",
    date: "2026-09-21",
    dateLabel: "21-sentabr, 2026",
    author: "OneRoom",
    image: "/blog/crm-tanlash.png",
    imageAlt: "OneRoom logotipi va CRM, LMS, Moliya yozuvli ko‘k yo‘nalish belgilari",
    markdown: crm.markdown,
    readingMinutes: Math.ceil(crm.markdown.split(/\s+/).length / 200),
  },
];

export function getPost(slug: string) {
  return posts.find((post) => post.slug === slug);
}

export function getSections(markdown: string) {
  return markdown.split("\n").filter((line) => line.startsWith("## ")).map((line, index) => ({
    id: `bolim-${index + 1}`, title: line.slice(3),
  }));
}
