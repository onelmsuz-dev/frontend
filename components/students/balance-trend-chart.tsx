"use client";

import { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { useChartColors } from "@/hooks/use-chart-colors";
import { fmtShortDate } from "@/lib/date-uz";

interface Entry { amount: number; createdAt?: string; date?: string }

/**
 * BALANS DINAMIKASI — vaqt bo'yicha yig'indi. Alohida endpoint kerak emas:
 * `charges` + `payments` allaqachon balansning HAR BIR o'zgarishini o'z
 * ichiga oladi, shu yerda faqat sana bo'yicha kumulyativ yig'indiga
 * aylantiriladi. Ikki nuqtadan kam bo'lsa chizilmaydi — tendentsiya
 * bitta nuqtada ma'no anglatmaydi.
 */
export function BalanceTrendChart({ charges, payments, fmt }: {
  charges: Entry[]; payments: Entry[]; fmt: (v: number) => string;
}) {
  const chart = useChartColors();

  const points = useMemo(() => {
    const all = [...(charges ?? []), ...(payments ?? [])]
      .map(x => ({ t: new Date(x.createdAt ?? x.date ?? 0).getTime(), amount: x.amount }))
      .filter(x => Number.isFinite(x.t) && x.t > 0)
      .sort((a, b) => a.t - b.t);
    return all.reduce<{ t: number; label: string; balans: number }[]>((acc, x) => {
      const prev = acc.length > 0 ? acc[acc.length - 1].balans : 0;
      acc.push({ t: x.t, label: fmtShortDate(new Date(x.t)), balans: prev + x.amount });
      return acc;
    }, []);
  }, [charges, payments]);

  if (points.length < 2) return null;

  return (
    <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-5">
      <h3 className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-500
        dark:text-neutral-400 uppercase tracking-wider mb-3">
        <TrendingUp className="w-3.5 h-3.5" />
        Balans dinamikasi
      </h3>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={points}>
          <defs>
            <linearGradient id="g-balans" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#818cf8" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: chart.axis }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: chart.axis }}
            tickFormatter={v => `${Math.round(v / 1000)}k`} axisLine={false} tickLine={false} width={40} />
          <Tooltip
            formatter={(v: unknown) => fmt(v as number)}
            contentStyle={{ background: chart.tooltip, border: `1px solid ${chart.tooltipBorder}`, borderRadius: 10, color: chart.tooltipText }}
          />
          <Area type="monotone" dataKey="balans" stroke="#818cf8" fill="url(#g-balans)" strokeWidth={2.5} name="Balans" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
