"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Store, Package, Infinity as InfinityIcon, Clock, Percent } from "lucide-react";
import {
  usePanelShop, usePanelRedemptions,
  KIND_LABELS, KIND_COLORS, STATUS_LABELS, STATUS_COLORS,
} from "@/lib/hooks/useGamification";

const fmtSom = (v: number) => new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 0 }).format(v) + " so'm";

type ShopReward = NonNullable<ReturnType<typeof usePanelShop>["data"]>["rewards"][number];

export function PanelShop() {
  const { data: shop, mutate: refreshShop } = usePanelShop();
  const { data: mine, mutate: refreshMine } = usePanelRedemptions();
  const [target, setTarget] = useState<ShopReward | null>(null);

  if (!shop?.active) return null;

  const rewards = shop.rewards ?? [];
  const balance = shop.coinBalance;
  const coinIcon = shop.coinIcon;
  const pending = (mine ?? []).filter(r => r.status === "PENDING");

  return (
    <>
      <RedeemModal
        reward={target} balance={balance} coinIcon={coinIcon}
        onClose={() => setTarget(null)}
        onDone={() => { refreshShop(); refreshMine(); setTarget(null); }}
      />

      {/* Do'kon */}
      <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/50 dark:border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-pink-50 dark:bg-pink-900/40 flex items-center justify-center">
              <Store className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400" />
            </div>
            <h3 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">Do&apos;kon</h3>
          </div>
          <span className="text-[13px] font-black text-amber-600 dark:text-amber-400">
            {coinIcon} {balance}
          </span>
        </div>

        {rewards.length === 0 ? (
          <div className="py-10 text-center text-sm text-neutral-400">Hozircha sovg&apos;a yo&apos;q</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
            {rewards.map(r => {
              const affordable = balance >= r.cost;
              const soldOut = r.stock != null && r.stock <= 0;
              return (
                <div key={r.id} className={cn(
                  "glass-soft rounded-2xl p-4 border border-white/60 dark:border-white/10 flex flex-col",
                  soldOut && "opacity-50",
                )}>
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-white/70 dark:bg-white/10 flex items-center justify-center text-xl shrink-0">
                      {r.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100 truncate">{r.title}</p>
                      <span className={cn("inline-block mt-1 text-[10px] px-2 py-0.5 rounded-lg font-semibold", KIND_COLORS[r.kind])}>
                        {KIND_LABELS[r.kind]}
                      </span>
                    </div>
                  </div>

                  {r.description && (
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-2 line-clamp-2">{r.description}</p>
                  )}

                  {r.kind === "DISCOUNT" && r.discountAmount && (
                    <p className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-2">
                      <Percent className="w-3 h-3" />{fmtSom(r.discountAmount)} chegirma
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/50 dark:border-white/10">
                    <div>
                      <p className="text-[15px] font-black text-amber-600 dark:text-amber-400 leading-none">
                        {r.cost} {coinIcon}
                      </p>
                      <p className="flex items-center gap-1 text-[10px] text-neutral-400 mt-1">
                        {r.stock == null
                          ? <><InfinityIcon className="w-2.5 h-2.5" />cheksiz</>
                          : <><Package className="w-2.5 h-2.5" />{r.stock} ta qoldi</>}
                      </p>
                    </div>
                    <button
                      onClick={() => setTarget(r)}
                      disabled={!affordable || soldOut}
                      className={cn(
                        "px-3 h-8 rounded-lg text-[12px] font-semibold transition-colors shrink-0",
                        affordable && !soldOut
                          ? "bg-indigo-600 text-white hover:bg-indigo-700"
                          : "bg-neutral-200/70 dark:bg-white/10 text-neutral-400 cursor-not-allowed",
                      )}>
                      {soldOut ? "Tugadi" : affordable ? "So'rash" : `Yana ${r.cost - balance}`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Mening so'rovlarim */}
      {(mine ?? []).length > 0 && (
        <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/50 dark:border-white/10">
            <h3 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">So&apos;rovlarim</h3>
            {pending.length > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                <Clock className="w-3 h-3" />{pending.length} ta kutilmoqda
              </span>
            )}
          </div>
          {(mine ?? []).map(r => (
            <div key={r.id} className="flex items-center gap-3 px-5 py-2.5 border-b border-white/50 dark:border-white/10 last:border-0">
              <span className="text-lg shrink-0">{r.rewardEmoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 truncate">{r.rewardTitle}</p>
                <p className="text-[10px] text-neutral-400">{new Date(r.createdAt).toLocaleDateString("uz-UZ")}</p>
                {r.reviewNote && <p className="text-[11px] text-red-500 truncate">Sabab: {r.reviewNote}</p>}
              </div>
              <div className="text-right shrink-0">
                <p className="text-[12px] font-bold text-neutral-500 dark:text-neutral-400">{r.cost} {coinIcon}</p>
                <span className={cn("inline-block mt-1 text-[10px] px-2 py-0.5 rounded-lg font-semibold", STATUS_COLORS[r.status])}>
                  {STATUS_LABELS[r.status]}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function RedeemModal({ reward, balance, coinIcon, onClose, onDone }: {
  reward: ShopReward | null; balance: number; coinIcon: string;
  onClose: () => void; onDone: () => void;
}) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    if (!reward) return;
    setBusy(true); setErr("");
    try {
      const res = await fetch("/api/panel/gamification/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardId: reward.id, note: note || undefined }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(d.error ?? "So'rov yuborilmadi"); return; }
      setNote("");
      onDone();
    } catch { setErr("Serverga ulanib bo'lmadi"); }
    finally { setBusy(false); }
  }

  return (
    <Modal
      open={!!reward} onClose={onClose}
      title="Sovg'a so'rash"
      subtitle={reward?.title}
      footer={
        <>
          <Button onClick={submit} disabled={busy}
            className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-semibold">
            {busy ? "Yuborilmoqda..." : "So'rov yuborish"}
          </Button>
          <Button variant="outline" className="h-10 px-4 text-[13px]" onClick={onClose}>Bekor</Button>
        </>
      }
    >
      <div className="flex items-center gap-3 glass-soft rounded-2xl p-4 border border-white/60 dark:border-white/10">
        <div className="w-12 h-12 rounded-2xl bg-white/70 dark:bg-white/10 flex items-center justify-center text-2xl shrink-0">
          {reward?.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold text-neutral-900 dark:text-neutral-100 truncate">{reward?.title}</p>
          {reward?.kind === "DISCOUNT" && reward.discountAmount && (
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400">{fmtSom(reward.discountAmount)} chegirma</p>
          )}
        </div>
        <p className="text-[15px] font-black text-amber-600 dark:text-amber-400 shrink-0">
          {reward?.cost} {coinIcon}
        </p>
      </div>

      <div className="px-3.5 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <p className="text-[12px] text-blue-700 dark:text-blue-300">
          So&apos;rov yuborilganda <strong>{reward?.cost} {coinIcon}</strong> darhol yechiladi.
          Balansingiz: {balance} → <strong>{balance - (reward?.cost ?? 0)}</strong>.
          Rad etilsa avtomatik qaytariladi.
        </p>
      </div>

      <FormField label="Izoh" hint="Ixtiyoriy — o'lchami, rangi va h.k.">
        <Input placeholder="M o'lcham" value={note} onChange={e => setNote(e.target.value)} className="h-10" />
      </FormField>

      {err && <p className="text-[12px] text-red-600 dark:text-red-400">{err}</p>}
    </Modal>
  );
}
