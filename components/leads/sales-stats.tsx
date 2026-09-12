"use client";

import { useState } from "react";
import { BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import { useLeadStats } from "@/lib/hooks/useLeads";
import { useMe, hasPerm } from "@/lib/hooks/useMe";
import { cn } from "@/lib/utils";

/**
 * SOTUVCHILAR HISOBOTI — "kim nechta lid oldi va nechtasi to'ladi".
 *
 * Yig'ilgan holda turadi: lid taxtasi kundalik ish joyi, hisobot esa
 * haftada bir marta ochiladigan narsa. Yopiq holatda ham eng muhim
 * raqam — umumiy konversiya — sarlavhada ko'rinib turadi.
 *
 * Ruxsati yo'q odamga hech narsa chizilmaydi VA so'rov ham ketmaydi:
 * `useLeadStats(false)` SWR kalitini `null` qiladi.
 */
export function SalesStats() {
  const { me } = useMe();
  const koradi = hasPerm(me?.permissions, "leads.stats");
  const [ochiq, setOchiq] = useState(false);
  const { data, isLoading } = useLeadStats(koradi);

  if (!koradi) return null;

  const qatorlar = data?.rows ?? [];
  const jami = data?.jami;

  return (
    <div className="mb-5 rounded-2xl border border-white/60 dark:border-white/10 glass-panel overflow-hidden">
      <button type="button" onClick={() => setOchiq(v => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left
          hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
        <BarChart3 className="w-4 h-4 text-indigo-500 shrink-0" />
        <span className="text-[13px] font-semibold text-neutral-800 dark:text-neutral-200">
          Sotuvchilar hisoboti
        </span>
        {jami && (
          <span className="text-[11.5px] text-neutral-500 dark:text-neutral-400">
            · {jami.jami} lid · {jami.yutildi} to&apos;ladi · {jami.konversiya}%
          </span>
        )}
        <span className="ml-auto text-neutral-400 shrink-0">
          {ochiq ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {ochiq && (
        <div className="border-t border-white/50 dark:border-white/10">
          {data?.from && (
            <p className="px-4 pt-2.5 text-[11px] text-neutral-400">
              {`${data.from} dan ${data.to ?? "bugungacha"} — lid YARATILGAN sanasi bo'yicha`}
            </p>
          )}

          {isLoading && (
            <p className="px-4 py-6 text-center text-[12px] text-neutral-400">Yuklanmoqda...</p>
          )}

          {!isLoading && qatorlar.length === 0 && (
            <p className="px-4 py-6 text-center text-[12px] text-neutral-400">
              Bu davrda lid yo&apos;q
            </p>
          )}

          {!isLoading && qatorlar.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-[10.5px] uppercase tracking-wider text-neutral-400">
                    <th className="text-left font-bold px-4 py-2">Sotuvchi</th>
                    <th className="text-right font-bold px-2 py-2">Lid</th>
                    <th className="text-right font-bold px-2 py-2">Aloqa</th>
                    <th className="text-right font-bold px-2 py-2">Jarayonda</th>
                    <th className="text-right font-bold px-2 py-2">To&apos;ladi</th>
                    <th className="text-right font-bold px-2 py-2">Yo&apos;qotildi</th>
                    <th className="text-right font-bold px-4 py-2">Konversiya</th>
                  </tr>
                </thead>
                <tbody>
                  {qatorlar.map(r => (
                    <tr key={r.userId ?? "yoq"}
                      className={cn("border-t border-white/40 dark:border-white/5",
                        r.userId === null && "bg-amber-50/50 dark:bg-amber-950/20")}>
                      <td className="px-4 py-2 font-medium text-neutral-800 dark:text-neutral-200">
                        {r.name}
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums">{r.jami}</td>
                      <td className="px-2 py-2 text-right tabular-nums text-neutral-500">{r.aloqa}</td>
                      <td className="px-2 py-2 text-right tabular-nums text-neutral-500">{r.jarayonda}</td>
                      <td className="px-2 py-2 text-right tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                        {r.yutildi}
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums text-neutral-400">{r.yoqotildi}</td>
                      <td className="px-4 py-2 text-right tabular-nums font-semibold">
                        {r.konversiya}%
                      </td>
                    </tr>
                  ))}
                  {jami && (
                    <tr className="border-t-2 border-neutral-300 dark:border-white/20 font-semibold">
                      <td className="px-4 py-2">Jami</td>
                      <td className="px-2 py-2 text-right tabular-nums">{jami.jami}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{jami.aloqa}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{jami.jarayonda}</td>
                      <td className="px-2 py-2 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                        {jami.yutildi}
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums">{jami.yoqotildi}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{jami.konversiya}%</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <p className="px-4 py-2 text-[10.5px] text-neutral-400">
                Sariq qator — hali hech kimga biriktirilmagan lidlar. U kattalashsa,
                demak lidlar taqsimlanmayapti.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
