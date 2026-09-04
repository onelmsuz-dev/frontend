"use client";

import Link from "next/link";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import { useChartColors } from "@/hooks/use-chart-colors";
import {
  UserPlus, CalendarCheck, BookOpen, GraduationCap, Target,
} from "lucide-react";
import { useOverviewReport, type OverviewReport } from "@/lib/hooks/useReports";
import { stageHue } from "@/lib/lead-stages";

const fmtShort = (v: number) => {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} mln`;
  if (Math.abs(v) >= 1_000) return `${Math.round(v / 1_000)} ming`;
  return String(Math.round(v));
};

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded-xl", className)} />;
}

function Panel({ icon: Icon, title, hint, color, children }: {
  icon: any; title: string; hint?: string; color: string; children: React.ReactNode;
}) {
  return (
    <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className={cn("w-4 h-4", color)} />
          <h3 className="text-[14px] font-bold text-neutral-900 dark:text-neutral-100">{title}</h3>
        </div>
        {hint && <p className="text-[11px] text-neutral-400">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

export function OverviewSections({ months }: { months: number }) {
  const chart = useChartColors();
  const { data, isLoading, error } = useOverviewReport(months);

  if (error) {
    return (
      <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
        <p className="text-[13px] text-red-700 dark:text-red-300">{(error as Error).message}</p>
      </div>
    );
  }
  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StudentFlowPanel data={data} chart={chart} />
        <AttendancePanel data={data} chart={chart} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RetentionPanel data={data} />
        <LeadFunnel leads={data.leads} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CoursePanel data={data} />
        <TeacherPanel data={data} />
      </div>
    </div>
  );
}

// ─── O'quvchi harakati ────────────────────────────────────────────────────────

function StudentFlowPanel({ data, chart }: { data: OverviewReport; chart: ReturnType<typeof useChartColors> }) {
  const totalJoined = data.studentFlow.reduce((s, m) => s + m.joined, 0);
  const totalLeft = data.studentFlow.reduce((s, m) => s + m.left, 0);
  const net = totalJoined - totalLeft;

  return (
    <Panel icon={UserPlus} title="O'quvchi harakati" color="text-green-500"
      hint={`${totalJoined} qo'shildi · ${totalLeft} ketdi`}>
      <div className="flex items-center gap-4 mb-3">
        <Metric value={`+${totalJoined}`} label="Qo'shilgan" cls="text-green-600 dark:text-green-400" />
        <Metric value={`−${totalLeft}`} label="Ketgan" cls="text-red-600 dark:text-red-400" />
        <Metric value={`${net >= 0 ? "+" : ""}${net}`} label="Sof o'sish"
          cls={net >= 0 ? "text-indigo-600 dark:text-indigo-400" : "text-red-600 dark:text-red-400"} />
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data.studentFlow}>
          <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: chart.axis }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: chart.axis }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={{ background: chart.tooltip, border: `1px solid ${chart.tooltipBorder}`, borderRadius: 10, color: chart.tooltipText }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="joined" name="Qo'shildi" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="left"   name="Ketdi"     fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {totalLeft === 0 && (
        <p className="text-[11px] text-neutral-400 mt-2">
          &quot;Ketdi&quot; hisobi guruhdan chiqarilgan sanadan boshlab yuritiladi — bu funksiya
          yaqinda qo&apos;shilgani uchun eski chiqishlar ko&apos;rinmaydi.
        </p>
      )}
    </Panel>
  );
}


// ─── Ushlab qolish ────────────────────────────────────────────────────────────

/**
 * Sabab matnlari — JS KONSTANTASI sifatida, ko'p qatorli JSX matni emas.
 * Bu kod bazasida `&apos;` bo'lgan ko'p qatorli JSX matndan bo'shliq
 * yo'qoladi (`npm run verify:jsx` shuni qidiradi).
 */
const RETENTION_REASON: Record<string, string> = {
  TARIX_YOQ:    "oy boshida hali o'quvchi yo'q edi",
  HAMMA_KETGAN: "oy boshida faol o'quvchi qolmagan",
  OY_TUGAMAGAN: "oy tugagach hisoblanadi",
  KAM_ODAM:     "o'quvchi kam — foiz chalg'itardi",
};

