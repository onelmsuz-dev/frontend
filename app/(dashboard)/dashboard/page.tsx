"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  GraduationCap, Users, Wallet, Target, UserCheck, TrendingUp,
  CreditCard, AlertTriangle,
} from "lucide-react";
import { useChartColors } from "@/hooks/use-chart-colors";
import { TopHeader } from "@/components/layout/top-header";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/lib/hooks/useDashboard";
import { usePayments } from "@/lib/hooks/usePayments";
import { useLeads } from "@/lib/hooks/useLeads";
import { useBranchQueryString, useBranch } from "@/lib/contexts/branch-context";
import useSWR from "swr";

const _fetcher = (url: string) => fetch(url).then(r => r.json());

function formatCurrency(v: number) {
  return new Intl.NumberFormat("uz-UZ", { style: "currency", currency: "UZS", maximumFractionDigits: 0 }).format(v);
}

const LEAD_COLORS: Record<string, string> = {
  YANGI:          "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  ALOQA_QILINGAN: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  SINOV_DARSI:    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  TO_LANDI:       "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  BEKOR:          "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};
const LEAD_LABELS: Record<string, string> = {
  YANGI: "Yangi", ALOQA_QILINGAN: "Aloqa", SINOV_DARSI: "Sinov", TO_LANDI: "To'ladi", BEKOR: "Bekor",
};
const PAY_LABELS: Record<string, string> = {
  NAQD: "Naqd", KARTA: "Karta", CLICK: "Click", PAYME: "Payme",
};

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded-xl", className)} />;
}

