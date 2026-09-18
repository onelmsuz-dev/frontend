import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { useBranch } from "@/lib/contexts/branch-context";
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

/**
 * `opts.enabled === false` — SO'ROV UMUMAN YUBORILMAYDI (SWR kaliti
 * `null`). Yopiq holatda turadigan panellar uchun: ular har sahifada
 * mount bo'ladi va shartsiz so'rov yuborsa, butun ilova bo'ylab har
 * yuklanishda ortiqcha so'rov bo'lardi.
 */
export function useGroups(
  params?: { courseId?: string; teacherId?: string; status?: string },
  opts?: { enabled?: boolean },
) {
  const { activeBranchId } = useBranch();
  const query = new URLSearchParams();
  if (params?.courseId)  query.set("courseId",  params.courseId);
  if (params?.teacherId) query.set("teacherId", params.teacherId);
  if (params?.status)    query.set("status",    params.status);
  if (activeBranchId)    query.set("branchId",  activeBranchId);
  const qs = query.toString();
  const kalit = `/api/groups${qs ? `?${qs}` : ""}`;
  return useSWR(opts?.enabled === false ? null : kalit, fetcher);
}

export function useGroup(id: string) {
  return useSWR(id ? `/api/groups/${id}` : null, fetcher);
}

export function useCreateGroup() {
  return useSWRMutation("/api/groups", poster);
}

export function useUpdateGroup(id: string) {
  return useSWRMutation(`/api/groups/${id}`, patcher);
}

export function useDeleteGroup(id: string) {
  return useSWRMutation(`/api/groups/${id}`, (url) => deleter(url));
}
