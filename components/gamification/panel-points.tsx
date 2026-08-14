"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Trophy, Flame, Coins, TrendingUp, AlertCircle, Lock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  usePanelGamification, usePanelLeaderboard,
  REASON_LABELS, REASON_COLORS,
} from "@/lib/hooks/useGamification";
import { PanelReferral } from "@/components/gamification/panel-referral";

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded-xl", className)} />;
}

function Empty({ icon: Icon, text, hint }: { icon: LucideIcon; text: string; hint?: string }) {
  return (
    <div className="py-10 text-center text-neutral-400">
      <Icon className="w-8 h-8 mx-auto mb-2 opacity-30" />
      <p className="text-sm">{text}</p>
      {hint && <p className="text-[11px] mt-1 max-w-xs mx-auto">{hint}</p>}
    </div>
  );
}

/**
 * "Ballarim" tabi.
 *
 * MUHIM: yuklanish va xato holatlari ATAYLAB ko'rsatiladi. Ilgari bu bo'lim
 * `gami?.active` bo'lmasa butun tab bilan birga jimgina yashirilardi — ya'ni
 * so'rov xato bersa yoki hali yuklanayotgan bo'lsa o'quvchi gamifikatsiya
 * borligini umuman bilmasdi va sababni ham ko'rmasdi.
 */
