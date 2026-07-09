"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { TopHeader } from "@/components/layout/top-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { FormField } from "@/components/ui/form-field";
import { cn } from "@/lib/utils";
import { useGroups } from "@/lib/hooks/useGroups";
import { useCourses } from "@/lib/hooks/useCourses";
import { useTeachers } from "@/lib/hooks/useTeachers";
import { mutate } from "swr";
import {
  ChevronLeft, ChevronRight, CalendarDays, LayoutGrid, List, ChevronDown, Plus,
} from "lucide-react";

// ─── Constants ───────────────────────────────────────────────────────────────

const UZ_DAYS   = ["Dushanba","Seshanba","Chorshanba","Payshanba","Juma","Shanba"];
const UZ_DAYS_S = ["Du","Se","Cho","Pay","Ju","Sha","Yak"];
const UZ_MONTHS = ["Yanvar","Fevral","Mart","Aprel","May","Iyun","Iyul","Avgust","Sentabr","Oktabr","Noyabr","Dekabr"];
const UZ_MONTHS_S = ["Yan","Fev","Mar","Apr","May","Iyn","Iyl","Avg","Sen","Okt","Noy","Dek"];
const JS_TO_IDX: Record<number, number> = { 1:0, 2:1, 3:2, 4:3, 5:4, 6:5 };

const DAY_START = 8;
const DAY_END   = 20;
const HOUR_H    = 64;
const TOTAL_H   = (DAY_END - DAY_START) * HOUR_H;
const HOURS     = Array.from({ length: DAY_END - DAY_START + 1 }, (_, i) => i + DAY_START);
const TIME_W    = 52;

const DAY_MAP: Record<string, string> = {
  DUSHANBA: "Dushanba", SESHANBA: "Seshanba", CHORSHANBA: "Chorshanba",
  PAYSHANBA: "Payshanba", JUMA: "Juma", SHANBA: "Shanba", YAKSHANBA: "Yakshanba",
};
const DAYS_OPTS = [
  { v: "DUSHANBA",   l: "Dushanba"   }, { v: "SESHANBA",  l: "Seshanba"  },
  { v: "CHORSHANBA", l: "Chorshanba" }, { v: "PAYSHANBA", l: "Payshanba" },
  { v: "JUMA",       l: "Juma"       }, { v: "SHANBA",    l: "Shanba"    },
  { v: "YAKSHANBA",  l: "Yakshanba"  },
];
const DAYS_SHORT: Record<string,string> = {
  DUSHANBA:"Du", SESHANBA:"Se", CHORSHANBA:"Ch", PAYSHANBA:"Pa", JUMA:"Ju", SHANBA:"Sh", YAKSHANBA:"Yak",
};
const GROUP_COLORS = [
  "bg-blue-100 border-blue-400 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  "bg-green-100 border-green-400 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  "bg-purple-100 border-purple-400 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  "bg-orange-100 border-orange-400 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  "bg-pink-100 border-pink-400 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300",
  "bg-yellow-100 border-yellow-400 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
];

const EMPTY_FORM = {
  name: "", courseId: "", teacherId: "", maxStudents: "15",
  scheduleDays: [] as string[], startTime: "09:00", endTime: "11:00",
  startDate: new Date().toISOString().slice(0, 10), status: "ACTIVE",
};

type ViewMode = "kun" | "hafta" | "oy";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toMin(t: string) { const [h,m]=t.split(":").map(Number); return h*60+(m||0); }
function blockTop(t: string)              { return ((toMin(t)-DAY_START*60)/60)*HOUR_H; }
function blockH(s: string, e: string)     { return ((toMin(e)-toMin(s))/60)*HOUR_H; }

function getMondayOf(date: Date): Date {
  const d=new Date(date), day=d.getDay();
  d.setDate(d.getDate()+(day===0?-6:1-day)); d.setHours(0,0,0,0); return d;
}
function addDays(date: Date, n: number): Date {
  const d=new Date(date); d.setDate(d.getDate()+n); return d;
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
}
function getUzIdx(date: Date): number|null {
  const v=JS_TO_IDX[date.getDay()]; return v!==undefined?v:null;
}

// ─── Mini calendar popover ───────────────────────────────────────────────────

interface MiniCalProps {
  pickerMonth: Date;
  onChangeMonth: (d: Date) => void;
  today: Date;
  selDay: Date;
  weekStart: Date;
  view: ViewMode;
  onPick: (d: Date) => void;
  onToday: () => void;
}

