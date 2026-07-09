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

export function useTeachers() {
  return useSWR("/api/teachers", fetcher);
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
