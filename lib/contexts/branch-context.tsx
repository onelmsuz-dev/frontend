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

/** Almashtirgichdagi "Barcha filiallar" qiymati. */
export const HAMMA_FILIAL = "";

type BranchContextValue = {
  branches: BranchItem[];
  /** `null` = BARCHA filiallar (standart holat). */
  activeBranchId: string | null;
  activeBranch: BranchItem | null;
  isLoading: boolean;
  /** Bir nechta filial bor va tanlash ma'noga ega. */
  kopFilial: boolean;
  setActiveBranchId: (id: string | null) => void;
  refreshBranches: () => void;
};

const BranchContext = createContext<BranchContextValue | null>(null);

function storageKey(subdomain: string | null) {
  return `oneroom:branch:${subdomain ?? "default"}`;
}

/** localStorage'da "barcha" ni ALOHIDA belgi bilan saqlaymiz. */
const BARCHA = "__all__";

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
    // Eski kalitda "barcha" tushunchasi yo'q edi va u yerda filial id'si
    // yotibdi. Uni o'qiymiz, lekin pastdagi effekt ro'yxatda yo'q bo'lsa
    // "barcha" ga tushiradi.
    setActiveBranchIdState(saved && saved !== BARCHA ? saved : null);
    setHydrated(true);
  }, [orgSubdomain]);

  /**
   * TANLOVNI TEKSHIRISH.
   *
   * Ilgari bu yerda "hech narsa tanlanmagan bo'lsa BIRINCHI filialni qo'y"
   * degan qoida bor edi. Aynan shu sabab markazda ikkita filial bo'lsa ham
   * hamma narsa birinchisiga tushardi — panel ham, yangi kurs ham. Endi
   * standart holat "barcha filiallar" va u HECH QACHON o'z-o'zidan
   * bitta filialga almashmaydi.
   *
   * Yagona istisno — xodimga BITTA filial biriktirilgan bo'lsa: unda
   * tanlov degani yo'q, ro'yxatdagi yagona filial doim aktiv.
   */
  useEffect(() => {
    if (!hydrated || isLoading) return;
    if (branches.length === 1) {
      const yagona = branches[0].id;
      if (activeBranchId !== yagona) setActiveBranchIdState(yagona);
      return;
    }
    if (activeBranchId && !branches.some((b) => b.id === activeBranchId)) {
      setActiveBranchIdState(null);
      localStorage.removeItem(storageKey(orgSubdomain));
    }
  }, [hydrated, isLoading, branches, activeBranchId, orgSubdomain]);

  const setActiveBranchId = useCallback(
    (id: string | null) => {
      setActiveBranchIdState(id);
      localStorage.setItem(storageKey(orgSubdomain), id ?? BARCHA);
      /**
       * Filial almashsa — KESHDAGI HAMMA NARSA eskiradi.
       *
       * Ilgari faqat uchta yo'l (dashboard/payments/reports) yangilanardi;
       * o'quvchilar, guruhlar, kurslar va xodimlar ro'yxati eski filialdan
       * qolgan qatorlarni ko'rsatib turaverardi. Bu esa "filialni
       * almashtirdim, lekin ma'lumot o'sha-o'sha" degan tuyg'u berardi.
       */
      void mutate(
        (key) => typeof key === "string" && key.startsWith("/api/"),
        undefined,
        { revalidate: true },
      );
    },
    [orgSubdomain],
  );

  const activeBranch = useMemo(
    () => branches.find((b) => b.id === activeBranchId) ?? null,
    [branches, activeBranchId],
  );

  const value = useMemo<BranchContextValue>(
    () => ({
      branches,
      activeBranchId,
      activeBranch,
      isLoading,
      kopFilial: branches.length > 1,
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
