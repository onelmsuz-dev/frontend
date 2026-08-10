import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { useBranch } from "@/lib/contexts/branch-context";

/**
 * Xatoni yutmaydigan fetcher.
 *
 * Ilgari oddiy `r.json()` edi: 403/404 ham "muvaffaqiyat" deb qabul
 * qilinardi va o'quvchi profili guruhsiz, to'lovsiz, balanssiz bo'sh
 * chizilardi — sabab esa hech qayerda ko'rinmasdi.
 */
const fetcher = async (url: string) => {
  const r = await fetch(url);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error(data?.error ?? `So'rov bajarilmadi (${r.status})`) as Error & { status?: number };
    err.status = r.status;
    throw err;
  }
  return data;
};

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

export function useStudents(params?: { groupId?: string; search?: string }) {
  const { activeBranchId } = useBranch();
  const query = new URLSearchParams();
  if (params?.groupId)  query.set("groupId", params.groupId);
  if (params?.search)   query.set("q",       params.search);
  if (activeBranchId)   query.set("branchId", activeBranchId);
  const qs = query.toString();
  return useSWR(`/api/students${qs ? `?${qs}` : ""}`, fetcher);
}

export function useStudent(id: string) {
  return useSWR(id ? `/api/students/${id}` : null, fetcher);
}

export function useCreateStudent() {
  return useSWRMutation("/api/students", poster);
}

export function useUpdateStudent(id: string) {
  return useSWRMutation(`/api/students/${id}`, patcher);
}

export function useDeleteStudent(id: string) {
  return useSWRMutation(`/api/students/${id}`, (url) => deleter(url));
}
