"use client";

/**
 * MOLIYA — YANGI KO'RINISH (2026-10-23).
 *
 * Eski sahifada oltita teng huquqli tab bor edi, har birida o'z oy
 * tanlovi, tepada esa hamma tabga tegishli kartalar va katta tahlil bloki
 * turardi — "qaysi raqam qaysi oyniki?" degan savol tug'ilardi.
 *
 * Bu yerda:
 *   • BITTA OY tanlovi — to'lovlar, xarajatlar, qo'shimcha to'lovlar va
 *     oylik hammasi shu oyni ko'rsatadi;
 *   • bo'limlar uch guruhga ajratilgan: Umumiy / Kirim / Chiqim;
 *   • "Umumiy" bo'limida foyda formulasi (tushum + qo'shimcha − xarajat)
 *     va "E'tibor talab qiladi" ro'yxati — har bandi tegishli bo'limga olib
 *     boradi.
 *
 * Hisob-kitob mantig'i eski sahifadagi bilan bir xil, faqat joylashuv yangi.
 */

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import {
  AlertTriangle, ArrowRight, BarChart3, CalendarClock, ChevronLeft, ChevronRight,
  HandCoins, LayoutDashboard, Minus, Package, Plus, Receipt, Equal, TrendingDown,
  TrendingUp, Users, UserCog, Wallet, Sparkles, CheckCircle2,
} from "lucide-react";
import { TopHeader } from "@/components/layout/top-header";
import { AcceptPaymentModal } from "@/components/finance/accept-payment-modal";
import { MaterialsReport } from "@/components/finance/materials-report";
import { FinanceInsights } from "@/components/finance/finance-insights";
import { AvansTab } from "@/components/salary-advance/avans-tab";
import { StaffSalaries } from "@/components/staff/staff-salaries";
import { TabPanel } from "@/components/ui/tab-glide";
import { usePayments } from "@/lib/hooks/usePayments";
import { useFeature } from "@/lib/hooks/useFeatures";
import { useMe, hasPerm } from "@/lib/hooks/useMe";
import { useSalaryAdvances } from "@/lib/hooks/useSalaryAdvances";
import { useBranchQueryString } from "@/lib/contexts/branch-context";
import { fmtMonthYear } from "@/lib/date-uz";
import { formatCurrency } from "@/lib/money";
import { cn } from "@/lib/utils";
import { Skeleton, fetcher, royxat, type Tolov } from "./ui";
import type { OylikQatori } from "@/lib/salary-advance";
import { PaymentsSection } from "./payments";
import { ExpenseModal, ExpensesSection } from "./expenses";
import { TeacherSalariesSection } from "./salaries";
import { DebtorsSection, useDebtors, useDues } from "./debtors";

type Bolim =
  | "umumiy"
  | "tolovlar" | "qoshimcha" | "qarzdorlar"
  | "xarajatlar" | "oylik" | "xodimlar" | "avans";

type NavItem = { id: Bolim; label: string; icon: typeof Wallet; badge?: number; tone?: "red" | "amber" };

