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
  CheckCircle2, XCircle, Clock, CircleSlash, Trophy, AlertTriangle,
  CalendarDays, MapPin, ShieldAlert, Users, Store,
} from "lucide-react";
import { usePanelGamification } from "@/lib/hooks/useGamification";
import { PanelPoints } from "@/components/gamification/panel-points";
import { PointsBanner } from "@/components/gamification/points-banner";
import { PanelShop } from "@/components/gamification/panel-shop";
import { PasswordCard } from "@/components/gamification/panel-password";
import { payStatusFromBalance, PAY_STATUS_CFG } from "@/lib/payment-status";
import { fmtDayMonth, fmtShortDate, fmtWeekday, UZ_MONTHS_SHORT, UZ_WEEKDAYS_SHORT } from "@/lib/date-uz";

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
  { id: "dokon",     label: "Do'kon",     icon: Store },
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

// Sana nomlari brauzer lokalidan EMAS — Chrome uz-UZ uchun "M08" qaytaradi.
const fmtDate = fmtDayMonth;
const dayName = fmtWeekday;
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
  /**
   * Gamifikatsiya tablari.
   *
   * MUHIM: ilgari `!!gami?.active` ishlatilardi — ya'ni so'rov hali
   * YUKLANAYOTGAN bo'lsa yoki XATO bergan bo'lsa ham tab yashirinardi va
   * o'quvchi gamifikatsiya borligini umuman bilmasdi. Ma'lumot yo'qligi
   * funksiya o'chirilganini anglatmaydi. Endi faqat markaz uni ANIQ
   * o'chirib qo'ygani ma'lum bo'lgandagina yashiriladi; qolgan holatlarda
   * tab ochiladi va ichida sabab (yuklanmoqda / xato / yoqilmagan) yoziladi.
   */
  const { data: gami } = usePanelGamification();
  const gamiKnownOff = gami != null && gami.active === false;
  const TABS = BASE_TABS.filter(
    t => (t.id !== "ballarim" && t.id !== "dokon") || !gamiKnownOff,
  );

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
              {UZ_MONTHS_SHORT[new Date(nextLesson.date + "T12:00:00").getMonth()]}
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
      {tab === "ballarim" && <PanelPoints />}

      {/* ── Do'kon ── */}
      {tab === "dokon" && <PanelShop />}

      {/* ── Profil ── */}
      {tab === "profil" && (
        <div className="space-y-4">
          {/*
            Ball xulosasi profilda ATAYLAB birinchi turadi. Ilgari gamifikatsiya
            faqat alohida tab ichida edi va o'quvchi uni bosmasa ball yig'ilayotganini
            bilmasdi — ya'ni butun tizim ko'rinmas edi.
          */}
          <PointsBanner onOpen={() => setTab("ballarim")} onShop={() => setTab("dokon")} />

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
                    {/* Balansdan hisoblanadi — saqlangan `paymentStatus` eskiradi */}
                    {(() => {
                      const st = payStatusFromBalance(balance, sg.enrollmentStatus);
                      return (
                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold", PAY_STATUS_CFG[st].cls)}>
                          {PAY_STATUS_CFG[st].label}
                        </span>
                      );
                    })()}
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

/**
 * JADVAL — ikki ko'rinish.
 *
 * "Ro'yxat" — kelayotgan darslar ketma-ket. "Jadval" — hafta bo'yicha
 * setka: talaba haftasi qanday taqsimlanganini bir qarashda ko'radi
 * (dars yo'q kunlar ham ko'rinadi, ro'yxatda ular umuman chiqmaydi).
 */
function ScheduleTab({ items }: { items: ScheduleItem[] }) {
  const [view, setView] = useState<"royxat" | "jadval">("jadval");

  if (items.length === 0) {
    return (
      <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl">
        <Empty icon={CalendarDays} text="Yaqin 2 haftada dars yo'q" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1 p-1 glass-soft rounded-xl w-fit">
        {([["jadval", "Jadval"], ["royxat", "Ro'yxat"]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setView(id)}
            className={cn("px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all",
              view === id
                ? "bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-neutral-100"
                : "text-neutral-500 dark:text-neutral-400")}>
            {label}
          </button>
        ))}
      </div>
      {view === "jadval" ? <ScheduleGrid items={items} /> : <ScheduleList items={items} />}
    </div>
  );
}

/** Hafta setkasi: har bir kun — bitta qator, darslari yonida. */
function ScheduleGrid({ items }: { items: ScheduleItem[] }) {
  const today = todayIso();

  const weeks = useMemo(() => {
    const byDate = new Map<string, ScheduleItem[]>();
    for (const it of items) {
      const arr = byDate.get(it.date) ?? [];
      arr.push(it);
      byDate.set(it.date, arr);
    }

    // Birinchi darsdan boshlab dushanbaga tekislaymiz va to'liq haftalar
    // qilib chiqamiz — bo'sh kunlar ham ko'rinsin.
    const dates = [...byDate.keys()].sort();
    if (dates.length === 0) return [];
    const first = new Date(dates[0] + "T12:00:00");
    const shift = (first.getDay() + 6) % 7; // dushanba = 0
    first.setDate(first.getDate() - shift);
    const last = new Date(dates[dates.length - 1] + "T12:00:00");

    const out: { iso: string; lessons: ScheduleItem[] }[][] = [];
    const cur = new Date(first);
    while (cur <= last) {
      const week: { iso: string; lessons: ScheduleItem[] }[] = [];
      for (let i = 0; i < 7; i++) {
        const iso = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`;
        week.push({ iso, lessons: byDate.get(iso) ?? [] });
        cur.setDate(cur.getDate() + 1);
      }
      out.push(week);
    }
    return out;
  }, [items]);

  return (
    <div className="space-y-3">
      {weeks.map((week, wi) => (
        <div key={wi} className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
          <div className="px-4 py-2 border-b border-white/50 dark:border-white/10">
            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              {fmtDayMonth(week[0].iso)} — {fmtDayMonth(week[6].iso)}
            </p>
          </div>
          {week.map(({ iso, lessons }) => {
            const isToday = iso === today;
            return (
              <div key={iso}
                className={cn(
                  "flex gap-3 px-4 py-2.5 border-b border-white/50 dark:border-white/10 last:border-0",
                  isToday && "bg-indigo-50/70 dark:bg-indigo-400/10",
                  lessons.length === 0 && "opacity-50",
                )}>
                <div className="w-16 shrink-0">
                  <p className={cn("text-[12px] font-bold leading-tight",
                    isToday ? "text-indigo-700 dark:text-indigo-300" : "text-neutral-900 dark:text-neutral-100")}>
                    {UZ_WEEKDAYS_SHORT[new Date(iso + "T12:00:00").getDay()]}
                  </p>
                  <p className="text-[10px] text-neutral-400">{fmtShortDate(iso)}</p>
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  {lessons.length === 0 ? (
                    <p className="text-[12px] text-neutral-400">Dars yo&apos;q</p>
                  ) : lessons.map((l, i) => (
                    <div key={`${l.groupId}-${i}`} className="flex items-baseline gap-2">
                      <span className="text-[12px] font-bold tabular-nums text-neutral-900 dark:text-neutral-100 shrink-0">
                        {l.startTime}–{l.endTime}
                      </span>
                      <span className="text-[12px] text-neutral-600 dark:text-neutral-300 truncate">
                        {l.groupName}
                        {l.roomName ? <span className="text-neutral-400"> · {l.roomName}</span> : null}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function ScheduleList({ items }: { items: ScheduleItem[] }) {
  const byDate = useMemo(() => {
    const map = new Map<string, ScheduleItem[]>();
    for (const it of items) {
      const arr = map.get(it.date) ?? [];
      arr.push(it);
      map.set(it.date, arr);
    }
    return [...map.entries()];
  }, [items]);

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
