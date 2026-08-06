"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  useStudentProfile, useStudentGroups, useStudentPayments,
  useStudentAttendance, useStudentSchedule,
  type StudentAttendance, type ScheduleItem,
} from "@/lib/hooks/usePanel";
import {
  User, Wallet, CalendarCheck, BookOpen, Phone, TrendingDown, TrendingUp,
  CheckCircle2, XCircle, Clock, CircleSlash, Trophy, Flame, AlertTriangle,
  CalendarDays, MapPin, ShieldAlert, Users,
} from "lucide-react";
import {
  usePanelGamification, usePanelLeaderboard, REASON_LABELS, REASON_COLORS,
} from "@/lib/hooks/useGamification";
import { PanelShop } from "@/components/gamification/panel-shop";
import { PanelReferral } from "@/components/gamification/panel-referral";
import { PasswordCard } from "@/components/gamification/panel-password";

function fmtMoney(v: number) {
  return new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 0 }).format(v) + " so'm";
}

const ATT_CFG: Record<string, { label: string; icon: any; cls: string; chip: string }> = {
  KELDI:      { label: "Keldi",       icon: CheckCircle2, cls: "text-green-600 dark:text-green-400",  chip: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
  KELMADI:    { label: "Kelmadi",     icon: XCircle,      cls: "text-red-600 dark:text-red-400",      chip: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
  KECH_KELDI: { label: "Kech keldi",  icon: Clock,        cls: "text-amber-600 dark:text-amber-400",  chip: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  SABABLI:    { label: "Sababli",     icon: CircleSlash,  cls: "text-blue-600 dark:text-blue-400",    chip: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  SINOV_DARSI:{ label: "Sinov darsi", icon: BookOpen,     cls: "text-purple-600 dark:text-purple-400",chip: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
};

const BASE_TABS = [
  { id: "profil",    label: "Profil",     icon: User },
  { id: "ballarim",  label: "Ballarim",   icon: Trophy },
  { id: "jadval",    label: "Jadval",     icon: CalendarDays },
  { id: "tolovlar",  label: "To'lovlar",  icon: Wallet },
  { id: "davomat",   label: "Davomat",    icon: CalendarCheck },
  { id: "kurslarim", label: "Kurslarim",  icon: BookOpen },
];

/** `scheduleDays` bazada turli formatda bo'lishi mumkin — qisqa yorliqqa keltiramiz. */
const DAY_SHORT: Record<string, string> = {
  dushanba: "Du", seshanba: "Se", chorshanba: "Cho", payshanba: "Pay",
  juma: "Ju", shanba: "Sha", yakshanba: "Yak",
  du: "Du", se: "Se", ch: "Cho", pa: "Pay", ju: "Ju", sha: "Sha", sh: "Sha", ya: "Yak",
  mon: "Du", tue: "Se", wed: "Cho", thu: "Pay", fri: "Ju", sat: "Sha", sun: "Yak",
  "1": "Du", "2": "Se", "3": "Cho", "4": "Pay", "5": "Ju", "6": "Sha", "0": "Yak",
};
function dayLabels(days?: string[]): string[] {
  return (days ?? []).map(d => DAY_SHORT[String(d).trim().toLowerCase()] ?? String(d));
}

function fmtDate(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("uz-UZ", { day: "numeric", month: "long" });
}
function dayName(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("uz-UZ", { weekday: "long" });
}
function todayIso() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded-lg", className)} />;
}

export default function StudentPanelPage() {
  const [tab, setTab] = useState("profil");
  const { data: profile, isLoading: pLoad, error: pErr } = useStudentProfile();
  const { data: groups } = useStudentGroups();
  const { data: payments } = useStudentPayments();
  const { data: att } = useStudentAttendance();
  const { data: schedule } = useStudentSchedule();
  // Gamifikatsiya o'chiq bo'lsa (yoki xato bo'lsa) tab umuman ko'rsatilmaydi
  const { data: gami } = usePanelGamification();
  const gamiActive = !!gami?.active;
  const TABS = BASE_TABS.filter(t => t.id !== "ballarim" || gamiActive);

  const balance = profile?.balance ?? 0;
  const groupList: any[] = Array.isArray(groups) ? groups : [];
  const payList: any[] = Array.isArray(payments) ? payments : [];
  const totalPaid = payList.reduce((s, p) => s + (p.amount ?? 0), 0);
  const scheduleList: ScheduleItem[] = Array.isArray(schedule) ? schedule : [];
  const nextLesson = scheduleList[0] ?? null;

  // ── Profil yuklanmadi: sababni ochiq aytamiz ───────────────────────────────
  if (pErr) {
    const status = (pErr as Error & { status?: number }).status;
    return (
      <div className="glass-panel border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
        <ShieldAlert className="w-10 h-10 mx-auto mb-3 text-red-500" />
        <h2 className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100">
          {status === 403 ? "Bu sahifa faqat o'quvchilar uchun" : "Ma'lumotni yuklab bo'lmadi"}
        </h2>
        <p className="text-[13px] text-neutral-500 dark:text-neutral-400 mt-1.5 max-w-md mx-auto">
          {status === 403
            ? "Siz xodim yoki o'qituvchi hisobi bilan kirgansiz. O'quvchi paneli faqat o'quvchi hisobiga ochiladi — asosiy panelga qayting."
            : (pErr as Error).message}
        </p>
        {status === 403 && (
          <a href="/dashboard"
            className="inline-block mt-4 px-4 h-10 leading-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-semibold transition-colors">
            Asosiy panelga o&apos;tish
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Profil kartasi */}
      <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-5">
        {pLoad ? (
          <div className="space-y-3"><Skeleton className="h-6 w-40" /><Skeleton className="h-4 w-56" /></div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-blue-500 shrink-0" />
                  <h2 className="text-[13px] font-bold text-neutral-500 dark:text-neutral-400">
                    {profile?.organization?.name ?? "Talaba ma'lumotlari"}
                  </h2>
                </div>
                <h1 className="text-2xl font-black text-neutral-900 dark:text-neutral-100 truncate">
                  {profile?.name}
                </h1>
                <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px]">
                  {profile?.phone && (
                    <a href={`tel:${profile.phone}`}
                      className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300 hover:text-indigo-600 transition-colors">
                      <Phone className="w-3.5 h-3.5 text-blue-500" />{profile.phone}
                    </a>
                  )}
                  {profile?.branch?.name && (
                    <span className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
                      <MapPin className="w-3.5 h-3.5" />{profile.branch.name}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="text-[11px] text-neutral-400">Balans</p>
                <p className={cn("text-[20px] font-black leading-none mt-0.5",
                  balance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                  {fmtMoney(balance)}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Qarzdorlik — eng ko'zga tashlanadigan joyda */}
      {!pLoad && balance < 0 && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <p className="text-[13px] text-red-700 dark:text-red-300">
            Sizda <span className="font-bold">{fmtMoney(Math.abs(balance))}</span> qarz bor.
            To&apos;lovni o&apos;quv markazingiz qabulxonasiga topshiring.
          </p>
        </div>
      )}

      {/* Keyingi dars */}
      {!pLoad && nextLesson && (
        <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/40 flex flex-col items-center justify-center shrink-0">
            <span className="text-[15px] font-black text-indigo-600 dark:text-indigo-400 leading-none">
              {new Date(nextLesson.date + "T12:00:00").getDate()}
            </span>
            <span className="text-[9px] text-indigo-500 dark:text-indigo-400 uppercase mt-0.5">
              {new Date(nextLesson.date + "T12:00:00").toLocaleDateString("uz-UZ", { month: "short" })}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              {nextLesson.date === todayIso() ? "Bugungi dars" : "Keyingi dars"}
            </p>
            <p className="text-[14px] font-bold text-neutral-900 dark:text-neutral-100 truncate mt-0.5">
              {nextLesson.groupName}
            </p>
            <p className="text-[12px] text-neutral-500 dark:text-neutral-400 truncate">
              {dayName(nextLesson.date)} · {nextLesson.startTime}–{nextLesson.endTime}
              {nextLesson.roomName ? ` · ${nextLesson.roomName}` : ""}
            </p>
          </div>
        </div>
      )}

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
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={CalendarCheck} label="Umumiy davomat" value={`${att?.rate ?? 0}%`}
              trend={(att?.rate ?? 0) >= 80 ? "up" : "down"} />
            <StatCard icon={BookOpen} label="Guruhlar" value={String(groupList.length)} />
            <StatCard icon={Wallet} label="Jami to'langan" value={fmtMoney(totalPaid)} />
            <StatCard icon={CalendarDays} label="Yaqin darslar" value={String(scheduleList.length)} />
          </div>

          {/* Ota-ona ma'lumoti */}
          {(profile?.parentName || profile?.parentPhone || profile?.school) && (
            <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/50 dark:border-white/10">
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">Qo&apos;shimcha ma&apos;lumot</h3>
              </div>
              <div className="p-4 space-y-2 text-[13px]">
                {profile?.parentName && <InfoRow label="Ota-ona" value={profile.parentName} />}
                {profile?.parentPhone && (
                  <InfoRow label="Ota-ona telefoni"
                    value={<a href={`tel:${profile.parentPhone}`} className="hover:text-indigo-600">{profile.parentPhone}</a>} />
                )}
                {profile?.school && <InfoRow label="Maktab" value={profile.school} />}
              </div>
            </div>
          )}

          <PasswordCard />
        </div>
      )}

      {/* ── Jadval ── */}
      {tab === "jadval" && <ScheduleTab items={scheduleList} />}

      {/* ── To'lovlar ── */}
      {tab === "tolovlar" && (
        <div className="space-y-3">
          <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-4 flex items-center justify-between">
            <span className="text-[13px] text-neutral-500">Jami to&apos;langan</span>
            <span className="text-xl font-black text-green-600 dark:text-green-400">{fmtMoney(totalPaid)}</span>
          </div>
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
        </div>
      )}

      {/* ── Davomat ── */}
      {tab === "davomat" && <AttendanceTab att={att} />}

      {/* ── Kurslarim ── */}
      {tab === "kurslarim" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {groupList.length === 0 ? (
            <div className="sm:col-span-2"><Empty icon={BookOpen} text="Hali guruhga qo'shilmagansiz" /></div>
          ) : groupList.map(sg => {
            const days = dayLabels(sg.group?.scheduleDays);
            return (
              <div key={sg.id} className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">{sg.group?.name}</h3>
                    <p className="text-[12px] text-neutral-500">{sg.group?.course?.name}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold",
                      sg.paymentStatus === "TOLANDI"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400")}>
                      {sg.paymentStatus === "TOLANDI" ? "To'langan" : "Qarzdor"}
                    </span>
                    {sg.enrollmentStatus === "SINOV" && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        Sinov
                      </span>
                    )}
                  </div>
                </div>

                {/* Dars kunlari — eng kerakli ma'lumot */}
                {days.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {days.map(d => (
                      <span key={d} className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                        {d}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-white/50 dark:border-white/10 space-y-1.5 text-[12px] text-neutral-500 dark:text-neutral-400">
                  <p className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 shrink-0" />{sg.group?.startTime}–{sg.group?.endTime}
                    {sg.group?.room?.name ? ` · ${sg.group.room.name}` : ""}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <User className="w-3 h-3 shrink-0" />
                    {sg.group?.teacher?.user?.name ?? "—"}
                    {sg.group?.teacher?.phone && (
                      <a href={`tel:${sg.group.teacher.phone}`}
                        className="ml-1 text-indigo-600 dark:text-indigo-400 hover:underline">
                        {sg.group.teacher.phone}
                      </a>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Jadval ───────────────────────────────────────────────────────────────────

function ScheduleTab({ items }: { items: ScheduleItem[] }) {
  const byDate = useMemo(() => {
    const map = new Map<string, ScheduleItem[]>();
    for (const it of items) {
      const arr = map.get(it.date) ?? [];
      arr.push(it);
      map.set(it.date, arr);
    }
    return [...map.entries()];
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl">
        <Empty icon={CalendarDays} text="Yaqin 2 haftada dars yo'q" />
      </div>
    );
  }

  const today = todayIso();

  return (
    <div className="space-y-3">
      {byDate.map(([date, lessons]) => (
        <div key={date} className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
          <div className={cn(
            "flex items-center justify-between px-5 py-2.5 border-b border-white/50 dark:border-white/10",
            date === today && "bg-indigo-50/70 dark:bg-indigo-400/10",
          )}>
            <p className={cn("text-[13px] font-bold",
              date === today ? "text-indigo-700 dark:text-indigo-300" : "text-neutral-900 dark:text-neutral-100")}>
              {fmtDate(date)}
              {date === today && " · Bugun"}
            </p>
            <p className="text-[11px] text-neutral-400 capitalize">{dayName(date)}</p>
          </div>
          {lessons.map((l, i) => (
            <div key={`${l.groupId}-${i}`}
              className="flex items-center gap-3 px-5 py-3 border-b border-white/50 dark:border-white/10 last:border-0">
              <div className="text-center shrink-0 w-12">
                <p className="text-[13px] font-black text-neutral-900 dark:text-neutral-100 leading-none">{l.startTime}</p>
                <p className="text-[10px] text-neutral-400 mt-0.5">{l.endTime}</p>
              </div>
              <div className="w-px h-8 bg-neutral-200 dark:bg-white/10 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 truncate">{l.groupName}</p>
                <p className="text-[11px] text-neutral-400 truncate">
                  {[l.courseName, l.teacherName, l.roomName].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Davomat ──────────────────────────────────────────────────────────────────

function AttendanceTab({ att }: { att?: StudentAttendance }) {
  const b = att?.breakdown;
  const rate = att?.rate ?? 0;

  return (
    <div className="space-y-3">
      <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] text-neutral-500">Davomat foizi</span>
          <span className={cn("text-xl font-black",
            rate >= 80 ? "text-green-600 dark:text-green-400"
              : rate >= 50 ? "text-amber-600 dark:text-amber-400"
              : "text-red-600 dark:text-red-400")}>
            {rate}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-neutral-200/70 dark:bg-white/10 overflow-hidden">
          <div className={cn("h-full rounded-full transition-all",
            rate >= 80 ? "bg-green-500" : rate >= 50 ? "bg-amber-500" : "bg-red-500")}
            style={{ width: `${rate}%` }} />
        </div>
        {b && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {(["KELDI", "KECH_KELDI", "KELMADI", "SABABLI"] as const).map(k => (
              b[k] > 0 && (
                <span key={k} className={cn("text-[11px] px-2.5 py-1 rounded-lg font-semibold", ATT_CFG[k].chip)}>
                  {ATT_CFG[k].label}: {b[k]}
                </span>
              )
            ))}
          </div>
        )}
      </div>

      <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
        {(att?.records ?? []).length === 0 ? (
          <Empty icon={CalendarCheck} text="Davomat yozuvi yo'q" />
        ) : (att?.records ?? []).map(r => {
          const cfg = ATT_CFG[r.status] ?? ATT_CFG.KELDI;
          const Icon = cfg.icon;
          return (
            <div key={r.id} className="flex items-center justify-between px-4 py-3 border-b border-white/50 dark:border-white/10 last:border-0">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-neutral-800 dark:text-neutral-200 truncate">{r.group?.name ?? "—"}</p>
                <p className="text-[11px] text-neutral-400">{new Date(r.date).toLocaleDateString("uz-UZ")}</p>
                {r.note && <p className="text-[11px] text-neutral-400 italic truncate">{r.note}</p>}
              </div>
              <span className={cn("flex items-center gap-1.5 text-[12px] font-semibold shrink-0", cfg.cls)}>
                <Icon className="w-3.5 h-3.5" /> {cfg.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Umumiy ───────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-neutral-400 shrink-0">{label}</span>
      <span className="text-neutral-700 dark:text-neutral-300 text-right truncate">{value}</span>
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
      <p className="text-[17px] font-black text-neutral-900 dark:text-neutral-100 leading-tight">{value}</p>
      <p className="text-[11px] text-neutral-400 mt-0.5">{label}</p>
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
