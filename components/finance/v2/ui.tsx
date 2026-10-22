"use client";

/**
 * MOLIYA (YANGI KO'RINISH) — umumiy bo'laklar.
 *
 * Eski sahifada har tab o'z kartasi, o'z sarlavhasi, o'z filtr uslubini
 * chizardi. Bu yerda hammasi bitta qolipda: `Panel` — oq shisha karta,
 * `PanelHead` — sarlavha + o'ng tomonda amallar, `Th` — jadval ustuni.
 */

import { cn } from "@/lib/utils";
import { TableHead } from "@/components/ui/table";

export const fetcher = (url: string) => fetch(url).then((r) => r.json());

/** API javoblari — faqat shu sahifa o'qiydigan maydonlar. */
export interface Tolov {
  id: string; amount: number; method: string; date: string;
  student?: { name?: string }; group?: { name?: string } | null;
}
export interface Xarajat { id: string; category: string; description: string; amount: number; date: string }
export interface XarajatKategoriya { id: string; name: string }
export interface Qarzdor {
  id: string; name: string; balance: number; phone?: string | null; parentPhone?: string | null;
  groups?: {
    enrollmentStatus?: string;
    group?: { name?: string; teacher?: { user?: { name?: string } } };
  }[];
}

/** SWR javobi massiv bo'lmasa (xato obyekti) — bo'sh ro'yxat. */
export const royxat = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded-xl", className)} />;
}

/** Filtr maydoni (select / date / month) — bitta ko'rinish. */
export const FIELD_CLS =
  "h-9 px-3 text-[13px] rounded-xl border border-neutral-200/80 dark:border-white/10 " +
  "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none " +
  "focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-colors " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

export function Panel({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...rest}
      className={cn("glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden", className)}>
      {children}
    </div>
  );
}

export function PanelHead({
  title, sub, children,
}: { title: React.ReactNode; sub?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-white/50 dark:border-white/10">
      <div className="min-w-0">
        <p className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-100">{title}</p>
        {sub && <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

/** Filtrlar qatori — panel sarlavhasi ostida. */
export function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end gap-2 px-5 py-3 border-b border-white/50 dark:border-white/10 bg-white/30 dark:bg-white/[0.02]">
      {children}
    </div>
  );
}

export function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("flex flex-col gap-1 min-w-[140px]", className)}>
      <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">{label}</span>
      {children}
    </label>
  );
}

export function Th({ className, children, ...rest }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <TableHead {...rest}
      className={cn("text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider", className)}>
      {children}
    </TableHead>
  );
}

export function PrimaryBtn({ className, children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest}
      className={cn("inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-[12.5px] font-semibold",
        "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-sm transition-colors",
        "disabled:opacity-50", className)}>
      {children}
    </button>
  );
}

export function GhostBtn({ className, children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest}
      className={cn("inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[12.5px] font-semibold",
        "border border-neutral-200/80 dark:border-white/10 text-neutral-600 dark:text-neutral-300",
        "hover:bg-white/70 dark:hover:bg-white/10 transition-colors disabled:opacity-50", className)}>
      {children}
    </button>
  );
}

/** Kichik statistik plitka — bo'lim tepasidagi yig'indilar uchun. */
export function MiniStat({
  label, value, tone = "neutral", hint,
}: {
  label: string; value: React.ReactNode; hint?: React.ReactNode;
  tone?: "neutral" | "green" | "red" | "violet" | "amber" | "indigo";
}) {
  const color = {
    neutral: "text-neutral-900 dark:text-neutral-100",
    green:   "text-emerald-600 dark:text-emerald-400",
    red:     "text-red-600 dark:text-red-400",
    violet:  "text-violet-600 dark:text-violet-400",
    amber:   "text-amber-600 dark:text-amber-400",
    indigo:  "text-indigo-600 dark:text-indigo-400",
  }[tone];
  return (
    <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl px-4 py-3 min-w-0">
      <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 truncate">{label}</p>
      <p className={cn("text-[18px] font-black tabular-nums leading-tight mt-0.5 truncate", color)}>{value}</p>
      {hint && <p className="text-[11px] text-neutral-400 mt-0.5 truncate">{hint}</p>}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="py-12 flex flex-col items-center gap-3 text-sm text-neutral-400">{children}</div>;
}
