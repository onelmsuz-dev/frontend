"use client";

/**
 * O'QUVCHI PROFILI — "MOLIYA" BO'LIMI.
 *
 * Ilgari bo'lim bitta uzun ustun edi: balans → guruhlar bo'yicha → tarkib →
 * tarix → chegirma qoplagan → so'nggi chegirmalar → davomiylik → grafik →
 * qo'shimcha to'lovlar → to'lovlar. Hammasi bir xil mayda kulrang yozuvda, bir
 * tekis oqardi — "qarzi bormi, qachon to'lagan" degan savolga javob shu
 * oqim ichida yo'qolardi (egasi, 2026-10-05).
 *
 * ENDI: tepada uchta ko'rsatkich (holat, keyingi hisob, oxirgi to'lov) va
 * amallar; ostida ICHKI BO'LIMLAR — bir vaqtda bittasi ko'rinadi:
 * To'lovlar · Balans tarkibi · Chegirmalar · Dinamika. (Uch variantdan
 * egasi shuni tanladi.)
 *
 * MA'LUMOT O'ZGARMAGAN — hisob-kitob bloklari (`BalanceBreakdown`,
 * `GroupDebtBreakdown`, `PayActions`, chegirma oynalari, grafik, …) sahifadan
 * tayyor bo'lak (`slot`) sifatida keladi. Bu fayl faqat ularni QANDAY
 * JOYLASHTIRISHNI hal qiladi.
 *
 * "Davomiylik" bu yerdan olib tashlangan — u moliya emas; "Umumiy" va
 * "Davomat" tablarida turibdi.
 */

