"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import { mutate } from "swr";
import { useBranches } from "@/lib/hooks/useBranches";

export type BranchItem = {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
};

type BranchContextValue = {
  branches: BranchItem[];
  activeBranchId: string | null;
  activeBranch: BranchItem | null;
  isLoading: boolean;
  setActiveBranchId: (id: string) => void;
  refreshBranches: () => void;
};

const BranchContext = createContext<BranchContextValue | null>(null);

function storageKey(subdomain: string | null) {
  return `oneroom:branch:${subdomain ?? "default"}`;
}

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const orgSubdomain = session?.user?.orgSubdomain ?? null;
  const { data: raw, isLoading, mutate: refresh } = useBranches();

  const branches: BranchItem[] = useMemo(
    () => (Array.isArray(raw) ? raw : []),
    [raw],
  );

  const [activeBranchId, setActiveBranchIdState] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(storageKey(orgSubdomain));
    setActiveBranchIdState(saved);
    setHydrated(true);
  }, [orgSubdomain]);

  useEffect(() => {
    if (!hydrated || isLoading) return;
    if (branches.length === 0) {
      setActiveBranchIdState(null);
      return;
    }
    const exists = activeBranchId && branches.some(b => b.id === activeBranchId);
    if (!exists) {
      const first = branches[0].id;
      setActiveBranchIdState(first);
      localStorage.setItem(storageKey(orgSubdomain), first);
    }
  }, [hydrated, isLoading, branches, activeBranchId, orgSubdomain]);

  const setActiveBranchId = useCallback(
    (id: string) => {
      setActiveBranchIdState(id);
      localStorage.setItem(storageKey(orgSubdomain), id);
      void mutate(
        key => typeof key === "string" && (
          key.startsWith("/api/dashboard") ||
          key.startsWith("/api/payments") ||
          key.startsWith("/api/reports")
        ),
      );
    },
    [orgSubdomain],
  );

  const activeBranch = useMemo(
    () => branches.find(b => b.id === activeBranchId) ?? null,
    [branches, activeBranchId],
  );

  const value = useMemo<BranchContextValue>(
    () => ({
      branches,
      activeBranchId,
      activeBranch,
      isLoading,
      setActiveBranchId,
      refreshBranches: () => void refresh(),
    }),
    [branches, activeBranchId, activeBranch, isLoading, setActiveBranchId, refresh],
  );

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error("useBranch must be used within BranchProvider");
  return ctx;
}

export function useBranchQueryString(extra?: Record<string, string | undefined>) {
  const { activeBranchId } = useBranch();
  const params = new URLSearchParams();
  if (activeBranchId) params.set("branchId", activeBranchId);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v) params.set(k, v);
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