const RETENTION_HINT =
  "Oy boshida bo'lgan o'quvchilarning nechtasi oy oxirida ham qolgani. "
  + "O'sha oyda qo'shilganlar hisobga kirmaydi.";

const RETENTION_EMPTY =
  "Ushlab qolish darajasi hali hisoblanmaydi — buning uchun kamida bitta "
  + "to'liq tugagan oy va oy boshida bo'lgan o'quvchilar kerak.";

function RetentionPanel({ data }: { data: OverviewReport }) {
  const rows = data.retention ?? [];
  const withRate = rows.filter((r) => r.rate !== null);
  const latest = withRate[withRate.length - 1];

  return (
    <Panel icon={UserPlus} title="Ushlab qolish" color="text-indigo-500"
      hint={RETENTION_HINT}>
      {rows.length === 0 || withRate.length === 0 ? (
        <p className="text-[12px] leading-relaxed text-neutral-500 dark:text-neutral-400 py-2">
          {RETENTION_EMPTY}
        </p>
      ) : (
        <div className="flex items-center gap-4 mb-3">
          <Metric value={`${latest.rate}%`} label={`${latest.label} oyi`}
            cls="text-indigo-600 dark:text-indigo-400" />
          <Metric value={`${latest.retained}/${latest.base}`} label="Qolgan"
            cls="text-neutral-700 dark:text-neutral-200" />
        </div>
      )}

      <ul className="space-y-1.5">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center gap-2.5">
            <span className="w-12 shrink-0 text-[11px] text-neutral-500 dark:text-neutral-400">
              {r.label}
            </span>

            {r.rate !== null ? (
              <>
                <div className="h-2 flex-1 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                  <div className="h-full rounded-full bg-indigo-500"
                    style={{ width: `${r.rate}%` }} />
                </div>
                <span className="w-9 shrink-0 text-right text-[12px] font-semibold tabular-nums
                                 text-neutral-900 dark:text-neutral-100">
                  {r.rate}%
                </span>
              </>
            ) : (
              <span className="flex-1 text-[11px] text-neutral-400 dark:text-neutral-500">
                {RETENTION_REASON[r.status] ?? "hisoblanmadi"}
              </span>
            )}

            {/* Xom sonlar HAR DOIM ko'rinadi — foizni yashirish
                faktni yashirish degani emas. */}
            <span className="w-16 shrink-0 text-right text-[11px] tabular-nums
                             text-neutral-400 dark:text-neutral-500">
              {r.base === 0 ? "—"
                : r.left === 0 ? `${r.base} ta`
                : `${r.base} ta · −${r.left}`}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

// ─── Davomat dinamikasi ───────────────────────────────────────────────────────

function AttendancePanel({ data, chart }: { data: OverviewReport; chart: ReturnType<typeof useChartColors> }) {
  const withData = data.attendance.filter(a => a.total > 0);
  const avg = withData.length
    ? Math.round(withData.reduce((s, a) => s + a.rate, 0) / withData.length)
    : 0;

  return (
    <Panel icon={CalendarCheck} title="Davomat dinamikasi" color="text-blue-500"
      hint={`o'rtacha ${avg}%`}>
      {withData.length === 0 ? (
        <div className="py-14 text-center text-sm text-neutral-400">Davomat yozuvi yo&apos;q</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data.attendance}>
            <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: chart.axis }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: chart.axis }}
              tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v: any) => `${v}%`}
              contentStyle={{ background: chart.tooltip, border: `1px solid ${chart.tooltipBorder}`, borderRadius: 10, color: chart.tooltipText }} />
            <Line type="monotone" dataKey="rate" name="Davomat" stroke="#6366f1" strokeWidth={2.5}
              dot={{ r: 3, fill: "#6366f1" }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Panel>
  );
}

// ─── Lid voronkasi ────────────────────────────────────────────────────────────

