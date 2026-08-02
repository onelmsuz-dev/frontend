"use client";

import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermissionCatalog } from "@/lib/hooks/useStaffRoles";

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  className?: string;
}

/**
 * Rol imkoniyatlarini tanlash — guruhlangan checkboxlar.
 * Xodim yaratishda ham, mavjud rolni tahrirlashda ham shu bitta komponent.
 */
export function PermissionPicker({ value, onChange, className }: Props) {
  const { data: catalog } = usePermissionCatalog();
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const selected = new Set(value);

  function toggleGroupOpen(key: string) {
    setOpenGroups(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function togglePerm(key: string) {
    const next = new Set(selected);
    next.has(key) ? next.delete(key) : next.add(key);
    onChange([...next]);
  }

  function toggleGroup(keys: string[], allOn: boolean) {
    const next = new Set(selected);
    keys.forEach(k => (allOn ? next.delete(k) : next.add(k)));
    onChange([...next]);
  }

  return (
    <div className={cn("space-y-2", className)}>
      {(catalog ?? []).map(group => {
        const keys = group.permissions.map(p => p.key);
        const selectedIn = keys.filter(k => selected.has(k)).length;
        const allOn = selectedIn === keys.length && keys.length > 0;
        const someOn = selectedIn > 0 && !allOn;
        const isOpen = openGroups.has(group.key);

        return (
          <div key={group.key} className="border border-white/60 dark:border-white/10 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2.5 glass-soft">
              <button type="button" onClick={() => toggleGroup(keys, allOn)}
                className="flex items-center gap-2 flex-1 text-left">
                <span className={cn(
                  "w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0",
                  allOn ? "bg-indigo-600 dark:bg-indigo-500 border-neutral-900 dark:border-neutral-100"
                    : someOn ? "bg-neutral-400 border-neutral-400"
                    : "border-neutral-300 dark:border-neutral-600",
                )}>
                  {(allOn || someOn) && <Check className="w-3 h-3 text-white" />}
                </span>
                <span className="text-[13px] font-semibold text-neutral-800 dark:text-neutral-200">{group.label}</span>
                <span className="text-[11px] text-neutral-400">{selectedIn}/{keys.length}</span>
              </button>
              <button type="button" onClick={() => toggleGroupOpen(group.key)}
                className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">
                <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
              </button>
            </div>

            {isOpen && (
              <div className="px-3 py-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {group.permissions.map(p => (
                  <label key={p.key} className="flex items-center gap-2 py-1 cursor-pointer">
                    <input type="checkbox" checked={selected.has(p.key)} onChange={() => togglePerm(p.key)}
                      className="w-4 h-4 rounded accent-neutral-900 dark:accent-neutral-100" />
                    <span className="text-[12px] text-neutral-600 dark:text-neutral-300">{p.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
