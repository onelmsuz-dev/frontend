import {
  Building, MapPin, DoorOpen, Users, CalendarOff, Link2, Wallet, Percent,
  CreditCard, Type, Bell, Rocket, History, Trash2, SlidersHorizontal, HandCoins,
  type LucideIcon,
} from "lucide-react";
import { hasPerm } from "@/lib/hooks/useMe";

/**
 * SOZLAMALAR BO'LIMLARI — YAGONA MANBA (2026-10-01).
 *
 * Ilgari bu ro'yxat faqat sozlamalar sahifasining ichida edi va tepadagi
 * qidiruv bo'limlarni umuman bilmasdi: sozlamalarda turib "xona" yoki
 * "chegirma" deb yozib Enter bosgan odam "natija topilmadi" ni ko'rardi.
 * Endi sahifa ham, qidiruv ham shu ro'yxat va shu filtrdan o'qiydi —
 * qidiruv foydalanuvchi ocha olmaydigan bo'limni hech qachon taklif qilmaydi.
 *
 * BO'LIMLAR — GURUHLANGAN.
 *
 * Ilgari 11 ta tab bitta tekis ro'yxatda turardi va eng chalkashtiradigan
 * juftlik YONMA-YON edi: "Tarif" (markazning OneRoom'ga to'lovi) va
 * "To'lov qoidalari" (o'quvchidan qanday pul olish). Ikkalasi ham "to'lov"
 * so'zi bilan boshlanardi, ikkalasi ham pul haqida — lekin butunlay
 * boshqa narsa. Markaz egalari shu ikkitasini adashtirar edi.
 *
 * Endi guruhlangan va nomlar aniqlashtirilgan: "O'quvchi to'lovlari"
 * (bizning mijozimizning mijozi) va "OneRoom obunasi" (bizning
 * mijozimiz bizga to'laydi) — nomning o'zi kimga to'lov ekanini aytadi.
 *
 * SOZLAMALAR — IKKI QAVATLI (2026-09-28, chap menyu bilan bir uslubda).
 * Ilgari 15 bo'lim bitta ustunda, telefonda esa bitta uzun lentada edi.
 * Endi 4 asosiy guruh; ochilgan guruhning ichida uning bo'limlari.
 */
export const SETTINGS_GROUPS = [
  { id: "markaz", label: "Markaz",          hint: "Ma'lumot, filiallar, xonalar, xodimlar", icon: Building },
  { id: "pul",    label: "Pul va hisob",    hint: "To'lov rejimi, chegirmalar, oylik avansi", icon: Wallet },
  { id: "obuna",  label: "OneRoom obunasi", hint: "Tarif va muddat",                         icon: CreditCard },
  { id: "tizim",  label: "Tizim",           hint: "Ko'rinish, bildirishnoma, tarix",         icon: SlidersHorizontal },
] as const;

export type SettingsGroupId = (typeof SETTINGS_GROUPS)[number]["id"];

export interface SettingsSection {
  id: string;
  label: string;
  icon: LucideIcon;
  group: SettingsGroupId;
  /** Bayroq ortidagi bo'lim — bayroq yoqilmagan markazda ko'rinmaydi. */
  feature?: string;
  /** Ruxsat kaliti — yo'q bo'lsa bo'lim ko'rinmaydi. */
  perm?: string;
  /**
   * QIDIRUV SO'ZLARI — odam bo'lim nomini emas, ichidagi narsani yozadi:
   * "ish vaqti", "skidka", "sms". Kichik harf, apostrofsiz ham bo'laveradi
   * (solishtirish apostrofni tashlab yuboradi).
   */
  keywords: string[];
}

