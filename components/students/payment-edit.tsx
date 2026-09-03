"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Pencil, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import {
  SELECTABLE_METHODS, methodGridCls, methodShort,
} from "@/lib/payment-methods";

/**
 * TO'LOVNI TUZATISH VA O'CHIRISH.
 *
 * Kassir 300 000 o'rniga 3 000 000 kiritib qo'yadi — va shu paytgacha
 * buni tuzatishning hech qanday yo'li yo'q edi. O'quvchi 2.7 mln
 * "ortiqcha to'lagan" bo'lib qolaverardi va markaz telefonda tushuntirib
 * o'tirardi.
 *
 * SABAB MAJBURIY. Pulga tegadigan tuzatish jurnalda izsiz qolmasligi
 * kerak: keyin "bu summa nega o'zgardi?" degan savol albatta so'raladi
 * va javob jurnaldan topilishi kerak.
 */

const fmt = (v: number) => new Intl.NumberFormat("uz-UZ").format(v);

export interface PaymentRow {
  id: string; amount: number; method: string;
  date: string; note?: string | null;
}

export function PaymentEdit({
  payment, onDone,
}: {
  payment: PaymentRow;
  onDone: () => void;
}) {
  const [mode, setMode] = useState<null | "edit" | "delete">(null);
  const [amount, setAmount] = useState(String(Math.round(payment.amount)));
  const [method, setMethod] = useState(payment.method);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [warn, setWarn] = useState("");

  const n = Number(amount) || 0;
  const changed = n !== Math.round(payment.amount) || method !== payment.method;
  const valid = reason.trim().length > 0 && (mode === "delete" || (n > 0 && changed));

  function close() {
    setMode(null); setErr(""); setWarn(""); setReason("");
    setAmount(String(Math.round(payment.amount))); setMethod(payment.method);
  }

  async function save() {
    setBusy(true); setErr("");
    try {
      const r = mode === "delete"
        ? await fetch(`/api/payments/${payment.id}`, {
            method: "DELETE",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ reason: reason.trim() }),
          })
        : await fetch(`/api/payments/${payment.id}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              ...(n !== Math.round(payment.amount) ? { amount: n } : {}),
              ...(method !== payment.method ? { method } : {}),
              reason: reason.trim(),
            }),
          });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error ?? "Saqlab bo'lmadi");
      // Ogohlantirish bo'lsa — oynani yopmaymiz, odam o'qib olsin.
      if (j?.warning) { setWarn(j.warning); setBusy(false); onDone(); return; }
      close(); onDone();
    } catch (e) {
      setErr((e as Error).message);
    } finally { setBusy(false); }
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <button onClick={() => { close(); setMode("edit"); }}
          title="Tuzatish"
          className="rounded-lg p-1 text-neutral-400 hover:text-blue-600 hover:bg-blue-50
                     dark:hover:bg-blue-900/30 transition-colors">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => { close(); setMode("delete"); }}
          title="O'chirish"
          className="rounded-lg p-1 text-neutral-400 hover:text-red-600 hover:bg-red-50
                     dark:hover:bg-red-900/30 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <Modal
        open={!!mode}
        onClose={close}
        title={mode === "delete" ? "To'lovni o'chirish" : "To'lovni tuzatish"}
        footer={
          <>
            {!warn && (
              <Button onClick={save} disabled={!valid || busy}
                className={cn("flex-1 h-9 text-[13px]",
                  mode === "delete" && "bg-red-600 text-white hover:bg-red-700")}>
                {busy && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                {mode === "delete" ? "O'chirish" : "Saqlash"}
              </Button>
            )}
            <Button variant="outline" className="h-9 px-4 text-[13px]" onClick={close}>
              {warn ? "Yopish" : "Bekor"}
            </Button>
          </>
        }>
        <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/50 px-3 py-2.5">
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Hozirgi to&apos;lov</p>
          <p className="text-lg font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
            {fmt(payment.amount)}{" "}so&apos;m
          </p>
          <p className="text-[11px] text-neutral-400">
            {new Date(payment.date).toLocaleDateString("uz-UZ")} ·{" "}
            {methodShort(payment.method)}
          </p>
        </div>

        {mode === "edit" && (
          <>
            <div>
              <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400
                                mb-1.5 uppercase tracking-wide">
                To&apos;g&apos;ri summa
              </label>
              <input value={amount} inputMode="numeric"
                onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
                className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700
                           bg-white dark:bg-neutral-900 px-3 py-2 text-sm
                           text-neutral-900 dark:text-neutral-100 focus:outline-none
                           focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/10" />
              {n > 0 && n !== Math.round(payment.amount) && (
                <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                  Balans{" "}
                  <span className={cn("font-medium tabular-nums",
                    n > payment.amount ? "text-emerald-600" : "text-red-600")}>
                    {n > payment.amount ? "+" : ""}{fmt(n - payment.amount)}
                  </span>{" "}
                  so&apos;mga o&apos;zgaradi
                </p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400
                                mb-1.5 uppercase tracking-wide">
                To&apos;lov usuli
              </label>
              {/* Ustunlar soni ro'yxatdan — `grid-cols-4` qattiq
                  yozilgan bo'lsa, usullar soni o'zgarganda
                  joylashuv buzilardi. */}
              <div className={cn("grid gap-1.5", methodGridCls(SELECTABLE_METHODS.length))}>
                {SELECTABLE_METHODS.map((m) => (
                  <button key={m.value} onClick={() => setMethod(m.value)}
                    className={cn("rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors",
                      method === m.value
                        ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300")}>
                    {m.short}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div>
          <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400
                            mb-1.5 uppercase tracking-wide">
            Sababi <span className="text-red-500">*</span>
          </label>
          <input value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder={mode === "delete"
              ? "Nega o'chirilyapti" : "Masalan: 10 barobar ortiq kiritilgan"}
            className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700
                       bg-white dark:bg-neutral-900 px-3 py-2 text-sm
                       text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400
                       focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/10" />
          <p className="mt-1 text-[11px] text-neutral-400 dark:text-neutral-500">
            Harakatlar tarixiga yoziladi va keyin o&apos;zgartirib bo&apos;lmaydi
          </p>
        </div>

        {err && (
          <p className="rounded-xl bg-red-50 dark:bg-red-900/30 px-3 py-2 text-xs
                        text-red-700 dark:text-red-300">{err}</p>
        )}
        {warn && (
          <div className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 px-3 py-2.5">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400 mt-px" />
            <p className="text-[11px] leading-relaxed text-neutral-700 dark:text-neutral-300">
              {warn}
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}
