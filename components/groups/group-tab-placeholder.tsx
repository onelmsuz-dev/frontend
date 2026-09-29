import type { LucideIcon } from "lucide-react";

export function GroupTabPlaceholder({ icon: Icon, title, note }: { icon: LucideIcon; title: string; note: string }) {
  return (
    <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl py-16 flex flex-col items-center text-center px-6">
      <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-neutral-400" />
      </div>
      <h3 className="text-[14px] font-bold text-neutral-700 dark:text-neutral-300">{title}</h3>
      <p className="text-[12px] text-neutral-400 mt-1 max-w-xs">{note}</p>
      <span className="mt-3 text-[10px] px-2 py-0.5 rounded-lg font-semibold bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
        Tez orada
      </span>
    </div>
  );
}
