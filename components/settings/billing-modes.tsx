"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { fetcher } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import { formatUzDate } from "@/lib/date-uz";
import { useMe, hasPerm } from "@/lib/hooks/useMe";
import { Check, Lock, Loader2, Info, CalendarClock } from "lucide-react";

/**
 * SOZLAMALAR → TO'LOV REJIMI.
 *
 * Markaz o'quvchidan pul olish usulini tanlaydi. Ro'yxatda oltala rejim
 * ko'rinadi, lekin faqat platforma ochganlari tanlanadi — qulf belgisi
 * bilan. Bu ataylab: markaz qanday imkoniyat borligini bilsin, lekin
 * tushunmasdan yoqib qo'ymasin.
 */

interface ModeRow {
  mode: string; label: string; short: string; allowed: boolean; ready: boolean;
}

interface ModesData {
  current: string;
  since: string | null;
  shortTailDays: number;
  modes: ModeRow[];
}

export function BillingModes() {
  const { me } = useMe();
  const { data, error, isLoading } = useSWR<ModesData>("/api/billing/modes", fetcher);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const canManage = hasPerm(me?.permissions, "billing.manage");

  async function pick(mode: string) {
    if (!canManage || mode === data?.current) return;
    setBusy(mode); setMsg(null);
    try {
      const r = await fetch("/api/billing/mode", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ billingMode: mode }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error ?? "Saqlab bo'lmadi");
      setMsg({ ok: true, text: "To'lov rejimi o'zgartirildi" });
      mutate("/api/billing/modes");
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally { setBusy(null); }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
        ))}
      </div>
    );
  }
  if (error || !data) {
    return (
      <p className="py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
        To&apos;lov rejimlarini yuklab bo&apos;lmadi
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Eng muhim xabar tepada: rejim o'zgarishi o'tmishga TA'SIR QILMAYDI. */}
      <div className="flex items-start gap-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 px-4 py-3">
        <CalendarClock className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400 mt-px" />
        <p className="text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
          Rejim o&apos;zgarsa, <span className="font-medium">o&apos;tmishdagi hisob-kitob
          o&apos;zgarmaydi</span> — allaqachon yozilgan qarzlar joyida qoladi.
          Yangi qoida{" "}
          {data.since
            ? <span className="font-medium">{formatUzDate(data.since)}</span>
            : "keyingi oy boshidan"}{" "}
          amal qiladi.
        </p>
      </div>

      {msg && (
        <div className={cn("rounded-xl px-4 py-2.5 text-xs",
          msg.ok ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                 : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300")}>
          {msg.text}
        </div>
      )}

      <ul className="space-y-2">
        {data.modes.map((m) => {
          const active = m.mode === data.current;
          const locked = !m.allowed;
          return (
            <li key={m.mode}>
              <button
                onClick={() => pick(m.mode)}
                disabled={locked || !canManage || busy !== null}
                className={cn(
                  "w-full text-left rounded-2xl border p-4 transition-colors",
                  active
                    ? "border-blue-500 bg-blue-50/60 dark:bg-blue-900/20 dark:border-blue-500"
                    : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900",
                  !locked && canManage && !active &&
                    "hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer",
                  locked && "opacity-55 cursor-not-allowed",
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "mt-0.5 h-5 w-5 shrink-0 rounded-full grid place-items-center border-2",
                    active
                      ? "border-blue-500 bg-blue-500"
                      : "border-neutral-300 dark:border-neutral-600",
                  )}>
                    {active && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                    {busy === m.mode && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {m.label}
                      </span>
                      {active && (
                        <span className="rounded-md bg-blue-100 dark:bg-blue-900/50 px-1.5 py-px
                                         text-[10px] font-medium text-blue-700 dark:text-blue-300">
                          Hozirgi
                        </span>
                      )}
                      {locked && (
                        <span className="inline-flex items-center gap-1 rounded-md
                                         bg-neutral-100 dark:bg-neutral-800 px-1.5 py-px
                                         text-[10px] font-medium text-neutral-500 dark:text-neutral-400">
                          <Lock className="h-2.5 w-2.5" /> Ochilmagan
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                      {m.short}
                    </p>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex items-start gap-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 px-4 py-3">
        <Info className="h-4 w-4 shrink-0 text-neutral-400 mt-px" />
        <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
          Qulflangan rejim kerak bo&apos;lsa — biz bilan bog&apos;laning, ochib beramiz.
          Rejimni alohida <span className="font-medium">kurs</span> yoki{" "}
          <span className="font-medium">guruh</span> uchun ham belgilash mumkin:
          masalan markazda hamma oylik to&apos;laydi, «IELTS intensiv» esa modul bo&apos;yicha.
          {!canManage && " Rejimni o'zgartirish uchun markaz egasidan ruxsat so'rang."}
        </p>
      </div>
    </div>
  );
}
