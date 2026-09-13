"use client";

import { useState } from "react";
import { BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import { useLeadStats, useLeadDaily, type DailyReport } from "@/lib/hooks/useLeads";
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
  /** Ikki xil savol: "bugun kim nima qildi" va "davrda kim qancha yopdi". */
  const [tab, setTab] = useState<"kunlik" | "davr">("kunlik");
  const [sana, setSana] = useState("");

  const { data, isLoading } = useLeadStats(koradi && ochiq && tab === "davr");
  const { data: kun, isLoading: kunYuklanmoqda } =
    useLeadDaily(koradi && ochiq && tab === "kunlik", sana || undefined);

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
        {kun && (
          <span className="text-[11.5px] text-neutral-500 dark:text-neutral-400">
            {`· bugun ${kun.rows.reduce((a, r) => a + r.qongiroq, 0)} qo'ng'iroq`}
          </span>
        )}
        <span className="ml-auto text-neutral-400 shrink-0">
          {ochiq ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {ochiq && (
        <div className="border-t border-white/50 dark:border-white/10">
          <div className="flex items-center gap-1 px-4 pt-3">
            {([["kunlik", "Kunlik nazorat"], ["davr", "Davr bo'yicha"]] as const).map(([k, l]) => (
              <button key={k} type="button" onClick={() => setTab(k)}
                className={cn("px-2.5 py-1 rounded-lg text-[12px] font-semibold transition-colors",
                  tab === k
                    ? "bg-indigo-600 text-white"
                    : "text-neutral-500 dark:text-neutral-400 hover:bg-white/60 dark:hover:bg-white/10")}>
                {l}
              </button>
            ))}
            {tab === "kunlik" && (
              <input type="date" value={sana || kun?.date || ""}
                onChange={e => setSana(e.target.value)}
                className="ml-auto h-7 px-2 rounded-lg text-[11.5px] glass-soft
                  border border-white/60 dark:border-white/10
                  text-neutral-600 dark:text-neutral-300" />
            )}
          </div>

          {tab === "kunlik" && <KunlikJadval kun={kun} yuklanmoqda={kunYuklanmoqda} />}

          {tab === "davr" && <>
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
          </>}
        </div>
      )}
    </div>
  );
}

/**
 * KUNLIK NAZORAT JADVALI — "kun oxirida kim nima qildi".
 *
 * Bosqich ustunlari MARKAZNIKIDAN olinadi (masalan "Sinov darsi"),
 * qattiq yozilmagan: har markaz ustunini o'zi nomlaydi va o'z
 * voronkasini quradi. Faqat o'sha kuni HARAKAT bo'lgan bosqichlar
 * ko'rsatiladi — aks holda jadval bo'sh ustunlar bilan cho'ziladi.
 */
function KunlikJadval({
  kun, yuklanmoqda,
}: {
  kun: DailyReport | undefined;
  yuklanmoqda: boolean;
}) {
  if (yuklanmoqda) {
    return <p className="px-4 py-6 text-center text-[12px] text-neutral-400">Yuklanmoqda...</p>;
  }
  if (!kun || kun.rows.length === 0) {
    return <p className="px-4 py-6 text-center text-[12px] text-neutral-400">Xodim yo&apos;q</p>;
  }

  const faolBosqich = kun.stages.filter(st =>
    kun.rows.some(r => (r.bosqichga[st.id] ?? 0) > 0));

  const yigindi = kun.rows.reduce((a, r) => ({
    qongiroq: a.qongiroq + r.qongiroq,
    yangiLid: a.yangiLid + r.yangiLid,
    aylandi:  a.aylandi + r.aylandi,
  }), { qongiroq: 0, yangiLid: 0, aylandi: 0 });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="text-[10.5px] uppercase tracking-wider text-neutral-400">
            <th className="text-left font-bold px-4 py-2">Xodim</th>
            <th className="text-right font-bold px-2 py-2">Qo&apos;ng&apos;iroq</th>
            <th className="text-right font-bold px-2 py-2">Yangi lid</th>
            {faolBosqich.map(st => (
              <th key={st.id} className="text-right font-bold px-2 py-2 whitespace-nowrap">
                {st.name}
              </th>
            ))}
            <th className="text-right font-bold px-4 py-2">O&apos;quvchi</th>
          </tr>
        </thead>
        <tbody>
          {kun.rows.map(r => (
            <tr key={r.userId} className="border-t border-white/40 dark:border-white/5">
              <td className="px-4 py-2 font-medium text-neutral-800 dark:text-neutral-200">
                {r.name}
              </td>
              <td className="px-2 py-2 text-right tabular-nums">{r.qongiroq}</td>
              <td className="px-2 py-2 text-right tabular-nums text-neutral-500">{r.yangiLid}</td>
              {faolBosqich.map(st => (
                <td key={st.id} className="px-2 py-2 text-right tabular-nums text-neutral-600 dark:text-neutral-300">
                  {r.bosqichga[st.id] ?? 0}
                </td>
              ))}
              <td className="px-4 py-2 text-right tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                {r.aylandi}
              </td>
            </tr>
          ))}
          <tr className="border-t-2 border-neutral-300 dark:border-white/20 font-semibold">
            <td className="px-4 py-2">Jami</td>
            <td className="px-2 py-2 text-right tabular-nums">{yigindi.qongiroq}</td>
            <td className="px-2 py-2 text-right tabular-nums">{yigindi.yangiLid}</td>
            {faolBosqich.map(st => (
              <td key={st.id} className="px-2 py-2 text-right tabular-nums">
                {kun.rows.reduce((a, r) => a + (r.bosqichga[st.id] ?? 0), 0)}
              </td>
            ))}
            <td className="px-4 py-2 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
              {yigindi.aylandi}
            </td>
          </tr>
        </tbody>
      </table>
      <p className="px-4 py-2 text-[10.5px] text-neutral-400">
        Barchasi SHU KUNGI harakat — lid qachon yaratilganiga bog&apos;liq emas.
      </p>
    </div>
  );
}
