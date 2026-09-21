/**
 * Yechim sahifalarining qisqa tavsifi (navbar, footer, "Boshqa yechimlar" kartalari) — uch tilda.
 * O'zbekcha manba: `lib/seo/cluster-pages.ts` (o'zgarmagan); bu yerda faqat ruscha va inglizcha matnlar.
 * Manzil (`href`) va tartib manba bilan bir xil.
 */
import { CLUSTER_PAGES, type ClusterPageMeta } from "@/lib/seo/cluster-pages";
import type { Locale } from "./config";

type Text = Pick<ClusterPageMeta, "navLabel" | "title" | "blurb">;

const RU: Record<string, Text> = {
  "/oquv-markaz-crm": {
    navLabel: "CRM для учебного центра",
    title: "CRM для учебного центра",
    blurb: "Все модули в одной системе — полные возможности CRM.",
  },
  "/davomat": {
    navLabel: "Контроль посещаемости",
    title: "Программа учёта посещаемости для учебного центра",
    blurb: "Кто пришёл на занятие, а кто нет — за несколько секунд.",
  },
  "/tolovlar": {
    navLabel: "Платежи",
    title: "Система учёта платежей для учебного центра",
    blurb: "Приём и контроль платежей на одном экране.",
  },
  "/qarzdorlik": {
    navLabel: "Контроль задолженностей",
    title: "Контроль задолженностей учеников в учебном центре",
    blurb: "Автоматически находите должников и отправляйте напоминания.",
  },
  "/hisobot": {
    navLabel: "Отчёты и аналитика",
    title: "Программа отчётности для учебного центра",
    blurb: "Готовые отчёты по доходам, посещаемости и лидам.",
  },
  "/oqituvchi-oyligi": {
    navLabel: "Зарплата преподавателей",
    title: "Программа расчёта зарплаты преподавателей",
    blurb: "Процент, оклад или оплата за урок — любой способ считается автоматически.",
  },
  "/guruh-boshqaruvi": {
    navLabel: "Управление группами",
    title: "Управление группами в учебном центре",
    blurb: "Группы, кабинеты и вместимость — управляйте из одного места.",
  },
  "/dars-jadvali": {
    navLabel: "Расписание занятий",
    title: "Система расписания занятий для учебного центра",
    blurb: "Недельное расписание без конфликтов кабинетов и преподавателей.",
  },
  "/telegram-bot": {
    navLabel: "Telegram-бот и SMS",
    title: "Telegram-бот и SMS-уведомления для учебного центра",
    blurb: "Автоматические сообщения родителям о посещаемости и оплате.",
  },
  "/oquv-markazini-avtomatlashtirish": {
    navLabel: "Полная автоматизация",
    title: "Автоматизация учебного центра",
    blurb: "Как полностью отказаться от Excel и бумажных журналов.",
  },
};

const EN: Record<string, Text> = {
  "/oquv-markaz-crm": {
    navLabel: "CRM for learning centers",
    title: "CRM for learning centers",
    blurb: "All modules in one system — the full power of a CRM.",
  },
  "/davomat": {
    navLabel: "Attendance tracking",
    title: "Attendance software for learning centers",
    blurb: "Who came to class and who didn't — in seconds.",
  },
  "/tolovlar": {
    navLabel: "Payments",
    title: "Payment management system for learning centers",
    blurb: "Accept and track payments on a single screen.",
  },
  "/qarzdorlik": {
    navLabel: "Debt control",
    title: "Student debt tracking for learning centers",
    blurb: "Detect overdue students automatically and send reminders.",
  },
  "/hisobot": {
    navLabel: "Reports & analytics",
    title: "Reporting software for learning centers",
    blurb: "Ready-made reports on revenue, attendance and leads.",
  },
  "/oqituvchi-oyligi": {
    navLabel: "Teacher salaries",
    title: "Teacher salary calculation software",
    blurb: "Percentage, fixed salary or per-lesson pay — calculated automatically.",
  },
  "/guruh-boshqaruvi": {
    navLabel: "Group management",
    title: "Group management for learning centers",
    blurb: "Manage groups, rooms and capacity from one place.",
  },
  "/dars-jadvali": {
    navLabel: "Class schedule",
    title: "Class scheduling system for learning centers",
    blurb: "A weekly schedule with no room or teacher conflicts.",
  },
  "/telegram-bot": {
    navLabel: "Telegram bot & SMS",
    title: "Telegram bot and SMS notifications for learning centers",
    blurb: "Automatic messages to parents about attendance and payments.",
  },
  "/oquv-markazini-avtomatlashtirish": {
    navLabel: "Full automation",
    title: "Learning center automation",
    blurb: "The way to leave Excel and paper registers behind.",
  },
};

const CACHE: Record<Locale, ClusterPageMeta[]> = {
  uz: CLUSTER_PAGES,
  ru: CLUSTER_PAGES.map((p) => ({ ...p, ...(RU[p.href] ?? {}) })),
  en: CLUSTER_PAGES.map((p) => ({ ...p, ...(EN[p.href] ?? {}) })),
};

/** Til bo'yicha yechim sahifalari ro'yxati (matnlar tarjima qilingan, `href` — tilsiz manzil). Havola barqaror. */
export function getClusterMeta(locale: Locale): ClusterPageMeta[] {
  return CACHE[locale];
}
