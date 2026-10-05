"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { ListTodo, Plus, Check, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetcher } from "@/lib/fetcher";
import { formatUzDate } from "@/lib/date-uz";
import { todayStr } from "@/lib/form-constants";
import { DatePicker } from "@/components/ui/date-picker";
import { useStaffMembers, toggleReminderDone, deleteReminder, type Reminder } from "@/lib/hooks/useReminders";
import { useMe } from "@/lib/hooks/useMe";

const KEY = (studentId: string) => `/api/students/${studentId}/reminders`;

/**
 * VAZIFALAR — xodim uchun follow-up ("3 kundan keyin qo'ng'iroq qilish").
 * Izohdan farqi: bu bajariladigan VAZIFA — muddat, biriktirilgan xodim va
 * belgi bilan; izoh esa erkin kontekst matni. Kimga biriktirilgan bo'lsa,
 * o'sha odam buni top-header'dagi "Vazifalarim" belgisida ham ko'radi.
 *
 * Ilgari bu bo'lim "Eslatmalar" deb atalardi — "Izoh" bilan juda yaqin
 * turib, ikkalasini farqlash qiyin edi (egasining talabi, 2026-09-30).
 */
export function StudentReminders({ studentId, canEdit }: { studentId: string; canEdit: boolean }) {
  const { me } = useMe();
  const { data } = useSWR<Reminder[]>(KEY(studentId), fetcher);
  // Xodimlar ro'yxati faqat vazifa BERA oladiganga kerak (backend ham shunday).
  const { data: staffRaw } = useStaffMembers(canEdit);
  // O'zi ro'yxatda takrorlanmasin — birinchi variant allaqachon "O'zimga".
  const staff = (Array.isArray(staffRaw) ? staffRaw : []).filter(s => s.id !== me?.id);
  const all = Array.isArray(data) ? data : [];
  const open = all.filter(r => !r.done);
  const done = all.filter(r => r.done);

  const [showForm, setShowForm] = useState(false);
  const [text, setText] = useState("");
  const [dueDate, setDueDate] = useState(todayStr());
  // "" — "O'zimga": backend bo'sh ijrochini yaratuvchining o'zi deb oladi.
  // Ilgari birinchi variant biror xodim edi, lekin holat "" qolardi va
  // xodim yuborilmasdi — vazifa 400 bilan jimgina yo'qolardi.
  const [assigneeId, setAssigneeId] = useState("");
  const [saving, setSaving] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    if (!text.trim()) return;
    setSaving(true); setErr("");
    try {
      const res = await fetch(KEY(studentId), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), dueDate, ...(assigneeId ? { assigneeId } : {}) }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErr(d?.error ?? "Vazifa saqlanmadi");
        return;
      }
      setText(""); setDueDate(todayStr()); setAssigneeId(""); setShowForm(false);
      mutate(KEY(studentId));
    } catch {
      setErr("Serverga ulanib bo'lmadi");
    } finally { setSaving(false); }
  }

  async function toggle(r: Reminder) {
    setErr("");
    const e = await toggleReminderDone(r.id, !r.done);
    if (e) setErr(e);
    mutate(KEY(studentId));
  }

  async function remove(r: Reminder) {
    setErr("");
    const e = await deleteReminder(r.id);
    if (e) setErr(e);
    mutate(KEY(studentId));
  }

  /** Belgilash: boshqaruvchi yoki vazifa o'ziga biriktirilgan xodim. */
  const canToggle = (r: Reminder) => canEdit || r.assigneeId === me?.id;

  const today = todayStr();

  return (
    <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-500
          dark:text-neutral-400 uppercase tracking-wider">
          {/* Ro'yxat belgisi — qo'ng'iroqcha (`Bell`) tepa paneldagi
              bildirishnomalar bilan adashtirardi. */}
          <ListTodo className="w-3.5 h-3.5" />
          Vazifalar
        </h3>
        {canEdit && (
          <button onClick={() => setShowForm(v => !v)} title="Vazifa qo'shish"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400
              hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors">
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {showForm && (
        <div className="space-y-2 mb-3 pb-3 border-b border-white/50 dark:border-white/10">
          <input value={text} onChange={e => setText(e.target.value)}
            placeholder="Masalan: qo'ng'iroq qilish kerak"
            className="w-full px-3 py-2 text-[12.5px] rounded-xl border border-white/60 dark:border-white/10
              bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400
              outline-none focus:border-indigo-400 transition-colors" />
          <div className="flex items-center gap-2">
            <DatePicker value={dueDate} min={today} onChange={setDueDate} />
            <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)}
              className="h-9 flex-1 min-w-0 px-2.5 text-[12px] rounded-xl border border-white/60 dark:border-white/10
                bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 outline-none">
              <option value="">O&apos;zimga</option>
              {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <button onClick={submit} disabled={saving || !text.trim()}
            className="w-full h-9 rounded-xl text-[12px] font-semibold bg-indigo-600 hover:bg-indigo-700
              disabled:bg-neutral-200 disabled:dark:bg-neutral-800 disabled:text-neutral-400
              disabled:cursor-not-allowed text-white transition-colors">
            {saving ? "Saqlanmoqda..." : "Qo'shish"}
          </button>
        </div>
      )}

      {err && <p className="text-[11.5px] text-red-600 dark:text-red-400 mb-2">{err}</p>}

      {open.length === 0 && done.length === 0 && (
        <p className="text-[12.5px] text-neutral-400">Vazifa yo&apos;q</p>
      )}

      {open.length > 0 && (
        <ul className="space-y-2">
          {open.map(r => {
            const overdue = r.status === "MUDDATI_OTGAN";
            return (
              <li key={r.id} className="flex items-start gap-2.5 group">
                <button onClick={() => toggle(r)} disabled={!canToggle(r)}
                  title="Bajarildi deb belgilash"
                  className="w-4 h-4 mt-0.5 shrink-0 rounded border-2 border-neutral-300 dark:border-neutral-600
                    hover:border-green-500 transition-colors disabled:cursor-not-allowed" />
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] text-neutral-700 dark:text-neutral-200 leading-snug">{r.text}</p>
                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                    {r.dueDate && (
                      <span className={cn("text-[11px]", overdue ? "text-red-500 font-semibold" : "text-neutral-400")}>
                        {overdue ? "Muddati o'tgan — " : ""}{formatUzDate(r.dueDate)}
                      </span>
                    )}
                    {r.assigneeName && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                        {r.assigneeName}
                      </span>
                    )}
                  </div>
                </div>
                {canEdit && (
                  <button onClick={() => remove(r)}
                    className="w-6 h-6 shrink-0 flex items-center justify-center rounded-lg text-neutral-300
                      hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {done.length > 0 && (
        <>
          <button onClick={() => setShowDone(v => !v)}
            className="flex items-center gap-1 mt-3 text-[11px] font-medium text-neutral-400
              hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">
            {showDone ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Bajarilgan {done.length} ta
          </button>
          {showDone && (
            <ul className="space-y-1.5 mt-1.5">
              {done.map(r => (
                <li key={r.id} className="flex items-center gap-2.5">
                  <button onClick={() => toggle(r)} disabled={!canToggle(r)}
                    className="w-4 h-4 shrink-0 rounded bg-green-500 border-2 border-green-500
                      flex items-center justify-center disabled:cursor-not-allowed">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </button>
                  <p className="text-[12px] text-neutral-400 line-through truncate">{r.text}</p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
