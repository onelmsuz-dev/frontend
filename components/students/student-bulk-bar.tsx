"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  X, Users, Shuffle, LogOut, UserCheck, UserX, MessageSquare, AlertCircle, Check,
} from "lucide-react";

type BulkAction = "add-to-group" | "transfer-group" | "exit-group" | "activate" | "deactivate";

interface BulkError { studentId: string; name?: string; message: string }

interface Props {
  /** Tanlangan o'quvchilar (id + ism — tasdiq oynasida ko'rsatiladi). */
  selected: { id: string; name: string }[];
  groups: { id: string; name: string; course?: { name?: string } }[];
  onClear: () => void;
  onDone: () => void;
  canUpdate: boolean;
  canSendSms: boolean;
}

const selectCls =
  "w-full h-10 px-3 text-[13px] rounded-xl border border-white/60 dark:border-white/10 " +
  "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none " +
  "focus:border-indigo-500 transition-colors";

/**
 * TANLANGAN O'QUVCHILAR USTIDA OMMAVIY AMALLAR.
 *
 * Ro'yxat ostida "suzib turuvchi" panel sifatida chiqadi — tanlov bekor
 * qilinmaguncha ekranda qoladi va sahifa aylantirilganda ham ko'rinib turadi.
 *
 * Har bir amal tasdiq oynasidan o'tadi: 40 ta o'quvchini bir bosishda
 * guruhdan chiqarib yuborish qaytarib bo'lmaydigan ish, foydalanuvchi
 * nima bo'layotganini aniq ko'rishi kerak.
 */
