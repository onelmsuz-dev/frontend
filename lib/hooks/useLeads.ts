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

export function useLeads(params?: { status?: string; search?: string }) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
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
