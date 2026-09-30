"use client";

import { useMemo } from "react";
import Link from "next/link";
import { TopHeader } from "@/components/layout/top-header";
import {
  CheckCircle2, Clock, AlertTriangle, ListChecks, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatUzDate } from "@/lib/date-uz";
import { useMe, hasPerm } from "@/lib/hooks/useMe";
import { useOpenReminders, useRemindersReport } from "@/lib/hooks/useReminders";
import { useFeature } from "@/lib/hooks/useFeatures";

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded-xl", className)} />;
}

const STATUS_CFG = {
  BAJARILGAN:    { label: "Bajarilgan",     cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  JARAYONDA:     { label: "Jarayonda",      cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  MUDDATI_OTGAN: { label: "Muddati o'tgan", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
} as const;

/**
 * VAZIFALAR HISOBOTI — CEO uchun: kim nechta vazifani bajargan, nechtasi
 * jarayonda, nechtasi muddatidan o'tib ketgan.
 *
 * SONLAR backenddan (`/api/reminders/report`) — butun jadval bo'yicha.
 * Ilgari ro'yxat so'rovidan sanalardi va u 50 ta bilan cheklangani uchun
 * 50 dan keyin hisobot jimgina noto'g'ri chiqardi. Ro'yxatda faqat OCHIQ
 * vazifalar (muddati bo'yicha). Ruxsat — `reminders.viewAll` (ilgari
 * mavjud bo'lmagan `tasks.view` edi, sahifa faqat egasiga ochilardi).
 */
export default function TasksReportPage() {
  const { me } = useMe();
  const canView = hasPerm(me?.permissions, "reminders.viewAll");
  const enabled = useFeature("reminders");
  const yuklansin = canView && enabled === true;
  const { data: report, isLoading } = useRemindersReport(yuklansin);
  const { data: openRaw } = useOpenReminders(yuklansin);

  const totals = {
    jami: report?.total ?? 0,
    bajarilgan: report?.done ?? 0,
    jarayonda: report?.open ?? 0,
    muddatiOtgan: report?.overdue ?? 0,
  };

  const byAssignee = useMemo(() => (report?.byAssignee ?? []).map(a => ({
    id: a.assigneeId, name: a.assigneeName,
    jami: a.done + a.open + a.overdue,
    bajarilgan: a.done, jarayonda: a.open, muddatiOtgan: a.overdue,
  })).sort((a, b) => b.muddatiOtgan - a.muddatiOtgan || b.jami - a.jami), [report]);

  const openSorted = useMemo(
    () => (Array.isArray(openRaw) ? openRaw : [])
      .sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999")),
    [openRaw],
  );

  if (!canView) {
    return (
      <div className="p-5 flex flex-col items-center py-20 text-neutral-400">
        <AlertCircle className="w-10 h-10 mb-2 opacity-40" />
        <p className="text-sm">Bu sahifani ko&apos;rishga ruxsatingiz yo&apos;q</p>
      </div>
    );
  }

  // Bosqichma-bosqich chiqarish — hozircha faqat demo markazda.
  if (enabled === false) {
    return (
      <div className="p-5 flex flex-col items-center py-20 text-neutral-400">
        <ListChecks className="w-10 h-10 mb-2 opacity-30" />
        <p className="text-sm">Bu bo&apos;lim hali sinov bosqichida.</p>
      </div>
    );
  }

  return (
    <div>
      <TopHeader title="Vazifalar hisoboti" subtitle="Xodimlarga biriktirilgan follow-up ishlar" />

      <div className="p-5 space-y-5">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatTile icon={ListChecks} value={totals.jami} label="Jami vazifa" cls="text-neutral-900 dark:text-neutral-100" bg="bg-neutral-100 dark:bg-neutral-800" />
            <StatTile icon={CheckCircle2} value={totals.bajarilgan} label="Bajarilgan" cls="text-green-600 dark:text-green-400" bg="bg-green-50 dark:bg-green-900/30" />
            <StatTile icon={Clock} value={totals.jarayonda} label="Jarayonda" cls="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-900/30" />
            <StatTile icon={AlertTriangle} value={totals.muddatiOtgan} label="Muddati o'tgan" cls="text-red-600 dark:text-red-400" bg="bg-red-50 dark:bg-red-900/30" />
          </div>
        )}

        {/* XODIM BO'YICHA — eng ko'p muddati o'tgan yuqorida, CEO birinchi shuni ko'rishi kerak. */}
        <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/50 dark:border-white/10">
            <h3 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">Xodim bo&apos;yicha</h3>
          </div>
          {byAssignee.length === 0 ? (
            <p className="text-[12px] text-neutral-400 p-5 text-center">Hali vazifa yo&apos;q</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="border-b border-white/50 dark:border-white/10 text-left text-[11px] text-neutral-400 uppercase tracking-wider">
                    <th className="px-5 py-2 font-semibold">Xodim</th>
                    <th className="px-3 py-2 font-semibold text-center">Jami</th>
                    <th className="px-3 py-2 font-semibold text-center">Bajarilgan</th>
                    <th className="px-3 py-2 font-semibold text-center">Jarayonda</th>
                    <th className="px-3 py-2 font-semibold text-center">Muddati o&apos;tgan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {byAssignee.map(s => (
                    <tr key={s.id} className="hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-5 py-2.5 font-medium text-neutral-800 dark:text-neutral-200">{s.name}</td>
                      <td className="px-3 py-2.5 text-center text-neutral-500">{s.jami}</td>
                      <td className="px-3 py-2.5 text-center text-green-600 dark:text-green-400 font-semibold">{s.bajarilgan}</td>
                      <td className="px-3 py-2.5 text-center text-blue-600 dark:text-blue-400 font-semibold">{s.jarayonda}</td>
                      <td className={cn("px-3 py-2.5 text-center font-semibold", s.muddatiOtgan > 0 ? "text-red-600 dark:text-red-400" : "text-neutral-300 dark:text-neutral-600")}>
                        {s.muddatiOtgan}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* OCHIQ VAZIFALAR — muddati bo'yicha, eng yaqini/o'tgani birinchi. */}
        <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/50 dark:border-white/10">
            <h3 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">Ochiq vazifalar</h3>
          </div>
          {openSorted.length === 0 ? (
            <p className="text-[12px] text-neutral-400 p-5 text-center">Ochiq vazifa yo&apos;q</p>
          ) : (
            <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {openSorted.map(t => {
                const cfg = STATUS_CFG[t.status];
                return (
                  <li key={t.id} className="flex items-start justify-between gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] text-neutral-800 dark:text-neutral-200 leading-snug">{t.text}</p>
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        {t.studentId && (
                          <Link href={`/students/${t.studentId}`} className="text-[11.5px] text-indigo-600 dark:text-indigo-400 hover:underline">
                            {t.studentName}
                          </Link>
                        )}
                        <span className="text-[11px] text-neutral-400">· {t.assigneeName}</span>
                        {t.dueDate && <span className="text-[11px] text-neutral-400">· {formatUzDate(t.dueDate)}</span>}
                      </div>
                    </div>
                    <span className={cn("text-[10.5px] px-2 py-0.5 rounded-full font-semibold shrink-0", cfg.cls)}>
                      {cfg.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function StatTile({ icon: Icon, value, label, cls, bg }: {
  icon: typeof ListChecks; value: number; label: string; cls: string; bg: string;
}) {
  return (
    <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-4">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", bg)}>
        <Icon className={cn("w-4 h-4", cls)} />
      </div>
      <p className={cn("text-[22px] font-black leading-none", cls)}>{value}</p>
      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">{label}</p>
    </div>
  );
}
