"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { PhoneInput } from "@/components/ui/phone-input";
import { cn } from "@/lib/utils";
import { useGroups } from "@/lib/hooks/useGroups";
import { UserPlus, AlertCircle, CheckCircle2, Users } from "lucide-react";

/**
 * LIDNI O'QUVCHIGA AYLANTIRISH.
 *
 * NEGA BU KERAK. Ilgari «To'ladi» ga surish FAQAT yorliqni
 * o'zgartirardi. Keyin o'sha odam o'quvchilar bo'limida QAYTADAN
 * qo'lda kiritilardi — ism, telefon, maktab, manba. Ya'ni CRM dan
 * foydalanish uni chetlab o'tishdan KO'PROQ ish talab qilardi.
 * Proddagi 88 o'quvchiga atigi 12 lid to'g'ri kelishining sababi shu.
 *
 * SINOV BO'LIB QO'SHILADI va bu ataylab: guruhga FAOL qilib qo'shish
 * PUL YECHADI. Bir bosishlik tugma kutilmaganda qarz yozib qo'ymasligi
 * kerak — markaz o'quvchini ko'rib, keyin o'zi faollashtiradi.
 */

interface Lead {
  id: string;
  name: string;
  phone?: string | null;
  course?: string | null;
  courseId?: string | null;
  school?: string | null;
  source: string;
}

export function ConvertModal({
  lead, onClose, onDone,
}: {
  lead: Lead | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const { data: groupsRaw } = useGroups({ status: "ACTIVE,UPCOMING" });
  const allGroups: { id: string; name: string; courseId?: string | null;
                     course?: { name?: string } }[] =
    Array.isArray(groupsRaw) ? groupsRaw : [];

  const [groupId, setGroupId] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<{ name: string } | null>(null);

  if (!lead) return null;

  const leadPhone = (lead.phone ?? "").trim();
  const needPhone = leadPhone.replace(/\D/g, "").length < 9;
  const finalPhone = needPhone ? phone : leadPhone;

  // Lidning kursiga mos guruhlar tepada — administrator ro'yxatni
  // qidirib o'tirmasin.
  const matching = lead.courseId
    ? allGroups.filter((g) => g.courseId === lead.courseId)
    : [];
  const others = allGroups.filter((g) => !matching.includes(g));

  async function submit() {
    if (needPhone && finalPhone.replace(/\D/g, "").length !== 12) {
      setErr("Telefon raqamni to'liq kiriting"); return;
    }
    setBusy(true); setErr("");
    try {
      const r = await fetch(`/api/leads/${lead!.id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(groupId ? { groupId } : {}),
          ...(needPhone ? { phone: finalPhone } : {}),
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error ?? "Aylantirib bo'lmadi");
      setDone({ name: j?.student?.name ?? lead!.name });
      onDone();
    } catch (e) {
      setErr((e as Error).message);
    } finally { setBusy(false); }
  }

  function close() {
    setGroupId(""); setPhone(""); setErr(""); setDone(null);
    onClose();
  }

  return (
    <Modal
      open={!!lead}
      onClose={close}
      title="O'quvchiga aylantirish"
      subtitle={lead.name}
      footer={
        done ? (
          <Button onClick={close}
            className="flex-1 h-9 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px]">
            Yopish
          </Button>
        ) : (
          <>
            <Button onClick={submit} disabled={busy}
              className="flex-1 h-9 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px]">
              {busy ? "Yaratilmoqda…" : "O'quvchi yaratish"}
            </Button>
            <Button variant="outline" className="h-9 px-4 text-[13px]" onClick={close}>
              Bekor
            </Button>
          </>
        )
      }
    >
      {done ? (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-green-50 dark:bg-green-900/20">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
          <div className="text-[13px] leading-relaxed">
            <p className="font-semibold text-neutral-900 dark:text-neutral-100">
              {done.name}{" "}o&apos;quvchilar ro&apos;yxatiga qo&apos;shildi
            </p>
            <p className="text-neutral-600 dark:text-neutral-400 mt-0.5">
              Sinov holatida qo&apos;shildi — pul yechilmadi. To&apos;lov
              kelgach o&apos;quvchini faollashtiring.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/50 px-3 py-2.5 space-y-0.5">
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Lid ma&apos;lumotlari ko&apos;chiriladi
            </p>
            <p className="text-[13px] text-neutral-800 dark:text-neutral-200">
              {lead.name}
              {lead.school ? ` · ${lead.school}` : ""}
              {` · manba: ${lead.source}`}
            </p>
          </div>

          {needPhone && (
            <FormField label="Telefon" required
              hint="Lidda telefon yo'q — o'quvchi uchun majburiy">
              <PhoneInput value={phone} onChange={(v) => { setPhone(v); setErr(""); }}
                error={err.includes("Telefon")} />
            </FormField>
          )}

          <FormField label="Guruh" hint="Ixtiyoriy — keyin ham qo'shish mumkin">
            {allGroups.length === 0 ? (
              <p className="text-[12px] text-neutral-400">Faol guruh yo&apos;q</p>
            ) : (
              <div className="grid gap-1.5 max-h-52 overflow-y-auto">
                {[...matching, ...others].map((g) => (
                  <button key={g.id} type="button"
                    onClick={() => setGroupId(groupId === g.id ? "" : g.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-xl text-left border transition-all",
                      groupId === g.id
                        ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-800 dark:text-indigo-300"
                        : "border-white/60 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400",
                    )}>
                    <Users className="w-3.5 h-3.5 shrink-0 opacity-60" />
                    <span className="text-[13px] font-medium flex-1 truncate">{g.name}</span>
                    {matching.includes(g) && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-100
                                       dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                        lid kursi
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </FormField>

          <div className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 px-3 py-2.5">
            <UserPlus className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-px" />
            <p className="text-[11px] leading-relaxed text-neutral-700 dark:text-neutral-300">
              O&apos;quvchi <b>sinov</b> holatida yaratiladi — pul yechilmaydi.
              To&apos;lov kelgach o&apos;zingiz faollashtirasiz.
            </p>
          </div>

          {err && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2.5">
              <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <p className="text-[12px] font-medium text-red-600 dark:text-red-400">{err}</p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
