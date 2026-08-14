"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import {
  Store, Package, Infinity as InfinityIcon, Clock, Percent,
  AlertCircle, Lock, Gift, CheckCircle2,
} from "lucide-react";
import {
  usePanelShop, usePanelRedemptions,
  KIND_LABELS, KIND_COLORS, STATUS_LABELS, STATUS_COLORS,
} from "@/lib/hooks/useGamification";

const fmtSom = (v: number) => new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 0 }).format(v) + " so'm";

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded-xl", className)} />;
}

type ShopReward = NonNullable<ReturnType<typeof usePanelShop>["data"]>["rewards"][number];

/**
 * "Do'kon" tabi — o'quvchi ballarini sovg'aga almashtiradi.
 *
 * Ilgari bu bo'lim "Ballarim" tabining ICHIDA, reyting va referaldan keyin
 * turardi — ya'ni ballni sarflash uchun uzoq aylantirish kerak edi va ko'p
 * o'quvchi uni umuman topmasdi. Endi alohida tab.
 *
 * Barcha holat ochiq ko'rsatiladi: yuklanmoqda, xato, o'chirilgan,
 * sovg'a yo'q, coin yetmaydi, zaxira tugagan.
 */
export function PanelShop() {
  const { data: shop, isLoading, error, mutate: refreshShop } = usePanelShop();
  const { data: mine, mutate: refreshMine } = usePanelRedemptions();
  const [target, setTarget] = useState<ShopReward | null>(null);
  const [done, setDone] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
        <p className="text-[14px] font-bold text-neutral-900 dark:text-neutral-100">
          Do&apos;konni yuklab bo&apos;lmadi
        </p>
        <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-1">{(error as Error).message}</p>
      </div>
    );
  }

  if (!shop?.active) {
    return (
      <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-6 text-center">
        <Lock className="w-8 h-8 mx-auto mb-2 text-neutral-300 dark:text-neutral-600" />
        <p className="text-[14px] font-bold text-neutral-900 dark:text-neutral-100">
          Do&apos;kon hozircha yopiq
        </p>
        <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
          O&apos;quv markazingiz do&apos;konni yoqqanda, yig&apos;gan ballaringizni
          sovg&apos;alarga almashtira olasiz.
        </p>
      </div>
    );
  }

  const rewards = shop.rewards ?? [];
  const balance = shop.coinBalance;
  const coinIcon = shop.coinIcon;
  const list = mine ?? [];
  const pending = list.filter(r => r.status === "PENDING");

  return (
    <div className="space-y-4">
      <RedeemModal
        reward={target} balance={balance} coinIcon={coinIcon}
        onClose={() => setTarget(null)}
        onDone={() => {
          refreshShop(); refreshMine(); setTarget(null);
          setDone(true); setTimeout(() => setDone(false), 4000);
        }}
      />

      {done && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
          <p className="text-[13px] text-green-700 dark:text-green-300">
            So&apos;rovingiz yuborildi. Markaz tasdiqlagach sovg&apos;ani olasiz.
          </p>
        </div>
      )}

      {/* Balans */}
      <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-pink-50 dark:bg-pink-900/40 flex items-center justify-center shrink-0">
            <Store className="w-4.5 h-4.5 text-pink-600 dark:text-pink-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">Do&apos;kon</p>
            <p className="text-[11px] text-neutral-400">
              {rewards.length} ta sovg&apos;a{pending.length > 0 ? ` · ${pending.length} so'rov kutilmoqda` : ""}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[24px] font-black text-amber-600 dark:text-amber-400 leading-none">
            {coinIcon} {balance}
          </p>
          <p className="text-[11px] text-neutral-400 mt-0.5">{shop.coinName} balansi</p>
        </div>
      </div>

      {/* Sovg'alar */}
      {rewards.length === 0 ? (
        <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-8 text-center">
          <Gift className="w-10 h-10 mx-auto mb-2 text-neutral-300 dark:text-neutral-600" />
          <p className="text-[14px] font-bold text-neutral-900 dark:text-neutral-100">
            Hozircha sovg&apos;a qo&apos;shilmagan
          </p>
          <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
            Ballaringiz saqlanib turadi — markaz sovg&apos;a qo&apos;shishi bilan
            shu yerda paydo bo&apos;ladi.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {rewards.map(r => {
            const affordable = balance >= r.cost;
            const soldOut = r.stock != null && r.stock <= 0;
            const need = r.cost - balance;
            return (
              <div key={r.id} className={cn(
                "glass-panel border rounded-2xl p-4 flex flex-col transition-opacity",
                soldOut ? "border-white/60 dark:border-white/10 opacity-55" : "border-white/60 dark:border-white/10",
              )}>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl glass-soft flex items-center justify-center text-2xl shrink-0">
                    {r.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-neutral-900 dark:text-neutral-100 truncate">{r.title}</p>
                    <span className={cn("inline-block mt-1 text-[10px] px-2 py-0.5 rounded-lg font-semibold", KIND_COLORS[r.kind])}>
                      {KIND_LABELS[r.kind]}
                    </span>
                  </div>
                </div>

                {r.description && (
                  <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-2.5 line-clamp-2">{r.description}</p>
                )}

                {r.kind === "DISCOUNT" && r.discountAmount && (
                  <p className="flex items-center gap-1 text-[12px] font-semibold text-emerald-600 dark:text-emerald-400 mt-2">
                    <Percent className="w-3 h-3" />{fmtSom(r.discountAmount)} chegirma
                  </p>
                )}

                {/* Progress — maqsadga qancha qolgani */}
                {!affordable && !soldOut && (
                  <div className="mt-3">
                    <div className="h-1.5 rounded-full bg-neutral-200/70 dark:bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full bg-amber-500 transition-all"
                        style={{ width: `${Math.min(100, (balance / r.cost) * 100)}%` }} />
                    </div>
                    <p className="text-[10px] text-neutral-400 mt-1">
                      Yana {need} {coinIcon} kerak
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/50 dark:border-white/10">
                  <div>
                    <p className="text-[16px] font-black text-amber-600 dark:text-amber-400 leading-none">
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
                      "px-4 h-9 rounded-xl text-[12px] font-bold transition-colors shrink-0",
                      affordable && !soldOut
                        ? "bg-indigo-600 text-white hover:bg-indigo-700"
                        : "bg-neutral-200/70 dark:bg-white/10 text-neutral-400 cursor-not-allowed",
                    )}>
                    {soldOut ? "Tugadi" : affordable ? "Olish" : "Yetmaydi"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mening so'rovlarim */}
      {list.length > 0 && (
        <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/50 dark:border-white/10">
            <h3 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">So&apos;rovlarim</h3>
            {pending.length > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                <Clock className="w-3 h-3" />{pending.length} ta kutilmoqda
              </span>
            )}
          </div>
          {list.map(r => (
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
    </div>
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
      if (!res.ok) { setErr(d.error ?? `So'rov yuborilmadi (${res.status})`); return; }
      setNote("");
      onDone();
    } catch { setErr("Serverga ulanib bo'lmadi"); }
    finally { setBusy(false); }
  }

  return (
    <Modal
      open={!!reward} onClose={onClose}
      title="Sovg'a olish"
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
          Markaz rad etsa avtomatik qaytariladi.
        </p>
      </div>

      <FormField label="Izoh" hint="Ixtiyoriy — o'lchami, rangi va h.k.">
        <Input placeholder="M o'lcham" value={note} onChange={e => setNote(e.target.value)} className="h-10" />
      </FormField>

      {err && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-[12px] text-red-600 dark:text-red-400">{err}</p>
        </div>
      )}
    </Modal>
  );
}
