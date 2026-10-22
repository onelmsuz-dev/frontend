"use client";

import { useState } from "react";
import useSWR from "swr";
import { BadgeCheck, CheckCircle, Clock, RefreshCw } from "lucide-react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, usePagination } from "@/components/ui/pagination";
import { TolandiOyna } from "@/components/salary-advance/tolandi-oyna";
import { YopilmaganYuklab } from "@/components/salary-advance/yopilmagan";
import { useSalaryAdvanceSummary } from "@/lib/hooks/useSalaryAdvances";
import { useBranch, useBranchQueryString } from "@/lib/contexts/branch-context";
import { OyNomi, sanaQisqa, type AvansBandi, type OylikQatori } from "@/lib/salary-advance";
import { salaryDisplay, salaryTypeLabel } from "@/lib/salary";
import { formatCurrency } from "@/lib/money";
import { cn } from "@/lib/utils";
import { Empty, MiniStat, Panel, PanelHead, PrimaryBtn, Skeleton, Th, fetcher, royxat } from "./ui";

/** To'langan qatorda — to'lash paytidagi nusxa (keyin qayta hisoblanmaydi). */
const hisoblanganOf = (r: OylikQatori): number =>
  r.status === "PAID" && r.settledSalary > 0 ? r.settledSalary : r.calculatedSalary;

/**
 * CHIQIM → O'QITUVCHI OYLIGI. Oy — umumiy tanlovdan; avans bannerlari
 * boshqa oyni ochishni so'rasa `onMonth` orqali umumiy oy almashadi.
 */
