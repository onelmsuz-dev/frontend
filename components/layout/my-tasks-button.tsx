"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ListChecks, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatUzDate } from "@/lib/date-uz";
import { useMyTasks, toggleReminderDone } from "@/lib/hooks/useReminders";
import { useFeature } from "@/lib/hooks/useFeatures";

/**
 * VAZIFALARIM — top-header'dagi belgi.
 *
 * Bell (bildirishnoma) o'quvchi/to'lov hodisalarini ko'rsatadi — bu esa
 * ATAYLAB xodimga BIRIKTIRILGAN vazifalarni. Ikkalasi aralashtirilsa,
 * "menga tegishli ish" degani "hammaga tegishli xabar" ichida yo'qolib
 * ketardi. Belgi faqat MUDDATI O'TGAN yoki ochiq vazifa bo'lsa ko'rinadi.
 */
export function MyTasksButton() {
  // Bayroq o'chiq bo'lsa so'rov UMUMAN ketmaydi (SWR kaliti `null`) —
  // ilgari har bir foydalanuvchi har daqiqada 404 olib turardi.
  const enabled = useFeature("reminders");
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { data } = useMyTasks(enabled === true);
  const tasks = Array.isArray(data) ? data : [];
  const openTasks = tasks.filter(t => !t.done);
  const overdueCount = openTasks.filter(t => t.status === "MUDDATI_OTGAN").length;

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!enabled) return null;

  return (
    <div className="relative" ref={panelRef}>
      <button onClick={() => setOpen(v => !v)} title="Vazifalarim"
        className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors
          text-neutral-500 hover:text-indigo-600 dark:text-neutral-400 dark:hover:text-indigo-300
          hover:bg-white/60 dark:hover:bg-white/10">
        <ListChecks className="w-4 h-4" />
        {openTasks.length > 0 && (
          <span className={cn("absolute top-1.5 right-1.5 min-w-[14px] h-[14px] rounded-full",
            "text-[9px] text-white font-bold flex items-center justify-center px-0.5",
            overdueCount > 0 ? "bg-red-500" : "bg-indigo-500")}>
            {openTasks.length > 9 ? "9+" : openTasks.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 glass-strong w-80
          border border-white/60 dark:border-white/10 rounded-3xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/50 dark:border-white/10">
            <h3 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">Vazifalarim</h3>
            {overdueCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-red-600 dark:text-red-400">
                <AlertTriangle className="w-3 h-3" />
                {`${overdueCount} muddati o'tgan`}
              </span>
            )}
          </div>

          <div className="max-h-[340px] overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800">
            {openTasks.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-neutral-400">
                <ListChecks className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-[12px]">Ochiq vazifa yo&apos;q</p>
              </div>
            ) : (
              openTasks.slice(0, 6).map(t => (
                <div key={t.id} className="flex items-start gap-2.5 px-4 py-3 hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                  <button onClick={() => toggleReminderDone(t.id, true)}
                    title="Bajarildi deb belgilash"
                    className="w-4 h-4 mt-0.5 shrink-0 rounded border-2 border-neutral-300 dark:border-neutral-600 hover:border-green-500 transition-colors" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] text-neutral-800 dark:text-neutral-200 leading-snug">{t.text}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {t.studentId && (
                        <Link href={`/students/${t.studentId}`} onClick={() => setOpen(false)}
                          className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline">
                          {t.studentName}
                        </Link>
                      )}
                      {t.dueDate && (
                        <span className={cn("text-[11px]", t.status === "MUDDATI_OTGAN" ? "text-red-500 font-semibold" : "text-neutral-400")}>
                          · {formatUzDate(t.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-3 border-t border-white/50 dark:border-white/10">
            <Link href="/vazifalarim" onClick={() => setOpen(false)}
              className="block text-center text-[12px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              Hammasini ko&apos;rish
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
