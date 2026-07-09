"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { cn } from "@/lib/utils";
import {
  CheckCircle, XCircle, Building2, CreditCard, TrendingUp, Calendar,
  Receipt, Clock, ExternalLink, Check, X,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

const PLAN_PRICE: Record<string, number> = {
  STARTER: 270_000, BUSINESS: 570_000, PREMIUM: 870_000,
  BASIC: 270_000, PRO: 570_000, ENTERPRISE: 870_000,
};

const PLAN_LABEL: Record<string, string> = {
  STARTER: "Starter", BUSINESS: "Business", PREMIUM: "Premium",
  BASIC: "Starter", PRO: "Business", ENTERPRISE: "Premium",
};

function fmtMoney(v: number) {
  return new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 0 }).format(v) + " so'm";
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-800 rounded-lg", className)} />;
}

export default function SubscriptionsPage() {
  const { data: stats, isLoading } = useSWR("/api/admode/stats", fetcher, { refreshInterval: 60_000 });
  const { data: pendingRaw, isLoading: reqLoading } = useSWR(
    "/api/admode/subscription-requests?status=PENDING", fetcher, { refreshInterval: 30_000 },
  );
  const orgs: any[] = stats?.orgs ?? [];
  const pending: any[] = Array.isArray(pendingRaw) ? pendingRaw : [];

  const [busy, setBusy] = useState<string | null>(null);

  async function review(id: string, action: "APPROVE" | "REJECT") {
    let note: string | undefined;
    if (action === "REJECT") {
      note = window.prompt("Rad etish sababi (ixtiyoriy):") ?? undefined;
    }
    setBusy(id);
    try {
      await fetch(`/api/admode/subscription-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      });
      mutate("/api/admode/subscription-requests?status=PENDING");
      mutate("/api/admode/stats");
    } finally { setBusy(null); }
  }

  const totalMrr  = orgs.reduce((s, o) => s + (PLAN_PRICE[o.plan] ?? 0), 0);
  const activeMrr = orgs.filter(o => o.isActive).reduce((s, o) => s + (PLAN_PRICE[o.plan] ?? 0), 0);
  const activeCount = orgs.filter(o => o.isActive).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-black text-white">Obunalar va to'lovlar</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Tarif to'lov so'rovlarini tasdiqlang</p>
      </div>

      {/* ── To'lov so'rovlari (PENDING) ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Receipt className="w-4 h-4 text-amber-400" />
          <h2 className="text-[15px] font-bold text-white">Kutilayotgan to'lovlar</h2>
          {pending.length > 0 && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-900/40 text-amber-300">{pending.length}</span>
          )}
        </div>

        {reqLoading ? (
          <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</div>
        ) : pending.length === 0 ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl py-10 text-center">
            <CheckCircle className="w-7 h-7 mx-auto mb-2 text-neutral-700" />
            <p className="text-[13px] text-neutral-600">Kutilayotgan to'lov so'rovi yo'q</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pending.map(r => (
              <div key={r.id} className="bg-neutral-900 border border-amber-900/30 rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-900/20 border border-amber-900/40 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-white truncate">{r.organization?.name ?? "—"}</p>
                    <div className="flex items-center gap-2 flex-wrap text-[11px] text-neutral-500 mt-0.5">
                      <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 font-medium">{PLAN_LABEL[r.plan] ?? r.plan}</span>
                      <span className="font-semibold text-emerald-400">{fmtMoney(r.amount)}</span>
                      <span>· {r.months} oy</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(r.createdAt).toLocaleDateString("uz-UZ")}</span>
                      {r.receiptUrl && (
                        <a href={r.receiptUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-400 hover:text-blue-300">
                          <ExternalLink className="w-3 h-3" /> Chek
                        </a>
                      )}
                    </div>
                    {r.note && <p className="text-[11px] text-neutral-500 mt-1 italic">"{r.note}"</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => review(r.id, "APPROVE")} disabled={busy === r.id}
                    className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[13px] font-semibold transition-colors">
                    <Check className="w-3.5 h-3.5" /> Tasdiqlash
                  </button>
                  <button onClick={() => review(r.id, "REJECT")} disabled={busy === r.id}
                    className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-neutral-800 hover:bg-red-900/40 text-neutral-300 hover:text-red-400 text-[13px] font-semibold transition-colors">
                    <X className="w-3.5 h-3.5" /> Rad etish
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── MRR overview ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4"><Skeleton className="h-7 w-32" /></div>
          ))
        ) : (
          <>
            <div className="bg-neutral-900 border border-emerald-900/30 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">Faol MRR</p>
              </div>
              <p className="text-[20px] font-black text-emerald-400">{fmtMoney(activeMrr)}</p>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">Potensial MRR</p>
              </div>
              <p className="text-[20px] font-black text-blue-400">{fmtMoney(totalMrr)}</p>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">Faol obunalar</p>
              </div>
              <p className="text-[20px] font-black text-white">{activeCount} <span className="text-[12px] font-medium text-neutral-600">/ {orgs.length}</span></p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
