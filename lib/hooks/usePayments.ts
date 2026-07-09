import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { useBranchQueryString } from "@/lib/contexts/branch-context";

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

export function usePayments(params?: { studentId?: string; groupId?: string; month?: string }) {
  const qs = useBranchQueryString({
    studentId: params?.studentId,
    groupId:   params?.groupId,
    month:     params?.month,
  });
  return useSWR(`/api/payments${qs}`, fetcher);
}

export function useCreatePayment() {
  return useSWRMutation("/api/payments", poster);
}
