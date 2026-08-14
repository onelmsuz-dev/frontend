"use client";

import { cn } from "@/lib/utils";
import { Trophy, Store, Flame, ChevronRight } from "lucide-react";
import { usePanelGamification } from "@/lib/hooks/useGamification";

/**
 * Profil tabidagi ball xulosasi.
 *
 * Maqsad — o'quvchi panelni ochishi bilan ballini, darajasini va do'konga
 * yo'lni ko'rsin. Gamifikatsiya o'chiq bo'lsa yoki hali yuklanmagan bo'lsa
 * hech narsa ko'rsatilmaydi: bu yordamchi blok, xato joyi emas — sabab
 * "Ballarim" tabining o'zida to'liq yoziladi.
 */
export function PointsBanner({ onOpen, onShop }: { onOpen: () => void; onShop: () => void }) {
  const { data } = usePanelGamification();
  if (!data?.active) return null;

  const { student, level, coinIcon, coinName } = data;

  return (
    <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
      <button onClick={onOpen} className="w-full text-left p-4 hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[14px] font-bold text-neutral-900 dark:text-neutral-100 truncate">
                {level.name}
              </p>
              {student.streak > 0 && (
                <span className="flex items-center gap-0.5 text-[11px] font-bold text-orange-500 shrink-0">
                  <Flame className="w-3 h-3" />{student.streak}
                </span>
              )}
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              {student.xpTotal} XP
              {level.nextXp != null && ` · keyingi darajagacha ${level.nextXp - student.xpTotal}`}
            </p>
            <div className="h-1.5 rounded-full bg-neutral-200/70 dark:bg-white/10 overflow-hidden mt-1.5">
              <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                style={{ width: `${level.progress}%` }} />
            </div>
          </div>

          <div className="text-right shrink-0 flex items-center gap-1">
            <div>
              <p className="text-[19px] font-black text-amber-600 dark:text-amber-400 leading-none">
                {coinIcon} {student.coinBalance}
              </p>
              <p className="text-[10px] text-neutral-400 mt-0.5">{coinName}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-300 dark:text-neutral-600" />
          </div>
        </div>
      </button>

      <button onClick={onShop}
        className={cn(
          "w-full flex items-center justify-center gap-1.5 py-2.5",
          "border-t border-white/50 dark:border-white/10",
          "text-[12px] font-bold text-indigo-600 dark:text-indigo-400",
          "hover:bg-indigo-50/60 dark:hover:bg-indigo-400/10 transition-colors",
        )}>
        <Store className="w-3.5 h-3.5" />
        Ballarni sovg&apos;aga almashtirish
      </button>
    </div>
  );
}