function MiniCal({ pickerMonth, onChangeMonth, today, selDay, weekStart, view, onPick, onToday }: MiniCalProps) {
  const cells = useMemo(() => {
    const first = new Date(pickerMonth.getFullYear(), pickerMonth.getMonth(), 1);
    return Array.from({ length: 42 }, (_, i) => addDays(getMondayOf(first), i));
  }, [pickerMonth]);

  const weekEnd = addDays(weekStart, 5);

  return (
    <div className="w-[272px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-2xl p-4 select-none">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => onChangeMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth()-1, 1))}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-[13px] font-bold text-neutral-800 dark:text-neutral-100">
          {UZ_MONTHS[pickerMonth.getMonth()]} {pickerMonth.getFullYear()}
        </span>
        <button onClick={() => onChangeMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth()+1, 1))}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {UZ_DAYS_S.map(d => (
          <div key={d} className="text-center py-0.5">
            <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-600">{d}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.slice(0, 42).map((d, i) => {
          const inMonth   = d.getMonth() === pickerMonth.getMonth();
          const isToday   = sameDay(d, today);
          const isSel     = sameDay(d, selDay);
          const inWeek    = view === "hafta" && d.getTime() >= weekStart.getTime() && d.getTime() <= weekEnd.getTime();
          const inSelMon  = view === "oy" && d.getMonth() === selDay.getMonth() && d.getFullYear() === selDay.getFullYear();
          if (i >= 35 && !inMonth) return <div key={i} />;
          return (
            <button key={i} onClick={() => onPick(d)}
              className={cn(
                "h-8 flex items-center justify-center rounded-lg text-[12px] font-semibold transition-all",
                !inMonth && "opacity-30",
                isToday && "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900",
                isSel && !isToday && "bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 ring-2 ring-neutral-400 dark:ring-neutral-500",
                inWeek && !isSel && !isToday && "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-none",
                inSelMon && !isSel && !isToday && "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300",
                !isToday && !isSel && !inWeek && !inSelMon && "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
              )}>
              {d.getDate()}
            </button>
          );
        })}
      </div>
      <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
        <button onClick={onToday}
          className="w-full py-1.5 text-[12px] font-semibold rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
          Bugungi sana
        </button>
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function SchedulePage() {
  const today = useMemo(() => { const d=new Date(); d.setHours(0,0,0,0); return d; }, []);
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "SUPER_ADMIN";

  const [view,        setView]        = useState<ViewMode>("hafta");
  const [selDay,      setSelDay]      = useState(new Date(today));
  const [weekStart,   setWeekStart]   = useState(getMondayOf(today));
  const [monthDate,   setMonthDate]   = useState(new Date(today));
  const [pickerOpen,  setPickerOpen]  = useState(false);
  const [pickerMonth, setPickerMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  // Group modal
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupForm,      setGroupForm]      = useState(EMPTY_FORM);
  const [groupSaving,    setGroupSaving]    = useState(false);
  const [groupError,     setGroupError]     = useState("");

  // Quick-add teacher inline
  const [showQTeacher,   setShowQTeacher]   = useState(false);
  const [qTeacherForm,   setQTeacherForm]   = useState({ name: "", phone: "", password: "", subjects: "" });
  const [qTeacherSaving, setQTeacherSaving] = useState(false);
  const [qTeacherErr,    setQTeacherErr]    = useState("");

  // Quick-add course inline
  const [showQCourse,   setShowQCourse]   = useState(false);
  const [qCourseForm,   setQCourseForm]   = useState({ name: "", duration: "3 oy" });
  const [qCourseSaving, setQCourseSaving] = useState(false);
  const [qCourseErr,    setQCourseErr]    = useState("");

  // Quick "Dars qo'shish" modal (minimal: teacher + days + time)
  const [showDarsModal, setShowDarsModal] = useState(false);
  const [darsForm,      setDarsForm]      = useState({ teacherId: "", courseId: "", scheduleDays: [] as string[], startTime: "09:00", endTime: "10:30" });
  const [darsSaving,    setDarsSaving]    = useState(false);
  const [darsError,     setDarsError]     = useState("");

  const { data: groupsRaw, isLoading } = useGroups({ status: "ACTIVE" });
  const { data: coursesRaw }           = useCourses();
  const { data: teachersRaw }          = useTeachers();

  const groups:   any[] = Array.isArray(groupsRaw)  ? groupsRaw  : [];
  const courses:  any[] = Array.isArray(coursesRaw) ? coursesRaw : [];
  const teachers: any[] = Array.isArray(teachersRaw)? teachersRaw: [];

  // Convert groups to flat schedule entries
  const schedule = useMemo(() => {
    const entries: Array<{
      id: string; groupName: string; teacherName: string; courseName: string;
      day: string; time: string; endTime: string; room: string; color: string;
    }> = [];
    groups.forEach((g, gi) => {
      const color = g.color || GROUP_COLORS[gi % GROUP_COLORS.length];
      (g.scheduleDays ?? []).forEach((d: string) => {
        const dayName = DAY_MAP[d] ?? d;
        entries.push({
          id: `${g.id}-${d}`,
          groupName:   g.name,
          teacherName: g.teacher?.user?.name ?? "—",
          courseName:  g.course?.name ?? "—",
          day:         dayName,
          time:        g.startTime,
          endTime:     g.endTime,
          room:        g.room?.name ?? "—",
          color,
        });
      });
    });
    return entries;
  }, [groups]);

  function toggleGroupDay(d: string) {
    setGroupForm(p => ({
      ...p,
      scheduleDays: p.scheduleDays.includes(d) ? p.scheduleDays.filter(x=>x!==d) : [...p.scheduleDays, d],
    }));
  }
  function toggleDarsDay(d: string) {
    setDarsForm(p => ({
      ...p,
      scheduleDays: p.scheduleDays.includes(d) ? p.scheduleDays.filter(x=>x!==d) : [...p.scheduleDays, d],
    }));
  }

  function openGroupModal() {
    setGroupForm(EMPTY_FORM); setGroupError(""); setShowGroupModal(true);
  }
  function openDarsModal() {
    setDarsForm({ teacherId: "", courseId: "", scheduleDays: [], startTime: "09:00", endTime: "10:30" });
    setDarsError(""); setShowDarsModal(true);
  }

  async function submitGroup() {
    if (!groupForm.name.trim()) { setGroupError("Guruh nomi majburiy"); return; }
    if (!groupForm.scheduleDays.length || !groupForm.startTime || !groupForm.endTime) { setGroupError("Dars kunlari, boshlanish va tugash vaqti majburiy"); return; }
    setGroupSaving(true); setGroupError("");
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: groupForm.name, courseId: groupForm.courseId, teacherId: groupForm.teacherId,
          maxStudents: parseInt(groupForm.maxStudents) || 15,
          scheduleDays: groupForm.scheduleDays, startTime: groupForm.startTime, endTime: groupForm.endTime,
          startDate: groupForm.startDate, status: groupForm.status,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setGroupError(data.error ?? "Xatolik"); return; }
      mutate((k: string) => typeof k === "string" && k.startsWith("/api/groups"), undefined, { revalidate: true });
      setShowGroupModal(false);
    } catch { setGroupError("Serverga ulanib bo'lmadi"); }
    finally { setGroupSaving(false); }
  }

  async function submitDars() {
    if (!darsForm.courseId || !darsForm.teacherId) { setDarsError("Kurs va o'qituvchini tanlang"); return; }
    if (darsForm.scheduleDays.length === 0) { setDarsError("Kamida 1 ta kun tanlang"); return; }
    setDarsSaving(true); setDarsError("");
    try {
      // Auto-name: "Kurs nomi — O'qituvchi"
      const course  = courses.find((c: any) => c.id === darsForm.courseId);
      const teacher = teachers.find((t: any) => t.id === darsForm.teacherId);
      const autoName = `${course?.name ?? "Dars"} — ${teacher?.user?.name ?? ""}`.trim();
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: autoName, courseId: darsForm.courseId, teacherId: darsForm.teacherId,
          maxStudents: 20,
          scheduleDays: darsForm.scheduleDays, startTime: darsForm.startTime, endTime: darsForm.endTime,
          startDate: new Date().toISOString().slice(0, 10), status: "ACTIVE",
        }),
      });
      const data = await res.json();
      if (!res.ok) { setDarsError(data.error ?? "Xatolik"); return; }
      mutate((k: string) => typeof k === "string" && k.startsWith("/api/groups"), undefined, { revalidate: true });
      setShowDarsModal(false);
    } catch { setDarsError("Serverga ulanib bo'lmadi"); }
    finally { setDarsSaving(false); }
  }

  async function submitQuickTeacher() {
    if (!qTeacherForm.name.trim()) { setQTeacherErr("Ism majburiy"); return; }
    if (!qTeacherForm.phone.trim()) { setQTeacherErr("Telefon majburiy"); return; }
    if (!qTeacherForm.password || qTeacherForm.password.length < 6) { setQTeacherErr("Parol kamida 6 belgi"); return; }
    setQTeacherSaving(true); setQTeacherErr("");
    try {
      const res = await fetch("/api/teachers", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: qTeacherForm.name, phone: qTeacherForm.phone, password: qTeacherForm.password,
          subjects: qTeacherForm.subjects ? qTeacherForm.subjects.split(",").map(s => s.trim()).filter(Boolean) : ["Umumiy"],
        }),
      });
      const data = await res.json();
      if (!res.ok) { setQTeacherErr(data.error ?? "Xatolik"); return; }
      await mutate("/api/teachers");
      setGroupForm(p => ({ ...p, teacherId: data.id ?? data.teacher?.id ?? "" }));
      setShowQTeacher(false);
      setQTeacherForm({ name: "", phone: "", password: "", subjects: "" });
    } catch { setQTeacherErr("Serverga ulanib bo'lmadi"); }
    finally { setQTeacherSaving(false); }
  }

  async function submitQuickCourse() {
    if (!qCourseForm.name.trim()) { setQCourseErr("Kurs nomi majburiy"); return; }
    setQCourseSaving(true); setQCourseErr("");
    try {
      const res = await fetch("/api/courses", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: qCourseForm.name, duration: qCourseForm.duration }),
      });
      const data = await res.json();
      if (!res.ok) { setQCourseErr(data.error ?? "Xatolik"); return; }
      await mutate("/api/courses");
      setGroupForm(p => ({ ...p, courseId: data.id ?? "" }));
      setShowQCourse(false);
      setQCourseForm({ name: "", duration: "3 oy" });
    } catch { setQCourseErr("Serverga ulanib bo'lmadi"); }
    finally { setQCourseSaving(false); }
  }

  const weekDays = useMemo(() => Array.from({length:6},(_,i)=>addDays(weekStart,i)), [weekStart]);
  const calCells = useMemo(() => {
    const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    return Array.from({length:42},(_,i)=>addDays(getMondayOf(first),i));
  }, [monthDate]);

  function goToday() {
    const d=new Date(today);
    setSelDay(d); setWeekStart(getMondayOf(d));
    setMonthDate(new Date(d.getFullYear(),d.getMonth(),1));
  }
  function onPrev() {
    if (view==="kun")        setSelDay(d=>addDays(d,-1));
    else if (view==="hafta") setWeekStart(d=>addDays(d,-7));
    else setMonthDate(d=>new Date(d.getFullYear(),d.getMonth()-1,1));
  }
  function onNext() {
    if (view==="kun")        setSelDay(d=>addDays(d,+1));
    else if (view==="hafta") setWeekStart(d=>addDays(d,+7));
    else setMonthDate(d=>new Date(d.getFullYear(),d.getMonth()+1,1));
  }
  function openPicker() {
    const base = view==="kun" ? selDay : view==="hafta" ? weekStart : monthDate;
    setPickerMonth(new Date(base.getFullYear(), base.getMonth(), 1));
    setPickerOpen(v => !v);
  }
  function pickDate(d: Date) {
    setSelDay(new Date(d));
    if (view==="hafta") setWeekStart(getMondayOf(d));
    else if (view==="oy") setMonthDate(new Date(d.getFullYear(),d.getMonth(),1));
    setPickerOpen(false);
  }

  const navLabel = useMemo(() => {
    if (view==="kun") {
      const i=getUzIdx(selDay);
      return `${i!==null?UZ_DAYS[i]:"Yakshanba"}, ${selDay.getDate()} ${UZ_MONTHS[selDay.getMonth()]} ${selDay.getFullYear()}`;
    }
    if (view==="hafta") {
      const end=addDays(weekStart,5);
      return weekStart.getMonth()===end.getMonth()
        ? `${weekStart.getDate()}–${end.getDate()} ${UZ_MONTHS[weekStart.getMonth()]} ${weekStart.getFullYear()}`
        : `${weekStart.getDate()} ${UZ_MONTHS_S[weekStart.getMonth()]} – ${end.getDate()} ${UZ_MONTHS_S[end.getMonth()]} ${weekStart.getFullYear()}`;
    }
    return `${UZ_MONTHS[monthDate.getMonth()]} ${monthDate.getFullYear()}`;
  }, [view, selDay, weekStart, monthDate]);

  const kunUzIdx   = getUzIdx(selDay);
  const kunDayName = kunUzIdx!==null ? UZ_DAYS[kunUzIdx] : "Yakshanba";
  const kunEntries = kunUzIdx!==null
    ? schedule.filter(s=>s.day===UZ_DAYS[kunUzIdx]).sort((a,b)=>toMin(a.time)-toMin(b.time))
    : [];
  const kunIsToday = sameDay(selDay, today);

  const SELECT_CLS = "w-full h-10 px-3 text-[13px] rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:border-neutral-900 dark:focus:border-neutral-400 transition-colors";

  function ErrorBox({ msg }: { msg: string }) {
    return msg ? (
      <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-xl px-3 py-2.5">
        <svg className="w-3.5 h-3.5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="12" cy="12" r="10" strokeWidth="2"/><path d="M12 8v4m0 4h.01" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <p className="text-[12px] font-medium text-red-600 dark:text-red-400">{msg}</p>
      </div>
    ) : null;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <TopHeader
        title="Jadval"
        subtitle={isLoading ? "Yuklanmoqda..." : `${schedule.length} ta dars slot`}
      />

      {/* ── Guruh qo'shish modal (to'liq) ────────────────────────────────── */}
      <Modal
        open={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        title="Yangi guruh qo'shish"
        subtitle="To'liq guruh ma'lumotlarini kiriting"
        size="lg"
        footer={
          <>
            <Button onClick={submitGroup} disabled={groupSaving}
              className="flex-1 h-9 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 text-white text-[13px]">
              {groupSaving ? "Saqlanmoqda..." : "Guruh yaratish"}
            </Button>
            <Button variant="outline" className="h-9 px-4 text-[13px]" onClick={() => setShowGroupModal(false)}>Bekor</Button>
          </>
        }
      >
        <FormField label="Guruh nomi" required>
          <Input placeholder="Ingliz tili A1 - 1" value={groupForm.name}
            onChange={e => setGroupForm(p => ({...p, name: e.target.value}))} className="h-10" />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Kurs">
            <select value={groupForm.courseId} onChange={e => setGroupForm(p => ({...p, courseId: e.target.value}))} className={SELECT_CLS}>
              <option value="">Kurs tanlang...</option>
              {courses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button type="button" onClick={() => { setShowQCourse(v => !v); setQCourseErr(""); }}
              className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              <Plus className="w-3 h-3" /> Yangi kurs qo'shish
            </button>
            {showQCourse && (
              <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-900/40 space-y-2">
                <p className="text-[11px] font-bold text-green-700 dark:text-green-400">Tezkor kurs qo'shish</p>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Kurs nomi" value={qCourseForm.name}
                    onChange={e => setQCourseForm(p => ({...p, name: e.target.value}))} className="h-8 text-[12px]" />
                  <Input placeholder="Davomiylik (3 oy...)" value={qCourseForm.duration}
                    onChange={e => setQCourseForm(p => ({...p, duration: e.target.value}))} className="h-8 text-[12px]" />
                </div>
                {qCourseErr && <p className="text-[11px] text-red-600 dark:text-red-400">{qCourseErr}</p>}
                <Button onClick={submitQuickCourse} disabled={qCourseSaving}
                  className="h-7 px-3 text-[11px] bg-green-600 hover:bg-green-700 text-white rounded-lg">
                  {qCourseSaving ? "Qo'shilmoqda..." : "Qo'shish"}
                </Button>
              </div>
            )}
          </FormField>
          <FormField label="O'qituvchi">
            <select value={groupForm.teacherId} onChange={e => setGroupForm(p => ({...p, teacherId: e.target.value}))} className={SELECT_CLS}>
              <option value="">O'qituvchi tanlang...</option>
              {teachers.map((t: any) => <option key={t.id} value={t.id}>{t.user?.name}</option>)}
            </select>
            <button type="button" onClick={() => { setShowQTeacher(v => !v); setQTeacherErr(""); }}
              className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              <Plus className="w-3 h-3" /> Yangi o'qituvchi qo'shish
            </button>
            {showQTeacher && (
              <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/40 space-y-2">
                <p className="text-[11px] font-bold text-blue-700 dark:text-blue-400">Tezkor o'qituvchi qo'shish</p>

                {/* Admin o'zini o'qituvchi sifatida qo'sha oladi */}
                {isAdmin && session?.user?.id && (
                  <button type="button"
                    onClick={async () => {
                      setQTeacherSaving(true); setQTeacherErr("");
                      try {
                        const res = await fetch("/api/teachers", {
                          method: "POST", headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ existingUserId: session.user.id }),
                        });
                        const data = await res.json();
                        if (!res.ok) { setQTeacherErr(data.error ?? "Xatolik"); return; }
                        await mutate("/api/teachers");
                        setGroupForm(p => ({ ...p, teacherId: data.id ?? "" }));
                        setShowQTeacher(false);
                      } catch { setQTeacherErr("Serverga ulanib bo'lmadi"); }
                      finally { setQTeacherSaving(false); }
                    }}
                    disabled={qTeacherSaving}
                    className="w-full flex items-center justify-center gap-1.5 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold transition-colors disabled:opacity-60">
                    {qTeacherSaving ? "..." : `O'zimni qo'shish (${session.user.name ?? "Admin"})`}
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Ism familiya" value={qTeacherForm.name}
                    onChange={e => setQTeacherForm(p => ({...p, name: e.target.value}))} className="h-8 text-[12px]" />
                  <Input placeholder="+998 XX XXX XX XX" value={qTeacherForm.phone}
                    onChange={e => setQTeacherForm(p => ({...p, phone: e.target.value}))} className="h-8 text-[12px]" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Parol (min 6)" type="password" value={qTeacherForm.password}
                    onChange={e => setQTeacherForm(p => ({...p, password: e.target.value}))} className="h-8 text-[12px]" />
                  <Input placeholder="Fan (ixtiyoriy)" value={qTeacherForm.subjects}
                    onChange={e => setQTeacherForm(p => ({...p, subjects: e.target.value}))} className="h-8 text-[12px]" />
                </div>
                {qTeacherErr && <p className="text-[11px] text-red-600 dark:text-red-400">{qTeacherErr}</p>}
                <Button onClick={submitQuickTeacher} disabled={qTeacherSaving}
                  className="h-7 px-3 text-[11px] bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                  {qTeacherSaving ? "Qo'shilmoqda..." : "Yangi qo'shish"}
                </Button>
              </div>
            )}
          </FormField>
        </div>
        <FormField label="Dars kunlari" required>
          <div className="flex gap-2 flex-wrap">
            {DAYS_OPTS.map(d => (
              <button key={d.v} type="button" onClick={() => toggleGroupDay(d.v)}
                className={cn("px-3 py-1.5 rounded-lg text-[12px] font-semibold border-2 transition-all",
                  groupForm.scheduleDays.includes(d.v)
                    ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900 dark:border-neutral-100"
                    : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400")}>
                {DAYS_SHORT[d.v]}
              </button>
            ))}
          </div>
        </FormField>
        <div className="grid grid-cols-3 gap-3">
          <FormField label="Boshlanish" required>
            <Input type="time" value={groupForm.startTime} onChange={e => setGroupForm(p => ({...p, startTime: e.target.value}))} className="h-10" />
          </FormField>
          <FormField label="Tugash" required>
            <Input type="time" value={groupForm.endTime} onChange={e => setGroupForm(p => ({...p, endTime: e.target.value}))} className="h-10" />
          </FormField>
          <FormField label="Max o'quvchi">
            <Input type="number" min="1" max="50" value={groupForm.maxStudents} onChange={e => setGroupForm(p => ({...p, maxStudents: e.target.value}))} className="h-10" />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Boshlanish sanasi" required>
            <Input type="date" value={groupForm.startDate} onChange={e => setGroupForm(p => ({...p, startDate: e.target.value}))} className="h-10" />
          </FormField>
          <FormField label="Holat">
            <select value={groupForm.status} onChange={e => setGroupForm(p => ({...p, status: e.target.value}))} className={SELECT_CLS}>
              <option value="ACTIVE">Faol</option>
              <option value="UPCOMING">Keladi</option>
            </select>
          </FormField>
        </div>
        <ErrorBox msg={groupError} />
      </Modal>

      {/* ── Dars qo'shish modal (tezkor) ─────────────────────────────────── */}
      <Modal
        open={showDarsModal}
        onClose={() => setShowDarsModal(false)}
        title="Dars qo'shish"
        subtitle="Tez qo'shish — faqat asosiy ma'lumotlar"
        size="md"
        footer={
          <>
            <Button onClick={submitDars} disabled={darsSaving}
              className="flex-1 h-9 bg-blue-600 hover:bg-blue-700 text-white text-[13px]">
              {darsSaving ? "Qo'shilmoqda..." : "Dars qo'shish"}
            </Button>
            <Button variant="outline" className="h-9 px-4 text-[13px]" onClick={() => setShowDarsModal(false)}>Bekor</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Kurs" required>
            <select value={darsForm.courseId} onChange={e => setDarsForm(p => ({...p, courseId: e.target.value}))} className={SELECT_CLS}>
              <option value="">Kurs tanlang...</option>
              {courses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FormField>
          <FormField label="O'qituvchi" required>
            <select value={darsForm.teacherId} onChange={e => setDarsForm(p => ({...p, teacherId: e.target.value}))} className={SELECT_CLS}>
              <option value="">O'qituvchi...</option>
              {teachers.map((t: any) => <option key={t.id} value={t.id}>{t.user?.name}</option>)}
            </select>
          </FormField>
        </div>
        <FormField label="Dars kunlari" required>
          <div className="flex gap-2 flex-wrap">
            {DAYS_OPTS.map(d => (
              <button key={d.v} type="button" onClick={() => toggleDarsDay(d.v)}
                className={cn("px-3 py-1.5 rounded-lg text-[12px] font-semibold border-2 transition-all",
                  darsForm.scheduleDays.includes(d.v)
                    ? "bg-blue-600 text-white border-blue-600"
                    : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-blue-400 hover:text-blue-600")}>
                {DAYS_SHORT[d.v]}
              </button>
            ))}
          </div>
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Boshlanish" required>
            <Input type="time" value={darsForm.startTime} onChange={e => setDarsForm(p => ({...p, startTime: e.target.value}))} className="h-10" />
          </FormField>
          <FormField label="Tugash" required>
            <Input type="time" value={darsForm.endTime} onChange={e => setDarsForm(p => ({...p, endTime: e.target.value}))} className="h-10" />
          </FormField>
        </div>
        <ErrorBox msg={darsError} />
      </Modal>

      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="flex p-1 gap-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
          {([
            ["kun",   "Kun",   List],
            ["hafta", "Hafta", LayoutGrid],
            ["oy",    "Oy",    CalendarDays],
          ] as [ViewMode, string, React.ComponentType<{className?:string}>][]).map(([id,label,Icon]) => (
            <button key={id} onClick={() => setView(id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                view===id
                  ? "bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-neutral-100"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              )}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>

        <div className="relative flex items-center gap-1 ml-2">
          <button onClick={onPrev}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={openPicker}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors",
              "text-[13px] font-semibold text-neutral-700 dark:text-neutral-200",
              "min-w-[200px] justify-center",
              pickerOpen ? "bg-neutral-100 dark:bg-neutral-800" : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
            )}>
            <CalendarDays className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 shrink-0" />
            {navLabel}
            <ChevronDown className={cn("w-3 h-3 text-neutral-400 shrink-0 transition-transform", pickerOpen && "rotate-180")} />
          </button>
          <button onClick={onNext}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>

          {pickerOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setPickerOpen(false)} />
              <div className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-50">
                <MiniCal
                  pickerMonth={pickerMonth} onChangeMonth={setPickerMonth}
                  today={today} selDay={selDay} weekStart={weekStart}
                  view={view} onPick={pickDate} onToday={() => { goToday(); setPickerOpen(false); }}
                />
              </div>
            </>
          )}
        </div>

        <button onClick={goToday}
          className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
          Bugun
        </button>

        {/* Two buttons side by side — admin only */}
        {isAdmin && (
          <div className="ml-auto flex items-center gap-2">
            <button onClick={openDarsModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors">
              <Plus className="w-3.5 h-3.5" />
              Dars qo'shish
            </button>
            <button onClick={openGroupModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
              <Plus className="w-3.5 h-3.5" />
              Guruh qo'shish
            </button>
          </div>
        )}
      </div>

      {/* ══ KUN VIEW ══════════════════════════════════════════════════════════ */}
      {view === "kun" && (
        <>
          <div className={cn(
            "shrink-0 flex items-center justify-between px-5 py-4",
            "border-b border-neutral-100 dark:border-neutral-800",
            kunIsToday ? "bg-neutral-900 dark:bg-neutral-950" : "bg-white dark:bg-neutral-900"
          )}>
            <div>
              <p className={cn("text-[11px] font-bold uppercase tracking-widest",
                kunIsToday ? "text-neutral-500" : "text-neutral-400 dark:text-neutral-500")}>
                {kunIsToday ? "Bugun" : `${UZ_MONTHS[selDay.getMonth()]} ${selDay.getFullYear()}`}
              </p>
              <h2 className={cn("text-[22px] font-black leading-tight mt-0.5",
                kunIsToday ? "text-white" : "text-neutral-900 dark:text-neutral-100")}>
                {kunDayName}
              </h2>
              <p className={cn("text-[13px] font-medium mt-0.5",
                kunIsToday ? "text-neutral-400" : "text-neutral-400 dark:text-neutral-500")}>
                {selDay.getDate()} {UZ_MONTHS[selDay.getMonth()]} {selDay.getFullYear()}
              </p>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <div className={cn("w-[60px] h-[60px] rounded-2xl flex flex-col items-center justify-center",
                kunIsToday ? "bg-white/10" : "bg-neutral-100 dark:bg-neutral-800")}>
                <span className={cn("text-[10px] font-bold uppercase tracking-wider leading-none",
                  kunIsToday ? "text-neutral-400" : "text-neutral-400 dark:text-neutral-500")}>
                  {UZ_MONTHS_S[selDay.getMonth()]}
                </span>
                <span className={cn("text-[28px] font-black leading-tight",
                  kunIsToday ? "text-white" : "text-neutral-800 dark:text-neutral-200")}>
                  {selDay.getDate()}
                </span>
              </div>
              <span className={cn("text-[11px] font-semibold",
                kunIsToday ? "text-neutral-500" : "text-neutral-400 dark:text-neutral-500")}>
                {kunEntries.length} ta dars
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <div className="flex">
              <div className="shrink-0 border-r border-neutral-100 dark:border-neutral-800 relative" style={{ width: TIME_W, height: TOTAL_H }}>
                {HOURS.map((h,i) => (
                  <span key={h} className="absolute right-2 text-[10px] font-medium text-neutral-400 dark:text-neutral-600 tabular-nums select-none" style={{ top: i*HOUR_H+3 }}>
                    {String(h).padStart(2,"0")}:00
                  </span>
                ))}
              </div>
              <div className="flex-1 relative" style={{ height: TOTAL_H }}>
                {HOURS.map((_,i) => <div key={i} className="absolute inset-x-0 border-t border-neutral-100 dark:border-neutral-800" style={{ top: i*HOUR_H }} />)}
                {HOURS.slice(0,-1).map((_,i) => <div key={`h${i}`} className="absolute inset-x-0 border-t border-dashed border-neutral-100 dark:border-neutral-800/60" style={{ top: i*HOUR_H+HOUR_H/2 }} />)}
                {kunUzIdx === null ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-sm font-semibold text-neutral-400 dark:text-neutral-600">Dam olish kuni</p>
                  </div>
                ) : isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-700 rounded-full animate-spin" />
                  </div>
                ) : kunEntries.length === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <p className="text-sm font-semibold text-neutral-400 dark:text-neutral-600">Bu kunda dars yo'q</p>
                    <div className="flex gap-2">
                      {isAdmin && (
                        <>
                          <button onClick={openDarsModal}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-[12px] font-semibold hover:bg-blue-700 transition-colors">
                            <Plus className="w-3.5 h-3.5" /> Dars qo'shish
                          </button>
                          <button onClick={openGroupModal}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-[12px] font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                            <Plus className="w-3.5 h-3.5" /> Guruh qo'shish
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ) : kunEntries.map(entry => {
                  const top    = blockTop(entry.time);
                  const height = blockH(entry.time, entry.endTime);
                  return (
                    <div key={entry.id}
                      className={cn("absolute inset-x-3 rounded-xl overflow-hidden cursor-pointer border border-l-[4px] shadow-sm transition-all hover:brightness-95 hover:shadow-md", entry.color)}
                      style={{ top: top+2, height: Math.max(height-4,24) }}>
                      <div className="px-3 py-2 h-full flex flex-col overflow-hidden">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold text-[13px] leading-tight">{entry.groupName}</p>
                          <span className="text-[11px] opacity-60 tabular-nums shrink-0 mt-0.5">{entry.time}–{entry.endTime}</span>
                        </div>
                        {height >= 56 && <p className="text-[11px] opacity-60 mt-1">{entry.courseName}</p>}
                        {height >= 80 && (
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-[11px] opacity-70">📍 {entry.room}</span>
                            <span className="text-[11px] opacity-70">👤 {entry.teacherName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══ HAFTA VIEW ════════════════════════════════════════════════════════ */}
      {view === "hafta" && (
        <div className="flex-1 overflow-auto">
          <div className="sticky top-0 z-20 flex border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <div style={{ width: TIME_W, minWidth: TIME_W }} className="shrink-0 border-r border-neutral-100 dark:border-neutral-800" />
            {weekDays.map((d, i) => {
              const isToday = sameDay(d, today);
              const isSel   = sameDay(d, selDay) && !isToday;
              return (
                <button key={i} onClick={() => { setSelDay(new Date(d)); setView("kun"); }}
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center py-3 gap-px",
                    "border-r border-neutral-100 dark:border-neutral-800 last:border-r-0 cursor-pointer transition-colors",
                    isToday ? "bg-neutral-900 dark:bg-white" : isSel ? "bg-neutral-100 dark:bg-neutral-800" : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  )}>
                  <span className={cn("text-[10px] font-bold uppercase tracking-widest",
                    isToday ? "text-white/50 dark:text-neutral-900/50" : isSel ? "text-neutral-500" : "text-neutral-400 dark:text-neutral-500")}>
                    {UZ_DAYS_S[i]}
                  </span>
                  <span className={cn("text-[20px] font-black leading-none",
                    isToday ? "text-white dark:text-neutral-900" : isSel ? "text-neutral-800 dark:text-neutral-100" : "text-neutral-700 dark:text-neutral-200")}>
                    {d.getDate()}
                  </span>
                  <span className={cn("text-[10px]",
                    isToday ? "text-white/40 dark:text-neutral-900/40" : "text-neutral-400 dark:text-neutral-500")}>
                    {UZ_MONTHS_S[d.getMonth()]}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex">
            <div className="shrink-0 border-r border-neutral-100 dark:border-neutral-800 relative" style={{ width: TIME_W, height: TOTAL_H }}>
              {HOURS.map((h,i) => (
                <span key={h} className="absolute right-2 text-[10px] font-medium text-neutral-400 dark:text-neutral-600 tabular-nums select-none" style={{ top: i*HOUR_H+3 }}>
                  {String(h).padStart(2,"0")}:00
                </span>
              ))}
            </div>
            {weekDays.map((d, ci) => {
              const isToday   = sameDay(d, today);
              const isSel     = sameDay(d, selDay) && !isToday;
              const uzDayName = UZ_DAYS[ci];
              const entries   = schedule.filter(s => s.day===uzDayName).sort((a,b) => toMin(a.time)-toMin(b.time));
              return (
                <div key={ci}
                  className={cn("flex-1 relative border-r border-neutral-100 dark:border-neutral-800 last:border-r-0",
                    isToday && "bg-blue-50/25 dark:bg-blue-900/10", isSel && "bg-neutral-50/80 dark:bg-neutral-800/30")}
                  style={{ height: TOTAL_H }}>
                  {HOURS.map((_,i) => <div key={i} className="absolute inset-x-0 border-t border-neutral-100 dark:border-neutral-800" style={{ top: i*HOUR_H }} />)}
                  {HOURS.slice(0,-1).map((_,i) => <div key={`h${i}`} className="absolute inset-x-0 border-t border-dashed border-neutral-100 dark:border-neutral-800/60" style={{ top: i*HOUR_H+HOUR_H/2 }} />)}
                  {entries.map(entry => {
                    const top     = blockTop(entry.time);
                    const height  = blockH(entry.time, entry.endTime);
                    const compact = height < 52;
                    return (
                      <div key={entry.id}
                        className={cn("absolute inset-x-1 rounded-lg overflow-hidden cursor-pointer border border-l-[3px] shadow-sm transition-all hover:brightness-95 hover:shadow-md", entry.color)}
                        style={{ top: top+2, height: Math.max(height-4,20) }}>
                        <div className="px-2 py-1.5 h-full flex flex-col overflow-hidden">
                          <p className={cn("font-bold truncate leading-tight", compact?"text-[10px]":"text-[12px]")}>
                            {entry.groupName}
                          </p>
                          {!compact && (
                            <>
                              <p className="text-[10px] opacity-60 mt-0.5 tabular-nums">{entry.time}–{entry.endTime}</p>
                              <p className="text-[10px] opacity-55 truncate mt-0.5">{entry.room} · {entry.teacherName}</p>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ OY VIEW ═══════════════════════════════════════════════════════════ */}
      {view === "oy" && (
        <div className="flex-1 overflow-auto p-4">
          <div className="flex items-baseline gap-2 mb-3 px-1">
            <h2 className="text-[20px] font-black text-neutral-900 dark:text-neutral-100">{UZ_MONTHS[monthDate.getMonth()]}</h2>
            <span className="text-[14px] font-semibold text-neutral-400 dark:text-neutral-500">{monthDate.getFullYear()}</span>
          </div>
          <div className="grid grid-cols-7 mb-1">
            {["Dushanba","Seshanba","Chorshanba","Payshanba","Juma","Shanba","Yakshanba"].map(d => (
              <div key={d} className="text-center py-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">{d.slice(0,3)}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px rounded-2xl overflow-hidden bg-neutral-200 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-700">
            {calCells.slice(0,42).map((d, i) => {
              const inMonth = d.getMonth()===monthDate.getMonth();
              if (i>=35 && !inMonth) return <div key={i} className="bg-white dark:bg-neutral-900 h-24" />;
              const isToday = sameDay(d, today);
              const isSel   = sameDay(d, selDay);
              const idx     = getUzIdx(d);
              const entries = idx!==null && inMonth ? schedule.filter(s => s.day===UZ_DAYS[idx]) : [];
              return (
                <button key={i} onClick={() => { setSelDay(new Date(d)); setView("kun"); }}
                  className={cn("bg-white dark:bg-neutral-900 h-24 p-1.5 text-left flex flex-col gap-1",
                    "hover:bg-neutral-50 dark:hover:bg-neutral-800/70 transition-colors",
                    !inMonth && "opacity-25")}>
                  <span className={cn("w-6 h-6 flex items-center justify-center rounded-full text-[12px] font-bold shrink-0",
                    isToday ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
                    : isSel  ? "bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 ring-2 ring-neutral-400"
                             : "text-neutral-700 dark:text-neutral-300")}>
                    {d.getDate()}
                  </span>
                  <div className="flex flex-col gap-px flex-1 overflow-hidden">
                    {entries.slice(0,3).map(e => (
                      <div key={e.id} className={cn("text-[9px] font-semibold px-1.5 py-px rounded-sm truncate", e.color)}>
                        {e.time} {e.groupName}
                      </div>
                    ))}
                    {entries.length>3 && <span className="text-[9px] text-neutral-400 dark:text-neutral-500 px-1">+{entries.length-3} ta boshqa</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
