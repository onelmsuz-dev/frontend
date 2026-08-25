"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock, FileCheck,
  Save, Check, Users, Phone, UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ATTENDANCE_GRACE_MINUTES } from "@/lib/form-constants";
import { businessMinutesOfDay, businessToday } from "@/lib/time";

type Status = "KELDI" | "KELMADI" | "KECH_KELDI" | "SABABLI";

const STATUS_CFG: Record<Status, { short: string; cls: string; activeCls: string; icon: any }> = {
  KELDI:      { short: "Keldi",   cls: "text-green-600 dark:text-green-400", activeCls: "bg-green-500 text-white border-green-500", icon: CheckCircle2 },
  KELMADI:    { short: "Kelmadi", cls: "text-red-600 dark:text-red-400",     activeCls: "bg-red-500 text-white border-red-500",     icon: XCircle },
  KECH_KELDI: { short: "Kech",    cls: "text-amber-600 dark:text-amber-400", activeCls: "bg-amber-500 text-white border-amber-500", icon: Clock },
  SABABLI:    { short: "Sababli", cls: "text-blue-600 dark:text-blue-400",   activeCls: "bg-blue-500 text-white border-blue-500",   icon: FileCheck },
};
const ALL_STATUSES: Status[] = ["KELDI", "KELMADI", "KECH_KELDI", "SABABLI"];
const UZ_DAYS = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
const DOW_TO_VALUE = ["YAKSHANBA", "DUSHANBA", "SESHANBA", "CHORSHANBA", "PAYSHANBA", "JUMA", "SHANBA"];

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function addDays(d: Date, n: number) { const c = new Date(d); c.setDate(c.getDate() + n); return c; }
function fmtMoney(v: number) {
  return new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 0 }).format(Math.abs(v));
}

interface Props {
  groupId: string;
  scheduleDays: string[];
  startTime: string;
  /** Guruh ochilgan sana (ISO) — undan oldingi kunlarga davomat qo'yilmaydi. */
  startDate?: string | null;
  /** Guruh tugash sanasi (ISO) — undan keyin ham davomat qo'yilmaydi. */
  endDate?: string | null;
  /** Chiqib ketmagan StudentGroup yozuvlari (group.students dan). */
  studentGroups: any[];
  /** Ro'yxat o'zgargach guruhni qayta yuklash (faollashtirishdan keyin). */
  onChanged?: () => void;
  canUpdate?: boolean;
}

/**
 * GURUH O'QUVCHILARI VA DAVOMATI — bitta panel.
 *
 * Ilgari guruh sahifasida IKKI ro'yxat bo'lardi: "O'quvchilar ro'yxati"
 * (ism, telefon, holat) va uning ostida "Davomat" (yana o'sha ismlar,
 * bu safar tugmalar bilan). Bir xil odamlar ikki marta chizilib, ekranning
 * yarmi takrorga ketardi va "kim qarzdor" degan savolga birinchi ro'yxat
 * ham javob bermasdi.
 *
 * Endi bitta jadval: har bir qatorda o'quvchi, uning holati, balansi va
 * o'sha kungi davomat tugmalari.
 *
 * SINOVDAGI o'quvchilar ham ro'yxatda: ular sinov darsiga jismonan keladi
 * va davomati belgilanishi kerak (backend buni har doim ruxsat bergan —
 * faqat bu ekran ularni chiqarib tashlardi).
 */
