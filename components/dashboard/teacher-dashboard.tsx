"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Users, BookOpen, CalendarCheck, Clock, UserCheck, ArrowRight,
} from "lucide-react";

export interface TeacherDashboardData {
  isTeacher: true;
  groupCount: number;
  studentCount: number;
  attendanceRate: number;
  todayLessons: {
    id: string; name: string; courseName: string | null; roomName: string | null;
    startTime: string; endTime: string; students: number;
  }[];
  groups: {
    id: string; name: string; courseName: string | null; students: number;
    scheduleDays: string[]; startTime: string; endTime: string;
  }[];
}

const DAY_SHORT: Record<string, string> = {
  dushanba: "Du", seshanba: "Se", chorshanba: "Cho", payshanba: "Pay",
  juma: "Ju", shanba: "Sha", yakshanba: "Yak",
  du: "Du", se: "Se", ch: "Cho", pa: "Pay", ju: "Ju", sha: "Sha", sh: "Sha", ya: "Yak",
  mon: "Du", tue: "Se", wed: "Cho", thu: "Pay", fri: "Ju", sat: "Sha", sun: "Yak",
};
const dayLabels = (d?: string[]) =>
  (d ?? []).map(x => DAY_SHORT[String(x).trim().toLowerCase()] ?? String(x));

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded-xl", className)} />;
}

/**
 * O'qituvchi dashboardi.
 *
 * Markaz egasinikidan ATAYLAB farq qiladi: daromad, qarzdorlar, lidlar va
 * umumiy o'quvchi soni ko'rsatilmaydi — bular markaz ma'lumoti. O'qituvchi
 * faqat o'z ishini ko'radi: guruhlari, o'quvchilari, bugungi darslari va
 * o'z guruhlaridagi davomat.
 */
export function TeacherDashboard({ data, loading }: { data?: TeacherDashboardData; loading: boolean }) {
  if (loading || !data) {
    return (
      <div className="p-5 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
        </div>
        <Skeleton className="h-52 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-5 space-y-5">
      {/* KPI — faqat o'ziga tegishli */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat icon={BookOpen} label="Mening guruhlarim" value={String(data.groupCount)}
          bg="bg-indigo-50 dark:bg-indigo-950/40" text="text-indigo-600 dark:text-indigo-400" />
        <Stat icon={Users} label="Mening o'quvchilarim" value={String(data.studentCount)}
          bg="bg-emerald-50 dark:bg-emerald-950/40" text="text-emerald-600 dark:text-emerald-400" />
        <Stat icon={CalendarCheck} label="Davomat (bu oy)" value={`${data.attendanceRate}%`}
          bg="bg-blue-50 dark:bg-blue-950/40" text="text-blue-600 dark:text-blue-400"
          accent={data.attendanceRate >= 80 ? "text-emerald-500" : data.attendanceRate >= 50 ? "text-amber-500" : "text-red-500"} />
      </div>

      {/* Bugungi darslar */}
      <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/50 dark:border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-900/40 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">Bugungi darslarim</h3>
          </div>
          <Link href="/attendance"
            className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold hover:underline">
            Davomat belgilash →
          </Link>
        </div>

        {data.todayLessons.length === 0 ? (
          <div className="py-10 text-center text-sm text-neutral-400">Bugun darsingiz yo&apos;q</div>
        ) : data.todayLessons.map(l => (
          <div key={l.id}
            className="flex items-center gap-3 px-5 py-3 border-b border-white/50 dark:border-white/10 last:border-0 hover:bg-white/60 dark:hover:bg-white/10 transition-colors">
            <div className="text-center shrink-0 w-14">
              <p className="text-[13px] font-black text-neutral-900 dark:text-neutral-100 leading-none">{l.startTime}</p>
              <p className="text-[10px] text-neutral-400 mt-0.5">{l.endTime}</p>
            </div>
            <div className="w-px h-8 bg-neutral-200 dark:bg-white/10 shrink-0" />
            <Link href={`/groups/${l.id}`} className="flex-1 min-w-0 group/name">
              <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 truncate group-hover/name:text-indigo-600 transition-colors">
                {l.name}
              </p>
              <p className="text-[11px] text-neutral-400 truncate">
                {[l.courseName, l.roomName].filter(Boolean).join(" · ")}
              </p>
            </Link>
            <span className="flex items-center gap-1 text-[12px] font-semibold text-neutral-500 dark:text-neutral-400 shrink-0">
              <UserCheck className="w-3.5 h-3.5" />{l.students}
            </span>
          </div>
        ))}
      </div>

      {/* Barcha guruhlarim */}
      <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/50 dark:border-white/10">
          <h3 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">Guruhlarim</h3>
        </div>
        {data.groups.length === 0 ? (
          <div className="py-10 text-center text-sm text-neutral-400">Sizga guruh biriktirilmagan</div>
        ) : data.groups.map(g => (
          <Link key={g.id} href={`/groups/${g.id}`}
            className="flex items-center gap-3 px-5 py-3 border-b border-white/50 dark:border-white/10 last:border-0 hover:bg-white/60 dark:hover:bg-white/10 transition-colors">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-[12px] font-bold shrink-0">
              {g.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 truncate">{g.name}</p>
              <p className="text-[11px] text-neutral-400 truncate">
                {g.courseName} · {g.startTime}–{g.endTime}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {dayLabels(g.scheduleDays).map(d => (
                <span key={d} className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                  {d}
                </span>
              ))}
            </div>
            <span className="flex items-center gap-1 text-[12px] font-semibold text-neutral-500 dark:text-neutral-400 shrink-0 w-10 justify-end">
              <Users className="w-3.5 h-3.5" />{g.students}
            </span>
          </Link>
        ))}
      </div>

      <Link href="/salary"
        className="flex items-center justify-between glass-panel border border-white/60 dark:border-white/10 rounded-2xl px-5 py-4 hover:bg-white/60 dark:hover:bg-white/10 transition-colors">
        <div>
          <p className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">Oyligim</p>
          <p className="text-[11px] text-neutral-400 mt-0.5">Maosh hisobi va to&apos;lov tarixi</p>
        </div>
        <ArrowRight className="w-4 h-4 text-neutral-400" />
      </Link>
    </div>
  );
}

function Stat({ icon: Icon, label, value, bg, text, accent }: {
  icon: any; label: string; value: string; bg: string; text: string; accent?: string;
}) {
  return (
    <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-4">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", bg)}>
        <Icon className={cn("w-4.5 h-4.5", text)} />
      </div>
      <p className={cn("text-[22px] font-black leading-none", accent ?? "text-neutral-900 dark:text-neutral-100")}>
        {value}
      </p>
      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">{label}</p>
    </div>
  );
}
