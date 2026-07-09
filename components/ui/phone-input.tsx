"use client";

import { cn } from "@/lib/utils";

interface PhoneInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
}

function toDisplay(value: string): string {
  let d = value.replace(/\D/g, "");
  if (d.startsWith("998")) d = d.slice(3);
  d = d.slice(0, 9);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)} ${d.slice(2)}`;
  if (d.length <= 7) return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
  return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7)}`;
}

export function PhoneInput({
  value, onChange, placeholder = "90 123 45 67",
  className, required, disabled, error,
}: PhoneInputProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 9);
    onChange("+998" + digits);
  }

  const isComplete = value.replace(/\D/g, "").length === 12;

  return (
    <div className={cn(
      "flex h-10 items-center rounded-xl border transition-all overflow-hidden",
      error
        ? "border-red-400 dark:border-red-500 bg-red-50/30 dark:bg-red-950/20"
        : isComplete
          ? "border-green-400 dark:border-green-600 focus-within:border-green-500"
          : "border-neutral-200 dark:border-neutral-700 focus-within:border-neutral-900 dark:focus-within:border-neutral-400",
      disabled && "opacity-50 cursor-not-allowed bg-neutral-50 dark:bg-neutral-800",
      className
    )}>
      <div className={cn(
        "flex items-center gap-1.5 pl-3 pr-2.5 shrink-0 h-full border-r",
        error
          ? "border-red-300 dark:border-red-700"
          : "border-neutral-200 dark:border-neutral-700"
      )}>
        <span className="text-base leading-none">🇺🇿</span>
        <span className="text-[13px] font-bold text-neutral-500 dark:text-neutral-400 tracking-tight">+998</span>
      </div>
      <input
        type="tel"
        inputMode="numeric"
        value={toDisplay(value)}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={cn(
          "flex-1 px-3 h-full text-[14px] font-medium bg-transparent outline-none tracking-wide",
          "text-neutral-900 dark:text-neutral-100",
          "placeholder:text-neutral-300 dark:placeholder:text-neutral-600 placeholder:font-normal placeholder:tracking-normal",
          disabled && "cursor-not-allowed"
        )}
      />
      {isComplete && !error && (
        <div className="pr-3 shrink-0">
          <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
