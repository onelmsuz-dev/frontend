"use client";

import { useState, useMemo } from "react";
import useSWR, { mutate } from "swr";
import { fetcher } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import { Building2, Search, Check, Loader2, Wallet, AlertCircle } from "lucide-react";

/**
 * /admode → TO'LOV REJIMLARI.
 *
 * Platforma egasi har bir markazga qaysi rejimlardan foydalanishga ruxsat
 * berishini shu yerda hal qiladi. Markaz keyin o'ziga ochilganlardan
 * birini tanlaydi.
 *
 * Ikki bosqich ataylab: rejim hisob-kitobni tubdan o'zgartiradi, va markaz
 * uni tushunmasdan yoqib qo'ysa o'quvchilardan noto'g'ri pul olina
 * boshlardi. Avval gaplashiladi, keyin ochiladi.
 */

interface ModeInfo { mode: string; label: string; short: string; ready: boolean }
interface OrgRow {
  id: string; name: string; subdomain: string;
  billingMode: string; billingModeSince: string | null;
  isDemo: boolean; granted: string[];
}

export default function AdmodeBillingPage() {
  const { data, error, isLoading } = useSWR<{ modes: ModeInfo[]; organizations: OrgRow[] }>(
    "/api/admode/billing", fetcher);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const orgs = useMemo(() => {
    const list = data?.organizations ?? [];
    const n = q.trim().toLowerCase();
    return n ? list.filter((o) =>
      o.name?.toLowerCase().includes(n) || o.subdomain?.toLowerCase().includes(n)) : list;
  }, [data, q]);

  async function toggle(org: OrgRow, mode: string, enabled: boolean) {
    const key = `${org.id}:${mode}`;
    setBusy(key); setMsg(null);
    try {
      const r = await fetch(`/api/admode/billing/${org.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode, enabled }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error ?? "Saqlab bo'lmadi");
      setMsg({ ok: true, text:
        `${org.name}: ${mode} ${enabled ? "ochildi" : "yopildi"}` });
      mutate("/api/admode/billing");
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally { setBusy(null); }
  }

  const modes = (data?.modes ?? []).filter((m) => m.mode !== "OYLIK_KALENDAR");

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-4">
      <header>
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          To&apos;lov rejimlari
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
          Har bir markazga qaysi usullardan foydalanishga ruxsat berilishini belgilang
        </p>
      </header>

      {/* Oylik rejim ro'yxatda yo'q — u har doim ochiq va uni yopib bo'lmaydi. */}
      <div className="flex items-start gap-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 px-4 py-3">
        <Wallet className="h-4 w-4 shrink-0 text-neutral-400 mt-px" />
        <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
          <span className="font-medium text-neutral-700 dark:text-neutral-300">
            Oylik (kalendar)
          </span>{" "}
          — standart usul, u har doim ochiq va ro&apos;yxatda ko&apos;rsatilmaydi.
          Quyidagilar esa markaz so&apos;raganda ochiladi. Markaz hozir ishlatayotgan
          rejimni yopib bo&apos;lmaydi — avval uni boshqasiga o&apos;tkazish kerak.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Markaz nomi yoki subdomen…"
          className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700
                     bg-white dark:bg-neutral-900 pl-9 pr-3 py-2.5 text-sm
                     text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400
                     focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/10" />
      </div>

      {msg && (
        <div className={cn("rounded-xl px-4 py-2.5 text-xs",
          msg.ok ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                 : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300")}>
          {msg.text}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="flex items-start gap-2.5 py-8 text-sm text-neutral-600 dark:text-neutral-300">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 text-amber-500 mt-px" />
          <p>Ro&apos;yxatni yuklab bo&apos;lmadi</p>
        </div>
      ) : orgs.length === 0 ? (
        <p className="py-10 text-center text-sm text-neutral-500 dark:text-neutral-400">
          Markaz topilmadi
        </p>
      ) : (
        <ul className="space-y-2">
          {orgs.map((org) => (
            <li key={org.id}
              className="rounded-2xl border border-neutral-200 dark:border-neutral-800
                         bg-white dark:bg-neutral-900 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 shrink-0 rounded-lg bg-neutral-100 dark:bg-neutral-800 grid place-items-center">
                  <Building2 className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                    {org.name}
                    {org.isDemo && (
                      <span className="ml-2 rounded-md bg-amber-100 dark:bg-amber-900/40 px-1.5 py-px
                                       text-[10px] font-medium text-amber-700 dark:text-amber-300">
                        demo
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                    {org.subdomain} · hozir:{" "}
                    <span className="font-medium text-neutral-600 dark:text-neutral-300">
                      {data?.modes.find((m) => m.mode === org.billingMode)?.label ?? org.billingMode}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {modes.map((m) => {
                  const on = org.granted.includes(m.mode);
                  const inUse = org.billingMode === m.mode;
                  const key = `${org.id}:${m.mode}`;
                  return (
                    <button key={m.mode}
                      title={inUse ? "Markaz hozir shu rejimda — yopib bo'lmaydi" : m.short}
                      onClick={() => toggle(org, m.mode, !on)}
                      disabled={busy !== null || (on && inUse)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5",
                        "text-[11px] font-medium transition-colors disabled:opacity-60",
                        on
                          ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                          : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700",
                      )}>
                      {busy === key
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : on ? <Check className="h-3 w-3" /> : null}
                      {m.label}
                      {inUse && " ✓"}
                    </button>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
