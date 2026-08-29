"use client";

import { useState, useMemo } from "react";
import { mutate } from "swr";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Modal, ConfirmDeleteModal } from "@/components/ui/modal";
import { FormField } from "@/components/ui/form-field";
import {
  Gift, Percent, Sparkles, Plus, Pencil, Trash2, Infinity as InfinityIcon,
  Package, AlertTriangle, Store,
} from "lucide-react";
import { useBranches } from "@/lib/hooks/useBranches";
import {
  useRewards, useGamificationSettings, costInLessons, monthlyEarning,
  KIND_LABELS, KIND_COLORS, type Reward, type RewardKind,
} from "@/lib/hooks/useGamification";

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded-xl", className)} />;
}

const fmtSom = (v: number) => new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 0 }).format(v) + " so'm";

const KIND_ICONS: Record<RewardKind, typeof Gift> = {
  PHYSICAL: Gift, DISCOUNT: Percent, PRIVILEGE: Sparkles,
};

/** Tez tanlash uchun — emoji-klaviatura ochishga majbur qilmaslik uchun. */
const EMOJI_PRESETS = [
  "🎁", "👕", "🎒", "🖱️", "⌨️", "🎧", "📚", "✏️",
  "🏆", "🥇", "🎫", "🍕", "🍫", "☕", "💳", "⭐",
  "🎮", "📱", "🧢", "🖼️", "🎓", "💎", "🔥", "🎯",
];

const EMPTY = {
  title: "", description: "", emoji: "🎁", kind: "PHYSICAL" as RewardKind,
  cost: "500", discountAmount: "", stock: "", unlimited: true,
  branchId: "", isActive: true, sortOrder: "0",
};

