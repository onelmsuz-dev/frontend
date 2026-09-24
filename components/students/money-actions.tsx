"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, FilePlus2, Loader2, Plus, Undo2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SELECTABLE_METHODS, methodGridCls } from "@/lib/payment-methods";
import { cn } from "@/lib/utils";

/**
 * "TO'LOV" TUGMASI + QO'SHIMCHA AMALLAR (Doniyorjon, 2026-09-24).
 *
 * Asosiy qism — to'lov qabul qilish (o'zgarmagan). Yonidagi o'q ikki
 * amalni ochadi:
 *
 *   · QARZDORLIKKA KIRITISH — qo'lda qarz. 350 000 lik guruhda 500 000 ga
 *     kelishilgan o'quvchining 150 000 farqi va shunga o'xshash bir
 *     martalik holatlar. Guruh tanlansa o'qituvchi foiziga ham kiradi.
 *   · TO'LOVNI QAYTARISH — kassadan o'quvchiga pul berildi. Manfiy to'lov
 *     bo'lib yoziladi: tushum va kassa hisobida o'z-o'zidan ayiriladi.
 *     Balansdan (ortiqcha to'langan puldan) oshmaydi.
 *
 * Ikkalasi ham `payments.update` ruxsati bilan — pulni tuzatish bilan
 * bir qatorda, markaz egasining qarori. Ruxsat bo'lmasa o'q chizilmaydi.
 */

const fmt = (v: number) => new Intl.NumberFormat("uz-UZ").format(Math.round(v));

export interface MoneyGroup {
  groupId: string;
  name: string;
  /** Guruh savatidagi ortiqcha (oldindan to'langan) pul. */
  advance: number;
  /** Faol a'zolikmi (chiqib ketgan guruhlar qaytarishda kerak). */
  active: boolean;
}

const INPUT = "w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/10";
const LABEL = "block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase tracking-wide";

