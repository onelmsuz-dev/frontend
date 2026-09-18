"use client";

import useSWR from "swr";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetcher } from "@/lib/fetcher";
import { formatUzDate } from "@/lib/date-uz";

/**
 * QO'SHIMCHA TO'LOVLAR — kitob, forma, sertifikat.
 *
 * ATAYLAB ALOHIDA KARTOCHKA, to'lovlar ro'yxatiga qo'shilmagan. Bu pul
 * o'quvchining KURS qarziga tegmaydi va o'qituvchi foiziga kirmaydi —
 * agar u to'lovlar orasida tursa, xodim uni qarz to'lovi deb o'qirdi
 * va "nega balans o'zgarmadi" degan savol tug'ilardi (egasining
 * qarori, 2026-09-18).
 *
 * Yozuv bo'lmasa kartochka UMUMAN chizilmaydi — ko'p markaz kitob
 * sotmaydi va bo'sh bo'lim ekranda o'rin egallardi.
 */

interface Yozuv {
  id: string;
  kind: "SOTUV" | "TOLOV";
  category: string;
  amount: number;
  method: string | null;
  note: string | null;
  date: string;
  createdByName: string;
}

export function StudentMaterials({
  studentId, fmt,
}: {
  studentId: string;
  fmt: (v: number) => string;
}) {
  const { data } = useSWR<{
    items: Yozuv[]; sold: number; paid: number; debt: number;
  }>(`/api/materials/student/${studentId}`, fetcher);

  if (!data || data.items.length === 0) return null;

  return (
    <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-500
          dark:text-neutral-400 uppercase tracking-wider">
          <Package className="w-3.5 h-3.5" />
          Qo&apos;shimcha to&apos;lovlar
        </h3>
        {data.debt > 0 && (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg
            bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
            Qarz {fmt(data.debt)}
          </span>
        )}
      </div>

      <ul className="space-y-1.5">
        {data.items.slice(0, 6).map((it) => (
          <li key={it.id} className="flex items-start justify-between gap-2">
            <span className="text-[11.5px] leading-snug min-w-0 flex-1
              text-neutral-600 dark:text-neutral-300">
              {it.category}
              <span className="text-neutral-400">
                {" · "}{formatUzDate(it.date)}
              </span>
            </span>
            {/* SOTUV — qarz yozilishi, TO'LOV — pul kirishi.
                Rang bilan ajratiladi, chunki ikkalasi bir ro'yxatda. */}
            <span className={cn("text-[11.5px] font-semibold shrink-0 tabular-nums",
              it.kind === "TOLOV"
                ? "text-green-600 dark:text-green-400"
                : "text-neutral-500 dark:text-neutral-400")}>
              {it.kind === "TOLOV" ? "+" : ""}{fmt(it.amount)}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between gap-2 mt-2.5 pt-2.5
        border-t border-white/50 dark:border-white/10">
        <span className="text-[11px] text-neutral-400">
          Sotilgan {fmt(data.sold)} · to&apos;langan {fmt(data.paid)}
        </span>
        {data.items.length > 6 && (
          <span className="text-[11px] text-neutral-400">
            yana {data.items.length - 6} ta
          </span>
        )}
      </div>
    </div>
  );
}