import { useState } from "react";
import { Receipt, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/money";
import { formatUzDate } from "@/lib/date-uz";
import { methodLabel } from "@/lib/payment-methods";
import { TabGlide, TabPanel, tabCls } from "@/components/ui/tab-glide";

type Pay = { id: string; amount: number; date: string; method?: string | null; note?: string | null; groupId?: string | null; ledgerGroupName?: string | null };
type Charge = { id: string; amount?: number | null; discountAmount?: number | null; discountLabel?: string | null; note?: string | null; groupId?: string | null };

const CARD = "glass-panel border border-white/60 dark:border-white/10 rounded-2xl";
export function StudentFinance({
  balance, nextDue, payments, covered, discounts, groupName, paymentGroup,
  actions, discountActions, breakdown, chart, materials, paymentActions, onPay,
}: {
  balance: number;
  /** Eng yaqin hisob sanasi (guruhlar orasidan), bo'lmasa `null`. */
  nextDue: string | null;
  payments: Pay[];
  /** Chegirma qoplagan qarz qatorlari. */
  covered: Charge[];
  /** Bir martalik chegirmalar. */
  discounts: Charge[];
  groupName: (id: string | null | undefined) => string;
  paymentGroup: (p: Pay) => string | null;
  /** Asosiy amal: "To'lov" tugmasi va uning menyusi (sahifadan tayyor). */
  actions: React.ReactNode;
  /** Chegirma berish tugmalari — "Chegirmalar" bo'limida ko'rinadi. Huquq bo'lmasa `null`. */
  discountActions?: React.ReactNode;
  /** Balans tarkibi: guruhlar bo'yicha + qator-qator (sahifadan tayyor). */
  breakdown: React.ReactNode;
  chart: React.ReactNode;
  materials: React.ReactNode;
  /** Har bir to'lov qatoridagi amallar (chek, tahrirlash). */
  paymentActions: (p: Pay) => React.ReactNode;
  onPay: () => void;
}) {
  const [bolim, setBolim] = useState<"tolovlar" | "tarkib" | "chegirmalar" | "dinamika">("tolovlar");

  const qarz = balance < 0;
  const ortiqcha = balance > 0;
  const oxirgi = payments.find((p) => p.amount > 0) ?? null;
  const chegirmaBor = covered.length + discounts.length > 0;

  /* ── umumiy bo'laklar ─────────────────────────────────────────────── */

  const holatMatn = qarz ? "Qarzdor" : ortiqcha ? "Oldindan to'langan" : "Qarzi yo'q";
  const holatRang = qarz ? "text-red-600 dark:text-red-400" : ortiqcha ? "text-emerald-600 dark:text-emerald-400" : "text-neutral-500 dark:text-neutral-400";

  /** TO'LOVLAR ro'yxati: sana va usul chapda, summa o'ngda, amallar chetda. */
  const tolovlar = (
    payments.length === 0 ? (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400 dark:bg-white/5"><Receipt className="h-5 w-5" /></span>
        <p className="text-[13px] font-semibold text-neutral-700 dark:text-neutral-200">Hali to&apos;lov qilinmagan</p>
        <button type="button" onClick={onPay} className="text-[12.5px] font-semibold text-indigo-600 hover:underline dark:text-indigo-400">To&apos;lov qabul qilish</button>
      </div>
    ) : (
      <div className="divide-y divide-neutral-200/60 dark:divide-white/10">
        {payments.map((p) => {
          const guruh = paymentGroup(p);
          const qaytarildi = p.amount < 0;
          return (
            <div key={p.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-2 text-[13.5px] font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
                  {formatUzDate(p.date)}
                  {qaytarildi && <span className="rounded-md bg-red-100 px-1.5 py-0.5 text-[10.5px] font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-300">Qaytarildi</span>}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[12px] text-neutral-500 dark:text-neutral-400">
                  {methodLabel(p.method ?? "")}
                  {guruh && <><span className="text-neutral-300 dark:text-neutral-600">·</span><span className="flex min-w-0 items-center gap-1"><Users className="h-3 w-3 shrink-0" /><span className="truncate">{guruh}</span></span></>}
                  {p.note && <><span className="text-neutral-300 dark:text-neutral-600">·</span><span className="truncate" title={p.note}>{p.note}</span></>}
                </p>
              </div>
              <p className={cn("shrink-0 text-[15px] font-bold tabular-nums", qaytarildi ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400")}>
                {qaytarildi ? "−" : "+"}{formatCurrency(Math.abs(p.amount))}
              </p>
              <div className="flex shrink-0 items-center gap-1">{paymentActions(p)}</div>
            </div>
          );
        })}
      </div>
    )
  );

  /** CHEGIRMALAR: qoidadan (qarzni qoplagan) va bir martalik — bitta ro'yxatda. */
  const chegirmalar = (
    !chegirmaBor ? <p className="py-2 text-[13px] text-neutral-400">Chegirma qo&apos;llanmagan</p> : (
      <div className="divide-y divide-neutral-200/60 dark:divide-white/10">
        {covered.map((c) => (
          <div key={`q-${c.id}`} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">{c.discountLabel || "Chegirma qoidasi"}</p>
              <p className="truncate text-[12px] text-neutral-500 dark:text-neutral-400">
                {groupName(c.groupId)}{c.note ? ` · ${c.note}` : ""}
              </p>
            </div>
            <p className="shrink-0 text-right text-[12.5px] tabular-nums">
              <span className="text-neutral-400 line-through">{formatCurrency((c.discountAmount ?? 0) + Math.abs(c.amount ?? 0))}</span>
              <span className="ml-2 font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(Math.abs(c.amount ?? 0))}</span>
            </p>
          </div>
        ))}
        {discounts.map((c) => (
          <div key={`b-${c.id}`} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">{c.discountLabel || c.note || "Bir martalik chegirma"}</p>
              <p className="truncate text-[12px] text-neutral-500 dark:text-neutral-400">{groupName(c.groupId)} · bir martalik</p>
            </div>
            <p className="shrink-0 text-[13px] font-bold tabular-nums text-pink-600 dark:text-pink-400">−{formatCurrency(Math.abs(c.amount ?? 0))}</p>
          </div>
        ))}
      </div>
    )
  );

  /* ── joylashuv ────────────────────────────────────────────────────── */
  // Telefonda: holat to'liq qatorda, qolgan ikkitasi yonma-yon (uchalasi
  // ustma-ust tushib, birinchi ekranni egallab olmasin).
  const KORSATKICH = "min-w-0 flex-1 rounded-2xl px-4 py-3 sm:basis-40";
  return (
    <div className="space-y-4">
      <div className={cn(CARD, "p-4")}>
        <div className="flex flex-wrap items-stretch gap-3">
          <div className={cn(KORSATKICH, "basis-full", qarz ? "bg-red-50 dark:bg-red-950/30" : "glass-soft")}>
            <p className={cn("text-[12px] font-semibold", holatRang)}>{holatMatn}</p>
            <p className={cn("mt-0.5 truncate text-[22px] font-black leading-tight tabular-nums", qarz ? "text-red-600 dark:text-red-400" : "text-neutral-900 dark:text-neutral-100")}>
              {formatCurrency(Math.abs(balance))}
            </p>
          </div>
          <div className={cn(KORSATKICH, "basis-[calc(50%-0.375rem)] glass-soft")}>
            <p className="text-[12px] font-semibold text-neutral-500 dark:text-neutral-400">Keyingi hisob</p>
            <p className="mt-0.5 truncate text-[18px] font-bold leading-tight tabular-nums text-neutral-900 dark:text-neutral-100">{nextDue ? formatUzDate(nextDue) : "—"}</p>
          </div>
          <div className={cn(KORSATKICH, "basis-[calc(50%-0.375rem)] glass-soft")}>
            <p className="text-[12px] font-semibold text-neutral-500 dark:text-neutral-400">Oxirgi to&apos;lov</p>
            <p className="mt-0.5 truncate text-[18px] font-bold leading-tight tabular-nums text-neutral-900 dark:text-neutral-100">
              {oxirgi ? formatCurrency(oxirgi.amount) : "—"}
            </p>
            {oxirgi && <p className="text-[11.5px] text-neutral-500 dark:text-neutral-400">{formatUzDate(oxirgi.date)}</p>}
          </div>
          {/* "To'lov" — ko'rsatkichlar bilan bir qatorda (alohida qatorga bitta
              tugma uchun joy ketmasin); tor ekranda pastga, o'ngga o'tadi. */}
          <div className="ml-auto flex shrink-0 items-center gap-3 self-center">{actions}</div>
        </div>
      </div>

      <div className={cn(CARD, "overflow-hidden")}>
        <div className="overflow-x-auto border-b border-white/50 px-3 py-2 no-scrollbar dark:border-white/10">
          <TabGlide watch={bolim} className="flex w-max items-center gap-1">
            {([["tolovlar", `To'lovlar · ${payments.length}`], ["tarkib", "Balans tarkibi"], ["chegirmalar", `Chegirmalar${chegirmaBor ? ` · ${covered.length + discounts.length}` : ""}`], ["dinamika", "Dinamika"]] as const).map(([id, nom]) => (
              <button key={id} type="button" aria-pressed={bolim === id} data-tab-active={bolim === id} onClick={() => setBolim(id)}
                className={tabCls(bolim === id, "text-[13px]")}>
                {nom}
              </button>
            ))}
          </TabGlide>
        </div>
        <TabPanel k={bolim} className="p-5">
          {bolim === "tolovlar" && tolovlar}
          {bolim === "tarkib" && (
            <>
              <div className="peer">{breakdown}</div>
              <p className="hidden text-[13px] text-neutral-400 peer-empty:block">Hali hisob yozuvi yo&apos;q</p>
            </>
          )}
          {bolim === "chegirmalar" && (
            <>
              {/* Chegirma BERISH shu yerda — ro'yxat bilan bir joyda. */}
              {discountActions && (
                <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-white/50 pb-4 dark:border-white/10">
                  <span className="text-[12px] font-semibold text-neutral-500 dark:text-neutral-400">Chegirma berish:</span>
                  {discountActions}
                </div>
              )}
              {chegirmalar}
            </>
          )}
          {bolim === "dinamika" && (
            <>
              {/* Ichki kartalarning o'z ramkasi olib tashlanadi — karta ichida karta bo'lmasin. */}
              <div className="peer space-y-4 [&>.glass-panel]:border-0 [&>.glass-panel]:bg-transparent! [&>.glass-panel]:p-0 [&>.glass-panel]:backdrop-filter-none">{chart}{materials}</div>
              <p className="hidden text-[13px] text-neutral-400 peer-empty:block">Grafik uchun hali ma&apos;lumot yetarli emas</p>
            </>
          )}
        </TabPanel>
      </div>
    </div>
  );
}
