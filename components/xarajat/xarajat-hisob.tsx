"use client";

import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/money";

/**
 * OYNING HISOBI — bo'limning bosh raqami.
 *
 * Ilgari bu yerda to'rtta alohida kartochka turardi: xarajat, tushum,
 * foyda, foiz. Ular bir xil kattalikda yonma-yon tursa, ekranga
 * qaragan odam ularning O'ZARO BOG'LIQLIGINI ko'rmaydi — to'rtta
 * mustaqil raqamdek tuyuladi. Holbuki bu yerda bitta gap bor:
 *
 *      tushum − xarajat = sof foyda
 *
 * Shuning uchun ular tenglama ko'rinishida, bitta kartochkada va
 * raqamlar bir ustunga tekislangan holda turadi. Telefonda ham shu
 * tartib saqlanadi — faqat shrift kichrayadi, tuzilma buzilmaydi.
 */
export function OyHisobi({
  tushum, xarajat, foyda, ulush, oyLabel, qamrovLabel, ozgarish, yuklanmoqda,
}: {
  tushum: number | null;
  xarajat: number;
  foyda: number | null;
  /** Tushumning necha foizi xarajatga ketdi. */
  ulush: number | null;
  oyLabel: string;
  qamrovLabel: string;
  /** Xarajatning o'tgan oyga nisbatan o'zgarishi, foizda. */
  ozgarish: number | null;
  yuklanmoqda: boolean;
}) {
  const pulKorinadi = tushum != null;
  const son = (v: number) => (yuklanmoqda ? "…" : formatCurrency(v));

  return (
    <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-2 mb-4">
        <h2 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">{oyLabel}</h2>
        <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 truncate">
          {qamrovLabel}
        </span>
      </div>

      <div className="space-y-2.5">
        {pulKorinadi && (
          <Qator belgi="" nom="Tushum" qiymat={son(tushum)} />
        )}

        <Qator
          belgi={pulKorinadi ? "−" : ""}
          nom="Xarajat"
          qiymat={son(xarajat)}
          kuchli={!pulKorinadi}
          yon={
            ozgarish != null ? (
              <span className={cn(
                "text-[11px] font-bold px-1.5 py-0.5 rounded-md whitespace-nowrap",
                // Xarajatning O'SISHI yomon xabar — ishora teskari.
                ozgarish <= 0
                  ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
                  : "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40",
              )}>
                {ozgarish > 0 ? "+" : ""}{ozgarish}%
              </span>
            ) : null
          }
        />

        {pulKorinadi && (
          <>
            <div className="border-t border-neutral-200 dark:border-white/10" />
            <Qator
              belgi="="
              nom="Sof foyda"
              qiymat={
                yuklanmoqda
                  ? "…"
                  : `${(foyda ?? 0) >= 0 ? "" : "−"}${formatCurrency(Math.abs(foyda ?? 0))}`
              }
              kuchli
              rang={(foyda ?? 0) >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"}
            />
          </>
        )}
      </div>

      {/* O'LCHAGICH — tushumning qancha qismi xarajatga ketdi.
          Foizni yakka raqam bilan berish kam ma'lumot berardi:
          "25%" ko'p yoki ozmi — ko'rinmasdi. Chiziq esa uni darhol
          ko'rsatadi. Chiziq yonida raqam ham turadi. */}
      {pulKorinadi && ulush != null && !yuklanmoqda && (
        <div className="mt-4 pt-3.5 border-t border-white/60 dark:border-white/10">
          <div className="flex items-baseline justify-between gap-2 mb-1.5">
            <span className="text-[11.5px] font-medium text-neutral-500 dark:text-neutral-400">
              Tushumning xarajatga ketgan qismi
            </span>
            <span className="text-[12px] font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
              {ulush}%
            </span>
          </div>
          <div className="h-2 rounded bg-neutral-100 dark:bg-white/5 overflow-hidden">
            <div className="h-full rounded"
              style={{
                width: `${Math.min(100, Math.max(0, ulush))}%`,
                background: "#ea580c",
              }} />
          </div>
        </div>
      )}
    </div>
  );
}

function Qator({
  belgi, nom, qiymat, kuchli, rang, yon,
}: {
  belgi: string;
  nom: string;
  qiymat: string;
  kuchli?: boolean;
  rang?: string;
  yon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      {/* Belgi ustuni qat'iy kenglikda — raqamlar bir chiziqda tursin. */}
      <span className="w-3 shrink-0 text-[14px] font-bold text-neutral-300 dark:text-neutral-600 text-center">
        {belgi}
      </span>
      <span className={cn(
        "text-[12.5px] min-w-0 truncate",
        kuchli
          ? "font-bold text-neutral-900 dark:text-neutral-100"
          : "font-medium text-neutral-600 dark:text-neutral-400",
      )}>
        {nom}
      </span>
      {yon}
      <span className={cn(
        "ml-auto tabular-nums whitespace-nowrap",
        kuchli ? "text-[19px] sm:text-[22px] font-black leading-none" : "text-[14px] sm:text-[15px] font-bold",
        rang ?? "text-neutral-900 dark:text-neutral-100",
      )}>
        {qiymat}
      </span>
    </div>
  );
}