function LeadFunnel({ leads }: { leads: OverviewReport["leads"] }) {
  const stages = leads.stages ?? [];
  const max = Math.max(1, ...stages.map(s => s.count));
  const rateLabel = leads.conversionRate === null ? "kam sonda hisoblanmaydi" : `${leads.conversionRate}%`;

  return (
    <Panel icon={Target} title="Lid voronkasi" color="text-pink-500"
      hint={`${leads.total} ta lid · konversiya ${rateLabel}`}>
      {leads.total === 0 ? (
        <div className="py-10 text-center text-sm text-neutral-400">Bu davrda lid yo&apos;q</div>
      ) : (
        <div className="space-y-2.5">
          {stages.map(s => {
            const hue = stageHue(s.color);
            return (
              <div key={s.id}>
                <div className="flex items-center justify-between text-[12px] mb-1">
                  <span className="text-neutral-600 dark:text-neutral-400">{s.name}</span>
                  <span className="font-bold text-neutral-800 dark:text-neutral-200">
                    {s.count}
                    <span className="text-neutral-400 font-normal ml-1">
                      {leads.total > 0 ? `${Math.round((s.count / leads.total) * 100)}%` : ""}
                    </span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-neutral-200/70 dark:bg-white/10 overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all", hue.bar)}
                    style={{ width: `${(s.count / max) * 100}%` }} />
                </div>
              </div>
            );
          })}
          <p className="text-[11px] text-neutral-400 pt-1">
            {leads.conversionRate === null
              ? "Konversiya foizi hali hisoblanmaydi — bu davrda lidlar soni kam, foiz chalg'itardi."
              : <>Har 100 ta liddan <strong>{leads.conversionRate}</strong>{" "}tasi to&apos;lovchi o&apos;quvchiga aylangan.</>}
          </p>
        </div>
      )}
    </Panel>
  );
}

// ─── Kurs kesimi ──────────────────────────────────────────────────────────────

function CoursePanel({ data }: { data: OverviewReport }) {
  const maxRev = Math.max(1, ...data.courses.map(c => c.revenue));
  return (
    <Panel icon={BookOpen} title="Kurslar bo'yicha" color="text-purple-500" hint="davr tushumi">
      {data.courses.length === 0 ? (
        <div className="py-10 text-center text-sm text-neutral-400">Kurs yo&apos;q</div>
      ) : (
        <div className="space-y-2.5">
          {data.courses.map(c => (
            <div key={c.id}>
              <div className="flex items-center justify-between text-[12px] mb-1 gap-2">
                <Link href={`/courses/${c.id}`}
                  className="text-neutral-700 dark:text-neutral-300 hover:text-indigo-600 transition-colors truncate">
                  {c.name}
                  <span className="text-neutral-400 ml-1.5">{c.students} o&apos;quvchi · {c.groups} guruh</span>
                </Link>
                <span className="font-bold text-neutral-800 dark:text-neutral-200 shrink-0">
                  {fmtShort(c.revenue)}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-neutral-200/70 dark:bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-purple-500 transition-all"
                  style={{ width: `${(c.revenue / maxRev) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

// ─── O'qituvchi kesimi ────────────────────────────────────────────────────────

function TeacherPanel({ data }: { data: OverviewReport }) {
  return (
    <Panel icon={GraduationCap} title="O'qituvchilar bo'yicha" color="text-indigo-500" hint="davr tushumi">
      {data.teachers.length === 0 ? (
        <div className="py-10 text-center text-sm text-neutral-400">O&apos;qituvchi yo&apos;q</div>
      ) : (
        <div className="space-y-1">
          {data.teachers.map((t, i) => (
            <Link key={t.id} href={`/teachers/${t.id}`}
              className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-lg hover:bg-white/60 dark:hover:bg-white/10 transition-colors">
              <span className="w-5 text-center text-[12px] font-black text-neutral-400 shrink-0">{i + 1}</span>
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                {t.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 truncate">{t.name}</p>
                <p className="text-[11px] text-neutral-400">{t.groups} guruh · {t.students} o&apos;quvchi</p>
              </div>
              <span className="text-[13px] font-black text-neutral-800 dark:text-neutral-200 shrink-0">
                {fmtShort(t.revenue)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </Panel>
  );
}

function Metric({ value, label, cls }: { value: string; label: string; cls: string }) {
  return (
    <div>
      <p className={cn("text-[20px] font-black leading-none", cls)}>{value}</p>
      <p className="text-[11px] text-neutral-400 mt-0.5">{label}</p>
    </div>
  );
}
