"use client";

import { cn } from "@/lib/utils";
import { Check, TriangleAlert } from "lucide-react";

/**
 * GURUH BO'YICHA QARZ — o'quvchi profilidagi taqsimot.
 *
 * Umumiy balans "−1 800 000" degan raqam o'z-o'zicha savol tug'diradi:
 * qaysi guruhga? Bu ro'yxat aynan shunga javob beradi.
 *
 * IKKI QOIDA:
 *
 *  1. Chiqib ketgan guruh ham KO'RSATILADI. Uni yashirsak, ko'rinadigan
 *     qatorlar yig'indisi umumiy balansga teng chiqmasdi va foydalanuvchi
 *     "qolgan pul qayerda?" deb qolardi. Guruh almashtirilganda o'sha
 *     oyning asosiy qarzi ESKI guruhda qoladi — bu haqiqat, uni
 *     yashirmaslik kerak.
 *
 *  2. Pastda tekshiruv qatori bor. Yig'indi balansga teng ekani ko'rinib
 *     tursin — raqamlarga ishonch shundan boshlanadi.
 */

export interface LedgerRow {
  groupId:   string | null;
  groupName: string;
  status:    string | null;
  debt:      number;
  advance:   number;
  net:       number;
}

export interface GroupLedgerData {
  rows:       LedgerRow[];
  unassigned: number;
  total:      number;
}

const STATUS_UZ: Record<string, { label: string; cls: string }> = {
  FAOL:          { label: "Faol",         cls: "text-emerald-600 dark:text-emerald-400" },
  SINOV:         { label: "Sinov",        cls: "text-amber-600 dark:text-amber-400" },
  CHIQIB_KETGAN: { label: "Chiqib ketgan", cls: "text-neutral-400 dark:text-neutral-500" },
  OCHIRILGAN:    { label: "O'chirilgan",  cls: "text-neutral-400 dark:text-neutral-500" },
};

export function GroupDebtBreakdown({
  ledger, balance, fmt,
}: {
  ledger: GroupLedgerData | null | undefined;
  balance: number;
  fmt: (v: number) => string;
}) {
  if (!ledger || ledger.rows.length === 0) return null;

  // Bitta guruh va boshqa hech narsa bo'lmasa — taqsimot hech qanday yangi
  // ma'lumot bermaydi, faqat ekranni to'ldiradi.
  if (ledger.rows.length === 1 && ledger.unassigned === 0) return null;

  const matches = Math.round(ledger.total) === Math.round(balance);

  return (
    <div className="pt-3 mt-1 border-t border-neutral-200/60 dark:border-neutral-700/60">
      <p className="text-[11px] text-neutral-400 mb-1.5">Guruhlar bo&apos;yicha</p>

      <ul className="space-y-1">
        {ledger.rows.map((r) => {
          const st = r.status ? STATUS_UZ[r.status] : null;
          return (
            <li key={r.groupId ?? "—"} className="flex items-baseline justify-between gap-2">
              <span className="min-w-0 flex items-baseline gap-1.5">
                <span className={cn(
                  "text-[12px] truncate",
                  r.groupId == null
                    ? "text-neutral-500 dark:text-neutral-400 italic"
                    : "text-neutral-700 dark:text-neutral-200",
                )}>
                  {r.groupName}
                </span>
                {st && st.label !== "Faol" && (
                  <span className={cn("text-[10px] shrink-0", st.cls)}>· {st.label}</span>
                )}
              </span>
              <span className={cn(
                "text-[12px] font-semibold tabular-nums shrink-0",
                r.net > 0 ? "text-emerald-600 dark:text-emerald-400"
                : r.net < 0 ? "text-red-600 dark:text-red-400"
                : "text-neutral-400",
              )}>
                {r.net === 0 ? "—" : fmt(r.net)}
              </span>
            </li>
          );
        })}

        {ledger.unassigned !== 0 && (
          <li className="flex items-baseline justify-between gap-2">
            <span className="text-[12px] text-neutral-500 dark:text-neutral-400 italic truncate">
              Guruhsiz to&apos;lov
            </span>
            <span className="text-[12px] font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {fmt(ledger.unassigned)}
            </span>
          </li>
        )}
      </ul>

      {/* Tekshiruv qatori — raqamlar bir-biriga to'g'ri kelishi ko'rinib tursin. */}
      <div className="flex items-center justify-between gap-2 mt-2 pt-2
                      border-t border-dashed border-neutral-200/60 dark:border-neutral-700/60">
        <span className="flex items-center gap-1 text-[10.5px] text-neutral-400 dark:text-neutral-500">
          {matches
            ? <><Check className="w-3 h-3 text-emerald-500" /> Jami balansga teng</>
            : <><TriangleAlert className="w-3 h-3 text-amber-500" /> Jami mos kelmadi</>}
        </span>
        <span className="text-[11px] font-bold tabular-nums text-neutral-600 dark:text-neutral-300">
          {fmt(ledger.total)}
        </span>
      </div>
    </div>
  );
}