function joriyOy(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function PayActions({
  studentId, studentName, balance, groups, canAdjust, onPay, onDone,
}: {
  studentId: string;
  studentName: string;
  balance: number;
  groups: MoneyGroup[];
  canAdjust: boolean;
  onPay: () => void;
  onDone: () => void;
}) {
  const [modal, setModal] = useState<null | "debt" | "refund">(null);

  return (
    <>
      <div className="inline-flex items-stretch rounded-lg border border-emerald-500/70 dark:border-emerald-500/50 overflow-hidden">
        <button onClick={onPay}
          className="flex items-center gap-1 px-2.5 h-7 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
          <Plus className="w-3 h-3" />{" "}To&apos;lov
        </button>
        {canAdjust && (
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Boshqa amallar"
              className="flex items-center justify-center w-7 h-7 bg-emerald-600 hover:bg-emerald-700 text-white transition-colors outline-none">
              <ChevronDown className="w-3.5 h-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[210px]">
              <DropdownMenuItem onClick={() => setModal("refund")} className="text-red-600 dark:text-red-400">
                <Undo2 className="w-3.5 h-3.5" />{" "}To&apos;lovni qaytarish
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setModal("debt")} className="text-red-600 dark:text-red-400">
                <FilePlus2 className="w-3.5 h-3.5" />{" "}Qarzdorlikka kiritish
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {modal === "debt" && (
        <DebtModal studentId={studentId} studentName={studentName} balance={balance}
          groups={groups.filter((g) => g.active)}
          onClose={() => setModal(null)} onDone={onDone} />
      )}
      {modal === "refund" && (
        <RefundModal studentId={studentId} studentName={studentName} balance={balance}
          groups={groups}
          onClose={() => setModal(null)} onDone={onDone} />
      )}
    </>
  );
}

// ─── QARZDORLIKKA KIRITISH ────────────────────────────────────────────────

function DebtModal({
  studentId, studentName, balance, groups, onClose, onDone,
}: {
  studentId: string; studentName: string; balance: number;
  groups: MoneyGroup[]; onClose: () => void; onDone: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  // Bitta faol guruh bo'lsa — o'sha, aks holda tanlansin.
  const [groupId, setGroupId] = useState(groups.length === 1 ? groups[0].groupId : "");
  const [month, setMonth] = useState(joriyOy());
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [warn, setWarn] = useState("");

  const n = Number(amount) || 0;
  const valid = n > 0 && reason.trim().length > 0 && (!groupId || /^\d{4}-\d{2}$/.test(month));

  async function save() {
    setSaving(true); setErr("");
    try {
      const r = await fetch("/api/payments/debt", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          studentId, amount: n, reason: reason.trim(),
          ...(groupId ? { groupId, month } : {}),
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error ?? "Saqlab bo'lmadi");
      onDone();
      // Ogohlantirish bo'lsa — oynani yopmaymiz, odam o'qib olsin.
      if (j?.warning) { setWarn(j.warning); return; }
      onClose();
    } catch (e) { setErr((e as Error).message); }
    finally { setSaving(false); }
  }

  return (
    <Modal open onClose={onClose} title="Qarzdorlikka kiritish" subtitle={studentName}
      footer={
        <>
          <Button onClick={warn ? onClose : save} disabled={!warn && (!valid || saving)}
            className="flex-1 h-9 text-[13px] bg-red-600 hover:bg-red-700 text-white">
            {saving && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
            {warn ? "Yopish" : "Qarz yozish"}
          </Button>
          {!warn && <Button variant="outline" className="h-9 px-4 text-[13px]" onClick={onClose}>Bekor</Button>}
        </>
      }>
      <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/50 px-3 py-2.5">
        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Hozirgi balans</p>
        <p className={cn("text-lg font-bold tabular-nums",
          balance < 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400")}>
          {fmt(balance)}{" "}so&apos;m
        </p>
        {n > 0 && (
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
            Yozilgandan keyin: <span className="font-semibold tabular-nums text-red-600 dark:text-red-400">{fmt(balance - n)}{" "}so&apos;m</span>
          </p>
        )}
      </div>

      {groups.length > 0 && (
        <div className="grid grid-cols-[1fr_auto] gap-2.5">
          <div>
            <label className={LABEL}>Qaysi guruh uchun</label>
            <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className={INPUT}>
              <option value="">Guruhsiz (umumiy)</option>
              {groups.map((g) => <option key={g.groupId} value={g.groupId}>{g.name}</option>)}
            </select>
          </div>
          {groupId && (
            <div>
              <label className={LABEL}>Oy</label>
              <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
                className={cn(INPUT, "w-[150px]")} />
            </div>
          )}
        </div>
      )}
      <p className="-mt-1 text-[11px] text-neutral-400 dark:text-neutral-500">
        {groupId
          ? "Guruh qarzi bo'lib yoziladi va shu oy uchun o'qituvchi foiziga kiradi."
          : "Guruhga bog'lanmaydi — o'qituvchi foiziga kirmaydi."}
      </p>

      <div>
        <label className={LABEL}>Summa <span className="text-red-500">*</span></label>
        <input value={amount} inputMode="numeric" autoFocus
          onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
          placeholder="150000" className={INPUT} />
      </div>
      <div>
        <label className={LABEL}>Sabab <span className="text-red-500">*</span></label>
        <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200}
          placeholder="Masalan: kelishilgan narx 500 000, guruh narxi 350 000" className={INPUT} />
      </div>

      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 rounded-xl bg-sky-50 dark:bg-sky-900/20 px-3 py-2">
        Bu{" "}<strong>bir martalik</strong>{" "}qarz. O&apos;quvchi har oy boshqa narxda o&apos;qisa, guruh kartochkasida{" "}
        sana yonidagi &quot;o&apos;zgartirish&quot; orqali{" "}<strong>kelishilgan narx</strong>ni qo&apos;ying — tizim har oy o&apos;zi yozadi.
      </p>

      {warn && (
        <p className="text-[12px] text-amber-700 dark:text-amber-400 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />Yozildi. {warn}
        </p>
      )}
      {err && (
        <p className="text-[12px] text-red-600 dark:text-red-400 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />{err}
        </p>
      )}
    </Modal>
  );
}

// ─── TO'LOVNI QAYTARISH ───────────────────────────────────────────────────

function RefundModal({
  studentId, studentName, balance, groups, onClose, onDone,
}: {
  studentId: string; studentName: string; balance: number;
  groups: MoneyGroup[]; onClose: () => void; onDone: () => void;
}) {
  const maks = Math.max(0, Math.round(balance));
  // Standart guruh — ortiqcha puli eng ko'p turgan savat.
  const standart = useMemo(
    () => [...groups].filter((g) => g.advance > 0).sort((a, b) => b.advance - a.advance)[0]?.groupId ?? "",
    [groups]);
  const [amount, setAmount] = useState(maks > 0 ? String(maks) : "");
  const [method, setMethod] = useState<string>("NAQD");
  const [reason, setReason] = useState("");
  const [groupId, setGroupId] = useState(standart);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [warn, setWarn] = useState("");

  const n = Number(amount) || 0;
  const oshib = n > maks;
  const valid = n > 0 && !oshib && reason.trim().length > 0;

  async function save() {
    setSaving(true); setErr("");
    try {
      const r = await fetch("/api/payments/refund", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          studentId, amount: n, method, reason: reason.trim(),
          ...(groupId ? { groupId } : {}),
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error ?? "Saqlab bo'lmadi");
      onDone();
      if (j?.warning) { setWarn(j.warning); return; }
      onClose();
    } catch (e) { setErr((e as Error).message); }
    finally { setSaving(false); }
  }

  return (
    <Modal open onClose={onClose} title="To'lovni qaytarish" subtitle={studentName}
      footer={
        <>
          <Button onClick={warn ? onClose : save} disabled={!warn && (!valid || saving)}
            className="flex-1 h-9 text-[13px] bg-red-600 hover:bg-red-700 text-white">
            {saving && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
            {warn ? "Yopish" : "Qaytarish"}
          </Button>
          {!warn && <Button variant="outline" className="h-9 px-4 text-[13px]" onClick={onClose}>Bekor</Button>}
        </>
      }>
      <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/50 px-3 py-2.5">
        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Qaytarish mumkin (ortiqcha to&apos;langan)</p>
        <p className={cn("text-lg font-bold tabular-nums",
          maks > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-neutral-400")}>
          {fmt(maks)}{" "}so&apos;m
        </p>
      </div>

      {maks === 0 ? (
        <p className="text-[12px] text-neutral-500 dark:text-neutral-400">
          O&apos;quvchida ortiqcha pul yo&apos;q — qaytaradigan narsa yo&apos;q. Xato kiritilgan to&apos;lovni
          &quot;So&apos;nggi to&apos;lovlar&quot;dagi o&apos;chirish tugmasi bilan tuzating.
        </p>
      ) : (
        <>
          {groups.length > 0 && (
            <div>
              <label className={LABEL}>Qaysi guruhdan</label>
              <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className={INPUT}>
                <option value="">Guruhsiz (umumiy)</option>
                {groups.map((g) => (
                  <option key={g.groupId} value={g.groupId}>
                    {g.name}{!g.active ? " (ketgan)" : ""}{g.advance > 0 ? ` — ortiqcha ${fmt(g.advance)}` : ""}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-neutral-400 dark:text-neutral-500">
                Shu guruh tushumidan va o&apos;qituvchi foizidan ayiriladi.
              </p>
            </div>
          )}

          <div>
            <label className={LABEL}>Summa <span className="text-red-500">*</span></label>
            <input value={amount} inputMode="numeric"
              onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
              className={cn(INPUT, oshib && "border-red-400 dark:border-red-500")} />
            {oshib && (
              <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">
                {fmt(maks)}{" "}so&apos;mdan oshmasin
              </p>
            )}
          </div>

          <div>
            <label className={LABEL}>Qanday qaytarildi</label>
            <div className={cn("grid gap-2", methodGridCls(SELECTABLE_METHODS.length))}>
              {SELECTABLE_METHODS.map(({ value: m, label }) => (
                <button key={m} type="button" onClick={() => setMethod(m)}
                  className={cn(
                    "py-2 rounded-xl text-[12px] font-semibold border transition-colors",
                    method === m
                      ? "bg-red-600 text-white border-red-600"
                      : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-white/5",
                  )}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={LABEL}>Sabab <span className="text-red-500">*</span></label>
            <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200}
              placeholder="Masalan: guruhdan ketdi, qolgan puli qaytarildi" className={INPUT} />
          </div>
        </>
      )}

      {warn && (
        <p className="text-[12px] text-amber-700 dark:text-amber-400 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />Qaytarildi. {warn}
        </p>
      )}
      {err && (
        <p className="text-[12px] text-red-600 dark:text-red-400 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />{err}
        </p>
      )}
    </Modal>
  );
}
