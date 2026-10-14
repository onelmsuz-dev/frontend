"use client";

import { useEffect, useRef, useState } from "react";
import useSWR, { mutate } from "swr";
import { AlertCircle, ListTodo, Plus, Check, Trash2, ChevronDown, ChevronUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetcher } from "@/lib/fetcher";
import { formatUzDate } from "@/lib/date-uz";
import { todayStr } from "@/lib/form-constants";
import { DatePicker } from "@/components/ui/date-picker";
import { useStaffMembers, toggleReminderDone, deleteReminder, type Reminder } from "@/lib/hooks/useReminders";
import { useMe } from "@/lib/hooks/useMe";

const KEY = (studentId: string) => `/api/students/${studentId}/reminders`;

/**
 * Yangi vazifa shakli — izoh qo'shish shakli (`StudentNotes`) bilan bir xil
 * ko'rinish va boshqaruv: "Saqlash" / "Bekor qilish", `Esc` — bekor,
 * `Ctrl/⌘ + Enter` — saqlash. Matn ostida muddat va ijrochi.
 */
function Yozish({
  staff, saqlanmoqda, xato, onSave, onCancel,
}: {
  staff: { id: string; name: string }[]; saqlanmoqda: boolean; xato: string;
  onSave: (v: { text: string; dueDate: string; assigneeId: string }) => void; onCancel: () => void;
}) {
  const [matn, setMatn] = useState("");
  const [dueDate, setDueDate] = useState(todayStr());
  // "" — "O'zimga": backend bo'sh ijrochini yaratuvchining o'zi deb oladi.
  // Ilgari birinchi variant biror xodim edi, lekin holat "" qolardi va
  // xodim yuborilmasdi — vazifa 400 bilan jimgina yo'qolardi.
  const [assigneeId, setAssigneeId] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  const toza = matn.trim();
  const saqlasa = toza.length > 0 && !saqlanmoqda;
  const saqla = () => { if (saqlasa) onSave({ text: toza, dueDate, assigneeId }); };

  return (
    <div className="@container rounded-2xl border border-indigo-200 bg-white p-2.5 shadow-[0_8px_24px_-16px_rgba(79,70,229,0.5)] dark:border-indigo-400/30 dark:bg-neutral-900">
      <textarea
        ref={ref} value={matn} rows={2} maxLength={2000}
        onChange={(e) => setMatn(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") { e.preventDefault(); onCancel(); }
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); saqla(); }
        }}
        placeholder="Masalan: 3 kundan keyin ota-onasiga qo'ng'iroq qilish"
        className="block w-full resize-y bg-transparent px-1.5 py-1 text-[13.5px] leading-relaxed text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-neutral-100"
      />
      <div className="flex items-center gap-2 px-0.5 pb-2">
        <DatePicker value={dueDate} min={todayStr()} onChange={setDueDate} />
        <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} aria-label="Kimga"
          className="h-9 min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-2.5 text-[12.5px] text-neutral-700 outline-none
            focus:border-indigo-400 dark:border-white/10 dark:bg-neutral-800 dark:text-neutral-200">
          <option value="">O&apos;zimga</option>
          {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      {xato && (
        <p className="mx-1.5 mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-red-600 dark:text-red-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />{xato}
        </p>
      )}
      <div className="flex items-center gap-2 border-t border-neutral-100 pt-2 dark:border-white/10">
        <button type="button" disabled={!saqlasa} onClick={saqla}
          className="flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl bg-indigo-600 px-3 text-[12.5px] font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-40">
          <Check className="h-3.5 w-3.5" />{saqlanmoqda ? "Saqlanmoqda…" : "Saqlash"}
        </button>
        <button type="button" disabled={saqlanmoqda} onClick={onCancel}
          className="flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-[12.5px] font-semibold text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800 disabled:opacity-40 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-neutral-100">
          <X className="h-3.5 w-3.5" />Bekor qilish
        </button>
        <span className="ml-auto hidden whitespace-nowrap text-[11px] text-neutral-400 @md:block">Esc — bekor · Ctrl+Enter — saqlash</span>
      </div>
    </div>
  );
}

/**
 * VAZIFALAR — xodim uchun follow-up ("3 kundan keyin qo'ng'iroq qilish").
 * Izohdan farqi: bu bajariladigan VAZIFA — muddat, biriktirilgan xodim va
 * belgi bilan; izoh esa erkin kontekst matni. Kimga biriktirilgan bo'lsa,
 * o'sha odam buni top-header'dagi "Vazifalarim" belgisida ham ko'radi.
 *
 * Ilgari bu bo'lim "Eslatmalar" deb atalardi — "Izoh" bilan juda yaqin
 * turib, ikkalasini farqlash qiyin edi (egasining talabi, 2026-09-30).
 *
 * Ko'rinishi va qo'shish tartibi "Izohlar" bloki bilan bir xil (2026-10-14):
 * sarlavhada son va "Vazifa qo'shish" tugmasi, shakl ro'yxat tepasida ochiladi.
 */
