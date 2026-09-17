"use client";

import { useState } from "react";
import { Trash2, RotateCcw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtRelative } from "@/lib/date-uz";
import { useDeletedLeads, restoreLead } from "@/lib/hooks/useLeads";

/**
 * TAXTADAGI "O'CHIRILGANLAR" USTUNI.
 *
 * O'chirilgan lid YO'Q QILINMAYDI — korzinkaga nusxasi bilan tushadi va
 * o'chirishda sabab MAJBURIY so'raladi. Ya'ni ma'lumot allaqachon bor
 * edi, lekin unga yetib borishning yagona yo'li sozlamalardagi korzinka
 * bo'limi edi — u esa alohida ruxsat va bayroq ortida. Sotuvchi o'zi
 * o'chirgan lidni o'zi ko'ra olmasdi (egasining talabi, 2026-09-17).
 *
 * Ustun ATAYLAB sudrab olinmaydi (dnd yo'q): o'chirilgan lidni bosqichga
 * tashlash "tiklash" degani bo'lardi, lekin qaysi bosqichga tushishi
 * noaniq — u o'z bosqichi bilan qaytadi. Shuning uchun bitta aniq
 * tugma: "Tiklash".
 */
export function DeletedColumn({ onRestored }: { onRestored: () => void }) {
  const { items, yanaBor, isLoading, mutate } = useDeletedLeads(true);
  const [band, setBand] = useState<string | null>(null);
  const [xato, setXato] = useState("");

  async function tikla(id: string) {
    setBand(id); setXato("");
    try {
      await restoreLead(id);
      await mutate();
      onRestored();
    } catch (e) {
      setXato(e instanceof Error ? e.message : "Tiklab bo'lmadi");
    } finally { setBand(null); }
  }

  return (
    <div className="flex-shrink-0 w-[260px] flex flex-col">
      <div className="flex items-center justify-between px-3 py-2.5 rounded-xl mb-2
        bg-neutral-100 dark:bg-neutral-800/60">
        <div className="flex items-center gap-2 min-w-0">
          <Trash2 className="w-3 h-3 text-neutral-500 dark:text-neutral-400 shrink-0" />
          <span className="text-[12px] font-bold truncate text-neutral-600 dark:text-neutral-300">
            O&apos;chirilganlar
          </span>
          <span className="bg-white/60 dark:bg-black/20 text-[11px] font-black px-1.5 py-0.5
            rounded-full text-neutral-700 dark:text-neutral-300 shrink-0">
            {isLoading ? "…" : `${items.length}${yanaBor ? "+" : ""}`}
          </span>
        </div>
      </div>

      {xato && (
        <div className="flex items-start gap-1.5 mb-2 px-2.5 py-2 rounded-xl
          bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40">
          <AlertCircle className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
          <p className="text-[11px] font-medium text-red-600 dark:text-red-400">{xato}</p>
        </div>
      )}

      <div className="flex flex-col gap-2 min-h-24 flex-1">
        {isLoading && (
          <div className="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700
            py-6 text-center text-[11px] text-neutral-400">Yuklanmoqda...</div>
        )}

        {!isLoading && items.length === 0 && (
          <div className="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700
            py-6 text-center text-[11px] text-neutral-400">
            O&apos;chirilgan lid yo&apos;q
          </div>
        )}

        {items.map((it) => (
          <div key={it.id}
            className="glass-panel rounded-xl border border-white/60 dark:border-white/10 p-3 space-y-2">
            <div className="min-w-0">
              <p className="text-[12.5px] font-semibold text-neutral-700 dark:text-neutral-200 truncate">
                {it.title}
              </p>
              {it.subtitle && (
                <p className="text-[11px] text-neutral-400 truncate">{it.subtitle}</p>
              )}
            </div>

            {/* SABAB — ustunning butun ma'nosi shunda. Sabab bo'lmasa
                (eski yozuv) buni yashirmaymiz, ochiq aytamiz. */}
            <div className="rounded-lg bg-neutral-100/70 dark:bg-white/5 px-2 py-1.5">
              <p className="text-[10px] text-neutral-400 mb-0.5">Sabab</p>
              <p className={cn("text-[11px] whitespace-pre-line break-words",
                it.reason
                  ? "text-neutral-600 dark:text-neutral-300"
                  : "text-neutral-400 italic")}>
                {it.reason || "yozilmagan (eski yozuv)"}
              </p>
            </div>

            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] text-neutral-400 min-w-0 truncate">
                {it.actorName || "—"} · {fmtRelative(it.deletedAt)}
              </p>
              <button type="button" disabled={band === it.id}
                onClick={() => tikla(it.id)}
                className="flex items-center gap-1 shrink-0 px-2 py-1 rounded-lg text-[10px] font-semibold
                  bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400
                  hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors
                  disabled:opacity-50">
                <RotateCcw className="w-2.5 h-2.5" />
                {band === it.id ? "..." : "Tiklash"}
              </button>
            </div>
          </div>
        ))}

        {yanaBor && !isLoading && (
          <p className="text-[10.5px] text-neutral-400 text-center py-1">
            Eng oxirgi 50 tasi ko&apos;rsatilgan — qolgani sozlamalardagi korzinkada
          </p>
        )}
      </div>
    </div>
  );
}
