"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Check, Info, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { DatePicker } from "@/components/ui/date-picker";
import { formatUzDate } from "@/lib/date-uz";
import { todayStr } from "@/lib/form-constants";

/**
 * GURUHGA QO'SHILGAN SANANI TUZATISH.
 *
 * Nega alohida oyna: sana o'zgarishi pul hisobiga tegishi mumkin va
 * foydalanuvchi NIMA o'zgarishini, NIMA o'zgarmasligini oldindan ko'rishi
 * kerak. Ikkalasi ham shu yerda ochiq yozilgan.
 */

interface EditInfo {
  groupName: string;
  groupStartDate: string;
  joinedAt: string;
  leftAt: string | null;
  enrollmentStatus: string;
  /** O'qituvchining ALLAQACHON to'langan oyliklari ("YYYY-MM"). */
  paidSalaryMonths: string[];
}

export function MembershipDateModal({
  membershipId, open, onClose, onSaved,
}: {
  membershipId: string | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [info, setInfo] = useState<EditInfo | null>(null);
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open || !membershipId) { setInfo(null); setErr(""); return; }
    setLoading(true); setErr("");
    fetch(`/api/student-groups/${membershipId}/edit-info`)
      .then(r => r.json())
      .then(d => {
        if (d?.error) { setErr(d.error); return; }
        setInfo(d);
        setDate(String(d.joinedAt ?? "").slice(0, 10));
      })
      .catch(() => setErr("Ma'lumot yuklanmadi"))
      .finally(() => setLoading(false));
  }, [open, membershipId]);

  const minDate = info ? String(info.groupStartDate).slice(0, 10) : undefined;
  const maxDate = info?.leftAt ? String(info.leftAt).slice(0, 10) : todayStr();
  /** Tanlangan sana o'qituvchining to'langan oyiga tushdimi. */
  const monthOf = date.slice(0, 7);
  const hitsPaidMonth = !!info && info.paidSalaryMonths.includes(monthOf);

  async function save() {
    if (!membershipId || !date) return;
    setSaving(true); setErr("");
    try {
      const res = await fetch(`/api/student-groups/${membershipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joinedAt: date }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(data?.error ?? "Saqlanmadi"); return; }
      onSaved();
      onClose();
    } catch {
      setErr("Serverga ulanib bo'lmadi");
    } finally { setSaving(false); }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Qo'shilgan sanani tuzatish"
      subtitle={info?.groupName}
      footer={
        <>
          <Button onClick={save} disabled={saving || loading || !date}
            className="flex-1 h-9 text-[13px]">
            {saving ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Saqlanmoqda...</> : "Saqlash"}
          </Button>
          <Button variant="outline" className="h-9 px-4 text-[13px]" onClick={onClose}>Bekor</Button>
        </>
      }>
      {loading ? (
        <p className="text-[13px] text-neutral-500 py-4 text-center">Yuklanmoqda...</p>
      ) : (
        <>
          <FormField label="Guruhga qo'shilgan sana" required>
            <DatePicker value={date} min={minDate} max={maxDate} onChange={setDate} />
          </FormField>

          {info && (
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 -mt-1">
              Guruh {formatUzDate(info.groupStartDate)}{" "}dan boshlangan — sana
              undan oldin bo&apos;lishi mumkin emas.
            </p>
          )}

          {/* NIMA O'ZGARADI, NIMA O'ZGARMAYDI — ochiq yozilgan. */}
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-700
            bg-neutral-50 dark:bg-neutral-800/50 px-4 py-3 space-y-1.5 mt-3">
            <p className="text-[12px] font-semibold text-neutral-700 dark:text-neutral-200">
              Sana o&apos;zgarsa nima bo&apos;ladi
            </p>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-start gap-1.5">
              <Check className="w-3 h-3 mt-0.5 shrink-0 text-emerald-500" />
              O&apos;tgan oylar uchun o&apos;quvchidan qo&apos;shimcha pul
              yechilmaydi — hisob faqat joriy oyda yuritiladi.
            </p>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-start gap-1.5">
              <Check className="w-3 h-3 mt-0.5 shrink-0 text-emerald-500" />
              Allaqachon yozilgan qarz va to&apos;lovlar o&apos;zgarmaydi.
            </p>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-start gap-1.5">
              <Info className="w-3 h-3 mt-0.5 shrink-0 text-blue-500" />
              O&apos;qituvchi har bir o&apos;quvchi uchun oylik olsa — faqat hali
              to&apos;lanmagan oylarning hisobi yangilanadi. To&apos;langan
              oylikka tegilmaydi.
            </p>
          </div>

          {hitsPaidMonth && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-900/40
              bg-amber-50 dark:bg-amber-900/20 px-4 py-3 mt-2">
              <p className="text-[12px] text-amber-700 dark:text-amber-400 flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>
                  Bu oy uchun o&apos;qituvchi oyligi <b>allaqachon to&apos;langan</b>.
                  To&apos;langan summa o&apos;zgarmaydi — tizim to&apos;langan oyni
                  qayta hisoblamaydi.
                </span>
              </p>
            </div>
          )}

          {err && (
            <p className="text-[12px] text-red-600 dark:text-red-400 mt-3 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              {err}
            </p>
          )}
        </>
      )}
    </Modal>
  );
}
