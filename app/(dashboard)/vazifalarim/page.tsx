"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { mutate } from "swr";
import { TopHeader } from "@/components/layout/top-header";
import { ListChecks, AlertTriangle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatUzDate } from "@/lib/date-uz";
import { todayStr } from "@/lib/form-constants";
import { DatePicker } from "@/components/ui/date-picker";
import {
  useMyTasks, useStaffMembers, toggleReminderDone, createReminder, type ReminderStatus,
} from "@/lib/hooks/useReminders";
import { useFeature } from "@/lib/hooks/useFeatures";
import { useMe, hasPerm } from "@/lib/hooks/useMe";

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
 * MENING VAZIFALARIM — shu foydalanuvchiga biriktirilgan barcha vazifalar,
 * qaysi o'quvchiga tegishli bo'lishidan qat'i nazar bitta ro'yxatda.
 * O'quvchi profilidagi "Vazifalar" blokining o'zi — faqat u yerda faqat
 * bitta o'quvchi ko'rinadi, bu yerda esa hammasi.
 */
export default function MyTasksPage() {
  const enabled = useFeature("reminders");
  const { me } = useMe();
  // Admin va admin ruxsat bergan xodimlar — boshqalar faqat o'ziga
  // berilgan vazifani ko'rib, bajarilgan deb belgilay oladi, yangisini
  // yarata olmaydi (egasining talabi, 2026-09-30).
  const canCreate = hasPerm(me?.permissions, "reminders.create");
  // `enabled === true` — bayroq hali noma'lum yoki o'chiq bo'lsa so'rov
  // UMUMAN yuborilmaydi (aks holda har foydalanuvchi har daqiqada
  // kerakmas 404 olib turardi).
  const { data, isLoading } = useMyTasks(enabled === true);
  // Xodimlar ro'yxati faqat yaratish formasi uchun — ruxsatsiz xodimga 403 so'rov yubormaylik.
  const { data: staffRaw } = useStaffMembers(enabled === true && canCreate);
  const staff = Array.isArray(staffRaw) ? staffRaw : [];
  const all = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const [tab, setTab] = useState<"barchasi" | ReminderStatus>("barchasi");

  const [showForm, setShowForm] = useState(false);
  const [text, setText] = useState("");
  const [dueDate, setDueDate] = useState(todayStr());
  const [assigneeId, setAssigneeId] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    if (!text.trim() || !assigneeId) return;
    setSaving(true); setErr("");
    try {
      const e = await createReminder({ text: text.trim(), dueDate, assigneeId });
      if (e) { setErr(e); return; }
      setText(""); setDueDate(todayStr()); setAssigneeId(""); setShowForm(false);
      mutate("/api/reminders?assigneeId=me");
    } finally { setSaving(false); }
  }

  const filtered = useMemo(
    () => tab === "barchasi" ? all : all.filter(t => t.status === tab),
    [all, tab],
  );

  const overdueCount = all.filter(t => t.status === "MUDDATI_OTGAN").length;

  // Bosqichma-bosqich chiqarish — hozircha faqat demo markazda. Boshqa
  // markazlarda backend `@Feature("reminders")` bilan 404 qaytaradi;
  // shuni ochiq xato o'rniga tushunarli xabar bilan ko'rsatamiz.
  if (enabled === false) {
    return (
      <div>
        <TopHeader title="Vazifalarim" />
        <div className="p-6 max-w-md mx-auto text-center text-neutral-400">
          <ListChecks className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-[13px]">Bu bo&apos;lim hali sinov bosqichida.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopHeader title="Vazifalarim" subtitle="Sizga biriktirilgan follow-up ishlar"
        action={canCreate ? { label: "Vazifa qo'shish", onClick: () => setShowForm(v => !v) } : undefined} />

      <div className="p-5 space-y-4">
        {canCreate && showForm && (
          <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-4 space-y-2">
            <input value={text} onChange={e => setText(e.target.value)}
              placeholder="Masalan: yangi guruh jadvalini tasdiqlash"
              className="w-full px-3 py-2 text-[12.5px] rounded-xl border border-white/60 dark:border-white/10
                bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400
                outline-none focus:border-indigo-400 transition-colors" />
            <div className="flex items-center gap-2">
              <DatePicker value={dueDate} min={todayStr()} onChange={setDueDate} />
              <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)}
                className="h-9 flex-1 min-w-0 px-2.5 text-[12px] rounded-xl border border-white/60 dark:border-white/10
                  bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 outline-none">
                <option value="">Kimga biriktirilsin?</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <button onClick={submit} disabled={saving || !text.trim() || !assigneeId}
              className="w-full h-9 rounded-xl text-[12px] font-semibold bg-indigo-600 hover:bg-indigo-700
                disabled:bg-neutral-200 disabled:dark:bg-neutral-800 disabled:text-neutral-400
                disabled:cursor-not-allowed text-white transition-colors flex items-center justify-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              {saving ? "Saqlanmoqda..." : "Qo'shish"}
            </button>
            {err && <p className="text-[11.5px] text-red-600 dark:text-red-400">{err}</p>}
          </div>
        )}

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
                      {t.studentId && (
                        <Link href={`/students/${t.studentId}`}
                          className="text-[11.5px] text-indigo-600 dark:text-indigo-400 hover:underline">
                          {t.studentName}
                        </Link>
                      )}
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