export function StudentBulkBar({ selected, groups, onClear, onDone, canUpdate, canSendSms }: Props) {
  const [action,   setAction]   = useState<BulkAction | null>(null);
  const [smsOpen,  setSmsOpen]  = useState(false);
  const [groupId,  setGroupId]  = useState("");
  const [asTrial,  setAsTrial]  = useState(false);
  const [message,  setMessage]  = useState("");
  const [busy,     setBusy]     = useState(false);
  const [err,      setErr]      = useState("");
  const [errors,   setErrors]   = useState<BulkError[]>([]);
  const [okCount,  setOkCount]  = useState<number | null>(null);

  const count = selected.length;
  if (count === 0) return null;

  const needsGroup = action === "add-to-group" || action === "transfer-group";

  function open(a: BulkAction) {
    setAction(a); setGroupId(""); setAsTrial(false);
    setErr(""); setErrors([]); setOkCount(null);
  }
  function closeAll() {
    setAction(null); setSmsOpen(false); setErr(""); setErrors([]); setOkCount(null);
  }

  async function runBulk() {
    if (!action) return;
    if (needsGroup && !groupId) { setErr("Guruhni tanlang"); return; }
    setBusy(true); setErr(""); setErrors([]);
    try {
      const res = await fetch("/api/students/bulk", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          studentIds: selected.map(s => s.id),
          ...(needsGroup ? { groupId } : {}),
          ...(action === "add-to-group" ? { asTrial } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "Xatolik"); return; }

      setOkCount(data.ok ?? 0);
      setErrors(data.errors ?? []);
      onDone();
      // Hammasi o'tgan bo'lsa oynani yopamiz. Qisman bo'lsa — ochiq
      // qoldiramiz, foydalanuvchi qaysi o'quvchida nima bo'lganini ko'rsin.
      if (!data.errors?.length) { closeAll(); onClear(); }
    } catch { setErr("Serverga ulanib bo'lmadi"); }
    finally { setBusy(false); }
  }

  async function sendSms() {
    if (!message.trim()) { setErr("Xabar matnini kiriting"); return; }
    setBusy(true); setErr("");
    try {
      const res = await fetch("/api/sms/send", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          audiences: ["students"],
          scope: "selected",
          studentIds: selected.map(s => s.id),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "Xatolik"); return; }
      setOkCount(data.sent ?? 0);
      if (!data.failed) { closeAll(); setMessage(""); onClear(); }
      else setErr(`${data.sent} ta yuborildi, ${data.failed} ta yuborilmadi`);
    } catch { setErr("Serverga ulanib bo'lmadi"); }
    finally { setBusy(false); }
  }

  const ACTION_META: Record<BulkAction, { title: string; verb: string; danger?: boolean; note: string }> = {
    "add-to-group": {
      title: "Guruhga qo'shish", verb: "Qo'shish",
      note: "Mavjud guruhlari saqlanadi — o'quvchi bir necha fanga qatnashishi mumkin.",
    },
    "transfer-group": {
      title: "Guruh almashtirish", verb: "O'tkazish",
      note: "Hozirgi barcha guruhlaridan chiqarilib, tanlangan guruhga faol sifatida qo'shiladi.",
    },
    "exit-group": {
      title: "Guruhdan chiqarish", verb: "Chiqarish", danger: true,
      note: "Barcha faol guruhlaridan chiqariladi. Boshqa guruhi qolmaganlar nofaol bo'ladi.",
    },
    activate: {
      title: "Faollashtirish", verb: "Faollashtirish",
      note: "Sinovdagi a'zoliklar faolga o'tadi va kurs to'lovi balansga yoziladi.",
    },
    deactivate: {
      title: "Nofaol qilish", verb: "Nofaol qilish", danger: true,
      note: "O'quvchilar arxivlanadi va barcha guruhlaridan chiqariladi. Ma'lumot saqlanadi.",
    },
  };
  const meta = action ? ACTION_META[action] : null;

  return (
    <>
      {/* Suzuvchi panel */}
      <div className="sticky bottom-4 z-30 mx-auto w-fit max-w-full">
        <div className="glass-strong border border-white/60 dark:border-white/10 rounded-2xl shadow-2xl
                        flex items-center gap-2 px-3 py-2.5 flex-wrap justify-center">
          <span className="flex items-center gap-2 pr-2 mr-1 border-r border-white/60 dark:border-white/10">
            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">
              {count}
            </span>
            <span className="text-[12px] font-semibold text-neutral-700 dark:text-neutral-200 whitespace-nowrap">
              tanlandi
            </span>
          </span>

          {canUpdate && (
            <>
              <BarBtn icon={Users}    label="Guruhga qo'shish" onClick={() => open("add-to-group")} />
              <BarBtn icon={Shuffle}  label="Guruh almashtirish" onClick={() => open("transfer-group")} />
              <BarBtn icon={UserCheck} label="Faollashtirish"  onClick={() => open("activate")} />
              <BarBtn icon={LogOut}   label="Guruhdan chiqarish" danger onClick={() => open("exit-group")} />
              <BarBtn icon={UserX}    label="Nofaol qilish"    danger onClick={() => open("deactivate")} />
            </>
          )}
          {canSendSms && (
            <BarBtn icon={MessageSquare} label="SMS" onClick={() => { setSmsOpen(true); setErr(""); setOkCount(null); }} />
          )}

          <button onClick={onClear} title="Tanlovni bekor qilish"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400
                       hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-white/60 dark:hover:bg-white/10 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Amal tasdig'i */}
      <Modal
        open={!!action}
        onClose={closeAll}
        title={meta?.title ?? ""}
        subtitle={`${count} ta o'quvchi tanlangan`}
        footer={
          <>
            <Button onClick={runBulk} disabled={busy}
              className={cn("flex-1 h-9 text-white text-[13px]",
                meta?.danger ? "bg-red-600 hover:bg-red-700" : "bg-indigo-600 hover:bg-indigo-700")}>
              {busy ? "Bajarilmoqda..." : meta?.verb}
            </Button>
            <Button variant="outline" className="h-9 px-4 text-[13px]" onClick={closeAll}>Bekor</Button>
          </>
        }
      >
        {needsGroup && (
          <FormField label="Guruh" required>
            <select value={groupId} onChange={e => { setGroupId(e.target.value); setErr(""); }} className={selectCls}>
              <option value="">Tanlang...</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}{g.course?.name ? ` — ${g.course.name}` : ""}</option>
              ))}
            </select>
          </FormField>
        )}

        {action === "add-to-group" && (
          <label className="flex items-start gap-2.5 glass-soft rounded-xl px-3 py-2.5 cursor-pointer">
            <input type="checkbox" checked={asTrial} onChange={e => setAsTrial(e.target.checked)}
              className="mt-0.5 accent-indigo-600" />
            <span className="text-[12px] text-neutral-600 dark:text-neutral-300">
              <strong>Sinov sifatida qo&apos;shilsin</strong> — kurs to&apos;lovi balansga yozilmaydi,
              o&apos;quvchi keyin faollashtiriladi.
            </span>
          </label>
        )}

        <div className={cn("rounded-xl px-4 py-3 border",
          meta?.danger
            ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/40"
            : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/40")}>
          <p className={cn("text-[12px]",
            meta?.danger ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400")}>
            {meta?.note}
          </p>
        </div>

        <SelectedPreview selected={selected} />

        {okCount !== null && (
          <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/40 rounded-xl px-3 py-2.5">
            <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
            <p className="text-[12px] font-medium text-green-700 dark:text-green-400">
              {okCount} ta o&apos;quvchida bajarildi
            </p>
          </div>
        )}
        <ErrorList err={err} errors={errors} />
      </Modal>

      {/* SMS */}
      <Modal
        open={smsOpen}
        onClose={closeAll}
        title="Tanlanganlarga SMS"
        subtitle={`${count} ta o'quvchi`}
        footer={
          <>
            <Button onClick={sendSms} disabled={busy}
              className="flex-1 h-9 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px]">
              {busy ? "Yuborilmoqda..." : "Yuborish"}
            </Button>
            <Button variant="outline" className="h-9 px-4 text-[13px]" onClick={closeAll}>Bekor</Button>
          </>
        }
      >
        <FormField label="Xabar matni" required
          hint="{ism} va {markaz} belgilarini ishlatish mumkin — har bir o'quvchi uchun almashadi">
          <Textarea rows={4} value={message} onChange={e => { setMessage(e.target.value); setErr(""); }}
            placeholder="Assalomu alaykum {ism}, ertangi dars soat 14:00 da." />
        </FormField>
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-xl px-4 py-3">
          <p className="text-[12px] text-amber-700 dark:text-amber-400">
            Erkin matn Eskiz moderatsiyasidan o&apos;tmagan bo&apos;lishi mumkin.
            Muntazam xabarlar uchun <strong>SMS xabarlar</strong> bo&apos;limidan tasdiqlangan shablon yarating.
          </p>
        </div>
        <SelectedPreview selected={selected} />
        <ErrorList err={err} errors={[]} />
      </Modal>
    </>
  );
}

function BarBtn({ icon: Icon, label, onClick, danger }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; onClick: () => void; danger?: boolean;
}) {
  return (
    <button onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[12px] font-semibold transition-colors whitespace-nowrap",
        danger
          ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
          : "text-neutral-700 dark:text-neutral-200 hover:bg-white/70 dark:hover:bg-white/10",
      )}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

/** Kimga ta'sir qilishini ko'rsatadi — "40 ta tanlandi" mavhum, ismlar aniq. */
function SelectedPreview({ selected }: { selected: { id: string; name: string }[] }) {
  const shown = selected.slice(0, 8);
  const rest = selected.length - shown.length;
  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map(s => (
        <span key={s.id}
          className="text-[11px] px-2 py-0.5 rounded-lg glass-soft text-neutral-600 dark:text-neutral-300">
          {s.name}
        </span>
      ))}
      {rest > 0 && (
        <span className="text-[11px] px-2 py-0.5 rounded-lg text-neutral-400">+{rest} ta</span>
      )}
    </div>
  );
}

function ErrorList({ err, errors }: { err: string; errors: BulkError[] }) {
  if (!err && errors.length === 0) return null;
  return (
    <div className="space-y-1.5">
      {err && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-xl px-3 py-2.5">
          <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
          <p className="text-[12px] font-medium text-red-600 dark:text-red-400">{err}</p>
        </div>
      )}
      {errors.length > 0 && (
        <div className="rounded-xl border border-red-100 dark:border-red-900/40 divide-y divide-red-100 dark:divide-red-900/40 max-h-40 overflow-y-auto">
          {errors.map(e => (
            <div key={e.studentId} className="flex items-start justify-between gap-3 px-3 py-2 bg-red-50/60 dark:bg-red-900/10">
              <span className="text-[12px] font-medium text-neutral-700 dark:text-neutral-200">{e.name ?? e.studentId}</span>
              <span className="text-[11px] text-red-600 dark:text-red-400 text-right">{e.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
