import useSWR from "swr";
import useSWRMutation from "swr/mutation";

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

async function deleter(url: string) {
  const r = await fetch(url, { method: "DELETE" });
  if (!r.ok) throw await r.json();
  return r.json();
}

export function useStudents(params?: { groupId?: string; search?: string }) {
  const query = new URLSearchParams();
  if (params?.groupId) query.set("groupId", params.groupId);
  if (params?.search)  query.set("q",       params.search);
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
