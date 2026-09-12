"use client";

import { useState } from "react";
import { UserPlus, Check, Loader2 } from "lucide-react";
import { useLeadAssignees } from "@/lib/hooks/useLeads";
import { useMe, hasPerm } from "@/lib/hooks/useMe";
import { cn } from "@/lib/utils";

/**
 * LID MAS'ULI — kartochkadan biriktirish.
 *
 * Ikki xil odam, ikki xil imkoniyat:
 *
 *  • BOSHLIQ (`leads.assign`) — xohlagan xodimga beradi, qaytarib
 *    oladi, savatga qaytaradi.
 *  • SOTUVCHI — faqat BIRIKTIRILMAGAN lidni O'ZIGA ola oladi. Bu
 *    "umumiy savat" qoidasining ko'rinadigan qismi: savatdagi lidni
 *    ko'rib turib ola olmasa, qoidaning ma'nosi qolmasdi.
 *
 * Ruxsat baribir serverda tekshiriladi (`canAssign`); bu yerdagi
 * tekshiruv faqat ishlamaydigan tugmani ko'rsatmaslik uchun.
 */
export function AssigneePicker({
  leadId, current, onDone,
}: {
  leadId: string;
  current: { id?: string | null; name?: string | null } | null;
  onDone: () => void;
}) {
  const { me } = useMe();
  const { data: xodimlar } = useLeadAssignees();
  const [ochiq, setOchiq] = useState(false);
  const [saqlanmoqda, setSaqlanmoqda] = useState(false);

  const taqsimlay = hasPerm(me?.permissions, "leads.assign");
  const savatda   = !current?.id;
  // Sotuvchi uchun yagona amal — savatdagini o'ziga olish.
  const korsat = taqsimlay || savatda;
  if (!korsat && !current?.name) return null;

  async function biriktir(userId: string | null) {
    setSaqlanmoqda(true);
    try {
      const r = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedToId: userId }),
      });
      if (r.ok) { setOchiq(false); onDone(); }
    } finally {
      setSaqlanmoqda(false);
    }
  }

  if (!korsat) {
    return (
      <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-2 truncate">
        👤 {current?.name}
      </p>
    );
  }

  return (
    <div className="mt-2 relative">
      <button type="button"
        onClick={(e) => { e.stopPropagation(); setOchiq(v => !v); }}
        className={cn(
          "w-full flex items-center gap-1 text-[10px] rounded-md px-1.5 py-1 transition-colors",
          savatda
            ? "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50"
            : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/10",
        )}>
        {savatda
          ? <><UserPlus className="w-3 h-3 shrink-0" /> Biriktirilmagan</>
          : <><span className="shrink-0">👤</span> <span className="truncate">{current?.name}</span></>}
      </button>

      {ochiq && (
        <>
          <div className="fixed inset-0 z-20" onClick={(e) => { e.stopPropagation(); setOchiq(false); }} />
          <div className="absolute z-30 left-0 right-0 mt-1 max-h-52 overflow-y-auto rounded-lg
            border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-xl py-1"
            onClick={(e) => e.stopPropagation()}>

            {saqlanmoqda && (
              <div className="py-2 flex justify-center">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-400" />
              </div>
            )}

            {!saqlanmoqda && !taqsimlay && (
              <button type="button" onClick={() => biriktir(me?.id ?? null)}
                className="w-full text-left px-2.5 py-1.5 text-[11px] font-medium
                  text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40">
                O&apos;zimga olish
              </button>
            )}

            {!saqlanmoqda && taqsimlay && (
              <>
                <button type="button" onClick={() => biriktir(null)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px]
                    text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/10">
                  Biriktirilmagan
                  {savatda && <Check className="w-3 h-3 text-indigo-600" />}
                </button>
                {(xodimlar ?? []).map(x => (
                  <button key={x.id} type="button" onClick={() => biriktir(x.id)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px]
                      text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/10">
                    <span className="truncate">{x.name}</span>
                    {current?.id === x.id && <Check className="w-3 h-3 text-indigo-600 shrink-0" />}
                  </button>
                ))}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
