"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import useSWR, { mutate } from "swr";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetcher } from "@/lib/fetcher";
import { attendanceFrom } from "@/lib/attendance-from";
import { businessToday, toDateStr } from "@/lib/time";
import { UZ_MONTHS_SHORT, UZ_WEEKDAYS } from "@/lib/date-uz";

type Status = "KELDI" | "KELMADI" | "KECH_KELDI" | "SABABLI";
type Rec = { studentId: string; date: string; status: Status; note?: string | null };

const DOW_TO_VALUE = ["YAKSHANBA", "DUSHANBA", "SESHANBA", "CHORSHANBA", "PAYSHANBA", "JUMA", "SHANBA"];
const STATUS_ORDER: Status[] = ["KELDI", "KECH_KELDI", "KELMADI", "SABABLI"];
/** Shu statuslarda SABABI bo'lishi mumkin — tanlanganda izoh so'raladi. */
const NOTE_STATUSES: Status[] = ["KECH_KELDI", "SABABLI"];

const STATUS_CFG: Record<Status, { short: string; cls: string }> = {
  KELDI:      { short: "Bor edi", cls: "bg-teal-600 text-white" },
  KECH_KELDI: { short: "Kech",    cls: "bg-amber-500 text-white" },
  KELMADI:    { short: "Yo'q",    cls: "bg-red-500 text-white" },
  SABABLI:    { short: "Sababli", cls: "bg-blue-500 text-white" },
};

const POPUP_W = 112;      // w-28
const POPUP_H_EST = 160;
const NOTE_POPUP_W = 208; // w-52
const NOTE_POPUP_H_EST = 175;
const TOOLTIP_W = 144;    // w-36
const TOOLTIP_H_EST = 90;

function pad(n: number) { return String(n).padStart(2, "0"); }

/**
 * DAVOMAT — OY JADVALI (sana × o'quvchi).
 *
 * Kun-kun varaqlash o'rniga BUTUN OY bir ko'rinishda: xodim "kim necha kun
 * qatnashgan" ni pastga tushmasdan ko'radi. Faqat BUGUNGI ustun bosiladi —
 * o'tgan kunlar jurnal, o'zgartirib bo'lmaydi (xatoni tuzatish alohida
 * davomat sahifasida, ruxsat bilan).
 *
 * BELGILASH — POPUP orqali, sikllab EMAS: bir bosishda 4 ta variant chiqadi.
 *
 * POPUPLAR PORTAL ORQALI (`document.body`ga, `position:fixed`) chiziladi —
 * jadval o'zi `overflow-x-auto` ichida, ya'ni katakcha ichida qolsa
 * gorizontal skroll konteyneri uni pastdan/yon tomondan kesib tashlardi
 * (egasi xabar berdi: "scroll qilganda ko'rinmay qolib ketadi"). Portal
 * bilan popup butun ekranga nisbatan joylashadi — hech qanday konteyner
 * uni kesa olmaydi. `DatePicker` bilan bir xil naqsh.
 */
