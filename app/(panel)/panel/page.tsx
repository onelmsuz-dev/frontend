"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  useStudentProfile, useStudentGroups, useStudentPayments, useStudentAttendance,
} from "@/lib/hooks/usePanel";
import {
  User, Wallet, CalendarCheck, BookOpen, Phone, TrendingDown, TrendingUp,
  CheckCircle2, XCircle, Clock, CircleSlash, Trophy, Flame,
} from "lucide-react";
import {
  usePanelGamification, usePanelLeaderboard, REASON_LABELS, REASON_COLORS,
} from "@/lib/hooks/useGamification";
import { PanelShop } from "@/components/gamification/panel-shop";
import { PanelReferral } from "@/components/gamification/panel-referral";

function fmtMoney(v: number) {
  return new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 0 }).format(v) + " so'm";
}

const ATT_CFG: Record<string, { label: string; icon: any; cls: string }> = {
  KELDI:      { label: "Keldi",      icon: CheckCircle2, cls: "text-green-600 dark:text-green-400" },
  KELMADI:    { label: "Kelmadi",    icon: XCircle,      cls: "text-red-600 dark:text-red-400" },
  KECH_KELDI: { label: "Kech keldi", icon: Clock,        cls: "text-amber-600 dark:text-amber-400" },
  SABABLI:    { label: "Sababli",    icon: CircleSlash,  cls: "text-blue-600 dark:text-blue-400" },
  SINOV_DARSI:{ label: "Sinov darsi",icon: BookOpen,     cls: "text-purple-600 dark:text-purple-400" },
};

const BASE_TABS = [
  { id: "profil",    label: "Profil",     icon: User },
  { id: "ballarim",  label: "Ballarim",   icon: Trophy },
  { id: "tolovlar",  label: "To'lovlar",  icon: Wallet },
  { id: "davomat",   label: "Davomat",    icon: CalendarCheck },
  { id: "kurslarim", label: "Kurslarim",  icon: BookOpen },
];

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded-lg", className)} />;
}

