"use client";

import { cn } from "@/lib/utils";

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  sublabel?: string;
}

interface SegmentedProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
  /** Har bir tugma ustuni bir xil bo'lsin (grid) */
  grid?: boolean;
}

export function Segmented<T extends string>({
  options, value, onChange, className, grid,
}: SegmentedProps<T>) {
  return (
    <div
      className={cn(
        "p-1 gap-1 glass-soft rounded-xl",
        grid ? "grid" : "flex",
        className,
      )}
      style={grid ? { gridTemplateColumns: `repeat(${options.length}, minmax(0,1fr))` } : undefined}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "px-2.5 py-2 rounded-lg text-[13px] font-semibold transition-all leading-tight text-center",
            value === o.value
              ? "bg-white dark:bg-neutral-700 shadow-sm text-indigo-600 dark:text-indigo-300"
              : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200",
          )}
        >
          <span className="block">{o.label}</span>
          {o.sublabel && <span className="block text-[10px] font-normal opacity-70">{o.sublabel}</span>}
        </button>
      ))}
    </div>
  );
}

interface GenderPickerProps {
  value: "MALE" | "FEMALE" | "";
  onChange: (v: "MALE" | "FEMALE") => void;
}

/** "● Erkak  ○ Ayol" ko'rinishidagi radio (rasmga mos). */
export function GenderPicker({ value, onChange }: GenderPickerProps) {
  return (
    <div className="flex gap-3">
      {([["MALE", "Erkak"], ["FEMALE", "Ayol"]] as const).map(([v, label]) => {
        const active = value === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={cn(
              "flex-1 flex items-center gap-2.5 h-10 px-3 rounded-xl border transition-all",
              active
                ? "border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/30"
                : "border-white/60 dark:border-white/10 hover:border-neutral-300",
            )}
          >
            <span
              className={cn(
                "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                active ? "border-indigo-500" : "border-neutral-300 dark:border-neutral-600",
              )}
            >
              {active && <span className="w-2 h-2 rounded-full bg-indigo-500" />}
            </span>
            <span
              className={cn(
                "text-[13px] font-medium",
                active ? "text-indigo-700 dark:text-indigo-300" : "text-neutral-600 dark:text-neutral-400",
              )}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
