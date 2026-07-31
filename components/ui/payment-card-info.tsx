"use client";

import { useState } from "react";
import { CreditCard, Copy, Check } from "lucide-react";
import { usePlatformSettings, formatCardNumber } from "@/lib/hooks/usePlatformSettings";
import { cn } from "@/lib/utils";

/** To'lov qilinadigan karta — tarif va SMS-paket sotib olish oynalarida ko'rsatiladi. */
export function PaymentCardInfo({ className }: { className?: string }) {
  const { data } = usePlatformSettings();
  const [copied, setCopied] = useState(false);

  const number = data?.paymentCardNumber ?? "9860350142898617";

  async function copy() {
    try {
      await navigator.clipboard.writeText(number.replace(/\D/g, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard ruxsati yo'q — jim */ }
  }

  return (
    <div className={cn(
      "flex items-center justify-between gap-3 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/60 dark:bg-indigo-950/20 px-3.5 py-3",
      className,
    )}>
      <div className="flex items-center gap-2.5 min-w-0">
        <CreditCard className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
        <div className="min-w-0">
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">To'lov shu kartaga o'tkaziladi</p>
          <p className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100 tracking-wide truncate">
            {formatCardNumber(number)}
          </p>
          {data?.paymentCardOwner && (
            <p className="text-[11px] text-neutral-400">{data.paymentCardOwner}</p>
          )}
        </div>
      </div>
      <button type="button" onClick={copy}
        className="flex items-center gap-1 h-8 px-2.5 rounded-lg text-[11px] font-semibold bg-white dark:bg-neutral-800 border border-indigo-200 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors shrink-0">
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? "Nusxalandi" : "Nusxalash"}
      </button>
    </div>
  );
}