export default function StudentPanelPage() {
  const [tab, setTab] = useState("profil");
  const { data: profile, isLoading: pLoad } = useStudentProfile();
  const { data: groups } = useStudentGroups();
  const { data: payments } = useStudentPayments();
  const { data: att } = useStudentAttendance();
  // Gamifikatsiya o'chiq bo'lsa (yoki xato bo'lsa) tab umuman ko'rsatilmaydi
  const { data: gami } = usePanelGamification();
  const gamiActive = !!gami?.active;
  const TABS = BASE_TABS.filter(t => t.id !== "ballarim" || gamiActive);

  const balance = profile?.balance ?? 0;
  const groupList: any[] = Array.isArray(groups) ? groups : [];
  const payList: any[] = Array.isArray(payments) ? payments : [];
  const totalPaid = payList.reduce((s, p) => s + (p.amount ?? 0), 0);

  return (
    <div className="space-y-5">
      {/* Profil kartasi */}
      <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-5">
        {pLoad ? (
          <div className="space-y-3"><Skeleton className="h-6 w-40" /><Skeleton className="h-4 w-56" /></div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-blue-500" />
              <h2 className="font-bold text-neutral-900 dark:text-neutral-100">Talaba ma'lumotlari</h2>
            </div>
            <h1 className="text-2xl font-black text-neutral-900 dark:text-neutral-100">{profile?.name}</h1>
            <div className="mt-3 space-y-1.5 text-[14px]">
              <p className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
                <span className="text-neutral-400">Telefon:</span>
                <Phone className="w-3.5 h-3.5 text-blue-500" /> {profile?.phone}
              </p>
              <p className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
                <span className="text-neutral-400">Balans:</span>
                <span className={cn("font-semibold px-2 py-0.5 rounded-md",
                  balance >= 0 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400")}>
                  {fmtMoney(balance)}
                </span>
              </p>
              {profile?.branch?.name && (
                <p className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
                  <span className="text-neutral-400">Filial:</span> {profile.branch.name}
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 glass-panel border border-white/60 dark:border-white/10 rounded-xl p-1 overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors",
                tab === t.id
                  ? "bg-indigo-600 text-white dark:bg-indigo-500"
                  : "text-neutral-500 dark:text-neutral-400 hover:bg-white/60 dark:hover:bg-white/10"
              )}>
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Ballarim ── */}
      {tab === "ballarim" && gamiActive && gami && <PointsTab data={gami} />}

      {/* ── Profil ── */}
      {tab === "profil" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard icon={CalendarCheck} label="Umumiy davomat" value={`${att?.rate ?? 0}%`}
            trend={att?.rate >= 80 ? "up" : "down"} />
          <StatCard icon={BookOpen} label="Guruhlar" value={String(groupList.length)} />
          <StatCard icon={Wallet} label="Jami to'langan" value={fmtMoney(totalPaid)} />
        </div>
      )}

      {/* ── To'lovlar ── */}
      {tab === "tolovlar" && (
        <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
          {payList.length === 0 ? (
            <Empty icon={Wallet} text="Hali to'lov yo'q" />
          ) : payList.map(p => (
            <div key={p.id} className="flex items-center justify-between px-4 py-3 border-b border-white/50 dark:border-white/10 last:border-0">
              <div>
                <p className="text-[14px] font-semibold text-green-600 dark:text-green-400">+{fmtMoney(p.amount)}</p>
                <p className="text-[11px] text-neutral-400">
                  {new Date(p.date).toLocaleDateString("uz-UZ")}{p.group?.name ? ` · ${p.group.name}` : ""}
                </p>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full glass-soft text-neutral-500">{p.method}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Davomat ── */}
      {tab === "davomat" && (
        <div className="space-y-3">
          <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-4 flex items-center justify-between">
            <span className="text-[13px] text-neutral-500">Davomat foizi</span>
            <span className="text-xl font-black text-neutral-900 dark:text-neutral-100">{att?.rate ?? 0}%</span>
          </div>
          <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
            {(att?.records ?? []).length === 0 ? (
              <Empty icon={CalendarCheck} text="Davomat yozuvi yo'q" />
            ) : (att?.records ?? []).map((r: any) => {
              const cfg = ATT_CFG[r.status] ?? ATT_CFG.KELDI;
              const Icon = cfg.icon;
              return (
                <div key={r.id} className="flex items-center justify-between px-4 py-3 border-b border-white/50 dark:border-white/10 last:border-0">
                  <div>
                    <p className="text-[13px] font-medium text-neutral-800 dark:text-neutral-200">{r.group?.name ?? "—"}</p>
                    <p className="text-[11px] text-neutral-400">{new Date(r.date).toLocaleDateString("uz-UZ")}</p>
                  </div>
                  <span className={cn("flex items-center gap-1.5 text-[12px] font-semibold", cfg.cls)}>
                    <Icon className="w-3.5 h-3.5" /> {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Kurslarim ── */}
      {tab === "kurslarim" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {groupList.length === 0 ? (
            <div className="sm:col-span-2"><Empty icon={BookOpen} text="Hali guruhga qo'shilmagansiz" /></div>
          ) : groupList.map(sg => (
            <div key={sg.id} className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{sg.group?.name}</h3>
                <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold",
                  sg.paymentStatus === "TOLANDI" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400")}>
                  {sg.paymentStatus === "TOLANDI" ? "To'langan" : "Qarzdor"}
                </span>
              </div>
              <p className="text-[13px] text-neutral-500">{sg.group?.course?.name}</p>
              <div className="mt-2 space-y-1 text-[12px] text-neutral-400">
                <p>O'qituvchi: {sg.group?.teacher?.user?.name ?? "—"}</p>
                <p>Vaqt: {sg.group?.startTime}–{sg.group?.endTime}</p>
                {sg.group?.room?.name && <p>Xona: {sg.group.room.name}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, trend }: { icon: any; label: string; value: string; trend?: "up" | "down" }) {
  return (
    <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="w-9 h-9 rounded-lg glass-soft flex items-center justify-center">
          <Icon className="w-4 h-4 text-neutral-500" />
        </div>
        {trend && (trend === "up"
          ? <TrendingUp className="w-4 h-4 text-green-500" />
          : <TrendingDown className="w-4 h-4 text-red-500" />)}
      </div>
      <p className="text-xl font-black text-neutral-900 dark:text-neutral-100">{value}</p>
      <p className="text-[12px] text-neutral-400 mt-0.5">{label}</p>
    </div>
  );
}

function Empty({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="py-12 text-center text-neutral-400">
      <Icon className="w-8 h-8 mx-auto mb-2 opacity-30" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

// ─── Ballarim ─────────────────────────────────────────────────────────────────

function PointsTab({ data }: { data: NonNullable<ReturnType<typeof usePanelGamification>["data"]> }) {
  const [groupId, setGroupId] = useState<string | undefined>(undefined);
  const { data: board } = usePanelLeaderboard(groupId);
  const { student, level, coinIcon, coinName, monthXp, history } = data;

  const rows = board?.rows ?? [];
  const myIndex = rows.findIndex(r => r.id === student.id);

  return (
    <div className="space-y-4">
      {/* Daraja va progress */}
      <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">
            Daraja {level.level} · {level.name}
          </p>
          <p className="text-[12px] text-neutral-400">
            {level.nextXp != null ? `${student.xpTotal} / ${level.nextXp} XP` : `${student.xpTotal} XP`}
          </p>
        </div>
        <div className="h-2.5 rounded-full bg-neutral-200/70 dark:bg-white/10 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
            style={{ width: `${level.progress}%` }} />
        </div>
        <p className="text-[11px] text-neutral-400 mt-1.5">
          {level.nextXp != null
            ? `Keyingi darajagacha ${level.nextXp - student.xpTotal} XP`
            : "Eng yuqori darajaga yetdingiz"}
        </p>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="glass-soft rounded-xl p-3">
            <p className="text-[18px] font-black text-amber-600 dark:text-amber-400 leading-none">
              {coinIcon} {student.coinBalance}
            </p>
            <p className="text-[11px] text-neutral-400 mt-1">{coinName} balansi</p>
          </div>
          <div className="glass-soft rounded-xl p-3">
            <p className="flex items-center gap-1 text-[18px] font-black text-orange-500 leading-none">
              <Flame className="w-4 h-4" />{student.streak}
            </p>
            <p className="text-[11px] text-neutral-400 mt-1">Ketma-ket dars</p>
          </div>
          <div className="glass-soft rounded-xl p-3">
            <p className="text-[18px] font-black text-indigo-600 dark:text-indigo-400 leading-none">{monthXp}</p>
            <p className="text-[11px] text-neutral-400 mt-1">Bu oy XP</p>
          </div>
        </div>
      </div>

      {/* Reyting — guruh ichida, oylik */}
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

        {rows.length === 0 ? (
          <Empty icon={Trophy} text="Bu oyda hali ball yig'ilmagan" />
        ) : rows.map((r, i) => {
          const isMe = r.id === student.id;
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

        {myIndex >= 0 && (
          <p className="px-5 py-2.5 text-[11px] text-neutral-400 border-t border-white/50 dark:border-white/10">
            {board?.month} · guruhda {myIndex + 1}-o&apos;rindasiz. Reyting har oy yangilanadi.
          </p>
        )}
      </div>

      {/* Do'st taklif qilish */}
      <PanelReferral />

      {/* Do'kon */}
      <PanelShop />

      {/* Tarix */}
      <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/50 dark:border-white/10">
          <h3 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">So&apos;nggi ballar</h3>
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
