"use client";

import { useState } from "react";
import useSWR from "swr";
import { cn } from "@/lib/utils";
import { fetcher } from "@/lib/fetcher";
import { UZ_MONTHS } from "@/lib/date-uz";

/**
 * DAVOMAT STATISTIKASI — tarix ro'yxati ustida.
 *
 * Kartochkada faqat oxirgi 30 qator turardi: sana va holat. "Nechta
 * kelgan, nechta kelmagan" degan savolga javob yo'q edi — xodim
 * qatorlarni ko'z bilan sanashi kerak, 30 tadan oldingisi esa umuman
 * ko'rinmasdi (egasining talabi, 2026-09-18).
 *
 * STATISTIKA TO'LIQ TARIXDAN hisoblanadi, ro'yxatdagi 30 qatordan
 * emas — aks holda raqam "oxirgi 30 dars" degani bo'lardi va uni
 * hech kim shunday o'qimasdi.
 *
 * FOIZ: kelgan (kech kelgan ham kelgan) / hisobga olinadigan dars.
 * Sinov darsi maxrajga kirmaydi — u hali o'qimaydigan o'quvchining
 * tanishuv darsi. Raqamlar yonma-yon turadi, shuning uchun boshqacha
 * hisoblamoqchi bo'lgan markaz ham o'zi ko'rib oladi.
 */

interface Yigindi {
  KELDI: number; KECH_KELDI: number; KELMADI: number;
  SABABLI: number; SINOV_DARSI: number;
  kelgan: number; jami: number; foiz: number | null;
}

interface Javob {
  months: string[];
  month: string | null;
  /** O'quvchining BARCHA guruhlari (tanlangan filtrdan qat'i nazar) — tanlagich shundan quriladi. */
  groups: { groupId: string; groupName: string }[];
  groupId: string | null;
  summary: Yigindi;
  byGroup: (Yigindi & { groupId: string; groupName: string })[];
}

/** "2026-09" → "Sentabr 2026" */
function oyNomi(m: string): string {
  const [y, mm] = m.split("-");
  return `${UZ_MONTHS[Number(mm) - 1] ?? mm} ${y}`;
}

function Raqam({ label, value, cls }: { label: string; value: number; cls: string }) {
  return (
    <div className="flex-1 min-w-0 text-center px-1">
      <p className={cn("text-[17px] font-black leading-none tabular-nums", cls)}>{value}</p>
      <p className="text-[10px] text-neutral-400 mt-1 leading-tight">{label}</p>
    </div>
  );
}

