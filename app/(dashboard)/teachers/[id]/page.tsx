"use client";

import { use } from "react";
import Link from "next/link";
import useSWR from "swr";
import { TopHeader } from "@/components/layout/top-header";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, Phone, BookOpen, Users, DollarSign,
  AlertCircle, CheckCircle, XCircle,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

function fmt(v: number) {
  return new Intl.NumberFormat("uz-UZ", { style: "currency", currency: "UZS", maximumFractionDigits: 0 }).format(v);
}
function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded-xl", className)} />;
}

const SALARY_STATUS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "To'lanmagan", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  PAID:    { label: "To'langan",   cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
};
const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  ACTIVE:   { label: "Faol",     cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  INACTIVE: { label: "Nofaol",   cls: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800" },
};

export default function TeacherDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: teacher, isLoading } = useSWR(`/api/teachers/${id}`, fetcher);

  if (isLoading) {
    return (
      <div className="p-5 space-y-5">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-36" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (!teacher || teacher.error) {
    return (
      <div className="p-5 flex flex-col items-center py-20 text-neutral-400">
        <AlertCircle className="w-10 h-10 mb-2 opacity-40" />
        <p className="text-sm">O'qituvchi topilmadi</p>
        <Link href="/teachers" className="mt-3 text-sm text-blue-500 hover:underline">Orqaga</Link>
      </div>
    );
  }

  const user       = teacher.user;
  const status     = STATUS_CFG[teacher.status];
  const totalStudents = teacher.groups?.reduce((s: number, g: any) => s + (g.students?.length ?? 0), 0) ?? 0;
  const activeGroups  = teacher.groups?.filter((g: any) => g.status === "ACTIVE").length ?? 0;

  return (
    <div>
      <TopHeader
        title={user?.name ?? "O'qituvchi"}
        subtitle={
          <Link href="/teachers" className="flex items-center gap-1 text-neutral-400 hover:text-neutral-600 text-sm transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            O'qituvchilar
          </Link>
        }
      />

      <div className="p-5 space-y-5">
        {/* Top cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Profile */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xl font-black">
                {user?.name?.[0] ?? "T"}
              </div>
              <div>
                <h2 className="font-bold text-neutral-900 dark:text-neutral-100">{user?.name}</h2>
                <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-semibold", status?.cls)}>
                  {status?.label}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <a href={`tel:${user?.phone}`}
                className="flex items-center gap-2 text-[13px] text-neutral-600 dark:text-neutral-300 hover:text-blue-600 transition-colors">
                <Phone className="w-3.5 h-3.5 text-neutral-400" />
                {user?.phone}
              </a>
              {teacher.email && (
                <p className="text-[12px] text-neutral-400 pl-5">{teacher.email}</p>
              )}
              <div className="flex flex-wrap gap-1 pt-1">
                {teacher.subjects?.map((s: string) => (
                  <span key={s} className="text-[11px] px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Salary info */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5">
            <h3 className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Maosh</h3>
            <div className="space-y-3">
              <div>
                <p className="text-[11px] text-neutral-400 mb-0.5">Asosiy maosh</p>
                <p className="text-[22px] font-black text-neutral-900 dark:text-neutral-100 leading-none">
                  {teacher.salaryType === "PERCENT" ? `${teacher.salary}%` : fmt(teacher.salary)}
                </p>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  {teacher.salaryType === "FIXED" ? "Oylik fiksirovanniy" : "Tushum foizi"}
                </p>
              </div>
              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <p className="text-[11px] text-neutral-400 mb-1">Oxirgi maosh</p>
                {teacher.salaries?.[0] ? (
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-neutral-700 dark:text-neutral-300">
                      {fmt(teacher.salaries[0].calculatedSalary)}
                    </span>
                    <span className={cn("text-[11px] px-1.5 py-0.5 rounded-lg font-semibold",
                      SALARY_STATUS[teacher.salaries[0].status]?.cls)}>
                      {SALARY_STATUS[teacher.salaries[0].status]?.label}
                    </span>
                  </div>
                ) : (
                  <p className="text-[12px] text-neutral-400">Hali maosh yo'q</p>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5">
            <h3 className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Statistika</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Guruhlar", value: activeGroups, icon: BookOpen, cls: "text-blue-600" },
                { label: "O'quvchilar", value: totalStudents, icon: Users, cls: "text-green-600" },
              ].map(s => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="text-center">
                    <Icon className={cn("w-5 h-5 mx-auto mb-1 opacity-70", s.cls)} />
                    <p className="text-[24px] font-black text-neutral-900 dark:text-neutral-100 leading-none">{s.value}</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">{s.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Groups */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-neutral-400" />
            <h3 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">Guruhlar</h3>
          </div>
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {teacher.groups?.length === 0 && (
              <p className="text-[12px] text-neutral-400 p-6 text-center">Guruhlar yo'q</p>
            )}
            {teacher.groups?.map((g: any) => (
              <div key={g.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                <div>
                  <Link href={`/groups/${g.id}`}
                    className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 hover:text-blue-600 transition-colors">
                    {g.name}
                  </Link>
                  <p className="text-[11px] text-neutral-400">{g.course?.name} · {g.startTime}–{g.endTime}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-neutral-400">{g.students?.length ?? 0} o'quvchi</span>
                  <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-semibold",
                    g.status === "ACTIVE"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-neutral-100 text-neutral-500")}>
                    {g.status === "ACTIVE" ? "Faol" : g.status === "UPCOMING" ? "Yaqinda" : "Yakunlangan"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Salary history */}
        {teacher.salaries?.length > 0 && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-neutral-400" />
              <h3 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">Maosh tarixi</h3>
            </div>
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {teacher.salaries.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">{s.month}</p>
                    <p className="text-[11px] text-neutral-400">Bazaviy: {fmt(s.baseSalary)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">{fmt(s.calculatedSalary)}</p>
                    <span className={cn("text-[11px] px-1.5 py-0.5 rounded-lg font-semibold", SALARY_STATUS[s.status]?.cls)}>
                      {SALARY_STATUS[s.status]?.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
