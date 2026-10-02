"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Table2, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChartColors } from "@/hooks/use-chart-colors";
import { UZ_MONTHS_SHORT } from "@/lib/date-uz";
import { formatCurrency } from "@/lib/money";

/**
 * 12 OYLIK DAROMAD/XARAJAT — guruhlangan ustunlar, bitta o'q.
 *
 * Ranglar ikkala rejimda validator bilan tekshirilgan (indigo + to'q sariq):
 * yorug'da #4f46e5/#ea580c, qorong'ida #6366f1/#ea580c. Foyda ustun qilib
 * chizilmaydi — u ikki ustun farqi, tooltip va jadvalda beriladi; manfiy
 * foydani ustunga qo'yish ikkinchi o'qni talab qilardi.
 */
export interface OyQatori { month: string; daromad: number; xarajat: number; foyda: number }

export const SERIYA = {
  light: { daromad: "#4f46e5", xarajat: "#ea580c" },
  dark:  { daromad: "#6366f1", xarajat: "#ea580c" },
} as const;

const bosh = () => () => {};
export function useSeriesColors() {
  const { resolvedTheme } = useTheme();
  // Serverda mavzu noma'lum — gidratsiya nomuvofiqligi bo'lmasin.
  const mounted = useSyncExternalStore(bosh, () => true, () => false);
  return mounted && resolvedTheme === "dark" ? SERIYA.dark : SERIYA.light;
}

export function oyYorligi(month: string, birinchi = false): string {
  const [y, m] = month.split("-").map(Number);
  const nom = UZ_MONTHS_SHORT[m - 1] ?? month;
  return m === 1 || birinchi ? `${nom} ${String(y).slice(2)}` : nom;
}

export function qisqaSumma(v: number): string {
  const a = Math.abs(v);
  const s = a >= 1_000_000 ? `${(a / 1_000_000).toFixed(a >= 10_000_000 ? 0 : 1).replace(/\.0$/, "")} mln`
    : a >= 1_000 ? `${Math.round(a / 1_000)} ming` : String(a);
  return v < 0 ? `−${s}` : s;
}

function TooltipIchi({ active, payload, colors }: {
  active?: boolean; payload?: { payload: OyQatori }[]; colors: { daromad: string; xarajat: string };
}) {
  const chart = useChartColors();
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  const qatorlar = [
    { nom: "Daromad", v: row.daromad, rang: colors.daromad },
    { nom: "Xarajat", v: row.xarajat, rang: colors.xarajat },
  ];
  return (
    <div style={{ background: chart.tooltip, border: `1px solid ${chart.tooltipBorder}`, color: chart.tooltipText }}
      className="rounded-xl px-3 py-2.5 shadow-lg text-[12px] min-w-[190px]">
      <p className="font-semibold mb-1.5">{oyYorligi(row.month, true)}</p>
      {qatorlar.map((q) => (
        <div key={q.nom} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-2 opacity-80">
            <span className="inline-block w-3 h-0.5 rounded-full" style={{ background: q.rang }} />
            {q.nom}
          </span>
          <span className="font-semibold tabular-nums">{formatCurrency(q.v)}</span>
        </div>
      ))}
      <div className="flex items-center justify-between gap-4 pt-1.5 mt-1 border-t" style={{ borderColor: chart.tooltipBorder }}>
        <span className="opacity-80">Foyda</span>
        <span className="font-bold tabular-nums">{formatCurrency(row.foyda)}</span>
      </div>
    </div>
  );
}

export function LedgerChart({ oylar, loading }: { oylar: OyQatori[]; loading?: boolean }) {
  const chart = useChartColors();
  const colors = useSeriesColors();
  const [jadval, setJadval] = useState(false);
  const data = useMemo(() => oylar.map((o, i) => ({ ...o, label: oyYorligi(o.month, i === 0) })), [oylar]);
  const bosh = !loading && oylar.every((o) => o.daromad === 0 && o.xarajat === 0);

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-[13px] font-bold text-neutral-900 dark:text-white">So&apos;nggi 12 oy</h3>
          <p className="text-[11px] text-neutral-500 mt-0.5">Oylik daromad va xarajat, so&apos;mda</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3 text-[11px] text-neutral-600 dark:text-neutral-400">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-[3px]" style={{ background: colors.daromad }} />Daromad</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-[3px]" style={{ background: colors.xarajat }} />Xarajat</span>
          </div>
          <button type="button" onClick={() => setJadval((v) => !v)} title={jadval ? "Diagramma" : "Jadval ko'rinishi"}
            className="w-8 h-8 grid place-items-center rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:hover:text-white transition-colors">
            {jadval ? <BarChart3 className="w-4 h-4" /> : <Table2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {jadval ? (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-left text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
                <th className="py-2 px-1 font-semibold">Oy</th>
                <th className="py-2 px-1 font-semibold text-right">Daromad</th>
                <th className="py-2 px-1 font-semibold text-right">Xarajat</th>
                <th className="py-2 px-1 font-semibold text-right">Foyda</th>
              </tr>
            </thead>
            <tbody>
              {data.map((o) => (
                <tr key={o.month} className="border-b border-neutral-100 dark:border-neutral-800/60 last:border-0">
                  <td className="py-1.5 px-1 text-neutral-700 dark:text-neutral-300">{oyYorligi(o.month, true)}</td>
                  <td className="py-1.5 px-1 text-right tabular-nums">{formatCurrency(o.daromad)}</td>
                  <td className="py-1.5 px-1 text-right tabular-nums">{formatCurrency(o.xarajat)}</td>
                  <td className={cn("py-1.5 px-1 text-right tabular-nums font-semibold",
                    o.foyda < 0 ? "text-rose-600 dark:text-rose-400" : "text-neutral-900 dark:text-white")}>{formatCurrency(o.foyda)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={cn("relative transition-opacity", loading && "opacity-50")}>
          {bosh && (
            <p className="absolute inset-0 grid place-items-center text-[12px] text-neutral-400">Hali yozuv yo&apos;q</p>
          )}
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} barGap={2} barCategoryGap="30%" margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={chart.grid} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: chart.axis }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: chart.axis }} tickFormatter={(v) => qisqaSumma(Number(v))}
                axisLine={false} tickLine={false} width={56} />
              <Tooltip cursor={{ fill: chart.grid, opacity: 0.4 }} content={<TooltipIchi colors={colors} />} />
              <Bar dataKey="daromad" name="Daromad" fill={colors.daromad} maxBarSize={18} radius={[4, 4, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="xarajat" name="Xarajat" fill={colors.xarajat} maxBarSize={18} radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
