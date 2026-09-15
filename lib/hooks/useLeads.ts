import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import useSWRMutation from "swr/mutation";
import { fetcher } from "@/lib/fetcher";

async function poster(url: string, { arg }: { arg: unknown }) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg),
  });
  if (!r.ok) throw await r.json();
  return r.json();
}

async function patcher(url: string, { arg }: { arg: unknown }) {
  const r = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg),
  });
  if (!r.ok) throw await r.json();
  return r.json();
}

async function deleter(url: string) {
  const r = await fetch(url, { method: "DELETE" });
  if (!r.ok) throw await r.json();
  return r.json();
}

/** Bir so'rovda nechta lid — server chegarasi ham shu (1000). */
const SAHIFA = 500;

/**
 * LIDLAR — SAHIFALAB YUKLANADI.
 *
 * Ilgari bitta so'rov edi va server 500 ta bilan cheklardi. Prodda
 * oqibati (Juniors Academy, 2026-09-15): 938 lidning 438 tasi ekranda
 * UMUMAN ko'rinmadi va markaz "import 500 tada to'xtabdi" deb o'yladi.
 *
 * Endi sahifalar ketma-ket olinadi va `jami` bilan solishtiriladi —
 * "yana bormi?" degan savolga javob bor.
 */
export function useLeads(params?: { stageId?: string; search?: string }) {
  const { items, total, isLoading, error, mutate } = useLeadsPaged(params);
  // Eski chaqiruvchilar massiv kutadi — shakl o'zgarishi ularni buzmasin.
  return { data: items, total, isLoading, error, mutate };
}

export function useLeadsPaged(params?: { stageId?: string; search?: string }) {
  const qs = (skip: number) => {
    const q = new URLSearchParams();
    if (params?.stageId) q.set("stageId", params.stageId);
    if (params?.search)  q.set("q", params.search);
    q.set("take", String(SAHIFA));
    q.set("skip", String(skip));
    return q.toString();
  };

  const { data, size, setSize, isLoading, error, mutate } = useSWRInfinite<{
    items: unknown[]; total: number; skip: number; take: number;
  }>(
    (index, oldingi) => {
      // Oldingi sahifa oxirgisi bo'lsa — to'xtaymiz.
      if (oldingi && oldingi.skip + oldingi.items.length >= oldingi.total) return null;
      return `/api/leads?${qs(index * SAHIFA)}`;
    },
    fetcher,
    { revalidateFirstPage: false },
  );

  const sahifalar = data ?? [];
  const items = sahifalar.flatMap((p) => p?.items ?? []);
  const total = sahifalar[0]?.total ?? 0;

  return {
    items, total, isLoading, error, mutate,
    yuklangan: items.length,
    yanaBor: items.length < total,
    yanaYukla: () => setSize(size + 1),
  };
}

export function useCreateLead() {
  return useSWRMutation("/api/leads", poster);
}

export function useUpdateLead(id: string) {
  return useSWRMutation(`/api/leads/${id}`, patcher);
}

export function useDeleteLead(id: string) {
  return useSWRMutation(`/api/leads/${id}`, (url) => deleter(url));
}

/**
 * LID MANBALARI.
 *
 * Ro'yxat markazga bog'liq: kimdir "Maktab tashrifi" bilan ishlaydi,
 * kimdir "Banner" bilan. Ilgari u kodda qattiq yozilgan edi va markaz
 * o'z manbasini qo'sha olmasdi — natijada hamma narsa "Boshqa" ga
 * tushib, "qaysi reklama ishlayapti?" degan savol javobsiz qolardi.
 */
export function useLeadSources() {
  return useSWR<{ id: string; name: string }[]>("/api/leads/sources", fetcher);
}

/**
 * LID BOSQICHLARI (Kanban ustunlari) — markaz o'zi to'liq boshqaradi.
 *
 * Ilgari qattiq 5 qiymatli edi. `LeadSource`dan farqi: bu yerda
 * `sortOrder` MUHIM (ustunlar tartibi) va `kind` orqali maxsus xatti-
 * harakat (kurs talabi, konversiya) aniqlanadi — backend
 * `LeadStagesService`ga qarang.
 */
export interface LeadStage {
  id: string;
  name: string;
  kind: "NORMAL" | "WON" | "LOST";
  color: string;
  sortOrder: number;
}

export function useLeadStages() {
  return useSWR<LeadStage[]>("/api/leads/stages", fetcher);
}

