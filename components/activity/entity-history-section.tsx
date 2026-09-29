"use client";

import useSWR from "swr";
import { History } from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import { ActivityList, ActivityEmpty, ActivitySkeleton } from "@/components/activity/activity-list";
import type { ActivityPage } from "@/lib/hooks/useActivity";

/**
 * TARIX — bitta obyektga (guruh, o'quvchi, ...) tegishli harakatlar.
 * Sozlamalardagi "So'nggi harakatlar" bilan BIR XIL komponentdan
 * (`ActivityList`) chiziladi — jurnal ikki joyda boshqacha ko'rinsa,
 * xodim qaysi biriga ishonishni bilmasdi. Guruh va o'quvchi sahifalari
 * shu bittasidan foydalanadi, faqat `entity`/`entityId` farq qiladi.
 */
export function EntityHistorySection({ entity, entityId, emptyHint }: {
  entity: string; entityId: string; emptyHint: string;
}) {
  const { data, isLoading } = useSWR<ActivityPage>(
    `/api/activity?entity=${entity}&entityId=${entityId}&limit=15`,
    fetcher,
  );
  const items = data?.items ?? [];

  return (
    <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
      <div className="px-5 py-3 border-b border-white/50 dark:border-white/10 flex items-center gap-2">
        <History className="w-4 h-4 text-neutral-400" />
        <h3 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">Tarix</h3>
      </div>
      <div className="px-5 py-2">
        {isLoading ? (
          <ActivitySkeleton rows={3} />
        ) : items.length === 0 ? (
          <ActivityEmpty hint={emptyHint} />
        ) : (
          <ActivityList items={items} />
        )}
      </div>
    </div>
  );
}