export function StudentReminders({ studentId, canEdit, className }: { studentId: string; canEdit: boolean; className?: string }) {
  const { me } = useMe();
  const { data, isLoading } = useSWR<Reminder[]>(KEY(studentId), fetcher);
  // Xodimlar ro'yxati faqat vazifa BERA oladiganga kerak (backend ham shunday).
  const { data: staffRaw } = useStaffMembers(canEdit);
  // O'zi ro'yxatda takrorlanmasin — birinchi variant allaqachon "O'zimga".
  const staff = (Array.isArray(staffRaw) ? staffRaw : []).filter(s => s.id !== me?.id);
  const all = Array.isArray(data) ? data : [];
  const open = all.filter(r => !r.done);
  const done = all.filter(r => r.done);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [err, setErr] = useState("");

  const yop = () => { setShowForm(false); setFormErr(""); };

  async function submit(v: { text: string; dueDate: string; assigneeId: string }) {
    setSaving(true); setFormErr("");
    try {
      const res = await fetch(KEY(studentId), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: v.text, dueDate: v.dueDate, ...(v.assigneeId ? { assigneeId: v.assigneeId } : {}) }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setFormErr(d?.error ?? "Vazifa saqlanmadi");
        return;
      }
      yop();
      mutate(KEY(studentId));
    } catch {
      setFormErr("Serverga ulanib bo'lmadi");
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

  return (
    // `flex-col` + ro'yxat `flex-1 overflow-y-auto`: blokka balandlik berilsa
    // (`className`), sarlavha joyida qoladi va faqat ro'yxat aylanadi.
    <div className={cn("glass-panel flex flex-col rounded-2xl border border-white/60 p-5 dark:border-white/10", className)}>
      <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          {/* Ro'yxat belgisi — qo'ng'iroqcha (`Bell`) tepa paneldagi
              bildirishnomalar bilan adashtirardi. */}
          <ListTodo className="h-3.5 w-3.5" />
          Vazifalar
          {open.length > 0 && (
            <span className="rounded-full bg-neutral-200/70 px-1.5 py-px text-[10.5px] font-bold text-neutral-600 dark:bg-white/10 dark:text-neutral-300">
              {open.length}
            </span>
          )}
        </p>
        {canEdit && !showForm && (
          <button type="button" onClick={() => { setFormErr(""); setShowForm(true); }}
            className="flex h-8 items-center gap-1.5 rounded-xl bg-indigo-50 px-3 text-[12.5px] font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 dark:bg-indigo-400/15 dark:text-indigo-200 dark:hover:bg-indigo-400/25">
            <Plus className="h-3.5 w-3.5" />Vazifa qo&apos;shish
          </button>
        )}
      </div>

      <div className="-mr-2 min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-2 [scrollbar-width:thin]">
        {showForm && (
          <Yozish staff={staff} saqlanmoqda={saving} xato={formErr} onCancel={yop} onSave={submit} />
        )}

        {err && <p className="text-[12px] font-medium text-red-600 dark:text-red-400">{err}</p>}

        {isLoading && <div className="h-14 animate-pulse rounded-2xl bg-neutral-200/60 dark:bg-white/5" />}

        {!isLoading && open.length === 0 && done.length === 0 && !showForm && (
          <p className="py-2 text-[13px] text-neutral-400">
            Hali vazifa yo&apos;q{canEdit ? " — qilinadigan ishni muddati bilan shu yerga qo'shing." : "."}
          </p>
        )}

        {open.map(r => {
          const overdue = r.status === "MUDDATI_OTGAN";
          return (
            <div key={r.id} className={cn("group/vazifa flex items-start gap-2.5 rounded-2xl border px-3.5 py-3",
              overdue
                ? "border-red-200/70 bg-red-50/60 dark:border-red-400/20 dark:bg-red-400/[0.06]"
                : "border-indigo-200/60 bg-indigo-50/50 dark:border-indigo-400/15 dark:bg-indigo-400/[0.06]")}>
              <button type="button" onClick={() => toggle(r)} disabled={!canToggle(r)}
                title="Bajarildi deb belgilash" aria-label="Bajarildi deb belgilash"
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-2 border-neutral-300 transition-colors hover:border-green-500 disabled:cursor-not-allowed dark:border-neutral-600" />
              <div className="min-w-0 flex-1">
                <p className="whitespace-pre-line break-words text-[13.5px] leading-relaxed text-neutral-800 dark:text-neutral-100">{r.text}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {r.dueDate && (
                    <span className={cn("text-[11.5px]", overdue ? "font-semibold text-red-600 dark:text-red-400" : "text-neutral-500 dark:text-neutral-400")}>
                      {overdue ? "Muddati o'tgan — " : ""}{formatUzDate(r.dueDate)}
                    </span>
                  )}
                  {r.assigneeName && (
                    <span className="rounded-md bg-indigo-100/80 px-1.5 py-0.5 text-[10.5px] font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                      {r.assigneeName}
                    </span>
                  )}
                </div>
              </div>
              {canEdit && (
                // Sichqonchali qurilmada — ustiga borilganda; sensorli ekranda doim ko'rinadi.
                <button type="button" onClick={() => remove(r)} title="O'chirish" aria-label="Vazifani o'chirish"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-neutral-500 opacity-0 transition-opacity
                    hover:bg-red-500/10 hover:text-red-600 focus:opacity-100 group-hover/vazifa:opacity-100 [@media(hover:none)]:opacity-100 dark:text-neutral-400">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}

        {done.length > 0 && (
          <div>
            <button type="button" onClick={() => setShowDone(v => !v)}
              className="flex items-center gap-1 text-[12px] font-semibold text-neutral-500 transition-colors hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200">
              {showDone ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              Bajarilgan {done.length} ta
            </button>
            {showDone && (
              <ul className="mt-2 space-y-1.5">
                {done.map(r => (
                  <li key={r.id} className="flex items-center gap-2.5 px-1">
                    <button type="button" onClick={() => toggle(r)} disabled={!canToggle(r)}
                      title="Qayta ochish" aria-label="Qayta ochish"
                      className="flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 border-green-500 bg-green-500 disabled:cursor-not-allowed">
                      <Check className="h-2.5 w-2.5 text-white" />
                    </button>
                    <p className="truncate text-[12.5px] text-neutral-400 line-through">{r.text}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
