"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/money";

/**
 * XARAJAT BO'LIMINING DIAGRAMMALARI.
 *
 * RANG TANLOVI. Tushum va xarajat uchun yashil/qizil juftligi tabiiy
 * ko'rinadi, lekin deuteranopiyada (eng keng tarqalgan rang ko'rligi)
 * ular deyarli qo'shilib ketadi — o'lchangan farq ΔE 4.9, ya'ni
 * ajratib bo'lmaydi. Shuning uchun indigo (tushum) + to'q sariq
 * (xarajat) olindi: ikkala rejimda ham barcha tekshiruvdan o'tadi.
 * Yashil/qizil faqat FOYDANING ISHORASI uchun qoladi va u yerda doim
 * `+/−` belgisi va so'z bilan birga keladi — rang yakka o'zi ma'no
 * tashimaydi.
 *
 * Kategoriya va filial ustunlari BITTA rangda: uzunlikning o'zi
 * miqdorni ko'rsatadi, rangni ham shunga bog'lash ortiqcha takror
 * bo'lardi va ro'yxat kamalakka aylanardi.
 */

export const RANG = {
  tushum:  "#4f46e5", // indigo-600 (yorug'), quyida qorong'i uchun almashadi
  xarajat: "#ea580c", // orange-600 — ikkala rejimda ham o'tadi
};

/** Bo'linmaga nisbatan ulush (0 ga bo'linishdan himoya bilan). */
function ulush(qiymat: number, eng: number): number {
  if (eng <= 0) return 0;
  return Math.max(0, Math.min(100, (qiymat / eng) * 100));
}

type Qator = { nom: string; summa: number; soni?: number; ajratilgan?: boolean };

/**
 * Gorizontal ustunlar — "pul qayerga ketdi".
 *
 * Har qatorda summa MATN bilan ham yoziladi: ustun uzunligi taqqoslash
 * uchun, raqam esa aniqlik uchun. Faqat ustun qoldirilsa, markaz egasi
 * "qancha edi" degan savolga sichqonchani olib borib javob izlardi.
 */
