"use client";

import { useMemo } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Package, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetcher } from "@/lib/fetcher";
import { formatCurrency } from "@/lib/money";
import { formatUzDate } from "@/lib/date-uz";
import { methodShort, methodCls } from "@/lib/payment-methods";
import { useBranchQueryString } from "@/lib/contexts/branch-context";

/**
 * QO'SHIMCHA TO'LOVLAR HISOBOTI — kitob, forma, sertifikat.
 *
 * NEGA "JAMI TUSHUM" GA QO'SHILMAYDI: kurs to'lovlari bilan
 * aralashtirilsa yig'ilish darajasi ("rejaning necha foizi
 * yig'ildi") buzilardi — maxraj kurs qarzi, surat esa kitob pulini
 * ham o'z ichiga olib, raqam jimgina oshib ketardi. Shuning uchun
 * alohida tab va alohida karta, lekin SOF FOYDAGA kiradi.
 *
 * JADVALDA IKKI XIL QATOR:
 *   SOTUV — kitob berildi, qarz yozildi (hali pul emas)
 *   TO'LOV — pul kirdi
 * Hisobot yig'indisi faqat TO'LOV dan, qarz esa alohida ko'rsatiladi
 * va u DAVR bo'yicha filtrlanmaydi — qarz bugungi holat.
 */

interface Yozuv {
  id: string;
  kind: "SOTUV" | "TOLOV";
  category: string;
  amount: number;
  method: string | null;
  note: string | null;
  date: string;
  createdByName: string;
  /** `TOLOV` bo'lsa va sotuv bilan BIR VAQTDA to'langan bo'lsa — sotuv id'si. */
  saleId: string | null;
  student: { id: string; name: string; phone: string | null } | null;
}

interface Hisobot {
  total: number;
  count: number;
  debt: number;
  byCategory: { category: string; amount: number; count: number }[];
}