export const SETTINGS_SECTIONS: SettingsSection[] = [
  // ─ Markaz: markazning o'zi haqida ─
  { id: "markaz",        label: "Markaz ma'lumoti", icon: Building,  group: "markaz",
    keywords: ["markaz nomi", "subdomen", "ish kunlari", "ish vaqti", "ish soati", "dam olish kuni"] },
  { id: "filliallar",    label: "Filiallar",        icon: MapPin,    group: "markaz",
    keywords: ["filial", "branch", "manzil"] },
  { id: "xonalar",       label: "Xonalar",          icon: DoorOpen,  group: "markaz",
    keywords: ["xona", "auditoriya", "kabinet", "sig'im"] },
  { id: "xodimlar",      label: "Xodimlar",         icon: Users,     group: "markaz",
    keywords: ["xodim", "rol", "ruxsat", "huquq", "parol", "admin", "kassir", "menejer"] },
  // Bayram DARS SONINI o'zgartiradi, dars soni esa "necha darsga kelgan"
  // hisobining maxraji — ya'ni pulga tegadi. Shuning uchun o'z ruxsat kaliti.
  { id: "bayramlar",     label: "Bayram kunlari",   icon: CalendarOff, group: "markaz",
    perm: "holidays.view",
    keywords: ["bayram", "ta'til", "dam olish", "darssiz kun"] },
  // Target sozlamasi — markazning reklamadagi yuzi. "Markaz" guruhida,
  // chunki u markazning O'ZI haqida, pul yoki tizim sozlamasi emas.
  // Lidlardagi "Target" tabi bilan BIR ruxsat: ikkalasi ham reklama ishi.
  { id: "ariza",         label: "Target sozlamasi", icon: Link2,     group: "markaz",
    perm: "leads.target",
    keywords: ["target", "reklama", "ariza", "forma", "instagram", "anketa"] },

  // ─ Pul: O'QUVCHIDAN qanday pul olinadi ─
  { id: "tolov",         label: "O'quvchi to'lovlari", icon: Wallet, group: "pul",
    keywords: ["to'lov", "to'lov rejimi", "to'lov kuni", "oldindan", "oxirida", "oylik narx",
      "sinov darsi", "ketgan", "qarz", "hisob-kitob"] },
  { id: "chegirma",      label: "Chegirmalar", icon: Percent, group: "pul",
    feature: "discounts", perm: "discounts.view",
    keywords: ["chegirma", "skidka", "aksiya", "imtiyoz", "foiz"] },
  // Xodim va o'qituvchiga oy o'rtasida beriladigan pul — "pul" guruhida,
  // lekin O'QUVCHI to'lovi emas: nomi ataylab "Oylik avansi".
  { id: "avans",         label: "Oylik avansi", icon: HandCoins, group: "pul",
    feature: "salary-advance", perm: "salaries.view",
    keywords: ["avans", "oylik avansi", "maosh", "zarplata", "oy o'rtasi", "15-sana", "oylik"] },

  // ─ Obuna: MARKAZ BIZGA qancha to'laydi ─
  { id: "tarif",         label: "Tarif va muddat", icon: CreditCard, group: "obuna",
    keywords: ["tarif", "obuna", "muddat", "oneroom to'lovi", "litsenziya"] },

  // ─ Tizim ─
  // Ko'rinish BILDIRISHNOMADAN OLDIN: "yozuv kichik" shikoyati bilan
  // kelgan odam uni birinchi ko'rishi kerak, pastga qidirib emas.
  { id: "korinish",      label: "Ko'rinish", icon: Type, group: "tizim",
    keywords: ["yozuv", "shrift", "o'lcham", "kattalik", "mavzu", "tema"] },
  { id: "bildirishnoma", label: "Bildirishnomalar", icon: Bell, group: "tizim",
    keywords: ["bildirishnoma", "sms", "xabar", "eslatma", "avtomatik xabar"] },
  // Yo'l ko'rsatuvchi bayrog'i o'chiq markazda bu tab ko'rsatilmaydi
  // (quyida `visibleSettingsSections` da filtrlanadi).
  { id: "organish",      label: "Yo'l ko'rsatuvchi", icon: Rocket, group: "tizim",
    feature: "onboarding",
    keywords: ["qo'llanma", "o'rganish", "onboarding", "boshlash"] },
  // Harakatlar tarixi ham bayroq ortida chiqariladi va qo'shimcha ravishda
  // `activity.view` ruxsatini talab qiladi — jurnalda kim qachon nima
  // qilgani turadi, uni har bir xodimga ochib qo'yish markaz ichidagi
  // munosabatga aralashish bo'lardi.
  { id: "harakatlar",    label: "So'nggi harakatlar", icon: History, group: "tizim",
    feature: "activity", perm: "activity.view",
    keywords: ["harakat", "tarix", "jurnal", "log", "kim nima qildi"] },
  { id: "korzinka",      label: "Korzinka", icon: Trash2, group: "tizim",
    feature: "trash", perm: "trash.view",
    keywords: ["korzinka", "savat", "o'chirilgan", "tiklash"] },
];

/**
 * Foydalanuvchi ko'ra oladigan bo'limlar.
 *
 * Ilgari bu filtr FAQAT onboarding'ni bilardi (`|| onboardingEnabled`) —
 * ya'ni bayroq ortidagi ikkinchi bo'lim qo'shilgan zahoti u ham
 * onboarding bayrog'iga bog'lanib qolardi. Endi har bo'lim o'z kalitini
 * ko'rsatadi va tekshiruv umumiy.
 *
 * TARIF TUGAGANDA — FAQAT "Tarif va muddat" (Dream Zone, 2026-09-18):
 * qolgan bo'limlarning so'rovlari 402 bilan qaytadi.
 */
export function visibleSettingsSections(opts: {
  blocked: boolean;
  features: Record<string, boolean> | undefined;
  onboardingEnabled: boolean;
  permissions: string[] | undefined;
}): SettingsSection[] {
  const { blocked, features, onboardingEnabled, permissions } = opts;
  return SETTINGS_SECTIONS.filter((s) => {
    if (blocked) return s.id === "tarif";
    if (s.feature) {
      const on = s.feature === "onboarding" ? onboardingEnabled : features?.[s.feature];
      // `undefined` = bayroqlar hali yuklanmagan — tab ko'rsatilmaydi.
      // Ko'rsatib keyin yo'qotish sakrashga olib kelardi.
      if (!on) return false;
    }
    if (s.perm && !hasPerm(permissions, s.perm)) return false;
    return true;
  });
}
