"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { TopHeader } from "@/components/layout/top-header";
import {
  ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock, FileCheck,
  Save, Users, CalendarDays, Eraser, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGroups } from "@/lib/hooks/useGroups";
import { useStudents } from "@/lib/hooks/useStudents";
import { WEEKDAY_SHORT, ATTENDANCE_GRACE_MINUTES } from "@/lib/form-constants";

const UZ_MONTHS = ["Yanvar","Fevral","Mart","Aprel","May","Iyun","Iyul","Avgust","Sentabr","Oktabr","Noyabr","Dekabr"];
const UZ_DAYS   = ["Yakshanba","Dushanba","Seshanba","Chorshanba","Payshanba","Juma","Shanba"];
// getDay() (0=Yak..6=Sha) → guruh scheduleDays value
const DOW_TO_VALUE = ["YAKSHANBA","DUSHANBA","SESHANBA","CHORSHANBA","PAYSHANBA","JUMA","SHANBA"];

type Status = "KELDI" | "KELMADI" | "KECH_KELDI" | "SABABLI";

const STATUS_CFG: Record<Status, { label: string; short: string; cls: string; activeCls: string; icon: any }> = {
  KELDI:      { label: "Keldi",      short: "Keldi",   cls: "text-green-600 dark:text-green-400",  activeCls: "bg-green-500 text-white border-green-500",   icon: CheckCircle2 },
  KELMADI:    { label: "Kelmadi",    short: "Kelmadi", cls: "text-red-600 dark:text-red-400",      activeCls: "bg-red-500 text-white border-red-500",       icon: XCircle },
  KECH_KELDI: { label: "Kech keldi", short: "Kech",    cls: "text-amber-600 dark:text-amber-400",  activeCls: "bg-amber-500 text-white border-amber-500",   icon: Clock },
  SABABLI:    { label: "Sababli",    short: "Sababli", cls: "text-blue-600 dark:text-blue-400",    activeCls: "bg-blue-500 text-white border-blue-500",     icon: FileCheck },
};
const ALL_STATUSES: Status[] = ["KELDI", "KELMADI", "KECH_KELDI", "SABABLI"];

/** O'quvchining guruhdagi a'zoligi — davomat ro'yxati shu bo'yicha tuziladi. */
type Membership = {
  id: string;
  groupId: string;
  enrollmentStatus?: string;
  leftAt?: string | null;
};

function addDays(date: Date, n: number) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }
function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded-xl", className)} />;
}

