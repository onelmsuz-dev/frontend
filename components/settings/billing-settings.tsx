"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Check, AlertTriangle, Loader2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * MARKAZNING TO'LOV QOIDALARI.
 *
 * Markazlar hisob-kitobni bir xil yuritmaydi va bu masalada kelishuv yo'q:
 * biri sinov darslarini bepul beradi, ikkinchisi ma'qul kelsa o'sha kunlar
 * uchun ham pul oladi. Shuning uchun tanlov markazning o'ziga beriladi.
 *
 * Ikkala sozlamaning ham standarti — ESKI XULQ, ya'ni bu sahifa ochilgani
 * bilan hech bir markazning hisobi o'z-o'zidan o'zgarmaydi.
 */

interface OrgBilling {
  billingStart?: "ACTIVATION" | "JOIN";
  billingProrate?: boolean;
  trialLessonLimit?: number;
}

export function BillingSettings({
  org, onSaved,
}: {
  org: OrgBilling | undefined;
  onSaved: () => void;
}) {
  const [start, setStart] = useState<"ACTIVATION" | "JOIN">("ACTIVATION");
  const [prorate, setProrate] = useState(false);
  const [trialLimit, setTrialLimit] = useState("0");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!org) return;
    setStart(org.billingStart ?? "ACTIVATION");
    setProrate(!!org.billingProrate);
    setTrialLimit(String(org.trialLessonLimit ?? 0));
  }, [org]);

  async function save() {
    setSaving(true); setMsg(null);
    try {
      const res = await fetch("/api/organization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billingStart: start,
          billingProrate: prorate,
          trialLessonLimit: Math.max(0, Number(trialLimit) || 0),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setMsg({ ok: false, text: data?.error ?? "Saqlanmadi" }); return; }
      setMsg({ ok: true, text: "Saqlandi" });
      onSaved();
    } catch {
      setMsg({ ok: false, text: "Serverga ulanib bo'lmadi" });
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      {/* ── Hisob qaysi sanadan ──────────────────────────────────────── */}
      <div className="glass-panel rounded-2xl border border-white/60 dark:border-white/10 p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-2xl shrink-0 grid place-items-center bg-indigo-100/70 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300">
            <CalendarClock className="w-4.5 h-4.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100">
              Sinov darslari uchun to&apos;lov
            </p>
            <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5">
              O&apos;quvchi sinovdan faolga o&apos;tganda hisob qaysi sanadan boshlanadi
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-2.5 mt-4">
          {([
            {
              v: "ACTIVATION" as const,
              l: "Faol qilingan sanadan",
              d: "Sinov kunlari bepul. Pul faqat «Faol» qilingandan keyin hisoblanadi.",
            },
            {
              v: "JOIN" as const,
              l: "Guruhga qo'shilgan sanadan",
              d: "Sinov kunlari ham darsga kiradi va o'sha kunlar uchun ham pul olinadi.",
            },
          ]).map(o => (
            <button key={o.v} type="button" onClick={() => setStart(o.v)}
              className={cn(
                "text-left px-4 py-3 rounded-2xl border-2 transition-all",
                start === o.v
                  ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-900/20 dark:border-indigo-400"
                  : "border-white/60 dark:border-white/10 hover:border-neutral-400",
              )}>
              <p className={cn("text-[13px] font-bold",
                start === o.v ? "text-indigo-700 dark:text-indigo-300" : "text-neutral-800 dark:text-neutral-200")}>
                {o.l}
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                {o.d}
              </p>
            </button>
          ))}
        </div>

        <div className="flex items-start gap-2 mt-3 text-[11px] text-neutral-500 dark:text-neutral-400">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <p>
            O&apos;zgarish faqat BUNDAN KEYINGI faollashtirishlarga ta&apos;sir qiladi —
            allaqachon yozilgan qarzlar qayta hisoblanmaydi.
          </p>
        </div>
      </div>

      {/* ── Birinchi oy ──────────────────────────────────────────────── */}
      <div className="glass-panel rounded-2xl border border-white/60 dark:border-white/10 p-5">
        <p className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100">
          Birinchi (to&apos;liq bo&apos;lmagan) oy
        </p>
        <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5">
          Oy o&apos;rtasida qo&apos;shilgan o&apos;quvchidan qancha olinadi
        </p>

        <div className="grid sm:grid-cols-2 gap-2.5 mt-4">
          {([
            {
              v: false,
              l: "To'liq oylik narx",
              d: "Oyning 28-kunida qo'shilgan ham butun oy uchun to'laydi.",
            },
            {
              v: true,
              l: "Qolgan kunlarga mutanosib",
              d: "Oyning yarmidan qo'shilsa — taxminan yarmini to'laydi.",
            },
          ]).map(o => (
            <button key={String(o.v)} type="button" onClick={() => setProrate(o.v)}
              className={cn(
                "text-left px-4 py-3 rounded-2xl border-2 transition-all",
                prorate === o.v
                  ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-900/20 dark:border-indigo-400"
                  : "border-white/60 dark:border-white/10 hover:border-neutral-400",
              )}>
              <p className={cn("text-[13px] font-bold",
                prorate === o.v ? "text-indigo-700 dark:text-indigo-300" : "text-neutral-800 dark:text-neutral-200")}>
                {o.l}
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                {o.d}
              </p>
            </button>
          ))}
        </div>

        {!prorate && (
          <div className="flex items-start gap-2 mt-3 text-[11px] text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <p>
              Oy oxirida qo&apos;shilgan o&apos;quvchi bir necha kunlik o&apos;qish uchun
              to&apos;liq oylik to&apos;laydi, 1-sanada esa yangi oy yoziladi.
            </p>
          </div>
        )}
      </div>

      {/* ── Sinov chegarasi ──────────────────────────────────────────── */}
      <div className="glass-panel rounded-2xl border border-white/60 dark:border-white/10 p-5">
        <p className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100">
          Sinov darslari soni
        </p>
        <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5">
          Shu sondan oshsa ro&apos;yxatda ogohlantirish chiqadi. Pul avtomatik
          yechilmaydi — qaror sizda qoladi.
        </p>
        <div className="flex items-center gap-3 mt-3">
          <Input type="number" min={0} max={30} value={trialLimit}
            onChange={e => setTrialLimit(e.target.value)}
            className="h-10 w-24 text-[13px]" />
          <span className="text-[12px] text-neutral-500 dark:text-neutral-400">
            ta dars {Number(trialLimit) === 0 && "(0 — cheklanmagan)"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving} className="h-10 text-[13px]">
          {saving ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Saqlanmoqda...</> : "Saqlash"}
        </Button>
        {msg && (
          <span className={cn("text-[12px] font-semibold flex items-center gap-1.5",
            msg.ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
            {msg.ok ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            {msg.text}
          </span>
        )}
      </div>
    </div>
  );
}
