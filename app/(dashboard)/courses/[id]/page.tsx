"use client";

import { use } from "react";
import Link from "next/link";
import useSWR from "swr";
import { TopHeader } from "@/components/layout/top-header";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, BookOpen, Users, DollarSign, Clock, AlertCircle, TrendingUp,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

function fmt(v: number) {
  return new Intl.NumberFormat("uz-UZ", { style: "currency", currency: "UZS", maximumFractionDigits: 0 }).format(v);
}
function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded-xl", className)} />;
}

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  ACTIVE:    { label: "Faol",        cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  UPCOMING:  { label: "Yaqinda",     cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  COMPLETED: { label: "Yakunlangan", cls: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800" },
};

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: course, isLoading } = useSWR(`/api/courses/${id}`, fetcher);

  if (isLoading) {
    return (
      <div className="p-5 space-y-5">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (!course || course.error) {
    return (
      <div className="p-5 flex flex-col items-center py-20 text-neutral-400">
        <AlertCircle className="w-10 h-10 mb-2 opacity-40" />
        <p className="text-sm">Kurs topilmadi</p>
        <Link href="/courses" className="mt-3 text-sm text-blue-500 hover:underline">Orqaga</Link>
      </div>
    );
  }

  const totalStudents = course.groups?.reduce((s: number, g: any) => s + (g.students?.length ?? 0), 0) ?? 0;
  const activeGroups  = course.groups?.filter((g: any) => g.status === "ACTIVE").length ?? 0;
  const totalRevenue  = totalStudents * course.price;

  return (
    <div>
      <TopHeader
        title={course.name}
        subtitle={
          <Link href="/courses" className="flex items-center gap-1 text-neutral-400 hover:text-neutral-600 text-sm transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Kurslar
          </Link>
        }
      />

      <div className="p-5 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Narx",         value: fmt(course.price),   icon: DollarSign,  bg: "bg-blue-50 dark:bg-blue-950/40",   text: "text-blue-600 dark:text-blue-400" },
            { label: "Davomiylik",   value: course.duration,     icon: Clock,       bg: "bg-purple-50 dark:bg-purple-950/40", text: "text-purple-600 dark:text-purple-400" },
            { label: "Guruhlar",     value: `${activeGroups} ta`, icon: BookOpen,    bg: "bg-green-50 dark:bg-green-950/40", text: "text-green-600 dark:text-green-400" },
            { label: "O'quvchilar",  value: `${totalStudents} ta`, icon: Users,      bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-600 dark:text-amber-400" },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4">
                <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center mb-2", s.bg)}>
                  <Icon className={cn("w-4 h-4", s.text)} />
                </div>
                <p className="text-[18px] font-black text-neutral-900 dark:text-neutral-100 leading-tight">{s.value}</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Description */}
        {course.description && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5">
            <h3 className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">Tavsif</h3>
            <p className="text-[13px] text-neutral-700 dark:text-neutral-300 leading-relaxed">{course.description}</p>
          </div>
        )}

        {/* Groups */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-neutral-400" />
            <h3 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">Guruhlar</h3>
          </div>
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {course.groups?.length === 0 && (
              <p className="text-[12px] text-neutral-400 p-6 text-center">Guruhlar yo'q</p>
            )}
            {course.groups?.map((g: any) => {
              const st     = STATUS_CFG[g.status] ?? STATUS_CFG.ACTIVE;
              const teacher = g.teacher?.user;
              return (
                <div key={g.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", g.color ?? "bg-blue-100 text-blue-700")}>
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <Link href={`/groups/${g.id}`}
                        className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 hover:text-blue-600 transition-colors">
                        {g.name}
                      </Link>
                      <p className="text-[11px] text-neutral-400">
                        {teacher?.name ?? "—"} · {g.startTime}–{g.endTime}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-neutral-400">{g.students?.length ?? 0} o'quvchi</span>
                    <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-semibold", st.cls)}>{st.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