export function MaterialsReport({
  month, onMonth,
}: {
  month: string;
  onMonth: (v: string) => void;
}) {
  const qs = useBranchQueryString({ month });
  const { data: rep } = useSWR<Hisobot>(`/api/materials/report${qs}`, fetcher);
  const { data: rawList, isLoading } = useSWR<Yozuv[]>(`/api/materials${qs}`, fetcher);
  const xom = Array.isArray(rawList) ? rawList : [];

  /**
   * SOTUV + DARHOL TO'LOV = BITTA QATOR.
   *
   * `paidNow` bo'lganda jurnalga ikki yozuv tushadi: `SOTUV` (qarz) va
   * uni yopadigan `TOLOV`. Jurnal uchun bu TO'G'RI — qarz va uning
   * yopilishi alohida hodisa. Lekin ekranda ular ikki qator bo'lib
   * ko'rinardi va birinchisi "Qarzga berildi" deb yozilardi.
   *
   * Markaz buni shunday o'qidi: "bitta to'lov kiritdim, tizim qarz
   * ham yozib qo'ydi" (2026-09-21). Pul to'g'ri edi — yozuv yolg'on
   * gapirardi.
   *
   * Endi juftlik bitta "Sotildi" qatoriga yig'iladi. Yig'indilar
   * TEGILMAYDI: ular server tomonda, xom yozuvlardan hisoblanadi.
   */
  const items = useMemo(() => {
    const tolangan = new Map<string, Yozuv>();
    for (const x of xom) if (x.kind === "TOLOV" && x.saleId) tolangan.set(x.saleId, x);
    return xom
      .filter(x => !(x.kind === "TOLOV" && x.saleId))   // juftlikning to'lovi
      .map(x => ({ yozuv: x, juft: tolangan.get(x.id) ?? null }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawList]);

  return (
    <div className="space-y-4">
      {/* Oy tanlovi — tepadagi kartochkalar ham SHU oyni ko'rsatadi,
          shuning uchun bitta holat (`payMonth`) ikkalasini boshqaradi. */}
      <div className="flex items-center gap-2.5">
        <label className="text-[13px] font-semibold text-neutral-700 dark:text-neutral-300">Oy:</label>
        <input type="month" value={month} onChange={e => onMonth(e.target.value)}
          className="px-3 py-1.5 rounded-xl text-[13px] glass-soft border border-white/60
            dark:border-white/10 text-neutral-700 dark:text-neutral-200
            focus:outline-none focus:ring-2 focus:ring-indigo-500/40" />
      </div>

      {/* Yig'indi + kategoriya kesimi */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl
          bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40">
          <Package className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span className="text-[13px] font-semibold text-amber-700 dark:text-amber-400">
            Tushum: {formatCurrency(rep?.total ?? 0)}
          </span>
        </div>
        {!!rep?.debt && (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl
            bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span className="text-[13px] font-semibold text-red-700 dark:text-red-400">
              To&apos;lanmagan: {formatCurrency(rep.debt)}
            </span>
          </div>
        )}
        {(rep?.byCategory ?? []).map(c => (
          <span key={c.category}
            className="text-[12px] px-2.5 py-1.5 rounded-lg glass-soft
              text-neutral-600 dark:text-neutral-300">
            {c.category}: <b className="tabular-nums">{formatCurrency(c.amount)}</b>
            <span className="text-neutral-400"> · {c.count} ta</span>
          </span>
        ))}
      </div>

      <p className="text-[11px] text-neutral-400 -mt-1">
        Bu pul o&apos;quvchining kurs balansiga ta&apos;sir qilmaydi va
        o&apos;qituvchi foiziga kirmaydi. Yig&apos;indi faqat haqiqatan kirgan
        pulni sanaydi — qarzga berilgani &quot;to&apos;lanmagan&quot; da turadi.
      </p>

      <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="glass-soft">
                {["Sana", "O'quvchi", "Nima uchun", "Turi", "Usul", "Summa", "Kim kiritdi"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider
                    text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-[12px] text-neutral-400">
                  Yuklanmoqda...
                </td></tr>
              )}
              {!isLoading && items.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-[12px] text-neutral-400">
                  Bu oyda qo&apos;shimcha to&apos;lov yo&apos;q
                </td></tr>
              )}
              {items.map(({ yozuv: it, juft }) => (
                <tr key={it.id}
                  className="border-t border-white/50 dark:border-white/10
                    hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-4 py-2.5 text-[12px] text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                    {formatUzDate(it.date)}
                  </td>
                  <td className="px-4 py-2.5 text-[12.5px] font-medium">
                    {it.student
                      ? <Link href={`/students/${it.student.id}`}
                          className="text-neutral-800 dark:text-neutral-100 hover:text-indigo-600
                            dark:hover:text-indigo-400 transition-colors">
                          {it.student.name}
                        </Link>
                      : <span className="text-neutral-400">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-[12.5px] text-neutral-600 dark:text-neutral-300">
                    {it.category}
                    {it.note && (
                      <span className="text-neutral-400 text-[11.5px]"> · {it.note}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {/* UCH XIL HOLAT, uch xil yozuv:
                          sotuv + juft to'lov → "Sotildi"  (pul olingan)
                          juftsiz sotuv      → "Qarzga berildi"
                          juftsiz to'lov     → "To'lov"    (qarz yopilishi) */}
                    <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-lg",
                      (it.kind === "TOLOV" || juft)
                        ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400")}>
                      {juft ? "Sotildi" : it.kind === "TOLOV" ? "To'lov" : "Qarzga berildi"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {/* Usul juftlikdagi TO'LOVDAN olinadi — sotuv
                        yozuvining o'zida u bo'lmaydi. */}
                    {(juft?.method ?? (it.kind === "TOLOV" ? it.method : null))
                      ? <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-lg",
                          methodCls(juft?.method ?? it.method))}>
                          {methodShort(juft?.method ?? it.method)}
                        </span>
                      : <span className="text-neutral-300 dark:text-neutral-600">—</span>}
                  </td>
                  <td className={cn("px-4 py-2.5 text-[12.5px] font-bold tabular-nums whitespace-nowrap",
                    (it.kind === "TOLOV" || juft)
                      ? "text-green-600 dark:text-green-400"
                      : "text-amber-600 dark:text-amber-400")}>
                    {(it.kind === "TOLOV" || juft) ? "+" : ""}{formatCurrency(it.amount)}
                  </td>
                  <td className="px-4 py-2.5 text-[12px] text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                    {it.createdByName}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
