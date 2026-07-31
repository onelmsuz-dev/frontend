"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock, FileCheck,
  Save, Check, CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "KELDI" | "KELMADI" | "KECH_KELDI" | "SABABLI";

const STATUS_CFG: Record<Status, { short: string; cls: string; activeCls: string; icon: any }> = {
  KELDI:      { short: "Keldi",   cls: "text-green-600 dark:text-green-400", activeCls: "bg-green-500 text-white border-green-500", icon: CheckCircle2 },
  KELMADI:    { short: "Kelmadi", cls: "text-red-600 dark:text-red-400",     activeCls: "bg-red-500 text-white border-red-500",     icon: XCircle },
  KECH_KELDI: { short: "Kech",    cls: "text-amber-600 dark:text-amber-400", activeCls: "bg-amber-500 text-white border-amber-500", icon: Clock },
  SABABLI:    { short: "Sababli", cls: "text-blue-600 dark:text-blue-400",   activeCls: "bg-blue-500 text-white border-blue-500",   icon: FileCheck },
};
const ALL_STATUSES: Status[] = ["KELDI", "KELMADI", "KECH_KELDI", "SABABLI"];
const UZ_DAYS = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
const DOW_TO_VALUE = ["YAKSHANBA", "DUSHANBA", "SESHANBA", "CHORSHANBA", "PAYSHANBA", "JUMA", "SHANBA"];

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function addDays(d: Date, n: number) { const c = new Date(d); c.setDate(c.getDate() + n); return c; }

interface Props {
  groupId: string;
  scheduleDays: string[];
  startTime: string;
  /** FAOL StudentGroup yozuvlari (group.students dan) — sg.id, sg.studentId, sg.student.name/phone. */
  studentGroups: any[];
}

/**
 * Guruh info sahifasiga ko'chirilgan/joylashtirilgan davomat — alohida
 * /attendance sahifasidagi bilan bir xil qoidalar (dars kuni, boshlanish
 * vaqti) va API'ni ishlatadi, faqat shu guruh uchun ixcham ko'rinishda.
 */
export function GroupAttendanceSection({ groupId, scheduleDays, startTime, studentGroups }: Props) {
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const [currentDate, setCurrentDate] = useState(new Date(today));
  const [localStatus, setLocalStatus] = useState<Record<string, Status>>({});
  const [dirty,        setDirty]      = useState(false);
  const [saving,       setSaving]     = useState(false);
  const [savedFlash,   setSavedFlash] = useState(false);
  const [loadErr,      setLoadErr]    = useState("");

  const dateStr  = toDateStr(currentDate);
  const isToday  = currentDate.getTime() === today.getTime();
  const students = studentGroups.filter(sg => sg.enrollmentStatus === "FAOL");

  const isLessonDay = scheduleDays?.includes(DOW_TO_VALUE[currentDate.getDay()]);
  const lessonStarted = !isToday || (() => {
    const [h, m] = (startTime ?? "00:00").split(":").map(Number);
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes() >= h * 60 + m;
  })();
  const canMark = !!isLessonDay && lessonStarted;

  useEffect(() => {
    setDirty(false); setLoadErr("");
    fetch(`/api/attendance?groupId=${groupId}&date=${dateStr}`)
      .then(r => r.json())
      .then((records: any[]) => {
        if (!Array.isArray(records)) return;
        const map: Record<string, Status> = {};
        records.forEach(r => { if (ALL_STATUSES.includes(r.status)) map[r.studentId] = r.status; });
        setLocalStatus(map);
      })
      .catch(() => {});
  }, [groupId, dateStr]);

  function setStatus(studentId: string, status: Status) {
    if (!canMark) return;
    setLocalStatus(prev => ({ ...prev, [studentId]: status }));
    setDirty(true);
  }

  async function save() {
    if (!canMark || students.length === 0) return;
    setSaving(true); setLoadErr("");
    try {
      const records = students
        .filter(sg => localStatus[sg.studentId])
        .map(sg => ({ studentGroupId: sg.id, studentId: sg.studentId, status: localStatus[sg.studentId] }));
      const res = await fetch("/api/attendance", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId, date: dateStr, records }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setLoadErr(data.error ?? "Xatolik"); return; }
      setDirty(false); setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } catch { setLoadErr("Serverga ulanib bo'lmadi"); }
    finally { setSaving(false); }
  }

  const marked = students.filter(sg => localStatus[sg.studentId]).length;

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
      <div className="px-5 py-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-neutral-400" />
          <h3 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">Davomat</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setCurrentDate(d => addDays(d, -1))}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[12px] font-semibold text-neutral-700 dark:text-neutral-300 min-w-[92px] text-center">
            {currentDate.getDate()}.{currentDate.getMonth() + 1} · {UZ_DAYS[currentDate.getDay()].slice(0, 3)}
          </span>
          <button onClick={() => setCurrentDate(d => addDays(d, 1))} disabled={currentDate.getTime() >= today.getTime()}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          {!isToday && (
            <button onClick={() => setCurrentDate(new Date(today))}
              className="text-[11px] font-semibold px-2 h-7 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
              Bugun
            </button>
          )}
        </div>
      </div>

      {!isLessonDay ? (
        <p className="text-[12px] text-amber-600 dark:text-amber-400 px-5 py-4 text-center bg-amber-50/50 dark:bg-amber-900/10">
          {UZ_DAYS[currentDate.getDay()]} — bu guruh jadvalida dars kuni emas.
        </p>
      ) : !lessonStarted ? (
        <p className="text-[12px] text-amber-600 dark:text-amber-400 px-5 py-4 text-center bg-amber-50/50 dark:bg-amber-900/10">
          Dars hali boshlanmadi — davomat soat {startTime} dan keyin belgilanadi.
        </p>
      ) : students.length === 0 ? (
        <p className="text-[12px] text-neutral-400 px-5 py-6 text-center">Faol o'quvchi yo'q</p>
      ) : (
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {students.map((sg: any) => {
            const s = sg.student;
            const status = localStatus[sg.studentId];
            return (
              <div key={sg.id} className="flex items-center justify-between gap-3 px-5 py-2.5 flex-wrap">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                    {s?.name?.[0]}
                  </div>
                  <span className="text-[13px] font-medium text-neutral-800 dark:text-neutral-200 truncate">{s?.name}</span>
                </div>
                <div className="flex gap-1 shrink-0">
                  {ALL_STATUSES.map(st => {
                    const cfg = STATUS_CFG[st];
                    const active = status === st;
                    return (
                      <button key={st} onClick={() => setStatus(sg.studentId, st)}
                        className={cn("px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all",
                          active ? cfg.activeCls : cn("bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 hover:border-current", cfg.cls))}>
                        {cfg.short}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {canMark && students.length > 0 && (
        <div className="px-5 py-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
          <span className="text-[11px] text-neutral-400">{marked}/{students.length} belgilandi</span>
          {savedFlash && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-green-600 dark:text-green-400">
              <Check className="w-3.5 h-3.5" /> Saqlandi
            </span>
          )}
          {loadErr && <span className="text-[11px] text-red-500">{loadErr}</span>}
          <button onClick={save} disabled={saving || !dirty}
            className={cn("ml-auto flex items-center gap-1.5 px-4 h-8 rounded-xl text-[12px] font-semibold transition-colors",
              dirty && !saving ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed")}>
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </div>
      )}
    </div>
  );
}