export interface FeedItem {
  kind: "event" | "comment";
  id: string;
  at: string;
  actorName: string;
  text: string;
  changes: string[];
  editedAt?: string | null;
  canEdit: boolean;
  canDelete: boolean;
}

export interface LeadFeed {
  lead: { id: string; name: string; createdAt: string };
  items: FeedItem[];
  truncated: boolean;
  commentCount: number;
}

/**
 * BITTA LIDNING TASMASI — tizim tarixi va odam izohlari birga.
 *
 * `leadId` bo'sh bo'lsa so'rov YUBORILMAYDI (SWR kaliti `null`): oyna
 * yopiq turganda ham har renderda so'rov ketmasin.
 */
export function useLeadFeed(leadId: string | null) {
  return useSWR<LeadFeed>(leadId ? `/api/leads/${leadId}/feed` : null, fetcher);
}

/** Qo'ng'iroq natijalari — backend bilan bir xil ro'yxat. */
export const CALL_OUTCOMES = [
  { v: "GAPLASHDIM",    l: "Gaplashdim",    hint: "Keyingi bosqichga o'tadi" },
  { v: "JAVOB_BERMADI", l: "Javob bermadi", hint: "Bosqich o'zgarmaydi, urinish sanaladi" },
  { v: "QIZIQMADI",     l: "Qiziqmadi",     hint: "«Bekor» ga o'tadi" },
] as const;

export const LOST_REASONS = [
  { v: "NARX_QIMMAT",         l: "Narx qimmat" },
  { v: "VAQTI_TOGRI_KELMADI", l: "Vaqti to'g'ri kelmadi" },
  { v: "BOSHQA_MARKAZ",       l: "Boshqa markazga bordi" },
  { v: "JAVOB_BERMADI",       l: "Javob bermadi" },
  { v: "BOSHQA",              l: "Boshqa sabab" },
] as const;

export const LOST_REASON_UZ: Record<string, string> =
  Object.fromEntries(LOST_REASONS.map((r) => [r.v, r.l]));

export interface DueLead {
  id: string; name: string; phone: string; stageId: string;
  nextContactAt: string; contactAttempts: number; course?: string | null;
}

/**
 * BUGUN QO'NG'IROQ QILINADIGANLAR.
 *
 * Muddati o'tganlar ham shu ro'yxatda — ular yo'qolib ketmasligi
 * kerak, aks holda bir kun o'tkazib yuborilgan lid abadiy unutilardi.
 */
export function useDueLeads() {
  return useSWR<{ items: DueLead[]; overdue: number }>("/api/leads/due", fetcher);
}


// ─── SOTUV BO'LIMI (ROP) ─────────────────────────────────────────────────

export interface Assignee { id: string; name: string; role: string }

/** Lid biriktirish va "Sotuvchi" filtri uchun xodimlar ro'yxati. */
export function useLeadAssignees() {
  return useSWR<Assignee[]>("/api/leads/assignees", fetcher);
}

export interface LeadStatRow {
  userId: string | null;
  name: string;
  jami: number;
  aloqa: number;
  yutildi: number;
  yoqotildi: number;
  jarayonda: number;
  konversiya: number;
}

export interface LeadStats {
  from: string;
  to: string | null;
  rows: LeadStatRow[];
  jami: Omit<LeadStatRow, "userId" | "name">;
}

/**
 * Sotuvchilar hisoboti. `enabled` false bo'lsa SO'ROV KETMAYDI —
 * oddiy sotuvchida `leads.stats` yo'q va u har safar 403 olardi.
 */
export function useLeadStats(enabled: boolean, from?: string, to?: string) {
  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to)   qs.set("to", to);
  const suffix = qs.toString() ? `?${qs}` : "";
  return useSWR<LeadStats>(enabled ? `/api/leads/stats${suffix}` : null, fetcher);
}

export interface DailyRow {
  userId: string;
  name: string;
  qongiroq: number;
  aylandi: number;
  yangiLid: number;
  bosqichga: Record<string, number>;
}

export interface DailyReport {
  date: string;
  stages: { id: string; name: string; kind: string }[];
  rows: DailyRow[];
}

/** Kunlik nazorat — "kun oxirida kim nima qildi". */
export function useLeadDaily(enabled: boolean, date?: string) {
  const suffix = date ? `?date=${date}` : "";
  return useSWR<DailyReport>(enabled ? `/api/leads/daily${suffix}` : null, fetcher);
}
