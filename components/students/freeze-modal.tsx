"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, Snowflake } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { todayStr } from "@/lib/form-constants";

/**
 * A'ZOLIKNI MUZLATISH.
 *
 * O'quvchi vaqtincha qatnamaydi (kasal, safar). Muzlatilgan oraliqda
 * pul yechilmaydi: kunlik/modul rejimida o'sha kunlarning darsi, oylik
 * va sikl rejimida esa boshlanish kuni shu oraliqqa tushgan davr.
 * Allaqachon yozilgan qarzga tegilmaydi.
 */
export function FreezeModal({
  membership, open, onClose, onSaved,
}: {
  membership: { id: string; groupName: string } | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [from, setFrom] = useState(todayStr());
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    if (!membership || !from) return;
    setSaving(true); setErr("");
    try {
      const res = await fetch(`/api/student-groups/${membership.id}/freezes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: to || null, reason: reason.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(data?.error ?? "Saqlanmadi"); return; }
      onSaved();
      onClose();
      setTo(""); setReason("");
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

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 px-4 py-3 mt-2">
        <p className="text-[12px] font-semibold text-neutral-700 dark:text-neutral-200">Muzlatilganda nima bo&apos;ladi</p>
        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
          Kunlik va modul rejimida shu oraliqdagi darslar uchun pul yechilmaydi.
          Oylik va sikl rejimida boshlanish kuni shu oraliqqa tushgan davr yozilmaydi.
          Allaqachon yozilgan qarz o&apos;zgarmaydi.
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
