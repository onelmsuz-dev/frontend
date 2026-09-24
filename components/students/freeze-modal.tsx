"use client";

import { useState } from "react";
import useSWR from "swr";
import { AlertTriangle, Loader2, Snowflake } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { todayStr } from "@/lib/form-constants";
import { fetcher } from "@/lib/fetcher";

/**
 * A'ZOLIKNI MUZLATISH.
 *
 * O'quvchi vaqtincha qatnamaydi (kasal, safar). Muzlatilgan oraliqda
 * pul yechilmaydi: kunlik/modul rejimida o'sha kunlarning darsi, oylik
 * va sikl rejimida esa boshlanish kuni shu oraliqqa tushgan davr.
 *
 * DAVR O'RTASIDA muzlatilsa — HISOB-KITOB (2026-09-23): o'tgan darslar
 * puli guruhda "sarflangan" bo'lib qoladi, muzlatishga tushgan darslar
 * puli o'quvchi balansiga qaytadi va qaytganida shundan foydalanadi.
 * Raqam tanlashdan OLDIN ko'rinadi — aks holda kalit faqat so'z bo'lardi.
 */
export function FreezeModal({
  membership, open, onClose, onSaved, canSeeMoney = true,
}: {
  membership: { id: string; groupName: string } | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  canSeeMoney?: boolean;
}) {
  const [from, setFrom] = useState(todayStr());
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");
  const [settle, setSettle] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const { data: preview, isLoading: previewLoading } = useSWR<{
    settlement: {
      charged: number; periodStart: string; periodEnd: string;
      totalLessons: number; usedLessons: number; frozenLessons: number;
      keep: number; refund: number; explain: string; reason: string | null;
    } | null;
  }>(
    open && membership && from && canSeeMoney
      ? `/api/student-groups/${membership.id}/freezes/preview?from=${from}${to ? `&to=${to}` : ""}`
      : null,
    fetcher,
  );
  const hisob = preview?.settlement ?? null;
  const hisoblanadi = !!hisob && !hisob.reason && hisob.totalLessons > 0 && hisob.refund > 0;
  const fmt = (n: number) => `${Math.round(n).toLocaleString("ru-RU")} so'm`;

  async function save() {
    if (!membership || !from) return;
    setSaving(true); setErr("");
    try {
      const res = await fetch(`/api/student-groups/${membership.id}/freezes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from, to: to || null, reason: reason.trim() || undefined,
          settle,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(data?.error ?? "Saqlanmadi"); return; }
      onSaved();
      onClose();
      setTo(""); setReason(""); setSettle(true);
    } catch {
      setErr("Serverga ulanib bo'lmadi");
    } finally { setSaving(false); }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="A'zolikni muzlatish"
      subtitle={membership?.groupName}
      footer={
        <>
          <Button onClick={save} disabled={saving || !from} className="flex-1 h-9 text-[13px]">
            {saving ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Saqlanmoqda...</> : <><Snowflake className="w-3.5 h-3.5 mr-1.5" />Muzlatish</>}
          </Button>
          <Button variant="outline" className="h-9 px-4 text-[13px]" onClick={onClose}>Bekor</Button>
        </>
      }>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Boshlanishi" required>
          <DatePicker value={from} onChange={setFrom} />
        </FormField>
        <FormField label="Tugashi" hint="Bo'sh — ochiq muddat">
          <DatePicker value={to} min={from} onChange={setTo} />
        </FormField>
      </div>
      <FormField label="Sabab" hint="Ixtiyoriy">
        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Kasallik, safar..." className="h-10" />
      </FormField>

      {/* HISOB-KITOB — davr o'rtasida muzlatilsa. */}
      {canSeeMoney && (previewLoading || hisoblanadi) && (
        <div className="rounded-xl border border-sky-200 dark:border-sky-900/40 bg-sky-50 dark:bg-sky-900/20 px-4 py-3 mt-2">
          {previewLoading && !hisob ? (
            <p className="text-[11px] text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" /> Hisoblanmoqda...
            </p>
          ) : hisoblanadi && hisob && (
            <>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" checked={settle} onChange={(e) => setSettle(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-neutral-300 text-sky-600 focus:ring-sky-500" />
                <span className="text-[12px] font-semibold text-sky-800 dark:text-sky-200">
                  Muzlatilgan darslar puli balansga qaytsin
                </span>
              </label>
              <div className="grid grid-cols-2 gap-2 mt-2.5 pl-6">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-sky-600/80 dark:text-sky-300/70">Sarflangan · guruhda qoladi</p>
                  <p className="text-[13px] font-bold text-sky-900 dark:text-sky-100 tabular-nums">{fmt(hisob.keep)}</p>
                  <p className="text-[10px] text-sky-600/80 dark:text-sky-300/70">{hisob.usedLessons}/{hisob.totalLessons} dars</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-sky-600/80 dark:text-sky-300/70">Balansga qaytadi</p>
                  <p className="text-[13px] font-bold text-sky-900 dark:text-sky-100 tabular-nums">
                    {settle ? fmt(hisob.refund) : "—"}
                  </p>
                  <p className="text-[10px] text-sky-600/80 dark:text-sky-300/70">{hisob.frozenLessons}/{hisob.totalLessons} dars</p>
                </div>
              </div>
              <p className="text-[10px] text-sky-700/80 dark:text-sky-300/70 mt-2 pl-6">
                {settle
                  ? "Ustoz faqat sarflangan qismdan ulush oladi. O'quvchi qaytganida balans keyingi davrni qoplaydi."
                  : "Davr puli guruhda to'liq qoladi — qaytmaydi."}
              </p>
            </>
          )}
        </div>
      )}

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 px-4 py-3 mt-2">
        <p className="text-[12px] font-semibold text-neutral-700 dark:text-neutral-200">Muzlatilganda nima bo&apos;ladi</p>
        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
          Muzlatilgan oraliqda pul yechilmaydi: boshlanishi shu oraliqqa tushgan davr yozilmaydi.
          O&apos;quvchi qaytganda kartochkadagi &quot;qaytdi&quot; bosiladi — muzlatish tarixda qoladi.
          &quot;bekor&quot; esa go&apos;yo muzlatilmagandek qiladi.
        </p>
      </div>

      {err && (
        <p className="text-[12px] text-red-600 dark:text-red-400 mt-3 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />{err}
        </p>
      )}
    </Modal>
  );
}
