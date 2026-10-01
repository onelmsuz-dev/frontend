import type { LucideIcon } from "lucide-react";
import { navSections, navItemVisible } from "@/components/layout/nav-config";
import { SETTINGS_GROUPS, visibleSettingsSections } from "@/components/settings/settings-sections";
import { hasPerm } from "@/lib/hooks/useMe";
import type { Role } from "@/types/roles";

/**
 * TEPADAGI QIDIRUV — BO'LIMLAR (2026-10-01).
 *
 * Qidiruv ilgari faqat serverdan o'quvchi, guruh va lidni so'rardi.
 * Sozlamalarda turib "xona" yozib Enter bosgan odam "natija topilmadi"
 * ni ko'rardi — qidiruv ilovaning o'z bo'limlarini umuman bilmasdi.
 * Endi sahifalar (chap menyu) va sozlamalar bo'limlari shu yerda,
 * brauzerning o'zida qidiriladi: tarmoq so'rovi yo'q, natija darhol.
 *
 * Ko'rinish qoidasi menyu va sozlamalar sahifasi bilan BIR XIL
 * (`navItemVisible`, `visibleSettingsSections`) — qidiruv foydalanuvchi
 * ocha olmaydigan narsani hech qachon taklif qilmaydi.
 */

export interface BolimNatija {
  key: string;
  href: string;
  label: string;
  /** Qayerdaligi: menyu guruhi ("Ta'lim") yoki "Sozlamalar · Pul va hisob". */
  where: string;
  icon: LucideIcon;
}

/** Sahifalarning boshqacha atalishi — odam menyu yozuvini emas, o'z so'zini yozadi. */
const SAHIFA_SOZLARI: Record<string, string[]> = {
  "/dashboard":    ["bosh sahifa", "asosiy", "statistika"],
  "/vazifalar":    ["vazifa", "eslatma"],
  "/leads":        ["lid", "ariza", "crm", "mijoz", "voronka"],
  "/sms":          ["sms", "xabar", "rassilka"],
  "/courses":      ["kurs", "fan", "yo'nalish"],
  "/groups":       ["guruh"],
  "/schedule":     ["jadval", "dars jadvali", "raspisaniye"],
  "/attendance":   ["davomat", "yo'qlama"],
  "/gamification": ["ball", "reyting", "coin", "mukofot"],
  "/students":     ["o'quvchi", "talaba"],
  "/teachers":     ["o'qituvchi", "ustoz", "mentor"],
  "/xodimlar":     ["xodim", "hodim"],
  "/finance":      ["moliya", "to'lov", "kassa", "tushum", "pul"],
  "/xarajatlar":   ["xarajat", "chiqim"],
  "/reports":      ["hisobot", "statistika"],
  "/salary":       ["oylik", "maosh"],
  "/settings":     ["sozlama", "nastroyka"],
};

/**
 * Solishtirish uchun shakl: kichik harf, apostrofsiz, bitta bo'shliq.
 * "To'lov", "To‘lov" (telefon klaviaturasi) va "tolov" — bir xil.
 */
export function qidiruvShakli(s: string): string {
  return s.toLowerCase().replace(/['ʻʼ‘’`´]/g, "").replace(/\s+/g, " ").trim();
}

const sozlarga = (s: string) => s.split(/[^\p{L}\p{N}]+/u).filter(Boolean);

/**
 * 0 — mos emas; kattasi — yuqoriroq. Har bir yozilgan so'z nom yoki kalit
 * so'zlardan birining BOSHI bo'lishi shart ("xona" → "Xonalar").
 *
 * So'z O'RTASIDAN qidirilmaydi: aks holda o'quvchi ismi "Ali" ham
 * "kattALIk", "yo'nALIsh" ichidan topilib, bo'limlar o'quvchidan oldin
 * chiqardi va Enter o'quvchi o'rniga "Ko'rinish" ni ochardi.
 */
function ball(sozlar: string[], label: string, kalitlar: readonly string[]): number {
  const nom = qidiruvShakli(label);
  const nomSozlari = sozlarga(nom);
  const hammasi = [...nomSozlari, ...kalitlar.flatMap((k) => sozlarga(qidiruvShakli(k)))];
  if (!sozlar.every((w) => hammasi.some((h) => h.startsWith(w)))) return 0;
  if (nom.startsWith(sozlar.join(" "))) return 3;
  if (nomSozlari.some((h) => h.startsWith(sozlar[0]))) return 2;
  return 1;
}

export function bolimlarniTop(
  query: string,
  ctx: {
    role: Role;
    permissions: string[] | undefined;
    teacherId?: string | null;
    blocked: boolean;
    features: Record<string, boolean> | undefined;
    onboardingEnabled: boolean;
    /** Sozlamalarda turgan odamga sozlama bo'limlari birinchi chiqadi. */
    onSettings: boolean;
  },
  limit = 5,
): BolimNatija[] {
  const sozlar = sozlarga(qidiruvShakli(query));
  // Ruxsatlar hali yuklanmagan — taxmin qilmaymiz, bir lahzadan keyin chiqadi.
  if (sozlar.length === 0 || !ctx.permissions) return [];

  const topildi: { r: BolimNatija; b: number }[] = [];

  for (const s of navSections) {
    for (const i of s.items) {
      if (!navItemVisible(i, ctx)) continue;
      const b = ball(sozlar, i.label, SAHIFA_SOZLARI[i.href] ?? []);
      if (b) topildi.push({ r: { key: i.href, href: i.href, label: i.label, where: s.label, icon: i.icon }, b });
    }
  }

  if (hasPerm(ctx.permissions, "settings.view")) {
    for (const s of visibleSettingsSections(ctx)) {
      const guruh = SETTINGS_GROUPS.find((g) => g.id === s.group);
      const b = ball(sozlar, s.label, [...s.keywords, guruh?.label ?? ""]);
      if (!b) continue;
      topildi.push({
        r: {
          key: `settings:${s.id}`, href: `/settings?tab=${s.id}`, label: s.label,
          where: guruh ? `Sozlamalar · ${guruh.label}` : "Sozlamalar", icon: s.icon,
        },
        b: b + (ctx.onSettings ? 0.5 : 0),
      });
    }
  }

  // `sort` barqaror: teng balda menyu tartibi saqlanadi.
  return topildi.sort((x, y) => y.b - x.b).slice(0, limit).map((x) => x.r);
}