export default function DashboardPage() {
  const chart = useChartColors();
  const reportsQs = useBranchQueryString();
  const { activeBranch } = useBranch();
  const { data: stats, isLoading: statsLoading } = useDashboard();
  const { data: leadsData, isLoading: leadsLoading } = useLeads();
  const { data: paymentsData, isLoading: paymentsLoading } = usePayments();
  const { data: reportsData } = useSWR(`/api/reports${reportsQs}`, _fetcher);
  const revenueData = reportsData?.revenue ?? [];

  const leads    = Array.isArray(leadsData)    ? leadsData    : [];
  const payments = Array.isArray(paymentsData) ? paymentsData : [];

  const STAT_CARDS = [
    {
      title: "Jami o'quvchi", value: statsLoading ? null : stats?.studentCount ?? 0,
      change: statsLoading ? null : stats?.newStudentsThisMonth > 0 ? `+${stats.newStudentsThisMonth} bu oy` : "Bu oy o'zgarish yo'q",
      up: (stats?.newStudentsThisMonth ?? 0) >= 0,
      icon: GraduationCap, bg: "bg-indigo-50 dark:bg-indigo-950/40", text: "text-indigo-600 dark:text-indigo-400",
    },
    {
      title: "Faol guruhlar", value: statsLoading ? null : stats?.groupCount ?? 0,
      change: null, up: true,
      icon: Users, bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Oylik daromad", value: statsLoading ? null : formatCurrency(stats?.monthlyRevenue ?? 0),
      change: statsLoading ? null : stats?.revenueChange != null
        ? `${stats.revenueChange >= 0 ? "+" : ""}${stats.revenueChange}% o'tgan oyga`
        : null,
      up: (stats?.revenueChange ?? 0) >= 0,
      icon: Wallet, bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-600 dark:text-amber-400",
    },
    {
      title: "Yangi lidlar", value: statsLoading ? null : stats?.leadCount ?? 0,
      change: statsLoading ? null : stats?.newLeadsThisMonth > 0 ? `+${stats.newLeadsThisMonth} bu oy` : null,
      up: (stats?.newLeadsThisMonth ?? 0) >= 0,
      icon: Target, bg: "bg-pink-50 dark:bg-pink-950/40", text: "text-pink-600 dark:text-pink-400",
    },
    {
      title: "O'qituvchilar", value: statsLoading ? null : stats?.teacherCount ?? 0,
      change: null, up: true,
      icon: TrendingUp, bg: "bg-violet-50 dark:bg-violet-950/40", text: "text-violet-600 dark:text-violet-400",
    },
    {
      title: "Qarzdorlar", value: statsLoading ? null : stats?.debtorCount ?? 0,
      change: (stats?.debtorCount ?? 0) > 0 ? "Nazorat qiling" : null,
      up: false,
      icon: UserCheck, bg: "bg-teal-50 dark:bg-teal-950/40", text: "text-teal-600 dark:text-teal-400",
    },
  ];

  return (
    <div>
      <TopHeader
        title="Dashboard"
        subtitle={activeBranch ? `${activeBranch.name} · Bugungi holat` : "Bugungi holat"}
      />

      <div className="p-5 space-y-5">

        {/* KPI Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {STAT_CARDS.map(s => {
            const Icon = s.icon;
            return (
              <div key={s.title}
                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", s.bg)}>
                  <Icon className={cn("w-4.5 h-4.5", s.text)} />
                </div>
                {s.value === null
                  ? <Skeleton className="h-6 w-12 mb-1" />
                  : <p className="text-[22px] font-black text-neutral-900 dark:text-neutral-100 leading-none">{s.value}</p>
                }
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">{s.title}</p>
                {s.change && (
                  <p className={cn("text-[10px] font-semibold mt-0.5", s.up ? "text-emerald-500" : "text-red-500")}>
                    {s.change}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Alert: debtors */}
        {!statsLoading && (stats?.debtorCount ?? 0) > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">
              <span className="font-bold">{stats?.debtorCount} ta o'quvchi</span> to'lovni kechiktirmoqda — moliya bo'limiga o'ting
            </p>
            <a href="/finance" className="ml-auto text-xs font-semibold text-red-600 dark:text-red-400 hover:underline shrink-0">
              Ko'rish →
            </a>
          </div>
        )}

        {/* Area chart — still uses mock revenue until finance API is ready */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100">Moliyaviy ko'rsatkich</h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">So'nggi 6 oy — kirim va chiqim</p>
            </div>
            <div className="flex gap-4 text-[11px] text-neutral-500 dark:text-neutral-400">
              <div className="flex items-center gap-1.5">
                <span className="w-6 h-0.5 bg-teal-500 block rounded-full" />Kirim
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-6 h-0.5 bg-red-400 block rounded-full" />Chiqim
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="g-kirim" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: chart.axis }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: chart.axis }} tickFormatter={v => `${(v/1_000_000).toFixed(0)}M`} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v: unknown) => formatCurrency(v as number)}
                contentStyle={{ background: chart.tooltip, border: `1px solid ${chart.tooltipBorder}`, borderRadius: 10, color: chart.tooltipText }}
              />
              <Area type="monotone" dataKey="kirim" stroke="#14b8a6" fill="url(#g-kirim)" strokeWidth={2.5} name="Kirim" />
              <Area type="monotone" dataKey="chiqim" stroke="#f87171" fill="none" strokeWidth={1.5} strokeDasharray="6 3" name="Chiqim" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 2-col bottom */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Leads */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center">
                  <Target className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">So'nggi lidlar</h3>
              </div>
              <a href="/leads" className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold hover:underline">
                Barchasi →
              </a>
            </div>
            {leadsLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                    <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-1"><Skeleton className="h-3 w-28" /><Skeleton className="h-2.5 w-20" /></div>
                    <Skeleton className="h-5 w-14 rounded-lg" />
                  </div>
                ))
              : leads.slice(0, 5).map((l: any) => (
                  <div key={l.id}
                    className="flex items-center gap-3 px-5 py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-violet-500 rounded-xl flex items-center justify-center text-white text-[12px] font-bold shrink-0">
                      {l.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 truncate">{l.name}</p>
                      <p className="text-[11px] text-neutral-400 truncate">{l.phone}{l.course ? ` · ${l.course}` : ""}</p>
                    </div>
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-lg font-semibold shrink-0", LEAD_COLORS[l.status] ?? "bg-neutral-100 text-neutral-600")}>
                      {LEAD_LABELS[l.status] ?? l.status}
                    </span>
                  </div>
                ))
            }
            {!leadsLoading && leads.length === 0 && (
              <div className="py-10 text-center text-sm text-neutral-400">Hali lid yo'q</div>
            )}
          </div>

          {/* Payments + attendance */}
          <div className="flex flex-col gap-5">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/40 flex items-center justify-center">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">So'nggi to'lovlar</h3>
                </div>
                <a href="/finance" className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold hover:underline">
                  Barchasi →
                </a>
              </div>
              {paymentsLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between px-5 py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                      <div className="flex items-center gap-2.5">
                        <Skeleton className="w-7 h-7 rounded-xl shrink-0" />
                        <div className="space-y-1"><Skeleton className="h-3 w-24" /><Skeleton className="h-2.5 w-16" /></div>
                      </div>
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))
                : payments.slice(0, 4).map((p: any) => (
                    <div key={p.id}
                      className="flex items-center justify-between px-5 py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                          {p.student?.name?.[0] ?? "?"}
                        </div>
                        <div>
                          <p className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-100">{p.student?.name}</p>
                          <p className="text-[10px] text-neutral-400">{PAY_LABELS[p.method] ?? p.method} · {new Date(p.date).toLocaleDateString("uz-UZ")}</p>
                        </div>
                      </div>
                      <p className="text-[13px] font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(p.amount)}</p>
                    </div>
                  ))
              }
              {!paymentsLoading && payments.length === 0 && (
                <div className="py-8 text-center text-sm text-neutral-400">Hali to'lov yo'q</div>
              )}
            </div>

            {/* Stats banner */}
            <div className="bg-teal-600 text-white rounded-2xl p-5 flex items-center gap-4">
              <div className="flex-1">
                <p className="text-teal-200 text-[11px] font-semibold uppercase tracking-wider">Jami o'quvchi</p>
                <p className="text-[40px] font-black leading-none mt-1">
                  {statsLoading ? "..." : stats?.studentCount ?? 0}
                </p>
                <p className="text-teal-300 text-[11px] mt-2">
                  {statsLoading ? "" : `${stats?.groupCount ?? 0} ta faol guruh`}
                </p>
              </div>
              <UserCheck className="w-14 h-14 text-white/20 shrink-0" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
