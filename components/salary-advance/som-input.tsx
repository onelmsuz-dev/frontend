"use client";

import { somniOqi, somniYoz } from "@/lib/salary-advance";
import { cn } from "@/lib/utils";

/**
 * SO'M MAYDONI — raqamli klaviatura, yozish paytida guruhlanadi
 * ("1 500 000"). `type="number"` emas: u bo'shliqni qabul qilmaydi va
 * telefonda katta summani o'qib bo'lmaydi.
 */
export function SomInput({
  value, onChange, placeholder, className, disabled, autoFocus, id,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  id?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <input
        id={id}
        inputMode="numeric"
        autoComplete="off"
        autoFocus={autoFocus}
        disabled={disabled}
        value={somniYoz(value)}
        placeholder={placeholder ?? "0"}
        onChange={(e) => onChange(somniOqi(e.target.value))}
        className="w-full h-10 pl-3 pr-12 text-[14px] font-semibold tabular-nums rounded-xl border
          border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-800
          text-neutral-900 dark:text-neutral-100 outline-none focus:border-indigo-400
          disabled:opacity-60"
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-neutral-400 pointer-events-none">
        so&apos;m
      </span>
    </div>
  );
}
