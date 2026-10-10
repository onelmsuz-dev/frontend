/**
 * OYLIK AVANSI — umumiy turlar va yordamchilar.
 *
 * Nomi hamma joyda "Oylik avansi": "avans" so'zi tizimda o'quvchining
 * oldindan to'lovi ma'nosida band. Kodda `salaryAdvance*` / "avans".
 */
import { mutate } from "swr";
import { UZ_MONTHS } from "@/lib/date-uz";

export type AvansTuri = "TEACHER" | "STAFF";
export type OrtiqchaAmal = "KEYINGI_OY" | "QAYTARILDI" | "KECHIRILDI";

export interface AvansBandi {
  id: string;
  advanceSum: number;
  /** "YYYY-MM-DD" (panelda) yoki ISO (oylik ro'yxatlarida). */
  givenOn: string;
  status: "BERILDI" | "USHLANDI" | "BEKOR" | "QAYTARILDI" | "KECHIRILDI";
  extra: boolean;
  carriedFromMonth: string | null;
  note: string | null;
  closeReason?: string | null;
  createdByName: string;
  closedByName?: string | null;
}

export interface AvansQatori {
  userId: string;
  kind: AvansTuri;
  name: string;
  tafsil: string;
  maoshMatn: string;
  maoshBor: boolean;
  faol: boolean;
  egasi: boolean;
  advancePlan: number | null;
  taxminiy: number | null;
  oldingiOy: number | null;
  ikkiTizim: boolean;
  planMode: "STANDART" | "ALOHIDA" | "YOQ" | "EGASI";
  kechIshga: boolean;
  advancePlanned: number;
  advanceGiven: number;
  advanceCarried: number;
  advanceRemaining: number;
  salaryStatus: "PENDING" | "PAID" | null;
  ochirilgan?: boolean;
  items: AvansBandi[];
}

/** O'qituvchi oyligi qatori (GET /teacher-salaries) — avans maydonlari bilan. */
export interface OylikQatori {
  id: string;
  month: string;
  status: "PENDING" | "PAID";
  calculatedSalary: number;
  settledSalary: number;
  totalCollected: number;
  advanceTotal?: number;
  salaryRemainder?: number;
  overAdvance?: number;
  overAdvanceAction?: string | null;
  advanceItems?: AvansBandi[];
  teacher?: {
    status?: string; salary?: number; salaryType?: string;
    user?: { name?: string; email?: string | null };
  };
}

export interface YopilmaganAvans extends AvansBandi {
  userId: string;
  kind: AvansTuri;
  month: string;
  name: string;
  holat: "TOLANMAGAN" | "KETGAN";
  ochirilgan: boolean;
  maoshBor: boolean;
  salaryRow: { id: string; status: string; H: number } | null;
}

export interface AvansRoyxati {
  bugun: string;
  joriyOy: string;
  month: string;
  kechRuxsat: "JORIY" | "KECH" | null;
  sozlama: { enabled: boolean; day: number; standart: number };
  avansKuni: string;
  avansKuniMatn: string;
  avansKuniAsl: string;
  rows: AvansQatori[];
  jami: {
    rejada: number; planned: number; given: number; givenCount: number;
    remaining: number; remainingCount: number;
  };
  yopilmagan: YopilmaganAvans[];
  canManage: boolean;
}

export interface AvansSozlamasi {
  enabled: boolean;
  day: number;
  standart: number;
  keyingi: { month: string; sana: string; asl: string; matn: string; siljigan: boolean }[];
  qoldaMaosh: { soni: number; summa: number };
  canManage: boolean;
}

const OYLAR_KICHIK = UZ_MONTHS.map((m) => m.toLowerCase());

/** "2026-10" → "oktabr". */
export function oyNomi(month: string): string {
  return OYLAR_KICHIK[Number(month.slice(5, 7)) - 1] ?? month;
}
/** "2026-10" → "Oktabr" (gap boshida). */
export function OyNomi(month: string): string {
  const o = oyNomi(month);
  return o.charAt(0).toUpperCase() + o.slice(1);
}
/** "2026-10-15" yoki ISO → "15.10.2026". */
export function sanaQisqa(v: string): string {
  const d = v.slice(0, 10);
  return `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(0, 4)}`;
}
/** "2026-10-15" → "15-oktabr". */
export function sanaKun(v: string): string {
  return `${Number(v.slice(8, 10))}-${oyNomi(v.slice(0, 7))}`;
}

/**
 * Takror yuborishdan himoya kaliti. Tarmoq uzilib "Qayta urinish" bosilsa
 * ham bir xil kalit ketadi va server ikkinchi yozuv yaratmaydi.
 */
export function yangiKalit(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  } catch { /* eski brauzer */ }
  return `k${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

/** Faqat raqamlar: "1 500 000" → 1500000; bo'sh → null. */
export function somniOqi(v: string): number | null {
  const toza = v.replace(/[^\d]/g, "");
  return toza ? Number(toza) : null;
}
/** Kiritish maydoni uchun guruhlash: 1500000 → "1 500 000". */
export function somniYoz(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "";
  return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** Server javobi: xatoda `{ error, code, ... }`. */
export type ApiJavob = { error?: string; code?: string; [k: string]: unknown };
export interface ApiNatija<T = ApiJavob> { ok: boolean; status: number; data: T }

/** JSON so'rov — xato tanasini ham qaytaradi (`code`, `hozir`, ...). */
export async function soro<T = ApiJavob>(method: string, url: string, body?: unknown): Promise<ApiNatija<T>> {
  try {
    const r = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, data };
  } catch {
    return { ok: false, status: 0, data: { error: "Serverga ulanib bo'lmadi" } as T };
  }
}

/** Avans yoki oylik o'zgargandan keyin bog'liq ro'yxatlarni yangilash. */
export function avansniYangila() {
  void mutate((k) => typeof k === "string" && (
    k.startsWith("/api/salary-advances") || k.startsWith("/api/teacher-salaries")
    || k.startsWith("/api/staff-salaries") || k.startsWith("/api/expenses")
    || k.startsWith("/api/reports")));
}

export const HOLAT_NOMI: Record<AvansBandi["status"], string> = {
  BERILDI:    "Berildi",
  USHLANDI:   "Oylikdan ushlandi",
  BEKOR:      "Bekor qilingan",
  QAYTARILDI: "Pul qaytarilgan",
  KECHIRILDI: "Kechirilgan",
};
