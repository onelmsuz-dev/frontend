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

export interface PlanLimits {
  key: string;
  label: string;
  price: number;
  minStudents: number;
  maxStudents: number;
  maxBranches: number;
  maxStaff: number;
}

export interface SubscriptionData {
  plan: string;
  limits: PlanLimits;
  usage: {
    students: { used: number; max: number };
    branches: { used: number; max: number };
    staff: { used: number; max: number };
  };
  subscription: { active: boolean; daysLeft: number; expiresAt: string | null; warning: boolean };
  requests: Array<{
    id: string; plan: string; amount: number; months: number;
    note?: string; status: string; createdAt: string;
  }>;
}

export function useSubscription() {
  return useSWR<SubscriptionData>("/api/subscription", fetcher);
}

export function usePlans() {
  return useSWR<PlanLimits[]>("/api/plans", fetcher);
}

export function useSubmitSubscriptionRequest() {
  return useSWRMutation("/api/subscription/requests", poster);
}
