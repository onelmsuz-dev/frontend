"use client";

import { cn } from "@/lib/utils";

/**
 * VAQT MAYDONI — DOIM 24 SOATLIK.
 *
 * Ilgari hamma joyda `<input type="time">` turardi. Uning ko'rinishini
 * sahifa BOSHQARMAYDI: brauzer AM/PM yoki 24 soatni o'z tilidan oladi.
 * Ingliz tilidagi telefon yoki kompyuterda dars vaqti "02:30 PM" bo'lib
 * chiqardi — O'zbekistonda hech kim vaqtni bunday o'qimaydi va tushlikdan
 * oldin/keyin ekanini adashtirish oson. `lang="uz"` atributi ham yordam
 * bermaydi: Chrome ham, Firefox ham, Safari ham bu maydon uchun faqat
 * BRAUZER tilini hisobga oladi va `lang` ni e'tiborsiz qoldiradi.
 * (Egasining talabi, 2026-09-17.)
 *
 * Shuning uchun native maydon ikki ro'yxatga almashtirildi: soat 00–23,
 * daqiqa 5 daqiqalik qadam bilan. Ro'yxatda AM/PM tushunchasi umuman
 * yo'q, ya'ni brauzer tili nima bo'lishidan qat'i nazar ko'rinish bir xil.
 * Telefonda ham qulay — native g'ildirak ochiladi.
 *
 * Qiymat shakli AVVALGIDEK "HH:MM", shuning uchun forma mantig'i,
 * tekshiruvlari va backend o'zgarmadi.
 */

const SOATLAR = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));

/** Dars vaqtlari amalda 5 daqiqalik qadamda — 12 variant yetadi. */
const DAQIQALAR = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

const uslub = "h-full w-full rounded-lg border border-input bg-transparent px-2 "
  + "text-sm tabular-nums outline-none transition-colors "
  + "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 "
  + "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 "
  + "dark:bg-input/30";

export function TimeInput({
  value, onChange, className, disabled, id,
}: {
  /** "HH:MM" yoki bo'sh satr. */
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  id?: string;
}) {
  const [soat = "", daqiqa = ""] = (value || "").split(":");

  // ESKI MA'LUMOT YO'QOLMASIN. Bazada "09:07" kabi qiymat bo'lishi mumkin
  // (native maydon har daqiqani qabul qilardi). Ro'yxatda bo'lmasa —
  // shu qiymatni ham qo'shamiz, aks holda forma ochilganda jimgina
  // boshqa vaqtga surilib ketardi.
  const daqiqalar = daqiqa && !DAQIQALAR.includes(daqiqa)
    ? [...DAQIQALAR, daqiqa].sort()
    : DAQIQALAR;

  return (
    <div className={cn("flex items-center gap-1.5 h-8", className)}>
      <select
        id={id}
        aria-label="Soat"
        value={soat}
        disabled={disabled}
        onChange={(e) => onChange(`${e.target.value}:${daqiqa || "00"}`)}
        className={uslub}
      >
        <option value="" disabled>--</option>
        {SOATLAR.map((h) => <option key={h} value={h}>{h}</option>)}
      </select>

      <span className="text-neutral-400 font-semibold shrink-0">:</span>

      <select
        aria-label="Daqiqa"
        value={daqiqa}
        disabled={disabled}
        onChange={(e) => onChange(`${soat || "00"}:${e.target.value}`)}
        className={uslub}
      >
        <option value="" disabled>--</option>
        {daqiqalar.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
    </div>
  );
}
