import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { useBranch } from "@/lib/contexts/branch-context";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

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

export function useTeachers() {
  const { activeBranchId } = useBranch();
  const qs = activeBranchId ? `?branchId=${activeBranchId}` : "";
  return useSWR(`/api/teachers${qs}`, fetcher);
}

export function useTeacher(id: string) {
  return useSWR(id ? `/api/teachers/${id}` : null, fetcher);
}

export function useCreateTeacher() {
  return useSWRMutation("/api/teachers", poster);
}

export function useUpdateTeacher(id: string) {
  return useSWRMutation(`/api/teachers/${id}`, patcher);
}
