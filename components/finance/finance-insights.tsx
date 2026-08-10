"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Target, TrendingUp, TrendingDown, AlertTriangle, Wallet,
  CreditCard, Phone, ArrowRight,
} from "lucide-react";
import { useFinanceReport, METHOD_LABELS, METHOD_COLORS } from "@/lib/hooks/useReports";

const fmt = (v: number) =>
  new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 0 }).format(v) + " so'm";
const fmtShort = (v: number) => {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} mln`;
  if (Math.abs(v) >= 1_000) return `${Math.round(v / 1_000)} ming`;
  return String(Math.round(v));
};

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded-xl", className)} />;
}

/**
 * Moliya sahifasining tahliliy qismi.
 *
 * Asosiy g'oya: "jami tushum" yolg'iz javob bermaydi — 8 mln yaxshimi yoki
 * yomonmi, faqat KUTILGAN summa bilan solishtirilgandagina ma'lum bo'ladi.
 * Shuning uchun eng tepada yig'ilish darajasi turadi.
 */
export function FinanceInsights() {
  const { data, isLoading, error } = useFinanceReport();

  if (error) {
    return (
      <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
        <p className="text-[13px] text-red-700 dark:text-red-300">{(error as Error).message}</p>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-44 w-full rounded-2xl" />)}
      </div>
    );
  }

  const { month, prev, change, debt, methods, expenseCategories } = data;
  const rate = month.collectionRate;

  return (
    <div className="space-y-3">
      {/* Yig'ilish darajasi + taqqoslash */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Yig'ilish darajasi */}
        <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-indigo-500" />
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Yig&apos;ilish darajasi — {month.label}
            </p>
          </div>

          {rate == null ? (
            <p className="text-[13px] text-neutral-400 py-4">
              Faol o&apos;quvchi yo&apos;q — kutilgan tushumni hisoblab bo&apos;lmadi.
            </p>
          ) : (
            <>
              <div className="flex items-end justify-between mb-2">
                <div>
                  <p className={cn("text-[32px] font-black leading-none",
                    rate >= 90 ? "text-green-600 dark:text-green-400"
                      : rate >= 70 ? "text-amber-600 dark:text-amber-400"
                      : "text-red-600 dark:text-red-400")}>
                    {rate}%
                  </p>
                  <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-1">
                    {fmt(month.collected)} / {fmt(month.expected)}
                  </p>
                </div>
                {month.remaining > 0 && (
                  <div className="text-right">
                    <p className="text-[15px] font-black text-neutral-700 dark:text-neutral-300">
                      {fmt(month.remaining)}
                    </p>
                    <p className="text-[11px] text-neutral-400">yig&apos;ilmagan</p>
                  </div>
                )}
              </div>

              <div className="h-3 rounded-full bg-neutral-200/70 dark:bg-white/10 overflow-hidden">
                <div className={cn("h-full rounded-full transition-all",
                  rate >= 90 ? "bg-green-500" : rate >= 70 ? "bg-amber-500" : "bg-red-500")}
                  style={{ width: `${Math.min(rate, 100)}%` }} />
              </div>

              <p className="text-[11px] text-neutral-400 mt-2.5">
                Kutilgan summa — faol o&apos;quvchilarning kurs narxlari yig&apos;indisi.
                {rate < 70 && " Yig'ilish past — qarzdorlar ro'yxatini ko'rib chiqing."}
              </p>
            </>
          )}
        </div>

        {/* O'tgan oy bilan taqqoslash */}
        <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-5">
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
            {prev.label} bilan
          </p>
          <div className="space-y-2.5">
            <CompareRow label="Tushum"  cur={month.collected} prev={prev.collected} change={change.collected} good="up" />
            <CompareRow label="Xarajat" cur={month.expenses}  prev={prev.expenses}  change={change.expenses}  good="down" />
            <CompareRow label="Foyda"   cur={month.profit}    prev={prev.profit}    change={change.profit}    good="up" />
          </div>
        </div>
      </div>

      {/* Qarzdorlik + to'lov usullari + xarajat kategoriyalari */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* TOP qarzdorlar */}
        <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/50 dark:border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/40 flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">
                Eng katta qarzdorlar
              </h3>
            </div>
            <div className="text-right">
              <p className="text-[14px] font-black text-red-600 dark:text-red-400 leading-none">
                {fmt(debt.total)}
              </p>
              <p className="text-[10px] text-neutral-400 mt-0.5">{debt.count} ta o&apos;quvchi</p>
            </div>
          </div>

          {debt.top.length === 0 ? (
            <div className="py-10 text-center text-sm text-neutral-400">Qarzdor yo&apos;q 🎉</div>
          ) : debt.top.map(d => (
            <div key={d.id}
              className="flex items-center gap-3 px-5 py-2.5 border-b border-white/50 dark:border-white/10 last:border-0 hover:bg-white/60 dark:hover:bg-white/10 transition-colors">
              <Link href={`/students/${d.id}`}
                className="flex items-center gap-3 flex-1 min-w-0 group/name">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-400 to-orange-400 flex items-center justify-center text-white text-[12px] font-bold shrink-0">
                  {d.name[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 truncate group-hover/name:text-indigo-600 transition-colors">
                    {d.name}
                  </p>
                  <p className="text-[11px] text-neutral-400 truncate">
                    {d.groupName ?? "guruhsiz"}
                  </p>
                </div>
              </Link>
              <a href={`tel:${d.parentPhone || d.phone}`} title="Qo'ng'iroq"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors shrink-0">
                <Phone className="w-3.5 h-3.5" />
              </a>
              <span className="text-[13px] font-black text-red-600 dark:text-red-400 shrink-0 w-24 text-right">
                {fmtShort(d.debt)}
              </span>
            </div>
          ))}

          {debt.count > debt.top.length && (
            <Link href="/finance?tab=qarzdorlar"
              className="flex items-center justify-center gap-1 px-5 py-2.5 text-[12px] font-semibold text-teal-600 dark:text-teal-400 hover:underline border-t border-white/50 dark:border-white/10">
              Barcha {debt.count} ta qarzdor <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        {/* To'lov usullari + xarajat kategoriyalari */}
        <div className="space-y-3">
          <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-blue-500" />
              <p className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">
                To&apos;lov usullari
              </p>
            </div>
            {methods.length === 0 ? (
              <p className="text-[12px] text-neutral-400 py-2">Bu oyda to&apos;lov yo&apos;q</p>
            ) : (
              <div className="space-y-2">
                {methods.map(m => (
                  <div key={m.method}>
                    <div className="flex items-center justify-between text-[12px] mb-1">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        {METHOD_LABELS[m.method] ?? m.method}
                        <span className="text-neutral-400 ml-1">· {m.count} ta</span>
                      </span>
                      <span className="font-bold text-neutral-800 dark:text-neutral-200">{m.share}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-neutral-200/70 dark:bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${m.share}%`, backgroundColor: METHOD_COLORS[m.method] ?? "#6366f1" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="w-4 h-4 text-red-500" />
              <p className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">
                Xarajat turlari
              </p>
            </div>
            {expenseCategories.length === 0 ? (
              <p className="text-[12px] text-neutral-400 py-2">Bu oyda xarajat yo&apos;q</p>
            ) : (
              <div className="space-y-1.5">
                {expenseCategories.map(e => (
                  <div key={e.category} className="flex items-center justify-between gap-2 text-[12px]">
                    <span className="text-neutral-600 dark:text-neutral-400 truncate">{e.category}</span>
                    <span className="text-neutral-800 dark:text-neutral-200 font-semibold shrink-0">
                      {fmtShort(e.amount)}
                      <span className="text-neutral-400 font-normal ml-1">{e.share}%</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CompareRow({ label, cur, prev, change, good }: {
  label: string; cur: number; prev: number; change: number | null; good: "up" | "down";
}) {
  const isUp = change != null && change > 0;
  const isGood = change == null || change === 0 ? null : (good === "up" ? isUp : !isUp);

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="text-[12px] text-neutral-500 dark:text-neutral-400">{label}</p>
        <p className="text-[14px] font-black text-neutral-900 dark:text-neutral-100">{fmtShort(cur)}</p>
      </div>
      <div className="text-right shrink-0">
        {change == null ? (
          <span className="text-[11px] text-neutral-400">o&apos;tgan oy 0</span>
        ) : (
          <span className={cn("flex items-center gap-0.5 text-[12px] font-bold justify-end",
            isGood === null ? "text-neutral-400"
              : isGood ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400")}>
            {isUp ? <TrendingUp className="w-3 h-3" /> : change < 0 ? <TrendingDown className="w-3 h-3" /> : null}
            {change > 0 ? "+" : ""}{change}%
          </span>
        )}
        <p className="text-[10px] text-neutral-400 mt-0.5">{fmtShort(prev)}</p>
      </div>
    </div>
  );
}
