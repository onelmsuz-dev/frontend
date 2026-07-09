"use client";

import { useState } from "react";
import { TopHeader } from "@/components/layout/top-header";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { useChartColors } from "@/hooks/use-chart-colors";
import { useDashboard } from "@/lib/hooks/useDashboard";
import { useCourses } from "@/lib/hooks/useCourses";
import { useBranchQueryString } from "@/lib/contexts/branch-context";
import { TrendingUp, Users, BookOpen, CalendarCheck, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

function formatCurrency(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M so'm`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K so'm`;
  return `${v} so'm`;
}

const PIE_COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4"];
const COURSE_COLORS = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-pink-500", "bg-yellow-500"];

const DATE_RANGES: { label: string; months: number }[] = [
  { label: "Bu oy",         months: 1 },
  { label: "So'nggi 3 oy", months: 3 },
  { label: "So'nggi 6 oy", months: 6 },
  { label: "Bu yil",       months: 12 },
];

export default function ReportsPage() {
  const chart = useChartColors();
  const [monthCount, setMonthCount] = useState(6);
  const [showDateDrop, setShowDateDrop] = useState(false);

  const selectedRange = DATE_RANGES.find(r => r.months === monthCount) ?? DATE_RANGES[2];

  const branchQs = useBranchQueryString({ months: String(monthCount) });

  const { data: dashRaw } = useDashboard();
  const dash = dashRaw ?? {};

  const { data: coursesRaw } = useCourses();
  const courses: any[] = Array.isArray(coursesRaw) ? coursesRaw : [];

  const { data: reportsRaw } = useSWR(`/api/reports${branchQs}`, fetcher);
  const revenue: { label: string; kirim: number; chiqim: number }[] = reportsRaw?.revenue ?? [];

  const courseDistribution = courses
    .filter(c => c.studentCount > 0)
    .map(c => ({ name: c.name, value: c.studentCount }));

  return (
    <div>
      <TopHeader
        title="Hisobotlar"
        subtitle="Analitika va statistika"
      />

      <div className="p-5 space-y-5">

        {/* Date range selector */}
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-semibold text-neutral-700 dark:text-neutral-300">Davr:</span>
          <div className="relative">
            <button
              onClick={() => setShowDateDrop(v => !v)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700
                bg-white dark:bg-neutral-900 text-[13px] font-medium text-neutral-700 dark:text-neutral-300
                hover:border-neutral-400 transition-colors">
              {selectedRange.label}
              <ChevronDown className={cn("w-3.5 h-3.5 text-neutral-400 transition-transform", showDateDrop && "rotate-180")} />
            </button>
            {showDateDrop && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDateDrop(false)} />
                <div className="absolute top-full left-0 mt-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg z-50 min-w-[140px] overflow-hidden">
                  {DATE_RANGES.map(r => (
                    <button key={r.months} onClick={() => { setMonthCount(r.months); setShowDateDrop(false); }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-[13px] hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors",
                        monthCount === r.months
                          ? "font-semibold text-neutral-900 dark:text-neutral-100 bg-neutral-50 dark:bg-neutral-800"
                          : "text-neutral-600 dark:text-neutral-400"
                      )}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* KPI stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Oylik daromad",  value: formatCurrency(dash.monthlyRevenue ?? 0), icon: TrendingUp,    bg: "bg-blue-50 dark:bg-blue-950/40",    text: "text-blue-600 dark:text-blue-400" },
            { label: "Jami o'quvchi", value: dash.studentCount ?? "—",                  icon: Users,         bg: "bg-green-50 dark:bg-green-950/40",  text: "text-green-600 dark:text-green-400" },
            { label: "Faol kurslar",  value: courses.length || "—",                     icon: BookOpen,      bg: "bg-purple-50 dark:bg-purple-950/40", text: "text-purple-600 dark:text-purple-400" },
            { label: "Faol guruhlar", value: dash.groupCount ?? "—",                    icon: CalendarCheck, bg: "bg-amber-50 dark:bg-amber-950/40",   text: "text-amber-600 dark:text-amber-400" },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label}
                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", s.bg)}>
                    <Icon className={cn("w-4.5 h-4.5", s.text)} />
                  </div>
                </div>
                <p className="text-[22px] font-black text-neutral-900 dark:text-neutral-100 leading-none">{s.value}</p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5">
            <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Moliyaviy hisobot ({selectedRange.label.toLowerCase()})</p>
            {revenue.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-neutral-400 text-sm">Ma'lumot yuklanmoqda...</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: chart.axis }} />
                  <YAxis tick={{ fontSize: 11, fill: chart.axis }} tickFormatter={v => `${(v / 1000000).toFixed(0)}M`} />
                  <Tooltip
                    formatter={(v: unknown) => formatCurrency(v as number)}
                    contentStyle={{ background: chart.tooltip, border: `1px solid ${chart.tooltipBorder}`, borderRadius: 8, color: chart.tooltipText }}
                  />
                  <Bar dataKey="kirim"  name="Kirim"  fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="chiqim" name="Chiqim" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5">
            <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 mb-4">O'quvchilar bo'yicha kurs taqsimoti</p>
            {courseDistribution.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-neutral-400 text-sm">Ma'lumot yuklanmoqda...</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={courseDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                    paddingAngle={3} dataKey="value">
                    {courseDistribution.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: unknown) => `${v} ta`} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Courses summary table */}
        {courses.length > 0 && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
              <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">Kurslar bo'yicha umumiy ko'rsatkich</p>
            </div>
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {courses.map((course, idx) => (
                <div key={course.id}
                  className="flex items-center justify-between px-5 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-neutral-400 dark:text-neutral-500 w-5 font-mono shrink-0">{idx + 1}</span>
                    <div className={cn("w-2 h-8 rounded-full shrink-0", course.color ?? COURSE_COLORS[idx % COURSE_COLORS.length])} />
                    <div>
                      <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">{course.name}</p>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">{course._count?.groups ?? 0} ta guruh · {course.duration}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">{course.studentCount ?? 0} ta</p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      {formatCurrency((course.price ?? 0) * (course.studentCount ?? 0))}/oy
                    </p>
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
