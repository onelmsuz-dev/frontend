import useSWR from "swr";
import { useBranch } from "@/lib/contexts/branch-context";

const fetcher = async (url: string) => {
  const r = await fetch(url);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error ?? `So'rov bajarilmadi (${r.status})`);
  return data;
};

// ─── Moliya tahlili ───────────────────────────────────────────────────────────

export interface FinanceReport {
  month: {
    label: string;
    collected: number;
    expected: number;
    /** Kutilgan 0 bo'lsa `null` — foiz ma'nosiz. */
    collectionRate: number | null;
    remaining: number;
    expenses: number;
    profit: number;
    paymentCount: number;
  };
  prev: { label: string; collected: number; expenses: number; profit: number };
  change: { collected: number | null; expenses: number | null; profit: number | null };
  debt: {
    total: number;
    count: number;
    top: {
      id: string; name: string; phone: string; parentPhone: string | null;
      debt: number; groupName: string | null;
    }[];
  };
  methods: { method: string; amount: number; count: number; share: number }[];
  expenseCategories: { category: string; amount: number; share: number }[];
}

export function useFinanceReport() {
  const { activeBranchId } = useBranch();
  const qs = activeBranchId ? `?branchId=${activeBranchId}` : "";
  return useSWR<FinanceReport>(`/api/reports/finance${qs}`, fetcher);
}

// ─── Umumiy statistika ────────────────────────────────────────────────────────

export interface OverviewReport {
  months: string[];
  studentFlow: { label: string; joined: number; left: number; net: number }[];
  attendance: { label: string; rate: number; total: number }[];
  courses: { id: string; name: string; price: number; students: number; groups: number; revenue: number }[];
  teachers: { id: string; name: string; groups: number; students: number; revenue: number }[];
  leads: {
    total: number; yangi: number; aloqa: number; sinov: number;
    tolandi: number; bekor: number; conversionRate: number;
  };
}

export function useOverviewReport(months = 6) {
  const { activeBranchId } = useBranch();
  const params = new URLSearchParams({ months: String(months) });
  if (activeBranchId) params.set("branchId", activeBranchId);
  return useSWR<OverviewReport>(`/api/reports/overview?${params.toString()}`, fetcher);
}

// ─── Yordamchilar ─────────────────────────────────────────────────────────────

export const METHOD_LABELS: Record<string, string> = {
  NAQD: "Naqd", KARTA: "Karta", CLICK: "Click", PAYME: "Payme",
};

export const METHOD_COLORS: Record<string, string> = {
  NAQD:  "#10b981",
  KARTA: "#6366f1",
  CLICK: "#f59e0b",
  PAYME: "#06b6d4",
};