export function TeacherSalariesSection({
  month, onMonth, avansYoqiq, onGoAvans,
}: {
  month: string;
  onMonth: (m: string) => void;
  avansYoqiq: boolean;
  onGoAvans: () => void;
}) {
  const { activeBranchId } = useBranch();
  const [generating, setGenerating] = useState(false);
  const [payingId,   setPayingId]   = useState<string | null>(null);
  const [err,        setErr]        = useState("");
  const [msg,        setMsg]        = useState("");
  const [tolash,     setTolash]     = useState<OylikQatori | null>(null);
  const [yopilmaganKorin, setYopilmaganKorin] = useState(false);

  const qs = useBranchQueryString({ month });
  const { data: raw, isLoading, mutate } = useSWR(`/api/teacher-salaries${qs}`, fetcher);
  const { data: xulosa } = useSalaryAdvanceSummary(month, true);
  const salaries = royxat<OylikQatori>(raw);
  const pg = usePagination(salaries, qs);

  const now = new Date();
  const joriyOy = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const avansBor = salaries.some((r) => (r.advanceTotal ?? 0) > 0);
  const tolashQator = tolash ? (salaries.find((r) => r.id === tolash.id) ?? tolash) : null;

  const jamiHisob   = salaries.reduce((s: number, r: OylikQatori) => s + hisoblanganOf(r), 0);
  const kutilayotgan = salaries.reduce((s: number, r: OylikQatori) =>
    s + (r.status === "PAID" ? hisoblanganOf(r) : (r.expectedSalary ?? 0)), 0);
  const jamiAvans   = salaries.reduce((s: number, r: OylikQatori) => s + (r.advanceTotal ?? 0), 0);
  const qolgan      = salaries.filter((r: OylikQatori) => r.status !== "PAID")
    .reduce((s: number, r: OylikQatori) => s + (r.salaryRemainder ?? r.calculatedSalary), 0);
  const tolangan    = salaries.filter((r) => r.status === "PAID").length;

  async function generate() {
    setGenerating(true); setErr("");
    try {
      const res = await fetch("/api/teacher-salaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, ...(activeBranchId ? { branchId: activeBranchId } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "Xatolik"); return; }
      mutate();
    } catch { setErr("Serverga ulanib bo'lmadi"); }
    finally { setGenerating(false); }
  }

  /** Avansli qator — tasdiq oynasi; avanssizida bir bosish (summa baribir yuboriladi → 409). */
  async function markAsPaid(s: OylikQatori) {
    if ((s.advanceTotal ?? 0) > 0) { setTolash(s); return; }
    setPayingId(s.id); setErr(""); setMsg("");
    try {
      const res = await fetch(`/api/teacher-salaries/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedRemainder: s.salaryRemainder ?? Math.round(s.calculatedSalary) }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "Xatolik"); mutate(); return; }
      mutate();
    } catch { setErr("Serverga ulanib bo'lmadi"); }
    finally { setPayingId(null); }
  }

  const banner = "rounded-xl border px-3.5 py-2.5 text-[12.5px] flex items-center gap-3 flex-wrap";
  const amber  = "border-amber-200 bg-amber-50/80 dark:border-amber-900/40 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300";
  const amberBtn = "h-8 px-3 rounded-lg text-[12px] font-semibold border border-amber-300 text-amber-800 dark:text-amber-300";

  return (
    <div className="space-y-4">
      {/* Avans eslatmalari */}
      {xulosa && (
        <>
          {xulosa.hisoblanmagan > 0 && xulosa.month === month && (
            <p className={cn(banner, "border-blue-200 bg-blue-50/80 dark:border-blue-900/40 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300")}>
              {`Avansi bor, lekin oyligi hisoblanmagan: ${xulosa.hisoblanmagan} kishi. «Oylikni hisoblash»ni bosing.`}
            </p>
          )}
          {xulosa.tolanmagan.filter((t) => t.month !== month).map((t) => (
            <div key={t.month} className={cn(banner, amber)}>
              <p className="flex-1 min-w-0">{`${OyNomi(t.month)}: ${t.count} ta oylikda avans bor, «To'landi» bosilmagan: avans hali ushlanmagan.`}</p>
              <button type="button" onClick={() => onMonth(t.month)} className={amberBtn}>{`${OyNomi(t.month)}ni ochish`}</button>
            </div>
          ))}
          {xulosa.yopilmagan > 0 && (
            <div className={cn(banner, amber)}>
              <p className="flex-1">{`Yopilmagan avanslar: ${xulosa.yopilmagan}`}</p>
              <button type="button" className={amberBtn}
                onClick={() => (avansYoqiq ? onGoAvans() : setYopilmaganKorin((v) => !v))}>
                Ko&apos;rish
              </button>
            </div>
          )}
          {yopilmaganKorin && !avansYoqiq && <YopilmaganYuklab onMsg={setMsg} onOylikgaOt={onMonth} />}
        </>
      )}

      {msg && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/30 px-3.5 py-2.5 text-[12.5px] font-medium text-emerald-800 dark:text-emerald-300">
          {msg}
        </p>
      )}

      {salaries.length > 0 && (
        <div className={cn("grid grid-cols-2 gap-2.5", avansBor ? "lg:grid-cols-5" : "lg:grid-cols-4")}>
          <MiniStat label="Hisoblangan (tushumdan)" value={formatCurrency(jamiHisob)} tone="violet" />
          <MiniStat label="Kutilayotgan" value={formatCurrency(kutilayotgan)}
            hint="hamma to'lasa chiqadigan oylik" />
          {avansBor && <MiniStat label="Berilgan avans" value={formatCurrency(jamiAvans)} tone="indigo" />}
          <MiniStat label="Qo'lga to'lanadi" value={formatCurrency(qolgan)} tone="amber" hint="hali to'lanmagan" />
          <MiniStat label="To'langan" value={`${tolangan} / ${salaries.length}`} tone="green" />
        </div>
      )}

      <Panel>
        <PanelHead title={`O'qituvchilar oyligi — ${OyNomi(month)}`} sub={`${salaries.length} ta o'qituvchi`}>
          {err && <span className="text-[12px] text-red-500 font-medium">{err}</span>}
          <PrimaryBtn onClick={generate} disabled={generating}>
            <RefreshCw className={cn("w-3.5 h-3.5", generating && "animate-spin")} />
            {generating ? "Hisoblanmoqda..." : salaries.length ? "Qayta hisoblash" : "Oylikni hisoblash"}
          </PrimaryBtn>
        </PanelHead>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="glass-soft hover:bg-white/60 dark:hover:bg-white/10">
                <Th>O&apos;qituvchi</Th>
                <Th>Turi</Th>
                <Th className="text-right" title="Faqat shu oyga tegishli tushum">Yig&apos;ilgan</Th>
                <Th className="text-right" title="Shu oy uchun yozilgan qarzning hammasi to'lansa chiqadigan oylik">Kutilayotgan</Th>
                <Th className="text-right" title="Haqiqatan tushgan puldan — to'lanadigan summa shu">Hisoblangan</Th>
                {avansBor && (<><Th className="text-right">Avans</Th><Th className="text-right">Qo&apos;lga</Th></>)}
                <Th className="text-center">Holat</Th>
                <Th className="text-right">Amal</Th>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-3 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : pg.items.map((s) => {
                    const avans = s.advanceTotal ?? 0;
                    const oyTugagan = s.month < joriyOy;
                    return (
                      <TableRow key={s.id} className="hover:bg-white/60 dark:hover:bg-white/10 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 bg-gradient-to-br from-violet-400 to-blue-500 rounded-xl flex items-center justify-center text-white text-[13px] font-bold shrink-0">
                              {s.teacher?.user?.name?.[0] ?? "?"}
                            </div>
                            <div>
                              <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">{s.teacher?.user?.name}</p>
                              <p className="text-[11px] text-neutral-400">
                                {s.teacher?.status === "INACTIVE" ? "Ishdan ketgan" : s.teacher?.user?.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-[11px] bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                            {salaryTypeLabel(s.teacher?.salaryType)} — {salaryDisplay(s.teacher?.salaryType, s.teacher?.salary ?? 0)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-[13px] font-semibold text-neutral-700 dark:text-neutral-300 tabular-nums">
                          {formatCurrency(s.totalCollected)}
                        </TableCell>
                        <TableCell className="text-right text-[13px] font-semibold text-neutral-500 dark:text-neutral-400 tabular-nums"
                          title={s.chargedTotal != null ? `Shu oy uchun yozilgan qarz: ${formatCurrency(s.chargedTotal)}` : undefined}>
                          {s.status === "PAID" ? "—" : formatCurrency(s.expectedSalary ?? 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-[14px] font-black text-neutral-900 dark:text-neutral-100 tabular-nums">
                            {formatCurrency(hisoblanganOf(s))}
                          </span>
                          {s.status !== "PAID" && s.teacher?.salaryType === "PERCENT" && (s.expectedSalary ?? 0) > hisoblanganOf(s) && (
                            <span className="block text-[10.5px] text-neutral-400 mt-0.5">
                              {`to'lov tushgach ${formatCurrency(s.expectedSalary ?? 0)} gacha`}
                            </span>
                          )}
                        </TableCell>
                        {avansBor && (
                          <>
                            <TableCell className="text-right">
                              {avans > 0 ? (
                                <span className="text-[13px] font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums"
                                  title={(s.advanceItems ?? []).map((a: AvansBandi) => `${sanaQisqa(a.givenOn).slice(0, 5)} · ${formatCurrency(a.advanceSum)}`).join("\n")}>
                                  -{formatCurrency(avans)}
                                </span>
                              ) : <span className="text-neutral-300">—</span>}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-[14px] font-black text-neutral-900 dark:text-neutral-100 tabular-nums">
                                {formatCurrency(s.salaryRemainder ?? s.calculatedSalary)}
                              </span>
                              {(s.overAdvance ?? 0) > 0 && (
                                <span className={cn("block text-[10.5px] font-semibold mt-0.5",
                                  s.status === "PAID" || oyTugagan ? "text-red-600 dark:text-red-400" : "text-neutral-400")}>
                                  {`Ortiqcha avans ${formatCurrency(s.overAdvance ?? 0)}${s.status !== "PAID" && !oyTugagan ? " (hozircha)" : ""}`}
                                </span>
                              )}
                            </TableCell>
                          </>
                        )}
                        <TableCell className="text-center">
                          {s.status === "PAID" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-lg font-medium">
                              <CheckCircle className="w-3 h-3" />{" "}To&apos;landi
                            </span>
                          ) : (
                            <span className="inline-flex flex-col items-center gap-1">
                              <span className="inline-flex items-center gap-1 text-[11px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-lg font-medium">
                                <Clock className="w-3 h-3" /> Kutilmoqda
                              </span>
                              {avans > 0 && <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">Avans berildi</span>}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {s.status !== "PAID" && (
                            <button onClick={() => markAsPaid(s)} disabled={payingId === s.id}
                              className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50">
                              <BadgeCheck className="w-3 h-3" />
                              {payingId === s.id ? "..." : "To'landi"}
                            </button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
            </TableBody>
          </Table>
        </div>
        <Pagination p={pg} />
        {!isLoading && salaries.length === 0 && (
          <Empty>
            Bu oy uchun oylik hisoblanmagan
            <PrimaryBtn onClick={generate} disabled={generating}>
              <RefreshCw className="w-3.5 h-3.5" /> Oylikni hisoblash
            </PrimaryBtn>
          </Empty>
        )}
      </Panel>

      {avansBor && (
        <p className="text-[11.5px] text-neutral-500 dark:text-neutral-400">
          {"O'qituvchi oyligi Xarajatlarga avtomatik yozilmaydi. Qo'lda yozsangiz, TO'LIQ hisoblangan summani yozing (avans ham shu summa ichida)."}
        </p>
      )}

      {tolashQator && (
        <TolandiOyna open={!!tolashQator} onClose={() => setTolash(null)} kind="TEACHER"
          rowId={tolashQator.id} name={tolashQator.teacher?.user?.name ?? ""} month={tolashQator.month}
          hisoblangan={tolashQator.calculatedSalary} advanceTotal={tolashQator.advanceTotal ?? 0}
          advanceItems={tolashQator.advanceItems ?? []} faol={tolashQator.teacher?.status !== "INACTIVE"}
          onDone={(m) => { setTolash(null); setMsg(m); mutate(); }} />
      )}
    </div>
  );
}
