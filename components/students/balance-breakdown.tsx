"use client";

import { cn } from "@/lib/utils";
import { formatUzDate } from "@/lib/date-uz";

/**
 * BALANS NIMADAN IBORAT — qator-qator.
 *
 * "−300 000" degan raqam o'z-o'zicha savol tug'diradi: qaysi oy uchun,
 * chegirma tushdimi, to'lov qayerga ketdi. Guruh bo'yicha taqsimot
 * (`GroupDebtBreakdown`) bunga javob bermaydi — u bitta guruhli
 * o'quvchida o'zini umuman ko'rsatmaydi ham.
 *
 * IKKI QOIDA, ikkalasi ham arifmetika ROST bo'lishi uchun:
 *
 *  1. BEKOR QILINGAN qator ham ko'rsatiladi. `voidedAt` balansga ta'sir
 *     qilmaydi — pulni kompensatsiya qatori qaytaradi. Ya'ni bekor
 *     qilingan qator summasi hamon yig'indida qatnashadi; yashirilsa
 *     qatorlar jami balansga teng chiqmasdi.
 *
 *  2. RO'YXAT QISQARTIRILGAN bo'lishi mumkin (server oxirgi 20 tasini
 *     beradi). Shunda farq "Oldingi qoldiq" qatori bilan ochiq
 *     ko'rsatiladi — aks holda pastdagi "Jami" ko'rinadigan qatorlarga
 *     to'g'ri kelmay, ekran yolg'on gapirardi.
 */

export interface LedgerItem {
  id: string;
  amount: number;
  createdAt?: string;
  date?: string;
  note?: string | null;
  month?: string | null;
  reason?: string | null;
  method?: string | null;
  groupId?: string | null;
  voidedAt?: string | null;
  discountAmount?: number | null;
  discountLabel?: string | null;
}

function yorliq(it: LedgerItem, kind: "charge" | "payment",
                guruhNomi: (id?: string | null) => string): string {
  if (kind === "payment") return `To'lov${it.method ? ` · ${it.method}` : ""}`;
  if (it.reason === "DISCOUNT") return it.discountLabel || it.note || "Chegirma";
  if (it.reason === "CORRECTION" || it.reason === "ADJUSTMENT") {
    return it.note || "Tuzatish";
  }
  const g = guruhNomi(it.groupId);
  const davr = it.note || it.month || "";
  return [g, davr].filter(Boolean).join(" · ") || "Hisob";
}

/** Izohda davr oralig'i bormi ("07.09.2026–06.10.2026"). */
const davrBor = (t?: string | null) => !!t && /\d{2}\.\d{2}\.\d{4}\s*[–-]/.test(t);

function sanaKerak(it: LedgerItem, kind: "charge" | "payment"): boolean {
  if (!(it.createdAt || it.date)) return false;
  if (kind === "payment") return true;
  return !davrBor(it.note);
}

export function BalanceBreakdown({
  charges, payments, balance, fmt, groupName,
}: {
  charges: LedgerItem[];
  payments: LedgerItem[];
  balance: number;
  fmt: (v: number) => string;
  groupName: (id?: string | null) => string;
}) {
  const qatorlar = [
    ...charges.map((c) => ({ it: c, kind: "charge" as const })),
    ...payments.map((p) => ({ it: p, kind: "payment" as const })),
  ]
    .map((x) => ({
      ...x,
      vaqt: new Date(x.it.createdAt ?? x.it.date ?? 0).getTime(),
      summa: x.kind === "payment" ? Math.abs(x.it.amount) : x.it.amount,
    }))
    .sort((a, b) => b.vaqt - a.vaqt);

  if (qatorlar.length === 0) return null;

  const korinadigan = qatorlar.reduce((n, x) => n + x.summa, 0);
  // Ro'yxat qisqartirilgan bo'lsa farq shu — "Jami" har doim HAQIQIY
  // balansga teng bo'lishi kerak.
  const oldingi = Math.round(balance - korinadigan);

  return (
    <div className="mt-3 pt-3 border-t border-white/50 dark:border-white/10">
      <p className="text-[11px] text-neutral-400 mb-1.5">Nimadan iborat</p>

      {/* Sig'masa AYLANADI — ro'yxat uzun bo'lsa kartochka cho'zilib
          ketmasin, lekin hamma qator ham yetib borsin. */}
      <ul className="max-h-56 overflow-y-auto pr-1 space-y-1">
        {qatorlar.map(({ it, kind, summa }) => (
          <li key={`${kind}-${it.id}`} className="flex items-start justify-between gap-2">
            <span className={cn("text-[11px] leading-snug min-w-0 flex-1",
              it.voidedAt
                ? "text-neutral-400 line-through"
                : "text-neutral-600 dark:text-neutral-300")}>
              {yorliq(it, kind, groupName)}
              {/* SANA — faqat izohning o'zida davr YO'Q bo'lsa.
                  Davr qatorida izoh allaqachon "07.09–06.10" deb turadi
                  va yoniga yana yozuv sanasi qo'yilsa ikkita raqam
                  bir-biriga xalaqit berardi. */}
              {sanaKerak(it, kind) && (
                <span className="text-neutral-400">
                  {" · "}{formatUzDate(it.createdAt ?? it.date!)}
                </span>
              )}
            </span>
            <span className={cn("text-[11.5px] font-semibold shrink-0 tabular-nums",
              summa >= 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400")}>
              {summa >= 0 ? "+" : "−"}{fmt(Math.abs(summa))}
            </span>
          </li>
        ))}

        {oldingi !== 0 && (
          <li className="flex items-start justify-between gap-2">
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Oldingi qoldiq
              <span className="text-neutral-400">{" · "}eski yozuvlar</span>
            </span>
            <span className={cn("text-[11.5px] font-semibold shrink-0 tabular-nums",
              oldingi >= 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400")}>
              {oldingi >= 0 ? "+" : "−"}{fmt(Math.abs(oldingi))}
            </span>
          </li>
        )}
      </ul>

      {/* JAMI — pastda, siz so'raganingizdek. Har doim HAQIQIY balans. */}
      <div className="flex items-center justify-between gap-2 mt-2 pt-2
                      border-t border-white/50 dark:border-white/10">
        <span className="text-[11.5px] font-semibold text-neutral-700 dark:text-neutral-200">
          Jami
        </span>
        <span className={cn("text-[13px] font-black tabular-nums",
          balance >= 0
            ? "text-green-600 dark:text-green-400"
            : "text-red-600 dark:text-red-400")}>
          {fmt(balance)}
        </span>
      </div>
    </div>
  );
}
