/**
 * `/ads` — REKLAMA SO'ROVNOMASI.
 *
 * DIQQAT: kalitlar backenddagi `ADS_OPTIONS` bilan AYNAN bir xil bo'lishi
 * shart (`backend/src/modules/ads/ads.service.ts`). Bu yerdagi matn faqat
 * sahifada ko'rinadi — Telegramga boradigan matnni backend o'zi qo'yadi,
 * ya'ni ikkala ro'yxat mustaqil o'zgarishi mumkin, KALITLAR esa yo'q.
 *
 * Nega 5 ta savol: reklama sahifasida har bir qo'shimcha qadam konversiyani
 * pasaytiradi. Shu 5 tasi leadni segmentlash uchun yetarli — markaz
 * kattaligi, og'riq nuqtasi va sotib olishga tayyorligi.
 *
 * Nega har savolda ENG KO'PI 4 ta variant: ro'yxat uzun bo'lsa odam o'qimay
 * birinchisini bosadi. Ortiqcha variantlar o'chirilmagan — yaqinlari
 * BIRLASHTIRILGAN, ya'ni qamrov o'sha, tanlash esa osonlashgan.
 */

export interface AdsQuestion {
  /** Backend kutayotgan maydon nomi. */
  id: "students" | "problem" | "tool" | "goal" | "timeline" | "criteria";
  title: string;
  /** Savol ostidagi kichik izoh — ixtiyoriy. */
  hint?: string;
  options: { value: string; label: string }[];
}

export const ADS_QUESTIONS: AdsQuestion[] = [
  {
    id: "students",
    title: "Markazingizda hozir nechta o'quvchi tahsil oladi?",
    options: [
      { value: "1-100",    label: "1–100" },
      { value: "101-300",  label: "101–300" },
      { value: "301-1000", label: "301–1000" },
      { value: "1000+",    label: "1000+" },
    ],
  },
  {
    id: "problem",
    title: "Markazingizni boshqarishda hozir eng katta muammo nimada?",
    options: [
      { value: "davomat-guruh",  label: "Davomat va guruhlarni boshqarish" },
      { value: "qarzdorlik",     label: "Qarzdorliklarni nazorat qilish" },
      { value: "moliya-hisobot", label: "Moliya, oyliklar va hisobotlar" },
      { value: "bir-nechta",     label: "Bir nechta muammo bor" },
    ],
  },
  {
    id: "tool",
    title: "Hozir markazingizni qanday boshqarasiz?",
    options: [
      { value: "excel",    label: "Excel / Google Sheets" },
      { value: "qolda",    label: "Qo'lda — daftar yoki tizim yo'q" },
      { value: "telegram", label: "Telegram orqali" },
      { value: "crm",      label: "Boshqa CRM / dastur" },
    ],
  },
  {
    id: "goal",
    title: "Platformadan eng avvalo nimani hal qilishni kutasiz?",
    options: [
      { value: "yagona-tizim",      label: "Markazni yagona tizim orqali boshqarish" },
      { value: "avtomatlashtirish", label: "Davomat va to'lovlarni avtomatlashtirish" },
      { value: "moliya-hisobot",    label: "Moliya va hisobotlarni yuritish" },
      { value: "kommunikatsiya",    label: "O'quvchilar bilan kommunikatsiya" },
    ],
  },
  {
    id: "timeline",
    title: "Platformani qachon joriy qilishni rejalashtiryapsiz?",
    options: [
      { value: "hozir",       label: "Hozir kerak" },
      { value: "1-oy",        label: "1 oy ichida" },
      { value: "1-3-oy",      label: "1–3 oy ichida" },
      { value: "organyapman", label: "Hozircha o'rganib chiqyapman" },
    ],
  },
];

/**
 * 6-savol — ATAYLAB o'chirilgan.
 *
 * Backend uni qabul qiladi (`criteria` ixtiyoriy), ya'ni yoqish uchun shu
 * obyektni `ADS_QUESTIONS` oxiriga qo'shish yetarli — boshqa hech qayerni
 * o'zgartirish kerak emas. Lekin har bir qo'shimcha qadam konversiyani
 * pasaytiradi, shuning uchun standart holatda so'ralmaydi.
 */
export const CRITERIA_QUESTION: AdsQuestion = {
  id: "criteria",
  title: "Platformani tanlashda siz uchun eng muhim mezon qaysi?",
  options: [
    { value: "narx",     label: "Narxi" },
    { value: "funksiya", label: "Funksiyalar" },
    { value: "qulaylik", label: "Foydalanish qulayligi" },
    { value: "yordam",   label: "Texnik yordam" },
  ],
};
