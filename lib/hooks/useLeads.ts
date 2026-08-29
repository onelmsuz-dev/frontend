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
