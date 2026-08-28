"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Gift, X, Loader2, AlertTriangle } from "lucide-react";

/**
 * BIR MARTALIK CHEGIRMA — mavjud qarzni kamaytiradi.
 *
 * Sozlamalardagi chegirma QOIDASI faqat bundan keyingi hisoblarga
 * qo'llanadi. Markazga ikkinchisi ham kerak: "bu o'quvchining shu oylik
 * qarzidan 100 000 tushiring".
 *
 * Ikkalasi ATAYLAB ajratilgan. Bitta tugmaga qo'shilsa, markaz "chegirma
 * berdim" deb o'ylab, o'tgan oyning qarzi o'zgarmaganini ko'rib hayron
 * bo'lardi — yoki teskarisi, doimiy chegirma o'rniga bir martalik berib
 * qo'yardi.
 *
 * Asl qarz qatoriga TEGILMAYDI: jurnalga musbat qator yoziladi. Shunda
 * "500 000 hisoblangan, 100 000 chegirma berilgan" degan tarix o'qiladigan
 * qoladi va daromad hisoboti ham to'g'ri chiqadi.
 */

const fmt = (v: number) => new Intl.NumberFormat("uz-UZ").format(v);

export function OneTimeDiscount({
  studentId, studentName, balance, onDone,
}: {
  studentId: string; studentName: string; balance: number; onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const n = Number(amount) || 0;
  const debt = Math.max(0, -balance);
  const valid = n > 0 && note.trim().length > 0;

  async function save() {
    setSaving(true); setErr("");
    try {
      const r = await fetch("/api/discounts/one-time", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ studentId, amount: n, note: note.trim() }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error ?? "Saqlab bo'lmadi");
      setOpen(false); setAmount(""); setNote("");
      onDone();
    } catch (e) { setErr((e as Error).message); }
    finally { setSaving(false); }
  }

  return (
    <>
      <button onClick={() => { setErr(""); setOpen(true); }}
        className="flex items-center gap-1 text-[11px] font-semibold
                   text-emerald-600 dark:text-emerald-400 hover:underline">
        <Gift className="w-3 h-3" /> Chegirma
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
             onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-white dark:bg-neutral-900 shadow-xl">
            <header className="flex items-center justify-between gap-3 px-5 py-4
                               border-b border-neutral-100 dark:border-neutral-800">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Bir martalik chegirma
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                  {studentName}
                </p>
              </div>
              <button onClick={() => setOpen(false)}
                className="rounded-lg p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <X className="h-4 w-4 text-neutral-500" />
              </button>
            </header>

            <div className="p-5 space-y-3">
              <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/50 px-3 py-2.5">
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Hozirgi qarz</p>
                <p className={cn("text-lg font-bold tabular-nums",
                  debt > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400")}>
                  {debt > 0 ? `${fmt(debt)} so'm` : "Qarz yo'q"}
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400
                                  mb-1.5 uppercase tracking-wide">
                  Chegirma summasi <span className="text-red-500">*</span>
                </label>
                <input value={amount} inputMode="numeric"
                  onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder="100000"
                  className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700
                             bg-white dark:bg-neutral-900 px-3 py-2 text-sm
                             text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400
                             focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/10" />
                {n > 0 && (
                  <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                    Yangi qarz: <span className="font-medium tabular-nums">
                      {fmt(Math.max(0, debt - n))} so&apos;m
                    </span>
                    {n > debt && debt > 0 && " (ortiqchasi balansga qo'shiladi)"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400
                                  mb-1.5 uppercase tracking-wide">
                  Sababi <span className="text-red-500">*</span>
                </label>
                <input value={note} onChange={(e) => setNote(e.target.value)}
                  placeholder="Ijtimoiy holat / kelishuv"
                  className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700
                             bg-white dark:bg-neutral-900 px-3 py-2 text-sm
                             text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400
                             focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/10" />
                <p className="mt-1 text-[11px] text-neutral-400 dark:text-neutral-500">
                  Sabab jurnalga yoziladi va keyin o&apos;zgartirib bo&apos;lmaydi
                </p>
              </div>

              {err && (
                <p className="rounded-xl bg-red-50 dark:bg-red-900/30 px-3 py-2 text-xs
                              text-red-700 dark:text-red-300">{err}</p>
              )}

              <div className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 px-3 py-2.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400 mt-px" />
                <p className="text-[11px] leading-relaxed text-neutral-700 dark:text-neutral-300">
                  Bu amal <span className="font-medium">faqat shu o&apos;quvchining hozirgi
                  qarziga</span> ta&apos;sir qiladi. Doimiy chegirma kerak bo&apos;lsa —
                  Sozlamalar → Chegirmalar.
                </p>
              </div>
            </div>

            <footer className="flex gap-2 px-5 py-4 border-t border-neutral-100 dark:border-neutral-800">
              <button onClick={() => setOpen(false)}
                className="flex-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 px-4 py-2.5
                           text-sm font-medium text-neutral-700 dark:text-neutral-200">
                Bekor
              </button>
              <button onClick={save} disabled={!valid || saving}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl
                           bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white
                           hover:bg-emerald-700 disabled:opacity-40 transition-colors">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Berish
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
