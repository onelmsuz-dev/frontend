"use client";

import useSWR from "swr";
import { cn } from "@/lib/utils";
import {
  Building2, Users, GraduationCap, TrendingUp, BookOpen,
  Target, ArrowUpRight, RefreshCw, Clock,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

function fmt(v: number) {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000)     return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)         return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
}

function fmtMoney(v: number) {
  return new Intl.NumberFormat("uz-UZ", { style: "currency", currency: "UZS", maximumFractionDigits: 0 }).format(v);
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-800 rounded-lg", className)} />;
}

const PLAN_COLOR: Record<string, string> = {
  BASIC:      "bg-neutral-700 text-neutral-300",
  PRO:        "bg-blue-900/60 text-blue-300",
  ENTERPRISE: "bg-purple-900/60 text-purple-300",
};

export default function AdmodeDashboard() {
  const { data, isLoading, mutate } = useSWR("/api/admode/stats", fetcher, {
    refreshInterval: 60_000,
  });

  const totals = data?.totals;
  const orgs: any[] = data?.orgs ?? [];
  const recent = [...orgs].slice(0, 5);

  const stats = totals ? [
    { label: "O'quv markazlar",  value: totals.orgs,                       icon: Building2,     color: "text-blue-400",    bg: "bg-blue-900/20",    border: "border-blue-900/30" },
    { label: "Jami o'quvchilar", value: totals.students,                   icon: GraduationCap, color: "text-green-400",   bg: "bg-green-900/20",   border: "border-green-900/30" },
    { label: "O'qituvchilar",    value: totals.teachers,                   icon: Users,         color: "text-purple-400",  bg: "bg-purple-900/20",  border: "border-purple-900/30" },
    { label: "Faol guruhlar",    value: totals.groups,                     icon: BookOpen,      color: "text-yellow-400",  bg: "bg-yellow-900/20",  border: "border-yellow-900/30" },
    { label: "Lidlar",           value: totals.leads,                      icon: Target,        color: "text-pink-400",    bg: "bg-pink-900/20",    border: "border-pink-900/30" },
    { label: "Jami daromad",     value: fmt(totals.revenue), text: true,   icon: TrendingUp,    color: "text-emerald-400", bg: "bg-emerald-900/20", border: "border-emerald-900/30" },
  ] : [];

  const planCounts = {
    BASIC:      orgs.filter(o => o.plan === "BASIC").length,
    PRO:        orgs.filter(o => o.plan === "PRO").length,
    ENTERPRISE: orgs.filter(o => o.plan === "ENTERPRISE").length,
  };
  const totalOrgs = orgs.length || 1;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">Dashboard</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Platform umumiy ko'rinishi</p>
        </div>
        <button onClick={() => mutate()}
          className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-[12px] text-neutral-400 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
          Yangilash
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
                <Skeleton className="w-9 h-9 rounded-xl" />
                <Skeleton className="h-7 w-14" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))
          : stats.map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label}
                  className={cn("bg-neutral-900 border rounded-2xl p-4 hover:border-neutral-700 transition-colors", s.border)}>
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", s.bg)}>
                    <Icon className={cn("w-4 h-4", s.color)} />
                  </div>
                  <p className="text-[22px] font-black text-white leading-none">
                    {s.text ? s.value : Number(s.value).toLocaleString()}
                  </p>
                  <p className="text-[11px] text-neutral-500 mt-1">{s.label}</p>
                </div>
              );
            })
        }
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue summary */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-[13px] font-bold text-white">Moliyaviy ko'rsatkich</h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-8" />)}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-emerald-900/10 border border-emerald-900/20 rounded-xl">
                <p className="text-[12px] text-neutral-400">Jami daromad</p>
                <p className="text-[14px] font-black text-emerald-400">{fmtMoney(totals?.revenue ?? 0)}</p>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-900/10 border border-red-900/20 rounded-xl">
                <p className="text-[12px] text-neutral-400">Jami xarajat</p>
                <p className="text-[14px] font-black text-red-400">{fmtMoney(totals?.expenses ?? 0)}</p>
              </div>
              <div className="flex items-center justify-between p-3 bg-neutral-800/60 border border-neutral-700 rounded-xl">
                <p className="text-[12px] text-neutral-400">Sof foyda</p>
                <p className={cn("text-[14px] font-black",
                  ((totals?.revenue ?? 0) - (totals?.expenses ?? 0)) >= 0 ? "text-white" : "text-red-400")}>
                  {fmtMoney((totals?.revenue ?? 0) - (totals?.expenses ?? 0))}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Plan distribution */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-[13px] font-bold text-white">Tarif taqsimoti</h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-10" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {(["ENTERPRISE","PRO","BASIC"] as const).map(plan => {
                const count = planCounts[plan];
                const pct = Math.round((count / totalOrgs) * 100);
                const cfg = {
                  ENTERPRISE: { label: "Enterprise", bar: "bg-purple-500",  text: "text-purple-300" },
                  PRO:        { label: "Pro",        bar: "bg-blue-500",    text: "text-blue-300" },
                  BASIC:      { label: "Basic",      bar: "bg-neutral-500", text: "text-neutral-300" },
                }[plan];
                return (
                  <div key={plan}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={cn("text-[12px] font-semibold", cfg.text)}>{cfg.label}</span>
                      <span className="text-[11px] text-neutral-500">{count} ta ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all", cfg.bar)} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent orgs */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-bold text-white">So'nggi qo'shilganlar</h2>
            <Clock className="w-3.5 h-3.5 text-neutral-600" />
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-10" />)}
            </div>
          ) : recent.length === 0 ? (
            <p className="text-[12px] text-neutral-600 text-center py-4">Hali markaz yo'q</p>
          ) : (
            <div className="space-y-2">
              {recent.map(org => (
                <div key={org.id} className="flex items-center justify-between gap-2 group">
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-white truncate">{org.name}</p>
                    <p className="text-[10px] text-neutral-500">{org.subdomain}.oneroom.uz</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full", PLAN_COLOR[org.plan])}>
                      {org.plan}
                    </span>
                    <ArrowUpRight className="w-3 h-3 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
