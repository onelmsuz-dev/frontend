"use client";

import { useState } from "react";
import { AlertTriangle, CalendarClock, HandCoins } from "lucide-react";
import { useSalaryAdvanceSettings, useSalaryAdvances } from "@/lib/hooks/useSalaryAdvances";
import { formatCurrency } from "@/lib/money";
import { cn } from "@/lib/utils";
import { SomInput } from "./som-input";
import { KimgaQancha } from "./kimga-qancha";
import { soro, avansniYangila } from "@/lib/salary-advance";

/**
 * SOZLAMALAR → PUL VA HISOB → "OYLIK AVANSI".
 *
 * Markaz kaliti, avans kuni (1–28) va standart summa; ostida "Kimga qancha".
 * Sana va hafta kuni qo'lda yozilmaydi — server hisoblaydi (dam olish va
 * bayramga tushsa oldingi ish kuni).
 */
export function AvansSozlama() {
  const { data, isLoading, mutate } = useSalaryAdvanceSettings();
  const { data: royxat } = useSalaryAdvances(undefined);
  const [yoqiq, setYoqiq] = useState(false);
  const [kun, setKun] = useState<number | null>(15);
  const [standart, setStandart] = useState<number | null>(0);
  const [ishlamoqda, setIshlamoqda] = useState(false);
  const [xabar, setXabar] = useState<{ ok: boolean; matn: string } | null>(null);

  // Server qiymati o'zgarganda (birinchi yuklanish yoki saqlash) formaga
  // tushadi. Fondagi qayta so'rov bir xil qiymat qaytarsa — yozilayotgan
  // o'zgarish o'chib ketmaydi.
  const imzo = data ? `${data.enabled}|${data.day}|${data.standart}` : "";
  const [oldingiImzo, setOldingiImzo] = useState("");
  if (data && imzo !== oldingiImzo) {
    setOldingiImzo(imzo);
    setYoqiq(data.enabled); setKun(data.day); setStandart(data.standart);
  }

  if (isLoading || !data) {
    return <div className="h-40 rounded-2xl bg-neutral-200/60 dark:bg-neutral-800 animate-pulse" />;
  }
  const mumkin = data.canManage;
  const ozgardi = yoqiq !== data.enabled || kun !== data.day || (standart ?? 0) !== data.standart;

  async function saqla() {
    if (kun == null || kun < 1 || kun > 28) {
      setXabar({ ok: false, matn: "Avans kuni 1 dan 28 gacha bo'lsin: fevralda ham shu kun bo'lishi uchun" });
      return;
    }
    setIshlamoqda(true); setXabar(null);
    const r = await soro("PATCH", "/api/salary-advances/settings", { enabled: yoqiq, day: kun, standart: standart ?? 0 });
    setIshlamoqda(false);
    if (!r.ok) { setXabar({ ok: false, matn: r.data?.error ?? "Xatolik" }); return; }
    await mutate();
    avansniYangila();
    setXabar({ ok: true, matn: "Saqlandi" });
  }

  const bosh = royxat ? royxat.rows.filter((r) => r.faol && r.advancePlanned > 0).length === 0 : false;

  return (
    <div className="space-y-4" data-avans-sozlama>
      <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center shrink-0">
            <HandCoins className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100">Oylik avansi</p>
            <p className="text-[12.5px] text-neutral-500 dark:text-neutral-400 mt-0.5">
              {"Xodim va o'qituvchilarga oy o'rtasida oylikning bir qismi beriladi. Oy oxirida u oylikdan ayiriladi va qoldig'i beriladi."}
            </p>
          </div>
        </div>

        {!mumkin && (
          <p className="text-[12px] text-neutral-500 rounded-xl bg-neutral-50 dark:bg-white/[0.03] px-3 py-2">
            {"Faqat ko'rish: o'zgartirish uchun «Oyliklar: hisoblash / to'lash» ruxsati kerak"}
          </p>
        )}

        <label className={cn("flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3",
          yoqiq ? "border-indigo-300 bg-indigo-50/60 dark:bg-indigo-950/20" : "border-neutral-200 dark:border-white/10")}>
          <span className="min-w-0">
            <span className="block text-[13.5px] font-semibold text-neutral-900 dark:text-neutral-100">Avans berish</span>
            <span className="block text-[11.5px] text-neutral-500 dark:text-neutral-400 mt-0.5">
              {yoqiq ? "Avans kuni ro'yxat va eslatma chiqadi"
                : "O'chiq: avans ro'yxati va eslatma chiqmaydi. Ilgari berilgan avanslar baribir oylikdan ayiriladi."}
            </span>
          </span>
          <button type="button" role="switch" aria-checked={yoqiq} disabled={!mumkin} data-avans-kalit
            onClick={() => setYoqiq((v) => !v)}
            className={cn("relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-50",
              yoqiq ? "bg-indigo-600" : "bg-neutral-300 dark:bg-neutral-600")}>
            <span className={cn("absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
              yoqiq && "translate-x-5")} />
          </button>
        </label>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="avans-kun" className="text-[12px] font-medium text-neutral-500 mb-1.5 block">Avans kuni</label>
            <div className="flex items-center gap-2">
              <input id="avans-kun" inputMode="numeric" disabled={!mumkin} value={kun ?? ""}
                onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 2); setKun(v ? Number(v) : null); setXabar(null); }}
                className="w-20 h-10 px-3 text-[14px] font-semibold rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none disabled:opacity-60" />
              <span className="text-[12.5px] text-neutral-500">-sana, har oy</span>
            </div>
            <div className="mt-2 space-y-0.5" data-keyingi-sanalar>
              {data.keyingi.map((k, i) => (
                <p key={k.month} className="text-[11.5px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                  <CalendarClock className="w-3 h-3 shrink-0" />
                  {i === 0 ? `Shu oy: ${k.matn}` : k.matn}
                  {k.siljigan && <span className="text-amber-600 dark:text-amber-400">{` (${Number(k.asl.slice(8, 10))}-sana dam olish)`}</span>}
                </p>
              ))}
              {kun !== data.day && <p className="text-[11px] text-neutral-400">Saqlangandan keyin sanalar yangilanadi</p>}
            </div>
            <p className="text-[11px] text-neutral-400 mt-1.5">
              {"Dam olish yoki bayram kuniga tushsa, oldingi ish kuni. Ish kunlari «Markaz ma'lumoti»dan, bayramlar «Bayram kunlari»dan olinadi."}
            </p>
          </div>
          <div>
            <label htmlFor="avans-standart" className="text-[12px] font-medium text-neutral-500 mb-1.5 block">Standart summa</label>
            <SomInput id="avans-standart" value={standart} onChange={(v) => { setStandart(v); setXabar(null); }} disabled={!mumkin} />
            <p className="text-[11px] text-neutral-400 mt-1.5">
              {"Alohida summa belgilanmagan har bir o'qituvchi va xodimga. 0: faqat alohida belgilanganlarga."}
            </p>
          </div>
        </div>

        {data.qoldaMaosh.soni > 0 && (
          <p className="rounded-xl border border-amber-300/70 bg-amber-50 dark:bg-amber-950/30 p-3 text-[12px] leading-relaxed text-amber-800 dark:text-amber-300 flex gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              {`Bu markazda oxirgi 3 oyda «Maosh» xarajati ${data.qoldaMaosh.soni} marta qo'lda yozilgan (${formatCurrency(data.qoldaMaosh.summa)}). Avans Xarajatlarga alohida yozilmaydi. O'qituvchi oyligini qo'lda yozsangiz, oy oxirida TO'LIQ hisoblangan summani yozing (avans ham shu summa ichida).`}
            </span>
          </p>
        )}
        {yoqiq && bosh && (standart ?? 0) === 0 && (
          <p className="text-[12px] text-amber-700 dark:text-amber-400">
            {"Standart summa 0 va hech kimga alohida summa yo'q: avans ro'yxati bo'sh bo'ladi."}
          </p>
        )}

        {mumkin && (
          <div className="flex items-center gap-3">
            <button type="button" onClick={saqla} disabled={ishlamoqda || !ozgardi} data-avans-saqla
              className="h-10 px-5 rounded-xl bg-indigo-600 text-white text-[13px] font-semibold disabled:opacity-50">
              {ishlamoqda ? "Saqlanmoqda..." : "Saqlash"}
            </button>
            {xabar && (
              <span className={cn("text-[12.5px] font-medium", xabar.ok ? "text-emerald-600" : "text-red-600")}>{xabar.matn}</span>
            )}
          </div>
        )}
      </div>

      {royxat && (
        <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-4 sm:p-5 space-y-3">
          <p className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100">Kimga qancha</p>
          <KimgaQancha data={royxat} />
        </div>
      )}
    </div>
  );
}
