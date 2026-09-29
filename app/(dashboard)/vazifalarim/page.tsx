"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TopHeader } from "@/components/layout/top-header";
import { ListChecks, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatUzDate } from "@/lib/date-uz";
import { useMyTasks, toggleReminderDone, type ReminderStatus } from "@/lib/hooks/useReminders";

const TABS: { v: "barchasi" | ReminderStatus; l: string }[] = [
  { v: "barchasi", l: "Barchasi" },
  { v: "MUDDATI_OTGAN", l: "Muddati o'tgan" },
  { v: "JARAYONDA", l: "Jarayonda" },
  { v: "BAJARILGAN", l: "Bajarilgan" },
];

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded-xl", className)} />;
}

/**
 * MENING VAZIFALARIM — shu foydalanuvchiga biriktirilgan barcha eslatmalar,
 * qaysi o'quvchiga tegishli bo'lishidan qat'i nazar bitta ro'yxatda.
 * O'quvchi profilidagi "Eslatmalar" blokining o'zi — faqat u yerda faqat
 * bitta o'quvchi ko'rinadi, bu yerda esa hammasi.
 */
export default function MyTasksPage() {
  const { data, isLoading } = useMyTasks();
  const all = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const [tab, setTab] = useState<"barchasi" | ReminderStatus>("barchasi");

  const filtered = useMemo(
    () => tab === "barchasi" ? all : all.filter(t => t.status === tab),
    [all, tab],
  );

  const overdueCount = all.filter(t => t.status === "MUDDATI_OTGAN").length;

  return (
    <div>
      <TopHeader title="Vazifalarim" subtitle="Sizga biriktirilgan follow-up ishlar" />

      <div className="p-5 space-y-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map(t => (
            <button key={t.v} onClick={() => setTab(t.v)}
              className={cn(
                "shrink-0 whitespace-nowrap px-3.5 h-9 rounded-xl text-[12.5px] font-semibold transition-colors",
                tab === t.v
                  ? "bg-indigo-600 text-white dark:bg-indigo-500"
                  : "glass-soft text-neutral-600 dark:text-neutral-400 hover:bg-white/60 dark:hover:bg-white/10")}>
              {t.l}
              {t.v === "MUDDATI_OTGAN" && overdueCount > 0 && (
                <span className="ml-1.5 text-[10px]">({overdueCount})</span>
              )}
            </button>
          ))}
        </div>

        <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-neutral-400">
              <ListChecks className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-[13px]">Bu bo&apos;limda vazifa yo&apos;q</p>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filtered.map(t => (
                <li key={t.id} className="flex items-start gap-3 px-5 py-3.5">
                  <button onClick={() => toggleReminderDone(t.id, !t.done)}
                    title={t.done ? "Qayta ochish" : "Bajarildi deb belgilash"}
                    className={cn("w-4 h-4 mt-0.5 shrink-0 rounded border-2 transition-colors",
                      t.done
                        ? "bg-green-500 border-green-500"
                        : "border-neutral-300 dark:border-neutral-600 hover:border-green-500")} />
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-[13px] leading-snug", t.done ? "text-neutral-400 line-through" : "text-neutral-800 dark:text-neutral-200")}>
                      {t.text}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      <Link href={`/students/${t.studentId}`}
                        className="text-[11.5px] text-indigo-600 dark:text-indigo-400 hover:underline">
                        {t.studentName}
                      </Link>
                      {t.dueDate && (
                        <span className={cn("text-[11px]", t.status === "MUDDATI_OTGAN" ? "text-red-500 font-semibold flex items-center gap-1" : "text-neutral-400")}>
                          {t.status === "MUDDATI_OTGAN" && <AlertTriangle className="w-3 h-3" />}
                          {formatUzDate(t.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
