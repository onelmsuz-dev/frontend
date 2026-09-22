"use client";

import { useState } from "react";
import { Users, Wallet } from "lucide-react";
import { TopHeader } from "@/components/layout/top-header";
import { BranchFilter } from "@/components/layout/branch-filter";
import { StaffSection } from "@/components/settings/staff-section";
import { StaffSalaries } from "@/components/staff/staff-salaries";
import { useBranch } from "@/lib/contexts/branch-context";
import { useMe, hasPerm } from "@/lib/hooks/useMe";
import { cn } from "@/lib/utils";
import type { Branch } from "@/types";

/**
 * XODIMLAR — o'z bo'limi.
 *
 * Ilgari xodim va rollar Sozlamalar ichida edi: ya'ni ularni ko'rish
 * uchun `settings.view` kerak bo'lardi va u markazning pul, tarif,
 * tizim sozlamalarini ham ochardi. Endi bo'lim o'zining `staff.view`
 * ruxsati bilan ishlaydi.
 *
 * Ro'yxat TEPADAGI filial bo'yicha toraydi — server `UserBranch`
 * jadvalidan filtrlaydi, ya'ni bir nechta filialda ishlaydigan xodim
 * har ikkalasida ham ko'rinadi.
 *
 * O'QITUVCHILAR BU YERDA YO'Q — ular "O'qituvchilar" bo'limida va
 * oyligi guruhga/darsga bog'langan boshqa tizimda hisoblanadi.
 */

type Tab = "royxat" | "oylik";

export default function XodimlarPage() {
  const { me } = useMe();
  const oylikKoradi = hasPerm(me?.permissions, "salaries.view");
  const { branches, kopFilial, activeBranch } = useBranch();

  const [tab, setTab] = useState<Tab>("royxat");

  const TABLAR: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: "royxat", label: "Xodimlar", icon: Users },
    ...(oylikKoradi
      ? [{ id: "oylik" as Tab, label: "Oyliklar", icon: Wallet }]
      : []),
  ];

  return (
    <div>
      <TopHeader
        title="Xodimlar"
        subtitle={
          tab === "oylik"
            ? "Oylik hisobi va to'lovlar"
            : kopFilial
              ? (activeBranch?.name ?? "Barcha filiallar")
              : "Markaz xodimlari, rollar va oyliklar"
        }
      />

      <div className="p-4 sm:p-5 space-y-4 pb-24">
        {/* Tab qatori — bitta tab bo'lsa umuman chizilmaydi. */}
        {TABLAR.length > 1 && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex p-1 gap-0.5 glass-soft rounded-xl">
              {TABLAR.map((t) => {
                const Icon = t.icon;
                return (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                      tab === t.id
                        ? "bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-neutral-100"
                        : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200",
                    )}>
                    <Icon className="w-3.5 h-3.5" />{t.label}
                  </button>
                );
              })}
            </div>
            <BranchFilter />
          </div>
        )}
        {TABLAR.length === 1 && kopFilial && <BranchFilter />}

        {tab === "royxat"
          ? <StaffSection branches={branches as Branch[]} />
          : <StaffSalaries />}
      </div>
    </div>
  );
}