export default function AttendancePage() {
  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);

  const [currentDate,   setCurrentDate]   = useState(new Date(today));
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [localStatus,   setLocalStatus]   = useState<Record<string, Status>>({});
  const [localNote,     setLocalNote]     = useState<Record<string, string>>({});
  const [saving,        setSaving]        = useState(false);
  const [dirty,         setDirty]         = useState(false);
  const [savedFlash,    setSavedFlash]    = useState(false);
  const [saveErr,       setSaveErr]       = useState("");

  const { data: groupsRaw, isLoading: groupsLoading } = useGroups({ status: "ACTIVE" });
  const groups: any[] = Array.isArray(groupsRaw) ? groupsRaw : [];

  // Tanlangan guruh ro'yxatdan chiqib ketishi mumkin (holati o'zgardi, filial
  // almashtirildi). Ilgari `selectedGroup` eski id bilan qolib ketardi:
  // yuqorida "Faol guruh yo'q" yozilib turgani holda pastda o'sha guruh
  // o'quvchilari ro'yxati chizilaverardi.
  useEffect(() => {
    if (groupsLoading) return;
    if (groups.length === 0) { if (selectedGroup) setSelectedGroup(""); return; }
    if (!selectedGroup || !groups.some(g => g.id === selectedGroup)) {
      setSelectedGroup(groups[0].id);
    }
  }, [groups, groupsLoading, selectedGroup]);

  const dateStr = toDateStr(currentDate);
  const isToday = currentDate.getTime() === today.getTime();
  const group = groups.find(g => g.id === selectedGroup);

  const { data: studentsRaw, isLoading: studentsLoading } = useStudents(
    selectedGroup ? { groupId: selectedGroup } : undefined
  );
  const allStudents: any[] = Array.isArray(studentsRaw) ? studentsRaw : [];

  // Ro'yxat SHU GURUHDAGI a'zolik bo'yicha tuziladi, `Student.isActive`
  // bo'yicha emas: u global bayroq — boshqa guruhda o'qiyotgan, bu guruhdan
  // esa chiqib ketgan o'quvchi ham "faol" bo'lib ro'yxatda qolib ketardi.
  const membership = (s: { groups?: Membership[] }): Membership | undefined =>
    s.groups?.find(g => g.groupId === selectedGroup);
  const enrolled = allStudents.filter(s => {
    const sg = membership(s);
    return !!sg && sg.enrollmentStatus !== "CHIQIB_KETGAN" && !sg.leftAt;
  });
  const students     = enrolled.filter(s => membership(s)?.enrollmentStatus !== "SINOV");
  const sinovStudents = enrolled.filter(s => membership(s)?.enrollmentStatus === "SINOV");

  // Load existing attendance for date+group
  useEffect(() => {
    if (!selectedGroup) return;
    setDirty(false);
    fetch(`/api/attendance?groupId=${selectedGroup}&date=${dateStr}`)
      .then(r => r.json())
      .then((records: any[]) => {
        if (!Array.isArray(records)) return;
        const statusMap: Record<string, Status> = {};
        const noteMap: Record<string, string> = {};
        records.forEach(r => {
          if (ALL_STATUSES.includes(r.status as Status)) statusMap[r.studentId] = r.status as Status;
          if (r.note) noteMap[r.studentId] = r.note;
        });
        setLocalStatus(statusMap);
        setLocalNote(noteMap);
      })
      .catch(() => {});
  }, [selectedGroup, dateStr]);

  const stats = useMemo(() => {
    const counts = { KELDI: 0, KELMADI: 0, KECH_KELDI: 0, SABABLI: 0, marked: 0 };
    students.forEach(s => {
      const st = localStatus[s.id];
      if (st) { counts[st]++; counts.marked++; }
    });
    return { ...counts, total: students.length, unmarked: students.length - counts.marked };
  }, [students, localStatus]);

  const attendanceRate = stats.marked > 0
    ? Math.round(((stats.KELDI + stats.KECH_KELDI) / stats.marked) * 100)
    : 0;

  const isLessonDay = group?.scheduleDays?.includes(DOW_TO_VALUE[currentDate.getDay()]);
  // Bugungi kun uchun — dars boshlanish vaqtidan oldin davomat erta. O'tgan
  // kunlar uchun cheklov yo'q (kun allaqachon to'liq o'tgan).
  const lessonStarted = !isToday || !group || (() => {
    const [h, m] = group.startTime.split(":").map(Number);
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes() >= h * 60 + m - ATTENDANCE_GRACE_MINUTES;
  })();
  // Guruh ochilgan sanadan oldingi (yoki tugagandan keyingi) kunni backend
  // baribir rad etadi — buni interfeysda ham ko'rsatamiz, aks holda belgilash
  // ochiq turadi va faqat "Saqlash" bosilganda xato chiqadi.
  const groupStartStr = group?.startDate ? String(group.startDate).slice(0, 10) : null;
  const groupEndStr   = group?.endDate   ? String(group.endDate).slice(0, 10)   : null;
  const beforeGroupStart = !!groupStartStr && dateStr < groupStartStr;
  const afterGroupEnd    = !!groupEndStr   && dateStr > groupEndStr;
  const canMark = !!isLessonDay && lessonStarted && !beforeGroupStart && !afterGroupEnd;

  function setStatus(studentId: string, status: Status) {
    if (!canMark) return;
    setLocalStatus(prev => ({ ...prev, [studentId]: status }));
    setDirty(true);
  }
  function markAll(status: Status) {
    if (!canMark) return;
    const map: Record<string, Status> = {};
    students.forEach(s => { map[s.id] = status; });
    setLocalStatus(prev => ({ ...prev, ...map }));
    setDirty(true);
  }
  function clearAll() {
    setLocalStatus({}); setLocalNote({}); setDirty(true);
  }

  async function saveAttendance() {
    if (!selectedGroup || students.length === 0 || !canMark) return;
    setSaving(true);
    setSaveErr("");
    try {
      const records = students
        .filter(s => localStatus[s.id]) // faqat belgilanganlar
        .map(s => {
          const sg = s.groups?.find((g: any) => g.groupId === selectedGroup);
          return {
            studentGroupId: sg?.id ?? "",
            studentId:      s.id,
            status:         localStatus[s.id],
            note:           localNote[s.id] || undefined,
          };
        })
        .filter(r => r.studentGroupId);

      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: selectedGroup, date: dateStr, records }),
      });
      // Javob tekshirilmasa, server rad etgan (dars boshlanmagan, ruxsat yo'q,
      // obuna tugagan) holatda ham ekranda "Saqlandi" chiqib, butun jadval
      // jimgina yo'qolardi.
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveErr(data?.error ?? "Saqlanmadi — qayta urinib ko'ring");
        return;
      }
      setDirty(false);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } catch {
      setSaveErr("Serverga ulanib bo'lmadi");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <TopHeader
        title="Davomat"
        subtitle={`${currentDate.getDate()} ${UZ_MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}, ${UZ_DAYS[currentDate.getDay()]}`}
      />

      <div className="p-5 space-y-5 pb-24">

        {/* Date nav */}
        <div className="flex items-center gap-1.5">
          <button onClick={() => setCurrentDate(d => addDays(d, -1))}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-white/60 dark:border-white/10 hover:bg-white/60 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-400 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="px-4 py-1.5 rounded-xl border border-white/60 dark:border-white/10 glass-panel text-center min-w-[150px]">
            <p className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">
              {currentDate.getDate()} {UZ_MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </p>
            <p className="text-[11px] text-neutral-400">{UZ_DAYS[currentDate.getDay()]}</p>
          </div>
          <button onClick={() => setCurrentDate(d => addDays(d, 1))}
            disabled={currentDate.getTime() >= today.getTime()}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-white/60 dark:border-white/10 hover:bg-white/60 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronRight className="w-4 h-4" />
          </button>
          {!isToday && (
            <button onClick={() => setCurrentDate(new Date(today))}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-white/60 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:bg-white/60 dark:hover:bg-white/10 transition-colors">
              Bugun
            </button>
          )}
          {group && (
            <span className={cn("ml-2 text-[11px] px-2.5 py-1 rounded-lg font-semibold",
              isLessonDay
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400")}>
              {isLessonDay ? "Dars kuni" : "Dars kuni emas"}
            </span>
          )}
        </div>

        {/* Group selector */}
        <div>
          <p className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">Guruhni tanlang</p>
          <div className="flex gap-1.5 flex-wrap">
            {groupsLoading
              ? Array.from({length:3}).map((_,i) => <Skeleton key={i} className="h-9 w-28" />)
              : groups.map(g => (
                  <button key={g.id} onClick={() => setSelectedGroup(g.id)}
                    className={cn("px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all text-left",
                      selectedGroup === g.id
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "glass-panel text-neutral-600 dark:text-neutral-400 border-white/60 dark:border-white/10 hover:border-neutral-400")}>
                    <span className="block">{g.name}</span>
                    <span className={cn("block text-[10px] font-normal", selectedGroup === g.id ? "text-white/70" : "text-neutral-400")}>
                      {g.startTime}-{g.endTime}
                    </span>
                  </button>
                ))
            }
            {!groupsLoading && groups.length === 0 && (
              <p className="text-sm text-neutral-400">
                Faol guruh yo'q — davomat faqat boshlangan guruhlarda belgilanadi.{" "}
                <Link href="/groups" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                  Guruhlar
                </Link>
              </p>
            )}
          </div>
        </div>

        {/* Selected group info */}
        {group && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 glass-panel border border-white/60 dark:border-white/10 rounded-2xl px-4 py-3 text-[12px]">
            <span className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300"><Users className="w-3.5 h-3.5 text-neutral-400" />{group.teacher?.user?.name ?? "—"}</span>
            <span className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300"><CalendarDays className="w-3.5 h-3.5 text-neutral-400" />{(group.scheduleDays ?? []).map((d: string) => WEEKDAY_SHORT[d] ?? d).join(", ") || "—"}</span>
            <span className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300"><Clock className="w-3.5 h-3.5 text-neutral-400" />{group.startTime}–{group.endTime}</span>
            <span className="ml-auto text-neutral-500">{group.course?.name}</span>
          </div>
        )}

        {/* Guruh hali ochilmagan / allaqachon tugagan — ogohlantirish */}
        {group && (beforeGroupStart || afterGroupEnd) && (
          <div className="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl px-4 py-3">
            <CalendarDays className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[13px] text-amber-700 dark:text-amber-400">
              {beforeGroupStart
                ? <>Guruh <strong>{groupStartStr}</strong> dan boshlangan — undan oldingi kunga davomat qo'yib bo'lmaydi.</>
                : <>Guruh <strong>{groupEndStr}</strong> da tugagan — undan keyingi kunga davomat qo'yib bo'lmaydi.</>}
            </p>
          </div>
        )}

        {/* Dars kuni emas — ogohlantirish */}
        {group && !isLessonDay && !beforeGroupStart && !afterGroupEnd && (
          <div className="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl px-4 py-3">
            <CalendarDays className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[13px] text-amber-700 dark:text-amber-400">
              <strong>{UZ_DAYS[currentDate.getDay()]}</strong> — bu guruh jadvalida dars kuni emas.
              Davomat faqat dars kunlarida belgilanadi
              (<strong>{(group.scheduleDays ?? []).map((d: string) => WEEKDAY_SHORT[d] ?? d).join(", ") || "—"}</strong>).
            </p>
          </div>
        )}

        {/* Dars kuni, lekin hali boshlanmagan — ogohlantirish */}
        {group && isLessonDay && !lessonStarted && !beforeGroupStart && !afterGroupEnd && (
          <div className="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl px-4 py-3">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[13px] text-amber-700 dark:text-amber-400">
              Dars hali boshlanmadi — davomat soat <strong>{group.startTime}</strong> dan keyin belgilanadi.
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {(ALL_STATUSES.map(k => [k, STATUS_CFG[k]] as const)).map(([key, cfg]) => {
            const Icon = cfg.icon;
            return (
              <div key={key} className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-4">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-2 glass-soft", cfg.cls)}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                {studentsLoading ? <Skeleton className="h-6 w-8 mb-1" />
                  : <p className="text-[22px] font-black text-neutral-900 dark:text-neutral-100 leading-none">{stats[key]}</p>}
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">{cfg.label}</p>
              </div>
            );
          })}
          <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2 glass-soft text-neutral-400">
              <Users className="w-4.5 h-4.5" />
            </div>
            {studentsLoading ? <Skeleton className="h-6 w-8 mb-1" />
              : <p className="text-[22px] font-black text-neutral-400 leading-none">{stats.unmarked}</p>}
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">Belgilanmagan</p>
          </div>
        </div>

        {/* Rate bar */}
        {stats.marked > 0 && (
          <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[13px] font-semibold text-neutral-700 dark:text-neutral-300">Davomat darajasi <span className="text-neutral-400 font-normal">({stats.marked}/{stats.total} belgilandi)</span></p>
              <span className={cn("text-[13px] font-black",
                attendanceRate >= 90 ? "text-green-600 dark:text-green-400"
                : attendanceRate >= 70 ? "text-amber-600 dark:text-amber-400"
                : "text-red-600 dark:text-red-400")}>
                {attendanceRate}%
              </span>
            </div>
            <div className="h-2 glass-soft rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full transition-all",
                attendanceRate >= 90 ? "bg-green-500" : attendanceRate >= 70 ? "bg-amber-500" : "bg-red-500")}
                style={{ width: `${attendanceRate}%` }} />
            </div>
          </div>
        )}

        {/* Quick actions */}
        {students.length > 0 && canMark && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mr-1">Tez belgilash:</span>
            <button onClick={() => markAll("KELDI")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold border border-green-200 dark:border-green-900/50 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors">
              <Check className="w-3.5 h-3.5" /> Barchasi keldi
            </button>
            <button onClick={() => markAll("KELMADI")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
              <XCircle className="w-3.5 h-3.5" /> Barchasi kelmadi
            </button>
            <button onClick={clearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold border border-white/60 dark:border-white/10 text-neutral-500 dark:text-neutral-400 hover:bg-white/60 dark:hover:bg-white/10 transition-colors">
              <Eraser className="w-3.5 h-3.5" /> Tozalash
            </button>
          </div>
        )}

        {/* Student list */}
        <div className="space-y-2">
          {studentsLoading
            ? Array.from({length:5}).map((_,i) => <Skeleton key={i} className="h-16 rounded-2xl" />)
            : students.map((s: any, idx: number) => {
                const status = localStatus[s.id];
                return (
                  <div key={s.id}
                    className={cn("glass-panel border rounded-2xl p-3 transition-colors",
                      status ? "border-white/60 dark:border-white/10" : "border-dashed border-neutral-300 dark:border-neutral-700")}>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-[11px] text-neutral-400 dark:text-neutral-600 font-mono w-5 text-center shrink-0">{idx + 1}</span>
                      <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-white text-[13px] font-bold shrink-0">
                        {s.name[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 truncate">{s.name}</p>
                        {s.phone && <p className="text-[11px] text-neutral-400">{s.phone}</p>}
                      </div>
                      {/* Status buttons */}
                      <div className="flex gap-1.5 shrink-0">
                        {ALL_STATUSES.map(st => {
                          const cfg = STATUS_CFG[st];
                          const active = status === st;
                          return (
                            <button key={st} onClick={() => setStatus(s.id, st)}
                              disabled={!canMark}
                              className={cn("px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all",
                                !canMark && "opacity-40 cursor-not-allowed",
                                active
                                  ? cfg.activeCls
                                  : cn("glass-panel border-white/60 dark:border-white/10 hover:border-current", cfg.cls))}>
                              {cfg.short}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {(status === "SABABLI" || status === "KELMADI") && (
                      <input
                        value={localNote[s.id] ?? ""}
                        onChange={e => { setLocalNote(prev => ({ ...prev, [s.id]: e.target.value })); setDirty(true); }}
                        placeholder="Sabab / izoh..."
                        className="mt-2 w-full h-8 px-2.5 text-[12px] rounded-lg border border-white/60 dark:border-white/10 glass-soft text-neutral-700 dark:text-neutral-300 outline-none focus:border-indigo-400 transition-colors"
                      />
                    )}
                  </div>
                );
              })
          }
          {!studentsLoading && students.length === 0 && (
            <div className="py-12 text-center text-sm text-neutral-400 glass-panel border border-white/60 dark:border-white/10 rounded-2xl">
              {selectedGroup ? "Bu guruhda faol o'quvchi yo'q" : "Guruhni tanlang"}
            </div>
          )}
        </div>

        {/* Sinov students */}
        {!studentsLoading && sinovStudents.length > 0 && (
          <div className="glass-panel border border-amber-200 dark:border-amber-900/40 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-900/40 flex items-center justify-between">
              <p className="text-[13px] font-bold text-amber-700 dark:text-amber-400">Sinov darsidagi o'quvchilar</p>
              <span className="text-[11px] bg-amber-200 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-semibold">
                {sinovStudents.length} ta
              </span>
            </div>
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {sinovStudents.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-400 rounded-xl flex items-center justify-center text-white text-[12px] font-bold shrink-0">{s.name[0]}</div>
                    <div>
                      <p className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">{s.name}</p>
                      <p className="text-[11px] text-neutral-400">{s.phone}</p>
                    </div>
                  </div>
                  <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Sinov darsi</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky save bar */}
      {students.length > 0 && canMark && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-neutral-900/95 backdrop-blur border-t border-white/60 dark:border-white/10 px-5 py-3 flex items-center gap-3">
          <div className="text-[12px] text-neutral-500 dark:text-neutral-400">
            {stats.unmarked > 0
              ? <><strong className="text-neutral-700 dark:text-neutral-200">{stats.unmarked}</strong> ta belgilanmagan</>
              : <span className="text-green-600 dark:text-green-400 font-semibold">Barchasi belgilandi ✓</span>}
          </div>
          {savedFlash && !saveErr && (
            <span className="flex items-center gap-1 text-[12px] font-semibold text-green-600 dark:text-green-400">
              <Check className="w-4 h-4" /> Saqlandi
            </span>
          )}
          {saveErr && (
            <span className="text-[12px] font-semibold text-red-600 dark:text-red-400">
              {saveErr}
            </span>
          )}
          <button onClick={saveAttendance} disabled={saving || !dirty}
            className={cn("ml-auto flex items-center gap-2 px-6 h-10 rounded-xl text-[13px] font-semibold transition-colors",
              dirty && !saving
                ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                : "bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed")}>
            <Save className="w-4 h-4" />
            {saving ? "Saqlanmoqda..." : dirty ? "Saqlash" : "Saqlangan"}
          </button>
        </div>
      )}
    </div>
  );
}