export function GorizontalUstunlar({
  qatorlar, bosh, jami,
}: {
  qatorlar: Qator[];
  bosh: string;
  /** Foiz hisoblash uchun — berilmasa eng katta qator asos bo'ladi. */
  jami?: number;
}) {
  const eng = Math.max(...qatorlar.map((q) => q.summa), 0);
  const butun = jami ?? qatorlar.reduce((s, q) => s + q.summa, 0);

  if (qatorlar.length === 0) {
    return (
      <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-4 sm:p-5">
        <h3 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100 mb-3">{bosh}</h3>
        <p className="text-[12px] text-neutral-400 dark:text-neutral-500">Bu davrda xarajat yo&apos;q</p>
      </div>
    );
  }

  return (
    <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-4 sm:p-5">
      <h3 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100 mb-4">{bosh}</h3>
      <div className="space-y-3">
        {qatorlar.map((q) => {
          const foiz = butun > 0 ? Math.round((q.summa / butun) * 100) : 0;
          return (
            <div key={q.nom}>
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <span className="text-[12px] font-semibold text-neutral-700 dark:text-neutral-300 truncate min-w-0">
                  {q.nom}
                  {q.ajratilgan && (
                    <span className="ml-1.5 text-[10px] font-medium text-neutral-400 dark:text-neutral-500">
                      filialga kirmaydi
                    </span>
                  )}
                </span>
                <span className="text-[12px] font-bold text-neutral-900 dark:text-neutral-100 shrink-0 tabular-nums whitespace-nowrap">
                  {formatCurrency(q.summa)}
                  <span className="ml-1.5 text-[11px] font-medium text-neutral-400 dark:text-neutral-500">
                    {foiz}%
                  </span>
                </span>
              </div>
              {/* 4px yumaloq uchi — ustun asosga tiralgan holda qoladi. */}
              <div className="h-2 rounded bg-neutral-100 dark:bg-white/5 overflow-hidden">
                <div
                  className={cn("h-full rounded", q.ajratilgan && "opacity-60")}
                  style={{
                    width: `${ulush(q.summa, eng)}%`,
                    background: q.ajratilgan ? "var(--xarajat-neytral)" : RANG.xarajat,
                  }}
                  title={`${q.nom}: ${formatCurrency(q.summa)}${q.soni != null ? ` · ${q.soni} ta` : ""}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export type TarixOy = {
  oy: string;
  label: string;
  xarajat: number;
  tushum: number | null;
  foyda: number | null;
};

/**
 * OLTI OYLIK TREND — tushum va xarajat yonma-yon.
 *
 * BITTA O'Q: ikkala qator ham so'mda, shuning uchun ularni bitta
 * o'lchovda solishtirish to'g'ri. Ikkinchi o'q qo'shilsa, nisbatni
 * grafik chizuvchi o'zi tanlagan bo'lardi va "xarajat tushumdan
 * oshdi"dek yolg'on manzara chiqarish mumkin bo'lardi.
 *
 * Foyda uchinchi ustun emas — u ayirma va pastda raqam bilan
 * ko'rsatiladi. Uchta ustun yonma-yon turganda oyning o'zi o'qilmay
 * qolardi.
 */
export function TarixGrafigi({ tarix }: { tarix: TarixOy[] }) {
  const pulKorinadi = tarix.some((m) => m.tushum != null);
  const eng = Math.max(
    ...tarix.map((m) => Math.max(m.xarajat, m.tushum ?? 0)),
    0,
  );

  return (
    <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h3 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">
          Oxirgi 6 oy
        </h3>
        {/* Ikkita qator — izoh MAJBURIY, aks holda qaysi ustun nima
            ekani faqat rangdan bilinardi. */}
        <div className="flex items-center gap-3">
          {pulKorinadi && (
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--xarajat-tushum)" }} />
              Tushum
            </span>
          )}
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: RANG.xarajat }} />
            Xarajat
          </span>
        </div>
      </div>

      <div className="flex items-end gap-1.5 sm:gap-2 h-32 sm:h-36">
        {tarix.map((m) => (
          <div key={m.oy} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
            {/* 2px oraliq — yonma-yon ustunlar qo'shilib ketmasin. */}
            <div className="w-full flex-1 flex items-end justify-center gap-[2px]">
              {pulKorinadi && (
                <div
                  className="w-1/2 max-w-[22px] rounded-t"
                  style={{
                    height: `${ulush(m.tushum ?? 0, eng)}%`,
                    background: "var(--xarajat-tushum)",
                    minHeight: (m.tushum ?? 0) > 0 ? 3 : 0,
                  }}
                  title={`${m.label}: tushum ${formatCurrency(m.tushum ?? 0)}`}
                />
              )}
              <div
                className="w-1/2 max-w-[22px] rounded-t"
                style={{
                  height: `${ulush(m.xarajat, eng)}%`,
                  background: RANG.xarajat,
                  minHeight: m.xarajat > 0 ? 3 : 0,
                }}
                title={`${m.label}: xarajat ${formatCurrency(m.xarajat)}`}
              />
            </div>
            <span className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500">
              {m.label}
            </span>
          </div>
        ))}
      </div>

      {/* RAQAMLI KO'RINISH — grafikdan o'qib bo'lmaydigan aniq qiymatlar
          va foyda shu yerda. Rangni ko'ra olmaydigan foydalanuvchi ham
          bir xil ma'lumotga ega bo'ladi.

          YIG'ILGAN holda turadi: telefonda oltita qator grafikdan
          ikki barobar ko'p joy egallab, keyingi blok ekrandan uzoqqa
          tushib ketardi. Ochish bitta bosish. */}
      {pulKorinadi && (
        <details className="mt-4 pt-3 border-t border-white/60 dark:border-white/10 group">
          <summary className="flex items-center justify-between gap-2 cursor-pointer list-none
            text-[11.5px] font-semibold text-neutral-500 dark:text-neutral-400
            hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors">
            Raqamlar bilan
            <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-2 -mx-1 px-1 overflow-x-auto">
          <table className="w-full text-[11px] tabular-nums">
            <thead>
              <tr className="text-neutral-400 dark:text-neutral-500 text-left">
                <th className="font-medium pb-1.5">Oy</th>
                <th className="font-medium pb-1.5 text-right">Tushum</th>
                <th className="font-medium pb-1.5 text-right">Xarajat</th>
                <th className="font-medium pb-1.5 text-right">Foyda</th>
              </tr>
            </thead>
            <tbody>
              {tarix.map((m) => (
                <tr key={m.oy} className="border-t border-white/40 dark:border-white/5">
                  <td className="py-1.5 font-semibold text-neutral-700 dark:text-neutral-300">{m.label}</td>
                  <td className="py-1.5 text-right text-neutral-600 dark:text-neutral-400">
                    {formatCurrency(m.tushum ?? 0)}
                  </td>
                  <td className="py-1.5 text-right text-neutral-600 dark:text-neutral-400">
                    {formatCurrency(m.xarajat)}
                  </td>
                  <td className={cn(
                    "py-1.5 text-right font-bold",
                    (m.foyda ?? 0) >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400",
                  )}>
                    {(m.foyda ?? 0) >= 0 ? "+" : "−"}
                    {formatCurrency(Math.abs(m.foyda ?? 0))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </details>
      )}
    </div>
  );
}
