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

export function useAttendance(params: { groupId: string; date: string }) {
  const query = new URLSearchParams({ groupId: params.groupId, date: params.date });
  return useSWR(params.groupId ? `/api/attendance?${query}` : null, fetcher);
}

export function useSaveAttendance() {
  return useSWRMutation("/api/attendance", poster);
}
