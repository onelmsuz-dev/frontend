import useSWR from "swr";
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

export function useLeads(params?: { stageId?: string; search?: string }) {
  const query = new URLSearchParams();
  if (params?.stageId) query.set("stageId", params.stageId);
  if (params?.search) query.set("search", params.search);
  const qs = query.toString();
  return useSWR(`/api/leads${qs ? `?${qs}` : ""}`, fetcher);
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