const joriyOy = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
const oySur = (m: string, n: number) => {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(y, mo - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
const oyNomi = (m: string) => {
  const [y, mo] = m.split("-").map(Number);
  return fmtMonthYear(new Date(y, mo - 1, 1));
};

export function FinanceV2() {
  // Dashboard'dagi ogohlantirishdan ?tab=qarzdorlar bilan kelishi mumkin
  // (`useSearchParams` — sahifada Suspense ichida).
  const tabParam = useSearchParams().get("tab");
  const [bolim, setBolim] = useState<Bolim>(tabParam === "qarzdorlar" ? "qarzdorlar" : "umumiy");
  const [month, setMonth] = useState(joriyOy);
  const [showPay, setShowPay] = useState(false);
  const [showExp, setShowExp] = useState(false);

  const { me } = useMe();
  const oylikKoradi = hasPerm(me?.permissions, "salaries.view");
  const avansYoqiq  = useFeature("salary-advance") === true && oylikKoradi;
  const { data: avansRoyxat } = useSalaryAdvances(undefined, avansYoqiq);

  // ── Umumiy ko'rinish uchun yig'indilar (bo'limlar bilan bir xil SWR kalitlari) ──
  const { data: payRaw, isLoading: payLoading } = usePayments({ month });
  const expQs = useBranchQueryString({ month });
  const { data: expSum } = useSWR<{ total: number; count: number }>(`/api/expenses/summary${expQs}`, fetcher);
  const { data: matRep } = useSWR<{ total: number; debt: number }>(`/api/materials/report${expQs}`, fetcher);
  const { data: salRaw } = useSWR(oylikKoradi ? `/api/teacher-salaries${expQs}` : null, fetcher);
  const { debtors, total: totalDebt } = useDebtors();
  const { data: dues } = useDues();

  const payments = royxat<Tolov>(payRaw);
  const salaries = royxat<OylikQatori>(salRaw);
  const tushum    = payments.reduce((s, p) => s + p.amount, 0);
  const qoshimcha = matRep?.total ?? 0;
  const xarajat   = expSum?.total ?? 0;
  const foyda     = tushum + qoshimcha - xarajat;
  const oylikTolanmagan = salaries.filter((r) => r.status !== "PAID").length;

  const avansKutmoqda = (() => {
    const d = avansRoyxat;
    if (!d || !d.sozlama.enabled || d.month !== d.joriyOy || d.bugun < d.avansKuni) return 0;
    return d.rows.filter((r) => r.advanceRemaining > 0 && r.salaryStatus !== "PAID" && r.faol).length;
  })();

  const NAV: { group: string; items: NavItem[] }[] = [
    { group: "Umumiy", items: [{ id: "umumiy", label: "Umumiy ko'rinish", icon: LayoutDashboard }] },
    {
      group: "Kirim",
      items: [
        { id: "tolovlar",   label: "To'lovlar",           icon: Wallet },
        { id: "qoshimcha",  label: "Qo'shimcha to'lovlar", icon: Package },
        { id: "qarzdorlar", label: "Qarzdorlar",          icon: AlertTriangle, badge: debtors.length, tone: "red" },
      ],
    },
    {
      group: "Chiqim",
      items: [
        { id: "xarajatlar", label: "Xarajatlar", icon: Receipt },
        ...(oylikKoradi ? [
          { id: "oylik" as Bolim,    label: "O'qituvchi oyligi", icon: Users, badge: oylikTolanmagan, tone: "amber" as const },
          { id: "xodimlar" as Bolim, label: "Xodimlar oyligi",   icon: UserCog },
        ] : []),
        ...(avansYoqiq ? [
          { id: "avans" as Bolim, label: "Oylik avansi", icon: HandCoins, badge: avansKutmoqda, tone: "amber" as const },
        ] : []),
      ],
    },
  ];

  // "E'tibor talab qiladi" — faqat haqiqatan amal kerak bo'lganlar.
  const vazifalar: { key: string; text: string; sub: string; go: () => void; tone: "red" | "amber" | "blue" }[] = [];
  if (dues && dues.pending > 0)
    vazifalar.push({ key: "dues", tone: "amber", go: () => setBolim("qarzdorlar"),
      text: `${dues.pending} ta o'quvchiga bu oy to'lovi hali yozilmagan`,
      sub: `taxminan ${formatCurrency(dues.amount)}` });
  if (debtors.length > 0)
    vazifalar.push({ key: "debt", tone: "red", go: () => setBolim("qarzdorlar"),
      text: `${debtors.length} ta o'quvchi qarzdor`, sub: `jami ${formatCurrency(totalDebt)}` });
  if (avansKutmoqda > 0)
    vazifalar.push({ key: "avans", tone: "amber", go: () => setBolim("avans"),
      text: `${avansKutmoqda} kishiga avans berish kuni keldi`, sub: "Oylik avansi bo'limida" });
  if (oylikKoradi && salaries.length === 0)
    vazifalar.push({ key: "sal0", tone: "blue", go: () => setBolim("oylik"),
      text: `${oyNomi(month)} uchun o'qituvchi oyligi hisoblanmagan`, sub: "Hisoblash uchun bosing" });
  else if (oylikTolanmagan > 0)
    vazifalar.push({ key: "sal", tone: "amber", go: () => setBolim("oylik"),
      text: `${oylikTolanmagan} ta o'qituvchiga oylik to'lanmagan`, sub: oyNomi(month) });
  if (!!matRep?.debt)
    vazifalar.push({ key: "mat", tone: "amber", go: () => setBolim("qoshimcha"),
      text: "Qo'shimcha to'lovlarda qarz bor", sub: formatCurrency(matRep.debt) });

  const joriy = NAV.flatMap((g) => g.items).find((i) => i.id === bolim) ?? NAV[0].items[0];
  // Bu bo'limlar umumiy oyga bog'lanmagan — oy tanlovi ularda ko'rsatilmaydi.
  const oySiz = bolim === "qarzdorlar" || bolim === "xodimlar" || bolim === "avans";

  return (
    <div className="pb-6">
      <TopHeader
        title="Moliya"
        subtitle={`${oyNomi(month)} — moliyaviy hisobot`}
        action={{ label: "To'lov qabul qilish", onClick: () => setShowPay(true) }}
      />

      <div className="p-5 lg:flex lg:gap-5 lg:items-start">
        {/* ── NAVIGATSIYA: kompyuterda chap ustun, telefonda gorizontal ── */}
        <nav className="lg:w-56 lg:shrink-0 lg:sticky lg:top-4 mb-4 lg:mb-0">
          <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-2
            flex lg:flex-col gap-1 overflow-x-auto no-scrollbar">
            {NAV.map((g, gi) => (
              <div key={g.group} className={cn("flex lg:flex-col gap-1 shrink-0", gi > 0 && "lg:mt-2 pl-2 lg:pl-0 border-l lg:border-l-0 border-neutral-200/70 dark:border-white/10")}>
                <p className="hidden lg:block px-2.5 pt-1 pb-0.5 text-[10.5px] font-bold uppercase tracking-wider text-neutral-400">
                  {g.group}
                </p>
                {g.items.map((it) => {
                  const Icon = it.icon;
                  const active = bolim === it.id;
                  return (
                    <button key={it.id} type="button" onClick={() => setBolim(it.id)} aria-current={active ? "page" : undefined}
                      className={cn("flex items-center gap-2.5 h-9 px-2.5 rounded-xl text-[13px] font-medium whitespace-nowrap transition-colors",
                        active
                          ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
                          : "text-neutral-600 dark:text-neutral-300 hover:bg-white/70 dark:hover:bg-white/5")}>
                      <Icon className={cn("w-4 h-4 shrink-0", active ? "text-indigo-600 dark:text-indigo-400" : "text-neutral-400")} />
                      <span className="flex-1 text-left">{it.label}</span>
                      {!!it.badge && (
                        <span className={cn("min-w-5 h-5 px-1.5 rounded-full text-[10.5px] font-bold inline-flex items-center justify-center",
                          it.tone === "red"
                            ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300")}>
                          {it.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </nav>

        <main className="flex-1 min-w-0 space-y-4">
          {/* ── ASBOBLAR QATORI: bo'lim nomi, umumiy oy, filial, tezkor amallar ── */}
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-[18px] font-bold text-neutral-900 dark:text-neutral-100 mr-auto">{joriy.label}</h2>
            {!oySiz && (
              <div className="flex items-center gap-1 glass-soft rounded-xl p-1">
                <button type="button" onClick={() => setMonth((m) => oySur(m, -1))} aria-label="Oldingi oy"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-white/80 dark:hover:bg-white/10">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <label className="relative px-2 text-[13px] font-semibold text-neutral-800 dark:text-neutral-100 cursor-pointer min-w-[118px] text-center">
                  {oyNomi(month)}
                  <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer" aria-label="Oyni tanlash" />
                </label>
                <button type="button" onClick={() => setMonth((m) => oySur(m, 1))} aria-label="Keyingi oy"
                  disabled={month >= joriyOy()}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-white/80 dark:hover:bg-white/10 disabled:opacity-30">
                  <ChevronRight className="w-4 h-4" />
                </button>
                {month !== joriyOy() && (
                  <button type="button" onClick={() => setMonth(joriyOy())}
                    className="h-7 px-2 rounded-lg text-[11.5px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-white/80 dark:hover:bg-white/10">
                    Joriy oy
                  </button>
                )}
              </div>
            )}
          </div>

          <TabPanel k={bolim} className="space-y-4">
            {bolim === "umumiy" && (
              <div className="space-y-4">
                {/* Foyda formulasi: tushum + qo'shimcha − xarajat = sof foyda */}
                <div className="grid grid-cols-2 xl:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-stretch gap-2.5">
                  <KpiCard label="Kurs to'lovlari" value={tushum} loading={payLoading} icon={TrendingUp}
                    tone="green" sub={`${payments.length} ta to'lov`} onClick={() => setBolim("tolovlar")} />
                  <Op icon={Plus} />
                  <KpiCard label="Qo'shimcha daromad" value={qoshimcha} loading={!matRep} icon={Package}
                    tone="amber" sub="kitob, forma, sertifikat" onClick={() => setBolim("qoshimcha")} />
                  <Op icon={Minus} />
                  <KpiCard label="Xarajatlar" value={xarajat} loading={!expSum} icon={TrendingDown}
                    tone="red" sub={`${expSum?.count ?? 0} ta yozuv`} onClick={() => setBolim("xarajatlar")} />
                  <Op icon={Equal} />
                  <KpiCard label="Sof foyda" value={foyda} loading={payLoading || !expSum || !matRep} icon={Sparkles}
                    tone={foyda >= 0 ? "violet" : "red"} sub={oyNomi(month)} strong />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* E'tibor talab qiladi */}
                  <div className="lg:col-span-2 glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-4 border-b border-white/50 dark:border-white/10">
                      <CalendarClock className="w-4 h-4 text-indigo-500" />
                      <p className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-100">E&apos;tibor talab qiladi</p>
                      {vazifalar.length > 0 && (
                        <span className="ml-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-300">
                          {vazifalar.length}
                        </span>
                      )}
                    </div>
                    {vazifalar.length === 0 ? (
                      <div className="py-10 flex flex-col items-center gap-2 text-[13px] text-neutral-400">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                        Hammasi joyida — kutilayotgan ish yo&apos;q
                      </div>
                    ) : (
                      <ul className="divide-y divide-white/50 dark:divide-white/5">
                        {vazifalar.map((v) => (
                          <li key={v.key}>
                            <button type="button" onClick={v.go}
                              className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-white/50 dark:hover:bg-white/5 transition-colors group">
                              <span className={cn("w-2 h-2 rounded-full shrink-0",
                                v.tone === "red" ? "bg-red-500" : v.tone === "amber" ? "bg-amber-500" : "bg-blue-500")} />
                              <span className="flex-1 min-w-0">
                                <span className="block text-[13px] font-medium text-neutral-900 dark:text-neutral-100">{v.text}</span>
                                <span className="block text-[11.5px] text-neutral-500 dark:text-neutral-400">{v.sub}</span>
                              </span>
                              <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Tezkor amallar */}
                  <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-4 space-y-2">
                    <p className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-100 mb-1">Tezkor amallar</p>
                    <QuickAction icon={Wallet} tone="green" label="To'lov qabul qilish" onClick={() => setShowPay(true)} />
                    <QuickAction icon={Receipt} tone="red" label="Xarajat qo'shish" onClick={() => setShowExp(true)} />
                    {oylikKoradi && (
                      <QuickAction icon={Users} tone="violet" label="O'qituvchi oyligini hisoblash" onClick={() => setBolim("oylik")} />
                    )}
                    <QuickAction icon={AlertTriangle} tone="amber" label="Qarzdorlarni ko'rish" onClick={() => setBolim("qarzdorlar")} />
                  </div>
                </div>

                {/* Chuqur tahlil — joriy oy bo'yicha */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 pt-1">
                    <BarChart3 className="w-4 h-4 text-neutral-400" />
                    <p className="text-[13px] font-semibold text-neutral-500 dark:text-neutral-400">Tahlil — joriy oy</p>
                  </div>
                  <FinanceInsights />
                </div>
              </div>
            )}

            {bolim === "tolovlar"   && <PaymentsSection month={month} />}
            {bolim === "qoshimcha"  && <MaterialsReport month={month} onMonth={setMonth} />}
            {bolim === "qarzdorlar" && <DebtorsSection />}
            {bolim === "xarajatlar" && <ExpensesSection month={month} onAdd={() => setShowExp(true)} />}
            {bolim === "oylik" && oylikKoradi && (
              <TeacherSalariesSection month={month} onMonth={setMonth} avansYoqiq={avansYoqiq}
                onGoAvans={() => setBolim("avans")} />
            )}
            {bolim === "xodimlar" && oylikKoradi && <StaffSalaries />}
            {bolim === "avans" && avansYoqiq && (
              <AvansTab onOylikgaOt={(m) => { setMonth(m); setBolim("oylik"); }} />
            )}
          </TabPanel>
        </main>
      </div>

      <AcceptPaymentModal open={showPay} onClose={() => setShowPay(false)} />
      <ExpenseModal open={showExp} onClose={() => setShowExp(false)} />
    </div>
  );
}

const TONES = {
  green:  { icon: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400", val: "text-emerald-600 dark:text-emerald-400" },
  amber:  { icon: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",       val: "text-amber-600 dark:text-amber-400" },
  red:    { icon: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400",               val: "text-red-600 dark:text-red-400" },
  violet: { icon: "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",   val: "text-violet-600 dark:text-violet-400" },
} as const;

function KpiCard({
  label, value, sub, icon: Icon, tone, loading, onClick, strong, className,
}: {
  label: string; value: number; sub?: string; icon: typeof Wallet; tone: keyof typeof TONES;
  loading?: boolean; onClick?: () => void; strong?: boolean; className?: string;
}) {
  const t = TONES[tone];
  const Tag = onClick ? "button" : "div";
  return (
    <Tag type={onClick ? "button" : undefined} onClick={onClick}
      className={cn("glass-panel border rounded-2xl p-4 text-left min-w-0 transition-all",
        strong ? "border-violet-200 dark:border-violet-500/30 ring-1 ring-violet-500/10" : "border-white/60 dark:border-white/10",
        onClick && "hover:-translate-y-0.5 hover:shadow-md cursor-pointer", className)}>
      <div className="flex items-center gap-2 mb-2">
        <span className={cn("w-8 h-8 rounded-xl flex items-center justify-center", t.icon)}>
          <Icon className="w-4 h-4" />
        </span>
        <span className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400 truncate">{label}</span>
      </div>
      {loading
        ? <Skeleton className="h-6 w-28" />
        : <p className={cn("font-black tabular-nums leading-tight truncate",
            strong ? "text-[16px] sm:text-[22px]" : "text-[15px] sm:text-[19px]",
            strong ? t.val : "text-neutral-900 dark:text-neutral-100")}>{formatCurrency(value)}</p>}
      {sub && <p className="text-[11px] text-neutral-400 mt-1 truncate">{sub}</p>}
    </Tag>
  );
}

/** Formula belgisi (+ − =) — faqat keng ekranda, kartalar orasida. */
function Op({ icon: Icon }: { icon: typeof Plus }) {
  return (
    <div className="hidden xl:flex items-center justify-center">
      <span className="w-7 h-7 rounded-full glass-soft flex items-center justify-center text-neutral-400">
        <Icon className="w-3.5 h-3.5" />
      </span>
    </div>
  );
}

function QuickAction({
  icon: Icon, label, onClick, tone,
}: { icon: typeof Wallet; label: string; onClick: () => void; tone: keyof typeof TONES }) {
  return (
    <button type="button" onClick={onClick}
      className="w-full flex items-center gap-3 px-3 h-11 rounded-xl border border-neutral-200/70 dark:border-white/10
        hover:bg-white/70 dark:hover:bg-white/5 hover:border-indigo-200 transition-colors text-left group">
      <span className={cn("w-7 h-7 rounded-lg flex items-center justify-center", TONES[tone].icon)}>
        <Icon className="w-3.5 h-3.5" />
      </span>
      <span className="flex-1 text-[13px] font-medium text-neutral-800 dark:text-neutral-200">{label}</span>
      <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-indigo-500" />
    </button>
  );
}
