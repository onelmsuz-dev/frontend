"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { cn } from "@/lib/utils";
import {
  Building2, Users, GraduationCap, TrendingUp, BookOpen, Target,
  RefreshCw, Search, Wallet, ArrowUpDown,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function fmt(v: number) {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000)     return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)         return `${(v / 1_000).toFixed(0)}K`;
  return String(Math.round(v));
}

function fmtMoney(v: number) {
  return new Intl.NumberFormat("uz-UZ", { style: "currency", currency: "UZS", maximumFractionDigits: 0 }).format(v);
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-800 rounded-lg", className)} />;
}

const PLAN_META: Record<string, { label: string; badge: string; bar: string; text: string }> = {
  STARTER:  { label: "Starter",  badge: "bg-neutral-700 text-neutral-200",  bar: "bg-neutral-400", text: "text-neutral-300" },
  BUSINESS: { label: "Business", badge: "bg-blue-900/60 text-blue-300",     bar: "bg-blue-500",    text: "text-blue-300" },
  PREMIUM:  { label: "Premium",  badge: "bg-purple-900/60 text-purple-300", bar: "bg-purple-500",  text: "text-purple-300" },
};

type SortKey = "revenue" | "students" | "teachers" | "name";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "revenue",  label: "Daromad" },
  { key: "students", label: "O'quvchi" },
  { key: "teachers", label: "O'qituvchi" },
  { key: "name",     label: "Nom" },
];

