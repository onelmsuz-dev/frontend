"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, History, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatUzDate, UZ_MONTHS } from "@/lib/date-uz";

/**
 * BALANS TARIXI — standart holatda YOPIQ.
 *
 * Bu blok ilgari "Nimadan iborat" deb ochiq turardi va ekranni bosib
 * ketardi. Sabab raqamlarda: bitta o'quvchida 27 qator bor edi va
 * ularning 16 tasi — BEKOR QILINGAN JUFTLIKLAR, ya'ni nol so'm.
 * Bekor qilish ikki qator yozadi (asl qator + uni qoplaydigan qator);
 * ikkalasi bir-birini yo'qqa chiqaradi, lekin ikkalasi ham ro'yxatda
 * turardi. Ustiga xom baza identifikatori ham chiqardi
 * ("cmtwnmhon0000ty9kzl2i5rk4") — bu odamga hech narsa demaydi va
 * ekranni qo'rqinchli qilardi (egasining qarori, 2026-09-18).
 *
 * UCH QOIDA:
 *
 *  1. YOPIQ — "Tarix" tugmasi. Hech qanday qator ko'rinmaydi: balans
 *     va guruhlar bo'yicha taqsimot yuqorida allaqachon turibdi, tarix
 *     esa faqat savol tug'ilganda kerak.
 *
 *  2. BEKOR QILINGANLAR ICHKI TUGMA ORTIDA. Ularni ikkalasini birga
 *     olib tashlash arifmetikani BUZMAYDI — ular teng va qarama-qarshi.
 *     Shuning uchun "Jami" ular ko'rsatilgan-ko'rsatilmaganidan qat'i
 *     nazar bir xil chiqadi.
 *
 *  3. MATN SODDA. Texnik atama, identifikator va uzun davr tavsifi
 *     o'rniga odam o'qiydigan qisqa yorliq.
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

/** "2026-09" → "Sentabr". Yil yozilmaydi — yonida sana turadi. */
function oyNomi(m?: string | null): string {
  const mm = /^(\d{4})-(\d{2})$/.exec(String(m ?? ""));
  return mm ? (UZ_MONTHS[Number(mm[2]) - 1] ?? String(m)) : "";
}

/**
 * Qator yorlig'i — QISQA va ODDIY.
 *
 * `note` ATAYLAB ishlatilmaydi: u dvigatel uchun yozilgan texnik matn
 * ("2026-09-01–2026-10-01 davrida 12 ta dars, chiqishgacha 5 tasi
 * o'tdi..."). To'liq matn baribir Harakatlar tarixida qoladi.
 */
function yorliq(it: LedgerItem, kind: "charge" | "payment",
                guruhNomi: (id?: string | null) => string): string {
  // Manfiy to'lov — kassadan o'quvchiga QAYTARILGAN pul (2026-09-24).
  if (kind === "payment") return it.amount < 0 ? "To'lov qaytarildi" : "To'lov";

  const g = it.groupId ? guruhNomi(it.groupId) : "";
  const oy = oyNomi(it.month);

  switch (it.reason) {
    case "DISCOUNT":
      return ["Chegirma", it.discountLabel].filter(Boolean).join(" · ");
    case "MANUAL":
      return ["Qo'lda qarz", g].filter(Boolean).join(" · ");
    case "TRANSFER":
      return "Eski guruhdan ko'chirilgan balans";
    case "CORRECTION":
      return "Tuzatish";
    case "ADJUSTMENT":
      // Jurnal joriy qilinishidan oldingi holat — eng ko'p uchraydigani.
      return /qoldiq/i.test(it.note ?? "") ? "Oldingi qoldiq" : "Tuzatish";
    case "ACTIVATION":
      return [g, "guruhga qo'shilganda"].filter(Boolean).join(" · ");
    case "LESSON":
      return [g, "dars"].filter(Boolean).join(" · ");
    case "MODULE":
      return [g, "modul"].filter(Boolean).join(" · ");
    case "COURSE":
      return [g, "kurs to'lovi"].filter(Boolean).join(" · ");
    default:
      // MONTHLY / CYCLE — oddiy davr hisobi.
      return [g, oy].filter(Boolean).join(" · ") || "Hisob";
  }
}

interface Qator {
  it: LedgerItem;
  kind: "charge" | "payment";
  vaqt: number;
  summa: number;
}

/**
 * Bekor qilingan qator va uni qoplagan "Tuzatish" — bitta juftlik.
 *
 * Qoplovchi qatorning izohida asl qatorning identifikatori yozilgan
 * (`Bekor qilindi: "<id>" ...`) — juftlash aynan shundan quriladi.
 * Juftini topib bo'lmasa qator YASHIRILMAYDI: aks holda yig'indi
 * jimgina siljib ketardi.
 */
