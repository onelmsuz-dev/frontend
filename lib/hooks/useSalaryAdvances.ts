import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useBranchQueryString } from "@/lib/contexts/branch-context";
import type { AvansRoyxati, AvansSozlamasi } from "@/lib/salary-advance";

/** Oylik avansi ro'yxati — oy va tepadagi filial bo'yicha. */
export function useSalaryAdvances(month?: string, enabled = true) {
  const qs = useBranchQueryString({ month });
  return useSWR<AvansRoyxati>(enabled ? `/api/salary-advances${qs}` : null, fetcher);
}

export function useSalaryAdvanceSettings(enabled = true) {
  return useSWR<AvansSozlamasi>(enabled ? "/api/salary-advances/settings" : null, fetcher);
}

/** "Oylik hisoblash" bannerlari: avansi bor hisoblanmaganlar, to'lanmagan oylar. */
export function useSalaryAdvanceSummary(month: string, enabled = true) {
  const qs = useBranchQueryString({ month });
  return useSWR<{
    month: string; joriyOy: string; hisoblanmagan: number;
    tolanmagan: { month: string; count: number }[];
    yopilmagan: number; oyJami: number; oySoni: number;
  }>(enabled ? `/api/salary-advances/summary${qs}` : null, fetcher);
}