export function AttendanceStats({ studentId }: { studentId: string }) {
  const [oy, setOy] = useState("");
  const [guruh, setGuruh] = useState("");
  const qs = [oy && `month=${oy}`, guruh && `groupId=${guruh}`].filter(Boolean).join("&");
  const { data, isLoading } = useSWR<Javob>(
    `/api/attendance/student/${studentId}/stats${qs ? `?${qs}` : ""}`,
    fetcher);

  if (isLoading) {
    return <p className="text-[11px] text-neutral-400 px-5 py-3">Yuklanmoqda...</p>;
  }
  // Ruxsati yo'q (403) yoki o'quvchida DAVOMAT UMUMAN yo'q — kartochkaning
  // o'zi ro'yxatni baribir chizadi, bu blok shunchaki qo'shilmaydi.
  //
  // DIQQAT: bu tekshiruv `months` dan — joriy filtr natijasidan EMAS.
  // Ilgari `summary` bo'sh bo'lsa (masalan tanlangan oy/guruhda dars
  // bo'lmasa) BUTUN blok, filtr tanlagichlari bilan birga, yo'qolib
  // qolardi — foydalanuvchi filtrni orqaga qaytarib bo'lmasdi.
  if (!data || !data.months || data.months.length === 0) return null;

  const s = data.summary;
  const guruhlar = data.groups ?? [];
  const filtrBosh = s.jami + s.SINOV_DARSI === 0;

  return (
    <div className="px-5 py-3 border-b border-white/50 dark:border-white/10 space-y-3">
      {/* OY VA GURUH TANLASH — ikkalasi ham ro'yxatning O'ZIDAN quriladi
          (bo'sh oy/guruh ko'rsatilmaydi) va HAR DOIM TO'LIQ ro'yxat —
          biri tanlansa ikkinchisi qisqarib qolmaydi. Ilgari guruhlar
          faqat pastda o'qiladigan ro'yxat edi, tanlab bo'lmasdi — ikki
          guruhli o'quvchida raqamlar aralashib, "bu qaysi guruhniki"
          degan savol tug'ilardi (egasining talabi, 2026-09-28). */}
      {(data.months.length > 1 || guruhlar.length > 1) && (
        <div className="grid grid-cols-2 gap-1.5">
          {data.months.length > 1 ? (
            <select value={oy} onChange={(e) => setOy(e.target.value)}
              className="h-8 px-2 text-[12px] rounded-lg border border-white/60
                dark:border-white/10 bg-white dark:bg-neutral-800
                text-neutral-700 dark:text-neutral-200 outline-none">
              <option value="">Butun davr</option>
              {data.months.map((m) => (
                <option key={m} value={m}>{oyNomi(m)}</option>
              ))}
            </select>
          ) : <div />}
          {guruhlar.length > 1 ? (
            <select value={guruh} onChange={(e) => setGuruh(e.target.value)}
              className="h-8 px-2 text-[12px] rounded-lg border border-white/60
                dark:border-white/10 bg-white dark:bg-neutral-800
                text-neutral-700 dark:text-neutral-200 outline-none truncate">
              <option value="">Barcha guruhlar</option>
              {guruhlar.map((g) => (
                <option key={g.groupId} value={g.groupId}>{g.groupName}</option>
              ))}
            </select>
          ) : <div />}
        </div>
      )}

      {filtrBosh ? (
        <p className="text-[11.5px] text-neutral-400 py-2 text-center">
          Tanlangan davrda davomat yo&apos;q
        </p>
      ) : (
        <>
          <div className="flex items-stretch">
            <Raqam label="Keldi" value={s.KELDI} cls="text-emerald-600 dark:text-emerald-400" />
            <Raqam label="Kech keldi" value={s.KECH_KELDI} cls="text-amber-600 dark:text-amber-400" />
            <Raqam label="Kelmadi" value={s.KELMADI} cls="text-red-600 dark:text-red-400" />
            <Raqam label="Sababli" value={s.SABABLI} cls="text-neutral-500 dark:text-neutral-400" />
            {s.SINOV_DARSI > 0 && (
              <Raqam label="Sinov" value={s.SINOV_DARSI} cls="text-indigo-600 dark:text-indigo-400" />
            )}
          </div>

          {s.foiz !== null && (
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-[11px] text-neutral-400">
                  Davomat — {s.kelgan}{" / "}{s.jami} dars
                </span>
                <span className={cn("text-[12px] font-black tabular-nums",
                  s.foiz >= 80 ? "text-emerald-600 dark:text-emerald-400"
                    : s.foiz >= 60 ? "text-amber-600 dark:text-amber-400"
                    : "text-red-600 dark:text-red-400")}>
                  {s.foiz}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                <div className={cn("h-full rounded-full transition-all",
                  s.foiz >= 80 ? "bg-emerald-500" : s.foiz >= 60 ? "bg-amber-500" : "bg-red-500")}
                  style={{ width: `${s.foiz}%` }} />
              </div>
            </div>
          )}
        </>
      )}

      {/* GURUHLAR BO'YICHA TAQSIMOT — faqat "Barcha guruhlar" holatida va
          bittadan ko'p bo'lsa. Muayyan guruh allaqachon tanlangan bo'lsa,
          bu ro'yxat yuqoridagi raqamlarning takroriga aylanardi. */}
      {!guruh && !filtrBosh && data.byGroup.length > 1 && (
        <div className="space-y-1 pt-1">
          <p className="text-[10px] text-neutral-400 uppercase tracking-wider">Guruhlar bo&apos;yicha</p>
          {data.byGroup.map((g) => (
            <div key={g.groupId} className="flex items-center justify-between gap-2">
              <span className="text-[11.5px] text-neutral-600 dark:text-neutral-300 truncate min-w-0">
                {g.groupName}
              </span>
              <span className="text-[11px] tabular-nums shrink-0 text-neutral-500 dark:text-neutral-400">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{g.kelgan}</span>
                {" / "}{g.jami}
                {g.foiz !== null && <span className="ml-1.5 font-bold">{g.foiz}%</span>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
