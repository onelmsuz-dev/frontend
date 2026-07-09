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

export function useGroups(params?: { courseId?: string; teacherId?: string; status?: string }) {
  const query = new URLSearchParams();
  if (params?.courseId)  query.set("courseId",  params.courseId);
  if (params?.teacherId) query.set("teacherId", params.teacherId);
  if (params?.status)    query.set("status",    params.status);
  const qs = query.toString();
  return useSWR(`/api/groups${qs ? `?${qs}` : ""}`, fetcher);
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