export function GroupAttendanceSection({
  groupId, scheduleDays, startTime, startDate, endDate, studentGroups,
  onChanged, canUpdate = true,
}: Props) {
  // Toshkent bo'yicha — backend ham aynan shu mintaqada qaror qiladi.
  const today = useMemo(() => businessToday(), []);
  const [currentDate, setCurrentDate] = useState(new Date(today));
  const [localStatus, setLocalStatus] = useState<Record<string, Status>>({});
  const [dirty,        setDirty]      = useState(false);
  const [saving,       setSaving]     = useState(false);
  const [savedFlash,   setSavedFlash] = useState(false);
  const [loadErr,      setLoadErr]    = useState("");
  const [activating,   setActivating] = useState<string | null>(null);

  // Dars vaqti kelganda ekran O'ZI ochilsin. Ilgari bu qiymat faqat render
  // paytida hisoblanardi: jurnalni dars boshlanishidan oldin ochib qo'ygan
  // o'qituvchi sahifani qo'lda yangilamaguncha tugmalar yopiq turardi.
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const dateStr  = toDateStr(currentDate);
  const isToday  = currentDate.getTime() === today.getTime();
  // Chiqib ketganlarga davomat yozib bo'lmaydi (backend ham rad etadi),
  // qolganlarning hammasi — sinovdagilar ham — belgilanadi.
  const students = studentGroups.filter(sg => sg.enrollmentStatus !== "CHIQIB_KETGAN");

  const isLessonDay = scheduleDays?.includes(DOW_TO_VALUE[currentDate.getDay()]);
  const lessonStarted = !isToday || (() => {
    const [h, m] = (startTime ?? "00:00").split(":").map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return true;
    // Jonli soat (nowMs) — Toshkent daqiqalariga aylantiriladi; qurilma
    // mintaqasi boshqacha bo'lsa ham server bilan bir xil javob chiqadi.
    return businessMinutesOfDay(new Date(nowMs)) >= h * 60 + m - ATTENDANCE_GRACE_MINUTES;
  })();
  // Guruh ochilishi/tugashi ham hisobga olinadi. Ilgari bu yerda faqat dars
  // kuni va vaqti tekshirilardi: 26-avgustda ochiladigan guruhda 24-avgust
  // uchun belgilash ochiq turar, "Saqlash" bosilganda esa backend
  // "Guruh 26-dan boshlanadi" deb rad etardi.
  const startStr = startDate ? String(startDate).slice(0, 10) : null;
  const endStr   = endDate   ? String(endDate).slice(0, 10)   : null;
  const beforeStart = !!startStr && dateStr < startStr;
  const afterEnd    = !!endStr   && dateStr > endStr;
  const canMark = !!isLessonDay && lessonStarted && !beforeStart && !afterEnd;

  // Tanlangan kun davomatini yuklaydi.
  //
  // `cancelled` bayrog'i kerak: sanani tez-tez varaqlaganda javoblar
  // yuborilgan tartibda qaytmasligi mumkin va ESKI kunning javobi yangisining
  // ustiga yozilib qolardi (ekranda boshqa kunning belgilari ko'rinardi).
  // Holatlar javob kelganda BIR YO'LA yangilanadi — effekt tanasida
  // sinxron `setState` qilinmaydi.
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/attendance?groupId=${groupId}&date=${dateStr}`)
      .then(r => r.json())
      .then((records: any[]) => {
        if (cancelled) return;
        const map: Record<string, Status> = {};
        if (Array.isArray(records)) {
          records.forEach(r => { if (ALL_STATUSES.includes(r.status)) map[r.studentId] = r.status; });
        }
        setLocalStatus(map);
        setDirty(false);
        setLoadErr("");
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [groupId, dateStr]);

  function setStatus(studentId: string, status: Status) {
    if (!canMark) return;
    setLocalStatus(prev => ({ ...prev, [studentId]: status }));
    setDirty(true);
  }

  /** Butun guruhga bir xil holat — "hamma keldi" eng ko'p uchraydigan holat. */
  function markAll(status: Status) {
    if (!canMark) return;
    setLocalStatus(prev => {
      const next = { ...prev };
      for (const sg of students) next[sg.studentId] = status;
      return next;
    });
    setDirty(true);
  }

  async function save() {
    if (!canMark || students.length === 0) return;
    setSaving(true); setLoadErr("");
    try {
      const records = students
        .filter(sg => localStatus[sg.studentId])
        .map(sg => ({ studentGroupId: sg.id, studentId: sg.studentId, status: localStatus[sg.studentId] }));
      const res = await fetch("/api/attendance", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId, date: dateStr, records }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setLoadErr(data.error ?? "Xatolik"); return; }
      setDirty(false); setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } catch { setLoadErr("Serverga ulanib bo'lmadi"); }
    finally { setSaving(false); }
  }

  async function activate(sg: any) {
    setActivating(sg.id); setLoadErr("");
    try {
      const res = await fetch(`/api/student-groups/${sg.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentStatus: "FAOL" }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setLoadErr(d.error ?? "Faollashtirib bo'lmadi");
        return;
      }
      onChanged?.();
    } catch { setLoadErr("Serverga ulanib bo'lmadi"); }
    finally { setActivating(null); }
  }

  const marked = students.filter(sg => localStatus[sg.studentId]).length;

  /** Nega davomat yopiq — bitta joyda, tushunarli matn bilan. */
  const blockedReason =
    beforeStart ? <>Guruh <strong>{startStr}</strong> dan boshlanadi — undan oldingi kunga davomat qo&apos;yib bo&apos;lmaydi.</>
    : afterEnd  ? <>Guruh <strong>{endStr}</strong> da tugagan — undan keyingi kunga davomat qo&apos;yib bo&apos;lmaydi.</>
    : !isLessonDay ? <>{UZ_DAYS[currentDate.getDay()]} — bu guruh jadvalida dars kuni emas.</>
    : !lessonStarted ? <>Dars soat <strong>{startTime}</strong> da boshlanadi — davomat {ATTENDANCE_GRACE_MINUTES} daqiqa oldin ochiladi.</>
    : null;

  return (
    <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
      {/* Sarlavha + sana boshqaruvi */}
      <div className="px-5 py-3 border-b border-white/50 dark:border-white/10 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-neutral-400" />
          <h3 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">
            O&apos;quvchilar va davomat
          </h3>
          <span className="text-[11px] text-neutral-400">{students.length} ta</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setCurrentDate(d => addDays(d, -1))} aria-label="Oldingi kun"
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/60 dark:border-white/10 hover:bg-white/60 dark:hover:bg-white/10 text-neutral-500 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[12px] font-semibold text-neutral-700 dark:text-neutral-300 min-w-[92px] text-center">
            {currentDate.getDate()}.{currentDate.getMonth() + 1} · {UZ_DAYS[currentDate.getDay()].slice(0, 3)}
          </span>
          <button onClick={() => setCurrentDate(d => addDays(d, 1))} disabled={currentDate.getTime() >= today.getTime()}
            aria-label="Keyingi kun"
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/60 dark:border-white/10 hover:bg-white/60 dark:hover:bg-white/10 text-neutral-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          {!isToday && (
            <button onClick={() => setCurrentDate(new Date(today))}
              className="text-[11px] font-semibold px-2 h-7 rounded-lg border border-white/60 dark:border-white/10 text-neutral-500 hover:bg-white/60 dark:hover:bg-white/10 transition-colors">
              Bugun
            </button>
          )}
        </div>
      </div>

      {/* Nega yopiq */}
      {blockedReason && (
        <p className="text-[12px] text-amber-600 dark:text-amber-400 px-5 py-2.5 text-center bg-amber-50/50 dark:bg-amber-900/10">
          {blockedReason}
        </p>
      )}

      {/* Tez belgilash */}
      {canMark && students.length > 0 && (
        <div className="px-5 py-2 border-b border-white/50 dark:border-white/10 flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-neutral-400">Hammasi:</span>
          {ALL_STATUSES.map(st => (
            <button key={st} onClick={() => markAll(st)}
              className={cn("px-2 py-0.5 rounded-lg text-[11px] font-semibold border border-white/60 dark:border-white/10 hover:border-current transition-colors",
                STATUS_CFG[st].cls)}>
              {STATUS_CFG[st].short}
            </button>
          ))}
        </div>
      )}

      {/* Ro'yxat */}
      {students.length === 0 ? (
        <p className="text-[12px] text-neutral-400 px-5 py-8 text-center">Guruhda o&apos;quvchi yo&apos;q</p>
      ) : (
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {students.map((sg: any) => {
            const s = sg.student;
            const status = localStatus[sg.studentId];
            const isTrial = sg.enrollmentStatus === "SINOV";
            const debt = (s?.balance ?? 0) < 0;
            return (
              <div key={sg.id}
                className={cn("flex items-center justify-between gap-3 px-5 py-2.5 flex-wrap transition-colors",
                  isTrial ? "bg-amber-50/40 dark:bg-amber-900/10" : "hover:bg-white/60 dark:hover:bg-white/10")}>
                {/* Kim */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center text-white text-[12px] font-bold shrink-0",
                    isTrial
                      ? "bg-gradient-to-br from-amber-400 to-orange-400"
                      : "bg-gradient-to-br from-blue-400 to-indigo-500")}>
                    {s?.name?.[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Link href={`/students/${s?.id}`}
                        className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 hover:text-blue-600 transition-colors truncate">
                        {s?.name}
                      </Link>
                      {isTrial && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                          Sinov
                        </span>
                      )}
                      {debt && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">
                          Qarz {fmtMoney(s.balance)}
                        </span>
                      )}
                    </div>
                    {s?.phone && (
                      <a href={`tel:${s.phone}`}
                        className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-green-600 transition-colors w-fit">
                        <Phone className="w-2.5 h-2.5" />{s.phone}
                      </a>
                    )}
                  </div>
                </div>

                {/* Amallar */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {isTrial && canUpdate && (
                    <button onClick={() => activate(sg)} disabled={activating === sg.id}
                      title="Faollashtirish — kurs to'lovi balansga yoziladi"
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors disabled:opacity-50">
                      <UserCheck className="w-3 h-3" />
                      {activating === sg.id ? "..." : "Faollashtirish"}
                    </button>
                  )}
                  <div className="flex gap-1">
                    {ALL_STATUSES.map(st => {
                      const cfg = STATUS_CFG[st];
                      const active = status === st;
                      return (
                        <button key={st} onClick={() => setStatus(sg.studentId, st)}
                          disabled={!canMark}
                          className={cn("px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all",
                            !canMark && "opacity-40 cursor-not-allowed",
                            active ? cfg.activeCls : cn("glass-panel border-white/60 dark:border-white/10 hover:border-current", cfg.cls))}>
                          {cfg.short}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Saqlash */}
      {canMark && students.length > 0 && (
        <div className="px-5 py-3 border-t border-white/50 dark:border-white/10 flex items-center gap-3 flex-wrap">
          <span className="text-[11px] text-neutral-400">{marked}/{students.length} belgilandi</span>
          {savedFlash && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-green-600 dark:text-green-400">
              <Check className="w-3.5 h-3.5" /> Saqlandi
            </span>
          )}
          {loadErr && <span className="text-[11px] text-red-500">{loadErr}</span>}
          <button onClick={save} disabled={saving || !dirty}
            className={cn("ml-auto flex items-center gap-1.5 px-4 h-8 rounded-xl text-[12px] font-semibold transition-colors",
              dirty && !saving ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed")}>
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </div>
      )}

      {/* Davomat yopiq bo'lsa ham xatoni ko'rsatamiz (faollashtirish xatosi) */}
      {!canMark && loadErr && (
        <p className="px-5 py-2.5 text-[11px] text-red-500 border-t border-white/50 dark:border-white/10">{loadErr}</p>
      )}
    </div>
  );
}
