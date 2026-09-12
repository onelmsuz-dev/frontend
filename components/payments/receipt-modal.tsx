"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import QRCode from "qrcode";
import { Printer, Loader2, X } from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import { formatUzDate } from "@/lib/date-uz";

/**
 * TO'LOV CHEKI — mijozga beriladigan qog'oz.
 *
 * BIR IMPLEMENTATSIYA, IKKI NATIJA: brauzerning chop etish oynasida
 * "Printerga" ham, "PDF saqlash" ham bor. Alohida PDF kutubxonasi
 * qo'shilmadi — u faqat hajm va yana bir xil chiqadigan joy qo'shardi.
 *
 * `@media print` da ekrandagi hamma narsa yashiriladi va faqat chek
 * qoladi, shuning uchun modal ichidan to'g'ridan-to'g'ri bosib chiqarish
 * mumkin — alohida sahifa ochish shart emas.
 *
 * "QAYSI OY UCHUN" serverdan TAYYOR keladi va u `planGroupLedger()` ning
 * izidan olinadi. Bu yerda qayta hisoblanmaydi: chek bilan panel har xil
 * raqam ko'rsatsa, mijoz bilan bahsda qog'oz yutadi.
 */

const OYLAR = ["yanvar", "fevral", "mart", "aprel", "may", "iyun",
               "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];

const fmt = (v: number) => new Intl.NumberFormat("uz-UZ").format(Math.round(v));

/** "2026-09" → "sentabr 2026". Davri yo'q qarz uchun tushunarli matn. */
function oyNomi(m: string | null): string {
  if (!m) return "Davrsiz to'lov";
  const [y, mm] = m.split("-").map(Number);
  return `${OYLAR[mm - 1] ?? m} ${y}`;
}

const USUL: Record<string, string> = {
  NAQD: "Naqd", KARTA: "Karta", BANK: "Bank o'tkazmasi",
  CLICK: "Click", PAYME: "Payme",
};

const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  #chek, #chek * { visibility: visible !important; }
  #chek {
    position: absolute; left: 0; top: 0;
    width: 100%; margin: 0; padding: 0;
    box-shadow: none !important; border: none !important;
  }
  .chek-yashir { display: none !important; }
  @page { margin: 12mm; }
}`;

export function ReceiptModal({
  paymentId, open, onClose,
}: {
  paymentId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data, isLoading } = useSWR(
    open && paymentId ? `/api/payments/${paymentId}/receipt` : null, fetcher);
  const [qr, setQr] = useState("");

  useEffect(() => {
    if (!data?.code) { setQr(""); return; }
    QRCode.toDataURL(data.code, { margin: 0, width: 160 })
      .then(setQr)
      .catch(() => setQr(""));   // QR chiqmasa ham chek ishlaydi — kod matni bor
  }, [data?.code]);

  if (!open) return null;

  const qatorlar: [string, string | null][] = data ? [
    ["O'quvchi",     data.student?.name ?? null],
    ["Telefon",      data.student?.phone ?? null],
    ["Kurs",         data.courseName ?? null],
    ["Guruh",        data.groupName ?? null],
    ["Kurs narxi",   data.coursePrice ? `${fmt(data.coursePrice)} so'm` : null],
    ["Sana",         formatUzDate(data.date)],
    ["To'lov usuli", USUL[data.method] ?? data.method],
    ["Qabul qildi",  data.receivedBy ?? null],
  ] : [];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      <div className="chek-yashir-fon fixed inset-0 z-50 flex items-center justify-center
        bg-black/40 p-4" onClick={onClose}>
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-sm
          max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>

          <div className="chek-yashir flex items-center justify-between px-4 py-3
            border-b border-neutral-200 dark:border-white/10">
            <p className="text-[14px] font-bold">To&apos;lov cheki</p>
            <button onClick={onClose} aria-label="Yopish"
              className="w-7 h-7 flex items-center justify-center rounded-lg
                text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/10">
              <X className="w-4 h-4" />
            </button>
          </div>

          {isLoading && (
            <div className="p-8 flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
            </div>
          )}

          {data && (
            <div id="chek" className="p-5 bg-white text-neutral-900">
              <div className="text-center border-b border-dashed border-neutral-300 pb-3">
                <p className="text-[15px] font-bold">{data.organization?.name}</p>
                <p className="text-[11px] text-neutral-500 mt-0.5">TO&apos;LOV CHEKI</p>
                <p className="text-[17px] font-bold tabular-nums mt-1">{data.receiptLabel}</p>
              </div>

              <table className="w-full text-[12px] mt-3">
                <tbody>
                  {qatorlar.filter(([, v]) => v).map(([k, v]) => (
                    <tr key={k} className="align-top">
                      <td className="py-[3px] pr-2 text-neutral-500 whitespace-nowrap">{k}</td>
                      <td className="py-[3px] font-medium text-right">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* QAYSI DAVR UCHUN — bitta to'lov bir necha oyni qoplashi mumkin,
                  shuning uchun bitta oy emas, taqsimot ko'rsatiladi. */}
              <div className="mt-3 pt-2 border-t border-dashed border-neutral-300">
                <p className="text-[11px] text-neutral-500 mb-1">Qaysi davr uchun</p>
                {data.periods?.length > 0 ? (
                  <table className="w-full text-[12px]">
                    <tbody>
                      {data.periods.map((p: { month: string | null; amount: number }, i: number) => (
                        <tr key={i}>
                          <td className="py-[2px] text-neutral-700">{oyNomi(p.month)}</td>
                          <td className="py-[2px] text-right font-medium tabular-nums">
                            {fmt(p.amount)}{" "}so&apos;m
                          </td>
                        </tr>
                      ))}
                      {data.advance > 0 && (
                        <tr>
                          <td className="py-[2px] text-neutral-700">Oldindan to&apos;lov</td>
                          <td className="py-[2px] text-right font-medium tabular-nums">
                            {fmt(data.advance)}{" "}so&apos;m
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-[12px] text-neutral-600">
                    Oldindan to&apos;lov — {fmt(data.amount)}{" "}so&apos;m
                  </p>
                )}
              </div>

              <div className="mt-3 pt-2 border-t-2 border-neutral-800
                flex items-baseline justify-between">
                <span className="text-[13px] font-bold">JAMI</span>
                <span className="text-[18px] font-bold tabular-nums">
                  {fmt(data.amount)}{" "}so&apos;m
                </span>
              </div>

              {data.note && (
                <p className="text-[11px] text-neutral-500 mt-2">Izoh: {data.note}</p>
              )}

              {/* ORIGINALLIK KODI. Chek raqami markaz ichida NOYOB
                  (`@@unique([organizationId, receiptNo])`), ya'ni kod
                  bo'yicha chekni bir ma'noda topish mumkin. */}
              {data.code && (
                <div className="mt-4 flex flex-col items-center gap-1.5">
                  {qr && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qr} alt="" className="w-24 h-24" />
                  )}
                  <p className="text-[11px] font-mono tracking-wider">{data.code}</p>
                  <p className="text-[9px] text-neutral-400 text-center">
                    Chek haqiqiyligini shu kod bo&apos;yicha tekshirish mumkin
                  </p>
                </div>
              )}
            </div>
          )}

          {data && (
            <div className="chek-yashir px-4 py-3 border-t border-neutral-200 dark:border-white/10">
              <button onClick={() => window.print()}
                className="w-full h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white
                  text-[13px] font-semibold flex items-center justify-center gap-1.5">
                <Printer className="w-4 h-4" />
                Chop etish / PDF saqlash
              </button>
              <p className="text-[10px] text-neutral-400 text-center mt-1.5">
                Chop etish oynasida &quot;PDF saqlash&quot; ni tanlasangiz fayl bo&apos;lib tushadi
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