export function ShopTab({ canManage }: { canManage: boolean }) {
  const { data, isLoading, mutate: refresh } = useRewards();
  const { data: settings } = useGamificationSettings();
  const [editing, setEditing] = useState<Reward | null | "new">(null);
  const [deleteTarget, setDeleteTarget] = useState<Reward | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [err, setErr] = useState("");

  const rewards = data?.rewards ?? [];
  const coinIcon = data?.coinIcon ?? "🪙";
  const perLesson = settings?.attendanceCoin ?? 0;
  const perMonth = settings ? monthlyEarning(settings) : 0;

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true); setErr("");
    try {
      const res = await fetch(`/api/gamification/rewards/${deleteTarget.id}`, { method: "DELETE" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(d.error ?? "O'chirib bo'lmadi"); return; }
      if (d.deactivated) setErr("Bu sovg'ada so'rov tarixi bor — o'chirilmadi, nofaol qilindi");
      refresh();
      setDeleteTarget(null);
    } catch { setErr("Serverga ulanib bo'lmadi"); }
    finally { setDeleting(false); }
  }

  return (
    <div className="space-y-4">
      <RewardModal
        open={editing !== null}
        reward={editing === "new" ? null : editing}
        discountRate={data?.discountRate ?? 50}
        coinIcon={coinIcon}
        perLesson={perLesson}
        perMonth={perMonth}
        onClose={() => setEditing(null)}
        onSaved={() => { refresh(); mutate("/api/gamification/rewards"); }}
      />
      <ConfirmDeleteModal
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete} loading={deleting}
        title="Sovg'ani o'chirish"
        description={<><span className="font-semibold">{deleteTarget?.title}</span> o&apos;chirilsinmi?</>}
      />

      {err && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[13px] text-amber-700 dark:text-amber-300 flex-1">{err}</p>
          <button onClick={() => setErr("")} className="text-[12px] font-semibold text-amber-600 hover:underline shrink-0">Yopish</button>
        </div>
      )}

      {/* Do'kon iqtisodiyoti — narx belgilashda asosiy orientir */}
      {settings && (
        <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Store className="w-4 h-4 text-indigo-500" />
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Do&apos;kon iqtisodiyoti</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Metric value={`${perLesson}`} label={`1 dars = ${coinIcon}`} />
            <Metric value={`${perMonth}`} label={`Oyiga o'rtacha ${coinIcon}`} />
            <Metric value={`${perMonth * 12}`} label={`Yiliga o'rtacha ${coinIcon}`} />
            <Metric value={`${data?.discountRate ?? 50}`} label="1 coin = so'm (chegirmada)" />
          </div>
          <p className="text-[11px] text-neutral-400 mt-3">
            Narx belgilashda shu raqamlarga qarang: oyiga ~{perMonth} {coinIcon}{" "}yig&apos;ilsa,
            {" "}{perMonth * 3} {coinIcon}{" "}lik sovg&apos;a ≈ 3 oylik maqsad bo&apos;ladi. Juda arzon
            sovg&apos;a qiziqishni tez o&apos;ldiradi, juda qimmati esa yetib bo&apos;lmas ko&apos;rinadi.
          </p>
        </div>
      )}

      <div className="flex items-center gap-3">
        {canManage && (
          <button onClick={() => setEditing("new")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
            <Plus className="w-3.5 h-3.5" />{" "}Yangi sovg&apos;a
          </button>
        )}
        <span className="ml-auto text-xs text-neutral-400">{rewards.length} ta sovg&apos;a</span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)}
        </div>
      ) : rewards.length === 0 ? (
        <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl flex flex-col items-center py-16 text-neutral-400">
          <Gift className="w-10 h-10 mb-2 opacity-30" />
          <p className="text-sm">Hali sovg&apos;a qo&apos;shilmagan</p>
          <p className="text-[12px] mt-1">O&apos;quvchilar coin yig&apos;ishmoqda — sarflashga narsa qo&apos;shing</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {rewards.map(r => {
            const Icon = KIND_ICONS[r.kind];
            const est = costInLessons(r.cost, perLesson);
            return (
              <div key={r.id} className={cn(
                "glass-panel border rounded-2xl p-4 flex flex-col",
                r.isActive ? "border-white/60 dark:border-white/10" : "border-neutral-300/60 dark:border-white/5 opacity-60",
              )}>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl glass-soft flex items-center justify-center text-2xl shrink-0">
                    {r.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-neutral-900 dark:text-neutral-100 truncate">{r.title}</p>
                    <span className={cn("inline-flex items-center gap-1 mt-1 text-[10px] px-2 py-0.5 rounded-lg font-semibold", KIND_COLORS[r.kind])}>
                      <Icon className="w-2.5 h-2.5" />{KIND_LABELS[r.kind]}
                    </span>
                  </div>
                  {!r.isActive && (
                    <span className="text-[10px] px-2 py-0.5 rounded-lg font-semibold bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 shrink-0">
                      Nofaol
                    </span>
                  )}
                </div>

                {r.description && (
                  <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-2.5 line-clamp-2">{r.description}</p>
                )}

                <div className="flex items-end justify-between mt-3 pt-3 border-t border-white/50 dark:border-white/10">
                  <div>
                    <p className="text-[18px] font-black text-amber-600 dark:text-amber-400 leading-none">
                      {r.cost} {coinIcon}
                    </p>
                    <p className="text-[10px] text-neutral-400 mt-1">
                      {r.kind === "DISCOUNT" && r.discountAmount ? `= ${fmtSom(r.discountAmount)}` : null}
                      {r.kind !== "DISCOUNT" && est ? `≈ ${est.lessons} dars` : null}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="flex items-center justify-end gap-1 text-[12px] font-semibold text-neutral-600 dark:text-neutral-400">
                      {r.stock == null
                        ? <><InfinityIcon className="w-3.5 h-3.5" />cheksiz</>
                        : <><Package className="w-3.5 h-3.5" />{r.stock} ta</>}
                    </p>
                    {(r._count?.redemptions ?? 0) > 0 && (
                      <p className="text-[10px] text-neutral-400 mt-0.5">{r._count!.redemptions} marta so&apos;ralgan</p>
                    )}
                  </div>
                </div>

                {r.branch && (
                  <p className="text-[10px] text-neutral-400 mt-2">Faqat: {r.branch.name}</p>
                )}

                {canManage && (
                  <div className="flex gap-1 mt-3">
                    <button onClick={() => setEditing(r)}
                      className="flex-1 h-8 rounded-lg glass-soft border border-white/60 dark:border-white/10 text-[12px] font-semibold text-neutral-600 dark:text-neutral-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-1.5">
                      <Pencil className="w-3 h-3" /> Tahrirlash
                    </button>
                    <button onClick={() => setDeleteTarget(r)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="glass-soft rounded-xl p-3">
      <p className="text-[18px] font-black text-neutral-900 dark:text-neutral-100 leading-none">{value}</p>
      <p className="text-[10px] text-neutral-400 mt-1">{label}</p>
    </div>
  );
}

// ─── Sovg'a formasi ───────────────────────────────────────────────────────────

function RewardModal({
  open, reward, discountRate, coinIcon, perLesson, perMonth, onClose, onSaved,
}: {
  open: boolean; reward: Reward | null; discountRate: number; coinIcon: string;
  perLesson: number; perMonth: number; onClose: () => void; onSaved: () => void;
}) {
  const { data: branchesRaw } = useBranches();
  const branches: any[] = Array.isArray(branchesRaw) ? branchesRaw : [];

  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [loadedId, setLoadedId] = useState<string | null>(null);

  // Modal ochilganda formani to'ldiramiz (reward o'zgarsa qayta)
  const targetId = reward?.id ?? "new";
  if (open && loadedId !== targetId) {
    setLoadedId(targetId);
    setForm(reward
      ? {
          title: reward.title, description: reward.description ?? "", emoji: reward.emoji,
          kind: reward.kind, cost: String(reward.cost),
          discountAmount: reward.discountAmount != null ? String(reward.discountAmount) : "",
          stock: reward.stock != null ? String(reward.stock) : "",
          unlimited: reward.stock == null, branchId: reward.branchId ?? "",
          isActive: reward.isActive, sortOrder: String(reward.sortOrder),
        }
      : EMPTY);
    setErr("");
  }
  if (!open && loadedId !== null) setLoadedId(null);

  const cost = Number(form.cost) || 0;
  const est = useMemo(() => costInLessons(cost, perLesson), [cost, perLesson]);
  const autoDiscount = cost * discountRate;
  const effectiveDiscount = form.discountAmount ? Number(form.discountAmount) : autoDiscount;

  function set<K extends keyof typeof EMPTY>(k: K, v: (typeof EMPTY)[K]) {
    setForm(p => ({ ...p, [k]: v }));
    setErr("");
  }

  async function submit() {
    if (!form.title.trim()) { setErr("Sovg'a nomini kiriting"); return; }
    if (cost < 1) { setErr("Narx kamida 1 coin bo'lishi kerak"); return; }
    setSaving(true); setErr("");

    const body: Record<string, unknown> = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      emoji: form.emoji,
      kind: form.kind,
      cost,
      stock: form.unlimited ? null : Number(form.stock) || 0,
      branchId: form.branchId || null,
      isActive: form.isActive,
      sortOrder: Number(form.sortOrder) || 0,
      discountAmount: form.kind === "DISCOUNT" ? effectiveDiscount : null,
    };

    try {
      const res = await fetch(
        reward ? `/api/gamification/rewards/${reward.id}` : "/api/gamification/rewards",
        {
          method: reward ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(d.error ?? "Saqlab bo'lmadi"); return; }
      onSaved();
      onClose();
    } catch { setErr("Serverga ulanib bo'lmadi"); }
    finally { setSaving(false); }
  }

  return (
    <Modal
      open={open} onClose={onClose}
      title={reward ? "Sovg'ani tahrirlash" : "Yangi sovg'a"}
      subtitle={reward ? reward.title : "O'quvchilar coinni shunga almashtiradi"}
      size="lg"
      footer={
        <>
          <Button onClick={submit} disabled={saving}
            className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-semibold">
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
          <Button variant="outline" className="h-10 px-4 text-[13px]" onClick={onClose}>Bekor</Button>
        </>
      }
    >
      {/* Jonli ko'rinish — o'quvchi aynan shuni ko'radi */}
      <div className="glass-soft rounded-2xl p-4 border border-white/60 dark:border-white/10">
        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2.5">
          O&apos;quvchi shunday ko&apos;radi
        </p>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/70 dark:bg-white/10 flex items-center justify-center text-2xl shrink-0">
            {form.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold text-neutral-900 dark:text-neutral-100 truncate">
              {form.title || "Sovg'a nomi"}
            </p>
            <p className="text-[11px] text-neutral-400 truncate">
              {form.description || KIND_LABELS[form.kind]}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[16px] font-black text-amber-600 dark:text-amber-400 leading-none">
              {cost} {coinIcon}
            </p>
            {form.kind === "DISCOUNT" && (
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">{fmtSom(effectiveDiscount)}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tur */}
      <FormField label="Sovg'a turi">
        <div className="grid grid-cols-3 gap-1.5">
          {(["PHYSICAL", "DISCOUNT", "PRIVILEGE"] as RewardKind[]).map(k => {
            const Icon = KIND_ICONS[k];
            const active = form.kind === k;
            return (
              <button key={k} type="button" onClick={() => set("kind", k)}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 rounded-xl border text-[11px] font-semibold transition-all",
                  active
                    ? "bg-indigo-600 text-white border-neutral-900 dark:bg-indigo-500"
                    : "glass-soft text-neutral-600 dark:text-neutral-400 border-white/60 dark:border-white/10 hover:border-neutral-400",
                )}>
                <Icon className="w-4 h-4" />
                {KIND_LABELS[k]}
              </button>
            );
          })}
        </div>
      </FormField>

      {form.kind === "DISCOUNT" && (
        <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
          <Percent className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
            Tasdiqlangach {fmtSom(effectiveDiscount)} o&apos;quvchi <strong>balansiga</strong>{" "}qo&apos;shiladi
            (qarzi kamayadi). Bu daromad hisobotiga <strong>kirmaydi</strong> — chegirma haqiqiy tushum emas.
          </p>
        </div>
      )}

      <FormField label="Nomi" required>
        <Input placeholder="Brend sumka" value={form.title}
          onChange={e => set("title", e.target.value)} className="h-10" />
      </FormField>

      <FormField label="Tavsif" hint="Ixtiyoriy — do'konda ko'rinadi">
        <Input placeholder="OneRoom logotipi bilan" value={form.description}
          onChange={e => set("description", e.target.value)} className="h-10" />
      </FormField>

      {/* Emoji */}
      <FormField label="Belgi" hint="Do'kon kartasida ko'rinadi">
        <div className="flex flex-wrap gap-1.5">
          {EMOJI_PRESETS.map(e => (
            <button key={e} type="button" onClick={() => set("emoji", e)}
              className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all",
                form.emoji === e
                  ? "bg-indigo-100 dark:bg-indigo-400/20 ring-2 ring-indigo-500"
                  : "glass-soft border border-white/60 dark:border-white/10 hover:border-neutral-400",
              )}>
              {e}
            </button>
          ))}
        </div>
      </FormField>

      {/* Narx + kalkulyator */}
      <FormField label={`Narxi (${coinIcon})`} required>
        <Input type="number" value={form.cost} onChange={e => set("cost", e.target.value)} className="h-10" />
      </FormField>

      {cost > 0 && perLesson > 0 && (
        <div className={cn(
          "flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl border",
          est && est.lessons <= 15
            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
            : est && est.lessons <= 60
            ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
            : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
        )}>
          <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-neutral-500" />
          <div className="text-[11px] text-neutral-700 dark:text-neutral-300">
            <p>
              O&apos;quvchi buni yig&apos;ish uchun <strong>≈ {est?.lessons} ta darsga</strong> kelishi kerak
              {" "}(taxminan <strong>{est?.months} oy</strong>, faqat davomat hisobiga).
            </p>
            <p className="text-neutral-500 dark:text-neutral-400 mt-0.5">
              To&apos;lov bonuslari bilan birga oyiga ~{perMonth} {coinIcon} —
              {" "}<strong>{perMonth > 0 ? Math.ceil(cost / perMonth) : "?"} oy</strong> atrofida.
              {est && est.lessons <= 15 && " Juda arzon — tez zeriktirishi mumkin."}
              {est && est.lessons > 60 && " Juda qimmat — yetib bo'lmas ko'rinishi mumkin."}
            </p>
          </div>
        </div>
      )}

      {form.kind === "DISCOUNT" && (
        <FormField label="Chegirma summasi (so'm)"
          hint={`Bo'sh qoldirilsa avtomatik: ${cost} × ${discountRate} = ${fmtSom(autoDiscount)}`}>
          <Input type="number" placeholder={String(autoDiscount)} value={form.discountAmount}
            onChange={e => set("discountAmount", e.target.value)} className="h-10" />
        </FormField>
      )}

      {/* Zaxira */}
      <FormField label="Zaxira">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => set("unlimited", !form.unlimited)}
            className={cn(
              "flex items-center gap-1.5 px-3 h-10 rounded-xl border text-[12px] font-semibold transition-all shrink-0",
              form.unlimited
                ? "bg-indigo-600 text-white border-neutral-900 dark:bg-indigo-500"
                : "glass-soft text-neutral-600 dark:text-neutral-400 border-white/60 dark:border-white/10",
            )}>
            <InfinityIcon className="w-3.5 h-3.5" /> Cheksiz
          </button>
          {!form.unlimited && (
            <Input type="number" placeholder="Nechta bor" value={form.stock}
              onChange={e => set("stock", e.target.value)} className="h-10 flex-1" />
          )}
        </div>
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Filial" hint="Bo'sh = barchasiga">
          <select value={form.branchId} onChange={e => set("branchId", e.target.value)}
            className="w-full h-10 px-2.5 text-[13px] rounded-lg border border-white/60 dark:border-white/10 glass-soft text-neutral-900 dark:text-neutral-100 outline-none">
            <option value="">Barcha filiallar</option>
            {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </FormField>
        <FormField label="Tartib raqami" hint="Kichigi yuqorida turadi">
          <Input type="number" value={form.sortOrder}
            onChange={e => set("sortOrder", e.target.value)} className="h-10" />
        </FormField>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-white/50 dark:border-white/10 px-3.5 py-3">
        <div>
          <p className="text-[13px] font-semibold text-neutral-800 dark:text-neutral-200">Do&apos;konda ko&apos;rinsin</p>
          <p className="text-[11px] text-neutral-400 mt-0.5">Nofaol bo&apos;lsa o&apos;quvchilar ko&apos;rmaydi</p>
        </div>
        <button type="button" onClick={() => set("isActive", !form.isActive)}
          className={cn("relative w-10 h-6 rounded-full transition-colors shrink-0",
            form.isActive ? "bg-green-500" : "bg-neutral-300 dark:bg-neutral-600")}>
          <span className={cn("absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform",
            form.isActive && "translate-x-4")} />
        </button>
      </div>

      {err && <p className="text-[12px] text-red-600 dark:text-red-400">{err}</p>}
    </Modal>
  );
}