export function PanelPoints() {
  const { data, isLoading, error } = usePanelGamification();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-52 w-full rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
        <p className="text-[14px] font-bold text-neutral-900 dark:text-neutral-100">
          Ballaringizni yuklab bo&apos;lmadi
        </p>
        <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-1">
          {(error as Error).message}
        </p>
      </div>
    );
  }

  if (!data?.active) {
    return (
      <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-6 text-center">
        <Lock className="w-8 h-8 mx-auto mb-2 text-neutral-300 dark:text-neutral-600" />
        <p className="text-[14px] font-bold text-neutral-900 dark:text-neutral-100">
          Ball tizimi hozircha yoqilmagan
        </p>
        <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
          O&apos;quv markazingiz ball to&apos;plash tizimini yoqqanda, darsga
          qatnashganingiz va o&apos;z vaqtida to&apos;laganingiz uchun ball
          yig&apos;a boshlaysiz.
        </p>
      </div>
    );
  }

  const { student, level, coinIcon, coinName, monthXp, history } = data;

  return (
    <div className="space-y-4">
      {/* Daraja va balans */}
      <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Daraja {level.level}
            </p>
            <p className="text-[20px] font-black text-neutral-900 dark:text-neutral-100 leading-tight">
              {level.name}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[26px] font-black text-amber-600 dark:text-amber-400 leading-none">
              {coinIcon} {student.coinBalance}
            </p>
            <p className="text-[11px] text-neutral-400 mt-0.5">{coinName} balansi</p>
          </div>
        </div>

        <div className="h-2.5 rounded-full bg-neutral-200/70 dark:bg-white/10 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
            style={{ width: `${level.progress}%` }} />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <p className="text-[11px] text-neutral-400">
            {level.nextXp != null
              ? `Keyingi darajagacha ${level.nextXp - student.xpTotal} XP`
              : "Eng yuqori darajaga yetdingiz 🎉"}
          </p>
          <p className="text-[11px] text-neutral-400">
            {level.nextXp != null ? `${student.xpTotal} / ${level.nextXp} XP` : `${student.xpTotal} XP`}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <Stat icon={Flame} value={String(student.streak)} label="Ketma-ket dars" cls="text-orange-500" />
          <Stat icon={TrendingUp} value={String(monthXp)} label="Bu oy XP" cls="text-indigo-600 dark:text-indigo-400" />
          <Stat icon={Coins} value={String(student.coinEarned)} label={`Jami topilgan`} cls="text-emerald-600 dark:text-emerald-400" />
        </div>

        {student.xpTotal === 0 && (
          <p className="text-[11px] text-neutral-400 mt-3 pt-3 border-t border-white/50 dark:border-white/10">
            Hali ballingiz yo&apos;q. Darsga qatnashsangiz va to&apos;lovni o&apos;z
            vaqtida qilsangiz avtomatik ball yig&apos;iladi.
          </p>
        )}
      </div>

      <Leaderboard studentId={student.id} />
      <PanelReferral />

      {/* Tarix */}
      <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/50 dark:border-white/10">
          <h3 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">Ball tarixi</h3>
        </div>
        {history.length === 0 ? (
          <Empty icon={Trophy} text="Hali ball yozuvi yo'q" />
        ) : history.map(t => (
          <div key={t.id} className="flex items-center gap-3 px-5 py-2.5 border-b border-white/50 dark:border-white/10 last:border-0">
            <span className={cn("text-[10px] px-2 py-0.5 rounded-lg font-semibold shrink-0",
              REASON_COLORS[t.reason] ?? "bg-neutral-100 text-neutral-600")}>
              {REASON_LABELS[t.reason] ?? t.reason}
            </span>
            <div className="flex-1 min-w-0">
              {t.note && <p className="text-[12px] text-neutral-600 dark:text-neutral-400 truncate">{t.note}</p>}
              <p className="text-[10px] text-neutral-400">{new Date(t.createdAt).toLocaleDateString("uz-UZ")}</p>
            </div>
            <div className="text-right shrink-0">
              {t.xp !== 0 && (
                <p className={cn("text-[12px] font-black", t.xp > 0 ? "text-indigo-600 dark:text-indigo-400" : "text-red-500")}>
                  {t.xp > 0 ? "+" : ""}{t.xp} XP
                </p>
              )}
              {t.coin !== 0 && (
                <p className={cn("text-[11px] font-bold", t.coin > 0 ? "text-amber-600 dark:text-amber-400" : "text-red-500")}>
                  {t.coin > 0 ? "+" : ""}{t.coin} {coinIcon}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Reyting ──────────────────────────────────────────────────────────────────

function Leaderboard({ studentId }: { studentId: string }) {
  const [groupId, setGroupId] = useState<string | undefined>(undefined);
  const { data: board, isLoading, error } = usePanelLeaderboard(groupId);

  const rows = board?.rows ?? [];
  const myIndex = rows.findIndex(r => r.id === studentId);

  return (
    <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/50 dark:border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center">
            <Trophy className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">Guruhim reytingi</h3>
        </div>
        {(board?.groups?.length ?? 0) > 1 && (
          <select value={board?.groupId ?? ""} onChange={e => setGroupId(e.target.value)}
            className="text-[11px] h-7 px-2 rounded-lg border border-white/60 dark:border-white/10 glass-soft text-neutral-700 dark:text-neutral-300 outline-none">
            {board?.groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        )}
      </div>

      {isLoading ? (
        <div className="p-4 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
        </div>
      ) : error ? (
        <Empty icon={AlertCircle} text="Reytingni yuklab bo'lmadi" hint={(error as Error).message} />
      ) : (board?.groups?.length ?? 0) === 0 ? (
        <Empty icon={Trophy} text="Siz hali guruhga qo'shilmagansiz"
          hint="Guruhga qo'shilganingizdan keyin guruhdoshlaringiz bilan reytingda qatnashasiz." />
      ) : rows.length === 0 ? (
        <Empty icon={Trophy} text="Bu oyda hali hech kim ball yig'magan"
          hint="Reyting har oyning boshida qaytadan boshlanadi." />
      ) : (
        <>
          {rows.map((r, i) => {
            const isMe = r.id === studentId;
            return (
              <div key={r.id} className={cn(
                "flex items-center gap-3 px-5 py-2.5 border-b border-white/50 dark:border-white/10 last:border-0",
                isMe && "bg-indigo-50/70 dark:bg-indigo-400/10",
              )}>
                <span className="w-6 text-center text-[13px] font-black text-neutral-400 shrink-0">
                  {i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}
                </span>
                <p className={cn("flex-1 text-[13px] truncate",
                  isMe ? "font-black text-indigo-700 dark:text-indigo-300" : "font-medium text-neutral-700 dark:text-neutral-300")}>
                  {isMe ? "Siz" : r.name}
                </p>
                {r.streak > 0 && (
                  <span className="flex items-center gap-0.5 text-[11px] font-semibold text-orange-500 shrink-0">
                    <Flame className="w-3 h-3" />{r.streak}
                  </span>
                )}
                <span className="text-[13px] font-black text-neutral-900 dark:text-neutral-100 shrink-0">{r.xp}</span>
              </div>
            );
          })}
          <p className="px-5 py-2.5 text-[11px] text-neutral-400 border-t border-white/50 dark:border-white/10">
            {board?.month}
            {myIndex >= 0 ? ` · guruhda ${myIndex + 1}-o'rindasiz` : ""} · reyting har oy yangilanadi
          </p>
        </>
      )}
    </div>
  );
}

function Stat({ icon: Icon, value, label, cls }: { icon: LucideIcon; value: string; label: string; cls: string }) {
  return (
    <div className="glass-soft rounded-xl p-3">
      <div className="flex items-center gap-1">
        <Icon className={cn("w-3.5 h-3.5", cls)} />
        <p className={cn("text-[18px] font-black leading-none", cls)}>{value}</p>
      </div>
      <p className="text-[11px] text-neutral-400 mt-1 truncate">{label}</p>
    </div>
  );
}
