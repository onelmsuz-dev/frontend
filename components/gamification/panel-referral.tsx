"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { UserPlus, Copy, Check, Clock, Gift } from "lucide-react";
import { usePanelReferral } from "@/lib/hooks/useGamification";

export function PanelReferral() {
  const { data } = usePanelReferral();
  const [copied, setCopied] = useState<"code" | "text" | null>(null);

  if (!data?.active || !data.code) return null;

  const { code, invited, rewarded, pending, reward, milestone, coinIcon, coinName } = data;

  const shareText =
    `Salom! Men o'qiyotgan o'quv markazga sen ham qo'shil — ` +
    `ro'yxatdan o'tayotganda mening kodimni ayt: ${code}`;

  async function copy(what: "code" | "text") {
    try {
      await navigator.clipboard.writeText(what === "code" ? code! : shareText);
      setCopied(what);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      // clipboard ruxsati yo'q — foydalanuvchi qo'lda nusxalaydi
    }
  }

  const toMilestone = milestone ? Math.max(0, milestone.at - rewarded) : 0;

  return (
    <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/50 dark:border-white/10">
        <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-900/40 flex items-center justify-center">
          <UserPlus className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">Do&apos;st taklif qilish</h3>
      </div>

      <div className="p-4 space-y-3">
        <p className="text-[12px] text-neutral-500 dark:text-neutral-400">
          Do&apos;stingiz ro&apos;yxatdan o&apos;tayotganda shu kodni aytsa —
          u <strong>birinchi to&apos;lovni</strong> qilgach sizga{" "}
          <span className="font-bold text-amber-600 dark:text-amber-400">
            {reward?.coin} {coinIcon}
          </span>{" "}
          va <span className="font-bold text-indigo-600 dark:text-indigo-400">{reward?.xp} XP</span> beriladi.
        </p>

        {/* Kod */}
        <div className="flex items-center gap-2">
          <div className="flex-1 glass-soft rounded-xl border border-white/60 dark:border-white/10 px-4 py-3 text-center">
            <p className="text-[22px] font-black tracking-[0.3em] text-neutral-900 dark:text-neutral-100">
              {code}
            </p>
          </div>
          <button onClick={() => copy("code")}
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center transition-colors shrink-0",
              copied === "code"
                ? "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400"
                : "glass-soft border border-white/60 dark:border-white/10 text-neutral-500 hover:text-indigo-600",
            )}>
            {copied === "code" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <button onClick={() => copy("text")}
          className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-semibold transition-colors">
          {copied === "text" ? "Nusxalandi ✓" : "Taklif matnini nusxalash"}
        </button>

        {/* Statistika */}
        <div className="grid grid-cols-3 gap-2">
          <Stat value={invited.length} label="Taklif qilingan" />
          <Stat value={rewarded} label="Mukofot olingan" accent="text-green-600 dark:text-green-400" />
          <Stat value={pending} label="Kutilmoqda" accent="text-amber-600 dark:text-amber-400" />
        </div>

        {/* Bosqichli bonus */}
        {milestone && toMilestone > 0 && (
          <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
            <Gift className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-purple-700 dark:text-purple-300">
              Yana <strong>{toMilestone} ta</strong> do&apos;st taklif qilsangiz qo&apos;shimcha{" "}
              <strong>{milestone.coin} {coinIcon}</strong> bonus!
            </p>
          </div>
        )}

        {/* Taklif qilinganlar */}
        {invited.length > 0 && (
          <div className="pt-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
              Taklif qilganlarim
            </p>
            <div className="space-y-1">
              {invited.map(f => (
                <div key={f.id} className="flex items-center gap-2.5 py-1.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                    {f.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-neutral-800 dark:text-neutral-200 truncate">{f.name}</p>
                    <p className="text-[10px] text-neutral-400">
                      {new Date(f.createdAt).toLocaleDateString("uz-UZ")}
                    </p>
                  </div>
                  {f.rewarded ? (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-green-600 dark:text-green-400 shrink-0">
                      <Check className="w-3 h-3" />+{reward?.coin} {coinIcon}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 shrink-0">
                      <Clock className="w-3 h-3" />to&apos;lov kutilmoqda
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-[10px] text-neutral-400">
          Mukofot do&apos;st birinchi to&apos;lovini qilgandan keyin avtomatik beriladi.
          {coinName ? ` ${coinName}ni do'konda sovg'aga almashtirishingiz mumkin.` : ""}
        </p>
      </div>
    </div>
  );
}

function Stat({ value, label, accent }: { value: number; label: string; accent?: string }) {
  return (
    <div className="glass-soft rounded-xl p-2.5 text-center">
      <p className={cn("text-[18px] font-black leading-none", accent ?? "text-neutral-900 dark:text-neutral-100")}>
        {value}
      </p>
      <p className="text-[10px] text-neutral-400 mt-1">{label}</p>
    </div>
  );
}
