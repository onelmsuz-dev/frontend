"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Check, X, Package, Inbox, Percent } from "lucide-react";
import {
  useRedemptions, KIND_LABELS, KIND_COLORS, STATUS_LABELS, STATUS_COLORS,
  type Redemption, type RedemptionStatus,
} from "@/lib/hooks/useGamification";

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded-xl", className)} />;
}

const fmtSom = (v: number) => new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 0 }).format(v) + " so'm";

const FILTERS: { id: string; label: string }[] = [
  { id: "PENDING",   label: "Kutilmoqda" },
  { id: "APPROVED",  label: "Tasdiqlangan" },
  { id: "DELIVERED", label: "Topshirilgan" },
  { id: "REJECTED",  label: "Rad etilgan" },
  { id: "ALL",       label: "Barchasi" },
];

export function RedemptionsTab({ canManage }: { canManage: boolean }) {
  const [filter, setFilter] = useState("PENDING");
  const { data, isLoading, mutate: refresh } = useRedemptions(filter);
  const [rejectTarget, setRejectTarget] = useState<Redemption | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState("");

  const rows = data?.rows ?? [];

  async function review(id: string, status: RedemptionStatus, reviewNote?: string) {
    setBusyId(id); setErr("");
    try {
      const res = await fetch(`/api/gamification/redemptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewNote }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(d.error ?? "Amalni bajarib bo'lmadi"); return; }
      refresh();
    } catch { setErr("Serverga ulanib bo'lmadi"); }
    finally { setBusyId(null); }
  }

  return (
    <div className="space-y-4">
      <RejectModal
        target={rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={async note => {
          if (!rejectTarget) return;
          await review(rejectTarget.id, "REJECTED", note);
          setRejectTarget(null);
        }}
      />

      {err && (
        <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-[13px] text-red-700 dark:text-red-300">{err}</p>
        </div>
      )}

      <div className="flex items-center gap-1.5 flex-wrap">
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
              filter === f.id
                ? "bg-indigo-600 text-white dark:bg-indigo-500 border-neutral-900"
                : "glass-panel text-neutral-600 dark:text-neutral-400 border-white/60 dark:border-white/10 hover:border-neutral-400")}>
            {f.label}
            {f.id === "PENDING" && (data?.pendingCount ?? 0) > 0 && (
              <span className={cn("ml-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-black",
                filter === "PENDING" ? "bg-white/25" : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300")}>
                {data!.pendingCount}
              </span>
            )}
          </button>
        ))}
        <span className="ml-auto text-xs text-neutral-400">{rows.length} ta</span>
      </div>

      <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-neutral-400">
            <Inbox className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm">
              {filter === "PENDING" ? "Yangi so'rov yo'q" : "Bu holatda so'rov yo'q"}
            </p>
          </div>
        ) : rows.map(r => (
          <div key={r.id}
            className="flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-white/50 dark:border-white/10 last:border-0 hover:bg-white/60 dark:hover:bg-white/10 transition-colors">
            <div className="w-11 h-11 rounded-2xl glass-soft flex items-center justify-center text-xl shrink-0">
              {r.rewardEmoji}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100 truncate">
                  {r.rewardTitle}
                </p>
                <span className={cn("text-[10px] px-2 py-0.5 rounded-lg font-semibold shrink-0", KIND_COLORS[r.kind])}>
                  {KIND_LABELS[r.kind]}
                </span>
                {r.kind === "DISCOUNT" && r.discountAmount && (
                  <span className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Percent className="w-2.5 h-2.5" />{fmtSom(r.discountAmount)}
                  </span>
                )}
              </div>
              <p className="text-[12px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                {r.student?.name} · {r.student?.phone}
              </p>
              {r.note && <p className="text-[11px] text-neutral-400 truncate mt-0.5">&quot;{r.note}&quot;</p>}
              {r.reviewNote && <p className="text-[11px] text-red-500 truncate mt-0.5">Sabab: {r.reviewNote}</p>}
              <p className="text-[10px] text-neutral-400 mt-0.5">
                {new Date(r.createdAt).toLocaleString("uz-UZ")}
              </p>
            </div>

            <div className="text-right shrink-0">
              <p className="text-[14px] font-black text-amber-600 dark:text-amber-400 leading-none">{r.cost} 🪙</p>
              <span className={cn("inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-lg font-semibold", STATUS_COLORS[r.status])}>
                {STATUS_LABELS[r.status]}
              </span>
            </div>

            {canManage && (r.status === "PENDING" || r.status === "APPROVED") && (
              <div className="flex items-center gap-1 shrink-0">
                {r.status === "PENDING" && (
                  <button onClick={() => review(r.id, "APPROVED")} disabled={busyId === r.id}
                    title="Tasdiqlash"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors disabled:opacity-40">
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => review(r.id, "DELIVERED")} disabled={busyId === r.id}
                  title="Topshirildi"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-40">
                  <Package className="w-4 h-4" />
                </button>
                {r.status === "PENDING" && (
                  <button onClick={() => setRejectTarget(r)} disabled={busyId === r.id}
                    title="Rad etish (coin qaytariladi)"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-40">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-[11px] text-neutral-400">
        Coin so&apos;rov yuborilganda darhol yechiladi. Rad etilsa avtomatik qaytariladi va zaxira tiklanadi.
        Tasdiqlangandan keyin rad etib bo&apos;lmaydi.
      </p>
    </div>
  );
}

function RejectModal({ target, onClose, onConfirm }: {
  target: Redemption | null; onClose: () => void; onConfirm: (note: string) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <Modal
      open={!!target} onClose={onClose}
      title="So'rovni rad etish"
      subtitle={target ? `${target.student?.name} — ${target.rewardTitle}` : ""}
      footer={
        <>
          <Button
            onClick={async () => { setBusy(true); await onConfirm(note); setBusy(false); setNote(""); }}
            disabled={busy}
            className="flex-1 h-10 bg-red-600 hover:bg-red-700 text-white text-[13px] font-semibold">
            {busy ? "Rad etilmoqda..." : "Rad etish"}
          </Button>
          <Button variant="outline" className="h-10 px-4 text-[13px]" onClick={onClose}>Bekor</Button>
        </>
      }
    >
      <div className="px-3.5 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <p className="text-[12px] text-blue-700 dark:text-blue-300">
          <strong>{target?.cost} coin</strong>{" "}o&apos;quvchiga qaytariladi
          {target?.rewardTitle && ", zaxira ham tiklanadi"}.
        </p>
      </div>
      <FormField label="Sabab" hint="O'quvchi buni ko'radi">
        <Input placeholder="Sovg'a vaqtincha mavjud emas" value={note}
          onChange={e => setNote(e.target.value)} className="h-10" />
      </FormField>
    </Modal>
  );
}
