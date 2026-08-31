"use client";

import { cn } from "@/lib/utils";
import { useDueLeads } from "@/lib/hooks/useLeads";
import { PhoneCall, AlertCircle } from "lucide-react";

/**
 * «BUGUN QO'NG'IROQ QILISH» — taxta ustidagi bitta chiziq.
 *
 * Bozordagi eng ko'p uchraydigan javob — "payshanba kuni qo'ng'iroq
 * qiling". Ilgari uni yozadigan joy yo'q edi: u qog'ozga ko'chardi va
 * qog'oz haqiqiy tizimga aylanardi, taxta esa unutilgan nusxaga.
 *
 * ALOHIDA SAHIFA EMAS, ataylab. Yangi sahifa yangi odat talab qiladi;
 * bu chiziq esa administrator baribir ochadigan ekranning tepasida
 * turadi va "bugun kimga qo'ng'iroq qilaman" degan savolga darhol
 * javob beradi.
 *
 * MUDDATI O'TGANLAR HAM SHU YERDA. Ular alohida ro'yxatga surilsa,
 * bir kun o'tkazib yuborilgan lid abadiy unutilardi.
 */
export function DueStrip({ onOpen }: { onOpen: (id: string) => void }) {
  const { data } = useDueLeads();
  const items = data?.items ?? [];
  if (items.length === 0) return null;

  const overdue = data?.overdue ?? 0;

  return (
    <div className="mb-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/50
                    bg-indigo-50/60 dark:bg-indigo-900/20 px-4 py-3">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <PhoneCall className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
        <span className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
          Bugun qo&apos;ng&apos;iroq qilish
        </span>
        <span className="text-[12px] font-bold text-indigo-600 dark:text-indigo-400">
          {items.length} ta
        </span>
        {overdue > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/40
                           px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
            <AlertCircle className="w-2.5 h-2.5" />
            {overdue}{" "}tasining muddati o&apos;tgan
          </span>
        )}
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {items.map((l) => {
          const kech = new Date(l.nextContactAt) < new Date(new Date().setHours(0, 0, 0, 0));
          return (
            <div key={l.id}
              className={cn(
                "shrink-0 rounded-xl border px-2.5 py-1.5 bg-white dark:bg-neutral-900",
                kech ? "border-amber-300 dark:border-amber-800"
                     : "border-neutral-200 dark:border-neutral-700",
              )}>
              <button onClick={() => onOpen(l.id)}
                className="block text-[12px] font-semibold text-neutral-900 dark:text-neutral-100
                           hover:text-indigo-600 transition-colors max-w-[160px] truncate text-left">
                {l.name}
              </button>
              <div className="flex items-center gap-1.5 mt-0.5">
                {l.phone ? (
                  <a href={`tel:${l.phone}`}
                    className="text-[10px] text-neutral-500 dark:text-neutral-400
                               hover:text-green-600 transition-colors tabular-nums">
                    {l.phone}
                  </a>
                ) : (
                  <span className="text-[10px] text-neutral-300 dark:text-neutral-600">
                    telefon yo&apos;q
                  </span>
                )}
                {l.contactAttempts > 0 && (
                  <span className="text-[10px] text-neutral-400">
                    · {l.contactAttempts}-urinish
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