export default function StatsPage() {
  const { data, isLoading, mutate } = useSWR("/api/admode/stats", fetcher, {
    refreshInterval: 60_000,
  });

  const totals = data?.totals;
  const orgs: any[] = data?.orgs ?? [];

  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("revenue");

  const net = (totals?.revenue ?? 0) - (totals?.expenses ?? 0);
  const avgRevenue = orgs.length ? (totals?.revenue ?? 0) / orgs.length : 0;

  const planCounts = useMemo(() => ({
    STARTER:  orgs.filter((o) => o.plan === "STARTER").length,
    BUSINESS: orgs.filter((o) => o.plan === "BUSINESS").length,
    PREMIUM:  orgs.filter((o) => o.plan === "PREMIUM").length,
  }), [orgs]);
  const totalOrgs = orgs.length || 1;

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = s
      ? orgs.filter((o) => o.name.toLowerCase().includes(s) || o.subdomain.toLowerCase().includes(s))
      : orgs;
    return [...list].sort((a, b) => {
      if (sortKey === "name")     return a.name.localeCompare(b.name);
      if (sortKey === "students") return (b._count?.students ?? 0) - (a._count?.students ?? 0);
      if (sortKey === "teachers") return (b._count?.teachers ?? 0) - (a._count?.teachers ?? 0);
      return (b.revenue ?? 0) - (a.revenue ?? 0);
    });
  }, [orgs, q, sortKey]);

  const kpis = totals ? [
    { label: "O'quv markazlar", value: totals.orgs,     icon: Building2,     color: "text-blue-400",    bg: "bg-blue-900/20",    border: "border-blue-900/30" },
    { label: "O'quvchilar",     value: totals.students, icon: GraduationCap, color: "text-green-400",   bg: "bg-green-900/20",   border: "border-green-900/30" },
    { label: "O'qituvchilar",   value: totals.teachers, icon: Users,         color: "text-purple-400",  bg: "bg-purple-900/20",  border: "border-purple-900/30" },
    { label: "Faol guruhlar",   value: totals.groups,   icon: BookOpen,      color: "text-yellow-400",  bg: "bg-yellow-900/20",  border: "border-yellow-900/30" },
    { label: "Lidlar",          value: totals.leads,    icon: Target,        color: "text-pink-400",    bg: "bg-pink-900/20",    border: "border-pink-900/30" },
    { label: "O'rtacha daromad", value: fmt(avgRevenue), text: true, icon: Wallet, color: "text-cyan-400", bg: "bg-cyan-900/20", border: "border-cyan-900/30" },
  ] : [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">Statistika</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Platforma bo'yicha to'liq ko'rsatkichlar</p>
        </div>
        <button onClick={() => mutate()}
          className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-[12px] text-neutral-400 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
          Yangilash
        </button>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
                <Skeleton className="w-9 h-9 rounded-xl" />
                <Skeleton className="h-7 w-14" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))
          : kpis.map((s) => {
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

      {/* Financial + plan distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Financial */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-[13px] font-bold text-white">Moliyaviy ko'rsatkich</h2>
          {isLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-emerald-900/10 border border-emerald-900/20 rounded-xl">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <p className="text-[12px] text-neutral-400">Jami daromad</p>
                </div>
                <p className="text-[14px] font-black text-emerald-400">{fmtMoney(totals?.revenue ?? 0)}</p>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-900/10 border border-red-900/20 rounded-xl">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-red-400" />
                  <p className="text-[12px] text-neutral-400">Jami xarajat</p>
                </div>
                <p className="text-[14px] font-black text-red-400">{fmtMoney(totals?.expenses ?? 0)}</p>
              </div>
              <div className="flex items-center justify-between p-3 bg-neutral-800/60 border border-neutral-700 rounded-xl">
                <p className="text-[12px] text-neutral-400">Sof foyda</p>
                <p className={cn("text-[14px] font-black", net >= 0 ? "text-white" : "text-red-400")}>
                  {fmtMoney(net)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Plan distribution */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-[13px] font-bold text-white">Tarif taqsimoti</h2>
          {isLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : (
            <div className="space-y-3">
              {(["PREMIUM", "BUSINESS", "STARTER"] as const).map((plan) => {
                const count = planCounts[plan];
                const pct = Math.round((count / totalOrgs) * 100);
                const cfg = PLAN_META[plan];
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
      </div>

      {/* Org table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-neutral-800">
          <h2 className="text-[13px] font-bold text-white">Markazlar kesimida ({orgs.length})</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Qidirish..."
                className="w-40 pl-8 pr-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-[12px] text-white placeholder:text-neutral-600 outline-none focus:border-neutral-600"
              />
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-neutral-800 border border-neutral-700 p-0.5">
              {SORTS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSortKey(s.key)}
                  className={cn(
                    "px-2 py-1 rounded-md text-[11px] font-medium transition-colors",
                    sortKey === s.key ? "bg-blue-600 text-white" : "text-neutral-400 hover:text-white",
                  )}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-neutral-500 border-b border-neutral-800">
                <th className="text-left font-semibold px-4 py-2.5">Markaz</th>
                <th className="text-left font-semibold px-3 py-2.5">Tarif</th>
                <th className="text-right font-semibold px-3 py-2.5">O'quvchi</th>
                <th className="text-right font-semibold px-3 py-2.5">O'qituvchi</th>
                <th className="text-right font-semibold px-3 py-2.5">Guruh</th>
                <th className="text-right font-semibold px-3 py-2.5">Lid</th>
                <th className="text-right font-semibold px-4 py-2.5">Daromad</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-neutral-800/60">
                    <td className="px-4 py-3" colSpan={7}><Skeleton className="h-5 w-full" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-[12px] text-neutral-600 py-10">
                    {orgs.length === 0 ? "Hali markaz yo'q" : "Natija topilmadi"}
                  </td>
                </tr>
              ) : (
                filtered.map((org) => {
                  const meta = PLAN_META[org.plan] ?? PLAN_META.STARTER;
                  return (
                    <tr key={org.id} className="border-b border-neutral-800/60 hover:bg-neutral-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-[12px] font-semibold text-white truncate max-w-[200px]">{org.name}</p>
                        <p className="text-[10px] text-neutral-500">{org.subdomain}.oneroom.uz</p>
                      </td>
                      <td className="px-3 py-3">
                        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full", meta.badge)}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right text-[12px] font-semibold text-white tabular-nums">{org._count?.students ?? 0}</td>
                      <td className="px-3 py-3 text-right text-[12px] text-neutral-300 tabular-nums">{org._count?.teachers ?? 0}</td>
                      <td className="px-3 py-3 text-right text-[12px] text-neutral-300 tabular-nums">{org._count?.groups ?? 0}</td>
                      <td className="px-3 py-3 text-right text-[12px] text-neutral-300 tabular-nums">{org._count?.leads ?? 0}</td>
                      <td className="px-4 py-3 text-right text-[12px] font-bold text-emerald-400 tabular-nums whitespace-nowrap">{fmtMoney(org.revenue ?? 0)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