export function GroupAttendanceGrid({
  groupId, scheduleDays, students, canMark,
}: {
  groupId: string;
  scheduleDays: string[];
  students: any[];
  canMark: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const today = useMemo(() => businessToday(), []);
  const todayStr = toDateStr(today);

  const [view, setView] = useState(() => ({ year: today.getFullYear(), month: today.getMonth() }));
  const [savingCell, setSavingCell] = useState<string | null>(null);

  // ── Belgilash popup (bosish bilan) ──
  const [openCell, setOpenCell] = useState<{ key: string; sg: any; ds: string } | null>(null);
  const [openRect, setOpenRect] = useState<DOMRect | null>(null);
  // Popup ICHIDAGI ikkinchi bosqich: "Kech" yoki "Sababli" tanlansa,
  // to'g'ridan-to'g'ri saqlash o'rniga izoh so'raladi (sababi yozilsin).
  const [pendingStatus, setPendingStatus] = useState<Status | null>(null);
  const [noteText, setNoteText] = useState("");

  // ── "Jami" qatoridagi taqsimot (sichqoncha olib borish bilan) ──
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);

  // Ikkala popup ham: tashqariga bosilsa yoki SKROLL bo'lsa yopiladi.
  // Reposition qilib o'tirmaymiz — jadval o'zi tez-tez gorizontal
  // skroll qilinadi, popupni ortidan quvish o'rniga shunchaki yopish
  // soddaroq va hech qachon noto'g'ri joyda "muallaq" qolib ketmaydi.
  useEffect(() => {
    if (!openCell) return;
    const cellKey = openCell.key;
    function handler(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (t.closest("[data-attendance-popup]")) return;
      if (t.closest(`[data-cell-trigger="${cellKey}"]`)) return;
      setOpenCell(null);
      setPendingStatus(null);
    }
    function onScroll() { setOpenCell(null); setPendingStatus(null); }
    document.addEventListener("mousedown", handler);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", handler);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [openCell]);

  useEffect(() => {
    if (!hoverDate) return;
    function onScroll() { setHoverDate(null); }
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [hoverDate]);

  const monthKey = `${view.year}-${pad(view.month + 1)}`;
  const { data } = useSWR<Rec[]>(`/api/attendance?groupId=${groupId}&month=${monthKey}`, fetcher);

  const recordMap = useMemo(() => {
    const m = new Map<string, { status: Status; note: string | null }>();
    const records = Array.isArray(data) ? data : [];
    for (const r of records) m.set(`${r.studentId}|${r.date}`, { status: r.status, note: r.note ?? null });
    return m;
  }, [data]);

  const isCurrentMonth = view.year === today.getFullYear() && view.month === today.getMonth();

  const dates = useMemo(() => {
    const monthStart = new Date(view.year, view.month, 1);
    const monthEnd = new Date(view.year, view.month + 1, 0);
    const last = isCurrentMonth ? today : monthEnd;
    if (last < monthStart) return [];
    const out: Date[] = [];
    for (let d = new Date(monthStart); d <= last; d.setDate(d.getDate() + 1)) {
      if (scheduleDays.includes(DOW_TO_VALUE[d.getDay()])) out.push(new Date(d));
    }
    return out;
  }, [view, isCurrentMonth, today, scheduleDays]);

  /**
   * ESKI A'ZOLAR — boshqa guruhga o'tgan yoki chiqarilgan o'quvchi butunlay
   * yashirilsa, o'sha oydagi haqiqiy davomat tarixi ham (yozuvlar bazada
   * bor bo'lsa ham) ko'rinmay qolardi — jadvalda qatorning o'zi yo'q edi
   * (egasining talabi, 2026-09-30). Shuning uchun "Chiqib ketgan" o'quvchi
   * FAQAT shu oyda hali guruhda bo'lgan bo'lsa (chiqqan sanasi shu oy
   * boshidan keyin) ro'yxatda qoladi — yillar oldin ketgan bitiruvchilar
   * bilan jadval cheksiz cho'zilib ketmasin.
   */
  const roster = students.filter((sg: any) => {
    if (sg.enrollmentStatus !== "CHIQIB_KETGAN") return true;
    if (!sg.leftAt) return false;
    return toDateStr(new Date(sg.leftAt)) >= `${monthKey}-01`;
  });

  /** Shu sanada kim qanday belgilangan — "Jami" qatoridagi popup shundan quriladi. */
  function summaryForDate(ds: string) {
    const counts: Record<Status, number> = { KELDI: 0, KECH_KELDI: 0, KELMADI: 0, SABABLI: 0 };
    let marked = 0;
    let applicable = 0;
    for (const sg of roster) {
      const from = attendanceFrom(sg.joinedAt);
      if (from && ds < from) continue;
      applicable++;
      const rec = recordMap.get(`${sg.studentId}|${ds}`);
      if (rec) { counts[rec.status]++; marked++; }
    }
    return { counts, marked, applicable };
  }

  async function setStatus(sg: any, dateStr: string, status: Status, note: string | null) {
    if (!canMark) return;
    const key = `${sg.studentId}|${dateStr}`;
    setOpenCell(null);
    setPendingStatus(null);
    setSavingCell(key);
    try {
      await fetch("/api/attendance", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId, date: dateStr,
          records: [{ studentGroupId: sg.id, studentId: sg.studentId, status, note }],
        }),
      });
      mutate(`/api/attendance?groupId=${groupId}&month=${monthKey}`);
    } finally {
      setSavingCell(null);
    }
  }

  /** Ekrandan chiqib ketmasin — pastda joy yetmasa tepaga ochiladi, yon tomonda markazga tekislanadi. */
  function fixedPos(rect: DOMRect, width: number, heightEst: number, preferAbove: boolean) {
    const showAbove = preferAbove ? rect.top - heightEst > 8 : rect.bottom + heightEst > window.innerHeight;
    const top = showAbove ? Math.max(8, rect.top - heightEst - 6) : rect.bottom + 6;
    const left = Math.min(Math.max(8, rect.left + rect.width / 2 - width / 2), window.innerWidth - width - 8);
    return { top, left };
  }

  const statusPopup = openCell && openRect && mounted ? createPortal(
    pendingStatus ? (
      // ── IKKINCHI BOSQICH: "Kech" / "Sababli" — sababi yoziladi. ──
      <div data-attendance-popup=""
        style={{ position: "fixed", zIndex: 120, width: NOTE_POPUP_W, ...fixedPos(openRect, NOTE_POPUP_W, NOTE_POPUP_H_EST, false) }}
        className="rounded-xl glass-strong border border-white/60 dark:border-white/10 shadow-xl p-2.5 space-y-2">
        <div className="flex items-center gap-1.5">
          <span className={cn("w-2 h-2 rounded-full shrink-0", STATUS_CFG[pendingStatus].cls.split(" ")[0])} />
          <span className="text-[11.5px] font-bold text-neutral-800 dark:text-neutral-100">
            {STATUS_CFG[pendingStatus].short}
          </span>
        </div>
        <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={2} autoFocus
          placeholder="Sababi (ixtiyoriy)..."
          className="w-full px-2 py-1.5 text-[11.5px] rounded-lg border border-white/60 dark:border-white/10
            bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400
            outline-none focus:border-indigo-400 transition-colors resize-none" />
        <div className="flex items-center gap-1.5">
          <button onClick={() => setStatus(openCell.sg, openCell.ds, pendingStatus, noteText.trim() || null)}
            className={cn("flex-1 h-7 rounded-lg text-[11px] font-semibold text-white transition-colors",
              pendingStatus === "KECH_KELDI" ? "bg-amber-500 hover:bg-amber-600" : "bg-blue-500 hover:bg-blue-600")}>
            Saqlash
          </button>
          <button onClick={() => setPendingStatus(null)}
            className="h-7 px-2.5 rounded-lg text-[11px] font-semibold text-neutral-500 dark:text-neutral-400
              hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors">
            Orqaga
          </button>
        </div>
      </div>
    ) : (
      // ── BIRINCHI BOSQICH: 4 ta variant. ──
      <div data-attendance-popup="" style={{ position: "fixed", zIndex: 120, width: POPUP_W, ...fixedPos(openRect, POPUP_W, POPUP_H_EST, false) }}
        className="rounded-xl glass-strong border border-white/60 dark:border-white/10 shadow-xl p-1.5">
        {STATUS_ORDER.map(st => {
          const current = recordMap.get(openCell.key)?.status;
          return (
            <button key={st}
              onClick={() => {
                if (NOTE_STATUSES.includes(st)) { setPendingStatus(st); setNoteText(""); }
                else setStatus(openCell.sg, openCell.ds, st, null);
              }}
              className={cn("w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-left transition-colors",
                current === st
                  ? STATUS_CFG[st].cls
                  : "text-neutral-600 dark:text-neutral-300 hover:bg-white/70 dark:hover:bg-white/10")}>
              <span className={cn("w-2 h-2 rounded-full shrink-0", current === st ? "bg-white" : STATUS_CFG[st].cls.split(" ")[0])} />
              {STATUS_CFG[st].short}
            </button>
          );
        })}
      </div>
    ),
    document.body,
  ) : null;

  const jamiTooltip = hoverDate && hoverRect && mounted ? createPortal(
    (() => {
      const { counts, marked } = summaryForDate(hoverDate);
      const d = new Date(hoverDate + "T12:00:00");
      return (
        <div style={{ position: "fixed", zIndex: 110, width: TOOLTIP_W, ...fixedPos(hoverRect, TOOLTIP_W, TOOLTIP_H_EST, true) }}
          className="rounded-xl glass-strong border border-white/60 dark:border-white/10 shadow-lg p-2.5 text-left pointer-events-none">
          <p className="text-[10.5px] font-bold text-neutral-700 dark:text-neutral-200 mb-1.5 whitespace-normal">
            {UZ_WEEKDAYS[d.getDay()]}, {d.getDate()} {UZ_MONTHS_SHORT[d.getMonth()].toLowerCase()}
          </p>
          {marked === 0 ? (
            <p className="text-[10.5px] text-neutral-400">Hali belgilanmagan</p>
          ) : (
            <div className="space-y-1">
              {STATUS_ORDER.map(st => counts[st] > 0 && (
                <div key={st} className="flex items-center justify-between gap-2 text-[10.5px] font-normal">
                  <span className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300">
                    <span className={cn("w-2 h-2 rounded-full shrink-0", STATUS_CFG[st].cls.split(" ")[0])} />
                    {STATUS_CFG[st].short}
                  </span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-100">{counts[st]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    })(),
    document.body,
  ) : null;

  return (
    <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
      <div className="px-5 py-3 border-b border-white/50 dark:border-white/10 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-neutral-400" />
          <h3 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">Davomat</h3>
        </div>
        <div className="flex items-center gap-1.5">
          {!isCurrentMonth && (
            <button onClick={() => setView({ year: today.getFullYear(), month: today.getMonth() })}
              className="text-[11px] font-semibold px-2.5 h-7 rounded-lg border border-white/60 dark:border-white/10 text-neutral-500 hover:bg-white/60 dark:hover:bg-white/10 transition-colors">
              Joriy
            </button>
          )}
          <button onClick={() => setView(v => {
            const m = v.month - 1;
            return m < 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: m };
          })} aria-label="Oldingi oy"
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/60 dark:border-white/10 hover:bg-white/60 dark:hover:bg-white/10 text-neutral-500 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[12px] font-semibold text-neutral-700 dark:text-neutral-300 min-w-[80px] text-center">
            {UZ_MONTHS_SHORT[view.month].toLowerCase()} {view.year}
          </span>
          <button disabled={isCurrentMonth} onClick={() => setView(v => {
            const m = v.month + 1;
            return m > 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: m };
          })} aria-label="Keyingi oy"
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/60 dark:border-white/10 hover:bg-white/60 dark:hover:bg-white/10 text-neutral-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {roster.length === 0 ? (
        <p className="text-[12px] text-neutral-400 px-5 py-8 text-center">Guruhda o&apos;quvchi yo&apos;q</p>
      ) : dates.length === 0 ? (
        <p className="text-[12px] text-neutral-400 px-5 py-8 text-center">Bu oyda dars kuni yo&apos;q</p>
      ) : (
        <div className="overflow-x-auto [scrollbar-width:thin]">
          <table className="w-full text-[12px] border-collapse">
            <thead>
              <tr className="border-b border-white/50 dark:border-white/10">
                {/* "Ism" ustuni STICKY — gorizontal skrollda joyida qoladi.
                    `glass-panel` (kartaning o'zi ishlatadigan fon) dark
                    rejimda deyarli TO'LIQ SHAFFOF (5% oq) — pastidan
                    sirg'alib o'tayotgan sanalar ismning ustidan ko'rinib,
                    ikkalasi aralashib ketardi. `glass-strong` (dropdown/
                    modal fonidagi kabi, ~88% xira) sticky ustunni haqiqatan
                    QOPLAYDI (egasi skrinshot bilan ko'rsatdi, 2026-09-28). */}
                <th className="sticky left-0 z-10 glass-strong text-left font-semibold text-neutral-500 dark:text-neutral-400 px-4 py-2 whitespace-nowrap">
                  Ism
                </th>
                {dates.map(d => {
                  const ds = toDateStr(d);
                  return (
                    <th key={ds}
                      className={cn("px-2 py-2 font-semibold text-center whitespace-nowrap",
                        ds === todayStr ? "text-indigo-600 dark:text-indigo-400" : "text-neutral-400")}>
                      {d.getDate()} {UZ_MONTHS_SHORT[d.getMonth()].toLowerCase()}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {roster.map((sg: any) => {
                const s = sg.student;
                const from = attendanceFrom(sg.joinedAt);
                return (
                  <tr key={sg.id} className="hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                    <td className="sticky left-0 z-10 glass-strong px-4 py-1.5 whitespace-nowrap">
                      <span className={cn("text-[12.5px] font-medium",
                        sg.enrollmentStatus === "CHIQIB_KETGAN"
                          ? "text-neutral-400 dark:text-neutral-500"
                          : "text-neutral-800 dark:text-neutral-200")}>
                        {s?.name}
                      </span>
                      {sg.enrollmentStatus === "CHIQIB_KETGAN" && (
                        <span className="ml-1.5 text-[9.5px] px-1.5 py-0.5 rounded-full font-semibold
                          bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                          Ketgan
                        </span>
                      )}
                    </td>
                    {dates.map(d => {
                      const ds = toDateStr(d);
                      const applicable = !from || ds >= from;
                      const rec = recordMap.get(`${sg.studentId}|${ds}`);
                      const status = rec?.status;
                      const isToday = ds === todayStr;
                      const clickable = isToday && canMark && applicable;
                      const key = `${sg.studentId}|${ds}`;
                      return (
                        <td key={ds} className="px-2 py-1.5 text-center">
                          {!applicable ? (
                            <span className="inline-block w-14 h-5" />
                          ) : (
                            <button
                              data-cell-trigger={key}
                              disabled={!clickable || savingCell === key}
                              onClick={(e) => {
                                if (!clickable) return;
                                if (openCell?.key === key) { setOpenCell(null); setPendingStatus(null); return; }
                                setOpenRect(e.currentTarget.getBoundingClientRect());
                                setOpenCell({ key, sg, ds });
                                // Allaqachon "Kech"/"Sababli" bo'lsa — to'g'ridan-to'g'ri
                                // izoh tahririga o'tadi, qayta 4 tadan tanlash shart emas.
                                if (rec && NOTE_STATUSES.includes(rec.status)) {
                                  setPendingStatus(rec.status);
                                  setNoteText(rec.note ?? "");
                                } else {
                                  setPendingStatus(null);
                                  setNoteText("");
                                }
                              }}
                              className={cn("relative inline-flex items-center justify-center w-14 h-5 rounded-md text-[10px] font-semibold transition-opacity",
                                status
                                  ? STATUS_CFG[status].cls
                                  : "border border-dashed border-neutral-300 dark:border-neutral-700",
                                clickable ? "cursor-pointer hover:opacity-80" : "cursor-default",
                                savingCell === key && "opacity-50")}>
                              {status ? STATUS_CFG[status].short : (clickable &&
                                <span className="text-neutral-300 dark:text-neutral-600">+</span>)}
                              {/* Izoh bor belgisi — kichik nuqta, katakchani band qilmaydi. */}
                              {rec?.note && (
                                <span title={rec.note}
                                  className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-white ring-1 ring-neutral-400" />
                              )}
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>

            {/* JAMI — har bir kunning umumiy holati, o'quvchilar ro'yxati
                TAGIDA. Sana ustiga sichqoncha olib borilsa to'liq taqsimot
                (necha kishi kelgan, kelmagan...) chiqadi. */}
            <tfoot>
              <tr className="border-t-2 border-neutral-200 dark:border-neutral-700 bg-neutral-50/60 dark:bg-white/[0.03]">
                <td className="sticky left-0 z-10 glass-strong px-4 py-2 whitespace-nowrap">
                  <span className="text-[11.5px] font-bold text-neutral-600 dark:text-neutral-300">Jami</span>
                </td>
                {dates.map(d => {
                  const ds = toDateStr(d);
                  const { marked, applicable } = summaryForDate(ds);
                  return (
                    <td key={ds} className="px-2 py-2 text-center cursor-default"
                      onMouseEnter={(e) => { setHoverRect(e.currentTarget.getBoundingClientRect()); setHoverDate(ds); }}
                      onMouseLeave={() => setHoverDate(null)}>
                      <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 tabular-nums">
                        {marked}/{applicable}
                      </span>
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {statusPopup}
      {jamiTooltip}
    </div>
  );
}