function juftla(qatorlar: Qator[]): { asosiy: Qator[]; bekor: Qator[] } {
  const bekorQilinganIds = new Set(
    qatorlar.filter((q) => q.it.voidedAt).map((q) => q.it.id));

  const qoplovchiIds = new Set<string>();
  const qoplangan = new Set<string>();

  for (const q of qatorlar) {
    if (q.it.reason !== "CORRECTION") continue;
    const id = /Bekor qilindi:\s*"([^"]+)"/.exec(q.it.note ?? "")?.[1];
    if (id && bekorQilinganIds.has(id)) {
      qoplovchiIds.add(q.it.id);
      qoplangan.add(id);
    }
  }

  const bekor = qatorlar.filter(
    (q) => qoplovchiIds.has(q.it.id) || qoplangan.has(q.it.id));
  const asosiy = qatorlar.filter(
    (q) => !qoplovchiIds.has(q.it.id) && !qoplangan.has(q.it.id));
  return { asosiy, bekor };
}

function Satr({ q, guruhNomi, fmt }: {
  q: Qator;
  guruhNomi: (id?: string | null) => string;
  fmt: (v: number) => string;
}) {
  const { it, kind, summa } = q;
  return (
    <li className="flex items-start justify-between gap-2">
      <span className={cn("text-[11.5px] leading-snug min-w-0 flex-1",
        it.voidedAt
          ? "text-neutral-400 line-through"
          : "text-neutral-600 dark:text-neutral-300")}>
        {yorliq(it, kind, guruhNomi)}
        <span className="text-neutral-400">
          {" · "}{formatUzDate(it.createdAt ?? it.date ?? null)}
        </span>
      </span>
      <span className={cn("text-[11.5px] font-semibold shrink-0 tabular-nums",
        summa >= 0
          ? "text-green-600 dark:text-green-400"
          : "text-red-600 dark:text-red-400")}>
        {summa >= 0 ? "+" : "−"}{fmt(Math.abs(summa))}
      </span>
    </li>
  );
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
  // DIQQAT: hooklar pastdagi `return null` dan OLDIN chaqirilishi shart.
  const [ochiq, setOchiq] = useState(false);
  const [bekorOchiq, setBekorOchiq] = useState(false);

  const qatorlar: Qator[] = [
    ...charges.map((c) => ({ it: c, kind: "charge" as const })),
    ...payments.map((p) => ({ it: p, kind: "payment" as const })),
  ]
    .map((x) => ({
      ...x,
      vaqt: new Date(x.it.createdAt ?? x.it.date ?? 0).getTime(),
      // To'lov o'z ishorasi bilan: qaytarish MANFIY. Ilgari `Math.abs`
      // edi — qaytarilgan 150 000 bu yerda "+150 000" bo'lib chiqardi.
      summa: x.it.amount,
    }))
    .sort((a, b) => b.vaqt - a.vaqt);

  if (qatorlar.length === 0) return null;

  const { asosiy, bekor } = juftla(qatorlar);

  // Ro'yxat qisqartirilgan bo'lishi mumkin (server oxirgi 20 tasini
  // beradi) — farq ochiq ko'rsatiladi, aks holda "Jami" ko'rinadigan
  // qatorlarga to'g'ri kelmay, ekran yolg'on gapirardi.
  const korinadigan = qatorlar.reduce((n, x) => n + x.summa, 0);
  const oldingi = Math.round(balance - korinadigan);

  return (
    <div className="mt-3 pt-3 border-t border-white/50 dark:border-white/10">
      <button type="button" onClick={() => setOchiq((v) => !v)}
        className="flex items-center gap-1.5 text-[11px] font-semibold
          text-neutral-500 dark:text-neutral-400 hover:text-neutral-700
          dark:hover:text-neutral-200 transition-colors">
        <History className="w-3 h-3" />
        Tarix
        {ochiq ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {ochiq && (
        <>
          <ul className="space-y-1 mt-2">
            {asosiy.map((q) => (
              <Satr key={`${q.kind}-${q.it.id}`} q={q} guruhNomi={groupName} fmt={fmt} />
            ))}

            {oldingi !== 0 && (
              <li className="flex items-start justify-between gap-2">
                <span className="text-[11.5px] text-neutral-500 dark:text-neutral-400">
                  Oldingi qoldiq
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

          {/* BEKOR QILINGANLAR — ichki tugma ortida.
              Ular teng va qarama-qarshi juftlik, ya'ni yig'indiga
              ta'sir qilmaydi: ko'rsatilsa ham, ko'rsatilmasa ham
              "Jami" bir xil. */}
          {bekor.length > 0 && (
            <>
              <button type="button" onClick={() => setBekorOchiq((v) => !v)}
                className="flex items-center gap-1.5 mt-2 text-[11px] font-medium
                  text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300
                  transition-colors">
                <RotateCcw className="w-3 h-3" />
                {bekorOchiq
                  ? "Bekor qilinganlarni yashirish"
                  : `Bekor qilingan ${bekor.length} ta yozuv`}
              </button>
              {bekorOchiq && (
                <ul className="space-y-1 mt-1.5 pl-3 border-l-2 border-neutral-200
                  dark:border-neutral-700">
                  {bekor.map((q) => (
                    <Satr key={`${q.kind}-${q.it.id}`} q={q} guruhNomi={groupName} fmt={fmt} />
                  ))}
                </ul>
              )}
            </>
          )}

          {/* JAMI — faqat tarix ochiq bo'lganda. Yopiq holatda u
              yuqoridagi "Balans" raqamining aynan takrori bo'lardi. */}
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
        </>
      )}
    </div>
  );
}
