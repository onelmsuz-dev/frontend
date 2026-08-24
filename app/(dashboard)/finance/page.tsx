"use client";

import { useState, useEffect } from "react";
import { TopHeader } from "@/components/layout/top-header";
import { AcceptPaymentModal } from "@/components/finance/accept-payment-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  TrendingUp, TrendingDown, Wallet, Sparkles,
  Plus, X, CheckCircle, Clock, RefreshCw, BadgeCheck,
  AlertTriangle, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FinanceInsights } from "@/components/finance/finance-insights";
import Link from "next/link";
import { salaryDisplay, salaryTypeLabel } from "@/lib/salary";
import { usePayments } from "@/lib/hooks/usePayments";
import { useTeachers } from "@/lib/hooks/useTeachers";
import { useGroups } from "@/lib/hooks/useGroups";
import { useStudents } from "@/lib/hooks/useStudents";
import useSWR, { mutate } from "swr";
import { useBranch, useBranchQueryString } from "@/lib/contexts/branch-context";

function formatCurrency(v: number) {
  return new Intl.NumberFormat("uz-UZ", { style: "currency", currency: "UZS", maximumFractionDigits: 0 }).format(v);
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded-xl", className)} />;
}

const METHOD_LABELS: Record<string, string> = { NAQD: "Naqd", KARTA: "Karta", CLICK: "Click", PAYME: "Payme" };
const METHOD_COLORS: Record<string, string> = {
  NAQD:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  KARTA: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  CLICK: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  PAYME: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

type Tab = "kirim" | "chiqim" | "oylik" | "qarzdorlar";

const fetcher = (url: string) => fetch(url).then(r => r.json());

/** Filtr maydonlari uchun umumiy ko'rinish. */
const FILTER_CLS =
  "h-9 px-3 text-[13px] rounded-xl border border-white/60 dark:border-white/10 " +
  "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none " +
  "focus:border-neutral-400 transition-colors";

export default function FinancePage() {
  const [activeTab,    setActiveTab]    = useState<Tab>("kirim");

  // Dashboard'dagi "Qarzdorlar" ogohlantirishidan ?tab=qarzdorlar bilan kelishi
  // mumkin — SSR/hydration nomuvofiqligidan qochish uchun faqat client'da,
  // mount'dan keyin o'qiladi (boshlang'ich render doim "kirim").
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("tab");
    if (q === "qarzdorlar") setActiveTab("qarzdorlar");
  }, []);
  const now2 = new Date();
  const defaultPayMonth = `${now2.getFullYear()}-${String(now2.getMonth() + 1).padStart(2, "0")}`;
  const [payMonth, setPayMonth] = useState(defaultPayMonth);
  // To'lovlar filtri: guruh / aniq sana / to'lov usuli
  const [payGroupId, setPayGroupId] = useState("");
  const [payDate,    setPayDate]    = useState("");
  const [payMethod,  setPayMethod]  = useState("");
  const [showPayModal,  setShowPayModal]  = useState(false);

  // Xarajat
  const [showExpModal, setShowExpModal] = useState(false);
  const [expForm,      setExpForm]      = useState({ category: "", description: "", amount: "", date: "" });
  const [expErr,       setExpErr]       = useState("");
  const [expSaving,    setExpSaving]    = useState(false);

  // Oylik
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [salaryMonth,   setSalaryMonth]   = useState(defaultMonth);
  const [generating,    setGenerating]    = useState(false);
  const [payingId,      setPayingId]      = useState<string | null>(null);
  const [salaryErr,     setSalaryErr]     = useState("");

  // Qarzdorlar
  const [payForStudent, setPayForStudent] = useState<any>(null);
  const [chargingDues,  setChargingDues]  = useState(false);
  const [chargeMsg,     setChargeMsg]     = useState("");

  const { activeBranchId } = useBranch();
  const { data: paymentsRaw, isLoading: paymentsLoading } = usePayments({
    month:   payDate ? undefined : payMonth,   // aniq sana tanlansa oy shart emas
    date:    payDate || undefined,
    groupId: payGroupId || undefined,
    method:  payMethod || undefined,
  });
  const { data: groupsRaw } = useGroups();
  const groupOptions: { id: string; name: string }[] = Array.isArray(groupsRaw) ? groupsRaw : [];
  const { data: teachersRaw }                             = useTeachers();
  // Xarajat ham to'lov bilan BIR XIL qamrovda bo'lishi shart: o'sha oy va
  // o'sha filial. Ilgari butun tarix, barcha filiallar bo'yicha olinardi va
  // "Sof foyda" bir oylik tushumdan hamma vaqtdagi xarajatni ayirardi.
  const expensesQs = useBranchQueryString({ month: payMonth });
  const { data: expensesRaw, isLoading: expensesLoading } =
    useSWR(`/api/expenses${expensesQs}`, fetcher);
  const { data: studentsRaw, isLoading: studentsLoading } = useStudents();
  // Oylik ham aktiv filial bo'yicha — yonidagi "To'lovlar" tabi allaqachon
  // filialga bog'langan, oylik esa butun markazni ko'rsatib turardi.
  const salaryQs = useBranchQueryString({ month: salaryMonth });
  const { data: salariesRaw, isLoading: salariesLoading, mutate: mutateSalaries } =
    useSWR(`/api/teacher-salaries${salaryQs}`, fetcher);

  const payments: any[] = Array.isArray(paymentsRaw) ? paymentsRaw : [];
  const teachers: any[] = Array.isArray(teachersRaw) ? teachersRaw : [];
  const expenses: any[] = Array.isArray(expensesRaw) ? expensesRaw : [];
  const salaries: any[] = Array.isArray(salariesRaw) ? salariesRaw : [];
  const allStudents: any[] = Array.isArray(studentsRaw) ? studentsRaw : [];

  // Qarzdor = balans manfiy va guruhdan chiqib ketmagan (sinovdagilar 0 balans bilan qarzdor emas)
  const debtors = allStudents
    .filter(s => s.balance < 0 && s.groups?.[0]?.enrollmentStatus !== "CHIQIB_KETGAN")
    .sort((a, b) => a.balance - b.balance);
  const totalDebt = debtors.reduce((sum, s) => sum + Math.abs(s.balance), 0);

  const totalPayments = payments.reduce((s, p) => s + p.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const profit        = totalPayments - totalExpenses;

  const TABS: { id: Tab; label: string }[] = [
    { id: "kirim",      label: "To'lovlar (kirim)" },
    { id: "chiqim",     label: "Xarajatlar (chiqim)" },
    { id: "oylik",      label: "Oylik hisoblash" },
    { id: "qarzdorlar", label: `Qarzdorlar${debtors.length ? ` (${debtors.length})` : ""}` },
  ];

  async function submitExpense() {
    if (!expForm.category.trim() || !expForm.description.trim() || !expForm.amount) {
      setExpErr("Barcha maydonlarni to'ldiring"); return;
    }
    const amount = parseFloat(expForm.amount);
    if (isNaN(amount) || amount <= 0) { setExpErr("Summa to'g'ri kiriting"); return; }

    setExpSaving(true); setExpErr("");
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category:    expForm.category.trim(),
          description: expForm.description.trim(),
          amount,
          // Sarlavhada tanlangan filial — aks holda yozuv egasining "uy"
          // filialiga tushib, boshqa filial hisobotini buzardi.
          ...(activeBranchId ? { branchId: activeBranchId } : {}),
          ...(expForm.date ? { date: expForm.date } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setExpErr(data.error ?? "Xatolik"); return; }
      mutate((k: string) => typeof k === "string" && k.startsWith("/api/expenses"));
      mutate("/api/reports");
      setShowExpModal(false);
      setExpForm({ category: "", description: "", amount: "", date: "" });
    } catch { setExpErr("Serverga ulanib bo'lmadi"); }
    finally { setExpSaving(false); }
  }

  async function generateSalaries() {
    setGenerating(true); setSalaryErr("");
    try {
      const res  = await fetch("/api/teacher-salaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: salaryMonth,
          ...(activeBranchId ? { branchId: activeBranchId } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setSalaryErr(data.error ?? "Xatolik"); return; }
      mutateSalaries();
    } catch { setSalaryErr("Serverga ulanib bo'lmadi"); }
    finally { setGenerating(false); }
  }

  async function markAsPaid(id: string) {
    setPayingId(id); setSalaryErr("");
    try {
      const res  = await fetch(`/api/teacher-salaries/${id}`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) { setSalaryErr(data.error ?? "Xatolik"); return; }
      mutateSalaries();
    } catch { setSalaryErr("Serverga ulanib bo'lmadi"); }
    finally { setPayingId(null); }
  }

  /**
   * Joriy oy uchun faol o'quvchilarga kurs to'lovini qo'lda hisoblash.
   * Tizim buni har kuni birinchi dashboard yuklanganda avtomatik ham qiladi —
   * bu tugma faqat darhol/qo'lda tekshirish uchun (qayta bosish xavfsiz).
   */
  async function chargeMonthlyDues() {
    setChargingDues(true); setChargeMsg("");
    try {
      const res = await fetch("/api/student-groups/charge-monthly", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setChargeMsg(data.error ?? "Xatolik"); return; }
      setChargeMsg(
        data.alreadyRunning
          ? "Hisoblash hozir ishlamoqda — bir necha soniyadan so'ng yangilang"
          : data.charged > 0
            ? `${data.charged} ta o'quvchiga ${data.month} oyi uchun to'lov yozildi`
            : "Barcha o'quvchilar allaqachon shu oy uchun hisoblangan",
      );
      mutate((k: string) => typeof k === "string" && k.startsWith("/api/students"), undefined, { revalidate: true });
    } catch { setChargeMsg("Serverga ulanib bo'lmadi"); }
    finally { setChargingDues(false); }
  }

  return (
    <div>
      <TopHeader
        title="Moliya"
        subtitle={`${new Date().toLocaleString("uz-UZ", { month: "long", year: "numeric" })} — moliyaviy hisobot`}
        action={{ label: "To'lov qabul qilish", onClick: () => setShowPayModal(true) }}
      />

      <AcceptPaymentModal open={showPayModal} onClose={() => setShowPayModal(false)} />

      {/* Expense modal */}
      {showExpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && setShowExpModal(false)}>
          <div className="glass-strong rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/50 dark:border-white/10">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-500" />
                <h2 className="font-bold text-[15px] text-neutral-900 dark:text-neutral-100">Xarajat qo'shish</h2>
              </div>
              <button onClick={() => setShowExpModal(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/60 dark:hover:bg-white/10 text-neutral-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <Label className="text-xs font-medium text-neutral-500 mb-1.5 block">Kategoriya</Label>
                <select value={expForm.category}
                  onChange={e => { setExpForm(p => ({...p, category: e.target.value})); setExpErr(""); }}
                  className="w-full h-9 px-3 text-sm rounded-lg border border-white/60 dark:border-white/10 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none">
                  <option value="">Kategoriyani tanlang...</option>
                  {["Ijara", "Kommunal", "Maosh", "Reklama", "Ta'mirlash", "Jihozlar", "Maktab buyumlari", "Boshqa"].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs font-medium text-neutral-500 mb-1.5 block">Tavsif</Label>
                <Input placeholder="Masalan: Iyul oyi ijara to'lovi" value={expForm.description}
                  onChange={e => { setExpForm(p => ({...p, description: e.target.value})); setExpErr(""); }}
                  className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs font-medium text-neutral-500 mb-1.5 block">Summa (so'm)</Label>
                <Input type="number" placeholder="1 000 000" value={expForm.amount}
                  onChange={e => { setExpForm(p => ({...p, amount: e.target.value})); setExpErr(""); }}
                  className="h-9 text-sm" min="0" />
              </div>
              <div>
                <Label className="text-xs font-medium text-neutral-500 mb-1.5 block">Sana (ixtiyoriy)</Label>
                <input type="date" value={expForm.date}
                  onChange={e => setExpForm(p => ({...p, date: e.target.value}))}
                  className="w-full h-9 px-3 text-sm rounded-lg border border-white/60 dark:border-white/10 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none" />
              </div>
              {expErr && (
                <p className="text-[12px] text-red-600 dark:text-red-400 font-medium">{expErr}</p>
              )}
            </div>
            <div className="px-5 pb-5 flex gap-2">
              <Button
 className="flex-1 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 h-10"
                disabled={expSaving} onClick={submitExpense}>
                {expSaving ? "Saqlanmoqda..." : "Qo'shish"}
              </Button>
              <Button variant="outline" className="h-10 px-4" onClick={() => setShowExpModal(false)}>Bekor</Button>
            </div>
          </div>
        </div>
      )}

      <div className="p-5 space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Jami tushum",       value: formatCurrency(totalPayments), icon: TrendingUp,  bg: "bg-emerald-50 dark:bg-emerald-950/40",  text: "text-emerald-600 dark:text-emerald-400" },
            { label: "Xarajatlar",        value: formatCurrency(totalExpenses), icon: TrendingDown, bg: "bg-red-50 dark:bg-red-950/40",           text: "text-red-600 dark:text-red-400" },
            { label: "Sof foyda",         value: formatCurrency(profit),        icon: Sparkles,    bg: "bg-violet-50 dark:bg-violet-950/40",     text: "text-violet-600 dark:text-violet-400" },
            { label: "To'lovlar soni",    value: payments.length,               icon: Wallet,      bg: "bg-blue-50 dark:bg-blue-950/40",         text: "text-blue-600 dark:text-blue-400" },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label}
                className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-4">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", s.bg)}>
                  <Icon className={cn("w-4.5 h-4.5", s.text)} />
                </div>
                {paymentsLoading
                  ? <Skeleton className="h-5 w-24 mb-1" />
                  : <p className="text-[18px] font-black text-neutral-900 dark:text-neutral-100 leading-none">{s.value}</p>
                }
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Tahlil — yig'ilish darajasi, qarzdorlar, to'lov usullari */}
        <FinanceInsights />

        {/* Tabs */}
        <div className="flex gap-0.5 glass-soft p-1 rounded-xl w-fit">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-neutral-100"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              )}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* To'lovlar — filtrlar */}
        {activeTab === "kirim" && (
          <div className="flex flex-wrap items-center gap-2.5 mb-4">
            <label className="text-[13px] font-semibold text-neutral-700 dark:text-neutral-300">Oy:</label>
            <input
              type="month"
              value={payMonth}
              disabled={!!payDate}
              onChange={e => setPayMonth(e.target.value)}
              className={cn(FILTER_CLS, payDate && "opacity-50 cursor-not-allowed")}
            />

            <label className="text-[13px] font-semibold text-neutral-700 dark:text-neutral-300 ml-1">Sana:</label>
            <input
              type="date"
              value={payDate}
              onChange={e => setPayDate(e.target.value)}
              className={FILTER_CLS}
            />

            <select
              value={payGroupId}
              onChange={e => setPayGroupId(e.target.value)}
              className={FILTER_CLS}
            >
              <option value="">Barcha guruhlar</option>
              {groupOptions.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>

            <select
              value={payMethod}
              onChange={e => setPayMethod(e.target.value)}
              className={FILTER_CLS}
            >
              <option value="">Barcha usullar</option>
              {Object.entries(METHOD_LABELS).map(([m, label]) => (
                <option key={m} value={m}>{label}</option>
              ))}
            </select>

            {(payDate || payGroupId || payMethod) && (
              <button
                onClick={() => { setPayDate(""); setPayGroupId(""); setPayMethod(""); }}
                className="h-9 px-3 text-[12px] font-semibold rounded-xl text-neutral-500
                  hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-white/60
                  dark:hover:bg-white/10 transition-colors"
              >
                Tozalash
              </button>
            )}

            <span className="text-[12px] text-neutral-400">{payments.length} ta to'lov</span>
            <span className="ml-auto text-[13px] font-bold text-green-600 dark:text-green-400">
              Jami: {formatCurrency(totalPayments)}
            </span>
          </div>
        )}
        {activeTab === "kirim" && (
          <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/50 dark:border-white/10">
              <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
                To'lovlar tarixi ({payments.length} ta)
              </p>
              <div className="flex gap-1.5">
                {Object.entries(METHOD_COLORS).map(([m, cls]) => (
                  <span key={m} className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", cls)}>{METHOD_LABELS[m]}</span>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="glass-soft hover:bg-white/60 dark:hover:bg-white/10">
                  <TableHead className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">O'quvchi</TableHead>
                  <TableHead className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Guruh</TableHead>
                  <TableHead className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Sana</TableHead>
                  <TableHead className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Usul</TableHead>
                  <TableHead className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider text-right">Summa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentsLoading
                  ? Array.from({length: 5}).map((_,i) => (
                      <TableRow key={i}>
                        <TableCell><div className="flex items-center gap-2.5"><Skeleton className="w-8 h-8 rounded-xl shrink-0" /><Skeleton className="h-3 w-24" /></div></TableCell>
                        <TableCell><Skeleton className="h-3 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-3 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-12 rounded-full" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-3 w-20 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  : payments.map((p: any) => (
                      <TableRow key={p.id} className="hover:bg-white/60 dark:hover:bg-white/10 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center text-emerald-700 dark:text-emerald-400 text-[12px] font-bold shrink-0">
                              {p.student?.name?.[0] ?? "?"}
                            </div>
                            <span className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">{p.student?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-[13px] text-neutral-500 dark:text-neutral-400">{p.group?.name ?? "—"}</TableCell>
                        <TableCell className="text-[13px] text-neutral-500 dark:text-neutral-400">
                          {new Date(p.date).toLocaleDateString("uz-UZ")}
                        </TableCell>
                        <TableCell>
                          <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-medium", METHOD_COLORS[p.method] ?? "bg-neutral-100 text-neutral-600")}>
                            {METHOD_LABELS[p.method] ?? p.method}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(p.amount)}</span>
                        </TableCell>
                      </TableRow>
                    ))
                }
              </TableBody>
            </Table>
            </div>
            {!paymentsLoading && payments.length === 0 && (
              <div className="py-12 text-center text-sm text-neutral-400">Hali to'lov yo'q</div>
            )}
          </div>
        )}

        {/* Xarajatlar */}
        {activeTab === "chiqim" && (
          <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/50 dark:border-white/10">
              <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">Xarajatlar ({expenses.length} ta)</p>
              {/* Asosiy amal — ko'rinadigan (to'ldirilgan) tugma bo'lishi kerak.
                  Ilgari shaffof fonli, och kulrang matnli edi va deyarli
                  bilinmasdi. */}
              <button onClick={() => { setExpErr(""); setExpForm({ category: "", description: "", amount: "", date: "" }); setShowExpModal(true); }}
                className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 h-9 rounded-xl
                  bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-sm
                  transition-colors">
                <Plus className="w-4 h-4" /> Xarajat qo'shish
              </button>
            </div>
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="glass-soft hover:bg-white/60 dark:hover:bg-white/10">
                  <TableHead className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Kategoriya</TableHead>
                  <TableHead className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Tavsif</TableHead>
                  <TableHead className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Sana</TableHead>
                  <TableHead className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider text-right">Summa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((e: any) => (
                  <TableRow key={e.id} className="hover:bg-white/60 dark:hover:bg-white/10 transition-colors">
                    <TableCell>
                      <span className="text-[11px] bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 px-2.5 py-1 rounded-lg font-medium">
                        {e.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-[13px] text-neutral-700 dark:text-neutral-300">{e.description}</TableCell>
                    <TableCell className="text-[13px] text-neutral-500 dark:text-neutral-400">
                      {new Date(e.date).toLocaleDateString("uz-UZ")}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-[13px] font-bold text-red-600 dark:text-red-400">-{formatCurrency(e.amount)}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
            {!expensesLoading && expenses.length === 0 && (
              <div className="py-12 flex flex-col items-center gap-3">
                <p className="text-sm text-neutral-400">Bu oyda xarajat yozilmagan</p>
                <button onClick={() => { setExpErr(""); setExpForm({ category: "", description: "", amount: "", date: "" }); setShowExpModal(true); }}
                  className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 h-9 rounded-xl
                    bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-sm
                    transition-colors">
                  <Plus className="w-4 h-4" /> Xarajat qo'shish
                </button>
              </div>
            )}
          </div>
        )}

        {/* Oylik */}
        {activeTab === "oylik" && (
          <div className="space-y-4">
            {/* Month picker + generate */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-[12px] font-semibold text-neutral-500 dark:text-neutral-400">Oy:</label>
                <input
                  type="month"
                  value={salaryMonth}
                  onChange={e => setSalaryMonth(e.target.value)}
                  className="h-9 px-3 text-sm rounded-xl border border-white/60 dark:border-white/10
                    bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none"
                />
              </div>
              <button
                onClick={generateSalaries}
                disabled={generating}
                className="flex items-center gap-2 h-9 px-4 rounded-xl bg-indigo-600 dark:bg-indigo-500
                  text-white text-[13px] font-semibold hover:opacity-80 transition-opacity disabled:opacity-50">
                <RefreshCw className={cn("w-3.5 h-3.5", generating && "animate-spin")} />
                {generating ? "Hisoblanmoqda..." : "Oylikni hisoblash"}
              </button>
              {salaryErr && (
                <span className="text-[12px] text-red-500 font-medium">{salaryErr}</span>
              )}
            </div>

            {/* Summary cards */}
            {salaries.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-4">
                  <p className="text-[11px] text-neutral-400 mb-1">Jami o'qituvchilar</p>
                  <p className="text-[20px] font-black text-neutral-900 dark:text-neutral-100">{salaries.length}</p>
                </div>
                <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-4">
                  <p className="text-[11px] text-neutral-400 mb-1">Jami oylik</p>
                  <p className="text-[20px] font-black text-violet-600 dark:text-violet-400">
                    {formatCurrency(salaries.reduce((s: number, r: any) => s + r.calculatedSalary, 0))}
                  </p>
                </div>
                <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-4">
                  <p className="text-[11px] text-neutral-400 mb-1">To'langan</p>
                  <p className="text-[20px] font-black text-emerald-600 dark:text-emerald-400">
                    {salaries.filter((r: any) => r.status === "PAID").length} / {salaries.length}
                  </p>
                </div>
              </div>
            )}

            {/* Salary table */}
            <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/50 dark:border-white/10">
                <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
                  O'qituvchilar oylik hisobi — {salaryMonth}
                </p>
                <span className="text-[11px] text-neutral-400">{salaries.length} ta o'qituvchi</span>
              </div>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="glass-soft hover:bg-white/60 dark:hover:bg-white/10">
                    <TableHead className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">O'qituvchi</TableHead>
                    <TableHead className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Turi</TableHead>
                    <TableHead className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider text-right" title="Faqat shu oyga tegishli tushum — oldindan to'langan ortiqcha summa keyingi oyga o'tadi">Yig'ilgan (shu oy)</TableHead>
                    <TableHead className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider text-right">Hisoblangan</TableHead>
                    <TableHead className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider text-center">Holat</TableHead>
                    <TableHead className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider text-right">Amal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salariesLoading
                    ? Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><div className="flex items-center gap-2.5"><Skeleton className="w-9 h-9 shrink-0" /><Skeleton className="h-3 w-28" /></div></TableCell>
                          <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-3 w-20 ml-auto" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-3 w-24 ml-auto" /></TableCell>
                          <TableCell className="text-center"><Skeleton className="h-5 w-20 rounded-lg mx-auto" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-7 w-20 ml-auto rounded-lg" /></TableCell>
                        </TableRow>
                      ))
                    : salaries.map((s: any) => (
                        <TableRow key={s.id} className="hover:bg-white/60 dark:hover:bg-white/10 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 bg-gradient-to-br from-violet-400 to-blue-500 rounded-xl flex items-center justify-center text-white text-[13px] font-bold shrink-0">
                                {s.teacher?.user?.name?.[0] ?? "?"}
                              </div>
                              <div>
                                <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">{s.teacher?.user?.name}</p>
                                <p className="text-[11px] text-neutral-400">{s.teacher?.user?.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-[11px] bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 px-2 py-0.5 rounded-full font-medium">
                              {salaryTypeLabel(s.teacher?.salaryType)} — {salaryDisplay(s.teacher?.salaryType, s.teacher?.salary ?? 0)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-[13px] font-semibold text-neutral-700 dark:text-neutral-300">
                              {formatCurrency(s.totalCollected)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-[14px] font-black text-neutral-900 dark:text-neutral-100">
                              {formatCurrency(s.calculatedSalary)}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            {s.status === "PAID" ? (
                              <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-lg font-medium">
                                <CheckCircle className="w-3 h-3" /> To'landi
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-lg font-medium">
                                <Clock className="w-3 h-3" /> Kutilmoqda
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {s.status !== "PAID" && (
                              <button
                                onClick={() => markAsPaid(s.id)}
                                disabled={payingId === s.id}
                                className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg
                                  bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50">
                                <BadgeCheck className="w-3 h-3" />
                                {payingId === s.id ? "..." : "To'landi"}
                              </button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                  }
                </TableBody>
              </Table>
              </div>
              {!salariesLoading && salaries.length === 0 && (
                <div className="py-14 text-center">
                  <p className="text-sm text-neutral-400 mb-3">Bu oy uchun oylik hisoblanmagan</p>
                  <button
                    onClick={generateSalaries}
                    disabled={generating}
                    className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-4 py-2 rounded-xl
                      bg-indigo-600 text-white dark:bg-indigo-500 hover:opacity-80 transition-opacity">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Oylikni hisoblash
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Qarzdorlar */}
        {activeTab === "qarzdorlar" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40">
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-[13px] font-semibold text-red-700 dark:text-red-400">
                  {debtors.length} ta o'quvchi qarzdor
                </span>
              </div>
              <span className="text-[13px] font-bold text-red-600 dark:text-red-400">
                Jami qarz: {formatCurrency(totalDebt)}
              </span>
              <button onClick={chargeMonthlyDues} disabled={chargingDues}
                className="ml-auto inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-xl border border-white/60 dark:border-white/10 text-neutral-600 dark:text-neutral-300 hover:bg-white/60 dark:hover:bg-white/10 transition-colors disabled:opacity-50">
                <RefreshCw className={cn("w-3.5 h-3.5", chargingDues && "animate-spin")} />
                {chargingDues ? "Hisoblanmoqda..." : "Oylik to'lovni hisoblash"}
              </button>
            </div>
            {chargeMsg && (
              <p className="text-[12px] text-neutral-500 dark:text-neutral-400 -mt-2">{chargeMsg}</p>
            )}
            <p className="text-[11px] text-neutral-400 -mt-2">
              Tizim buni har oy avtomatik ham bajaradi (birinchi kirishda) — bu tugma darhol tekshirish uchun.
            </p>

            <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="glass-soft hover:bg-white/60 dark:hover:bg-white/10">
                      <TableHead className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">O'quvchi</TableHead>
                      <TableHead className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Guruh</TableHead>
                      <TableHead className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">O'qituvchi</TableHead>
                      <TableHead className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Qarz summasi</TableHead>
                      <TableHead className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentsLoading
                      ? Array.from({ length: 4 }).map((_, i) => (
                          <TableRow key={i}>
                            {Array.from({ length: 5 }).map((_, j) => (
                              <TableCell key={j}><Skeleton className="h-3 w-full" /></TableCell>
                            ))}
                          </TableRow>
                        ))
                      : debtors.map(s => {
                          const sg = s.groups?.[0];
                          return (
                            <TableRow key={s.id} className="hover:bg-white/60 dark:hover:bg-white/10 transition-colors">
                              <TableCell>
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-400 to-orange-400 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                                    {s.name?.[0]}
                                  </div>
                                  <div>
                                    <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">{s.name}</p>
                                    <p className="text-[11px] text-neutral-400">{s.phone}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-[13px] text-neutral-700 dark:text-neutral-300">{sg?.group?.name ?? "—"}</span>
                              </TableCell>
                              <TableCell>
                                <span className="text-[13px] text-neutral-500 dark:text-neutral-400">{sg?.group?.teacher?.user?.name ?? "—"}</span>
                              </TableCell>
                              <TableCell>
                                <span className="text-[13px] font-bold text-red-600 dark:text-red-400">{formatCurrency(Math.abs(s.balance))}</span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-end gap-1">
                                  <button onClick={() => setPayForStudent(s)}
                                    className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors">
                                    To'lov qabul qilish
                                  </button>
                                  <Link href={`/students/${s.id}`}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </Link>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                    }
                  </TableBody>
                </Table>
              </div>
              {!studentsLoading && debtors.length === 0 && (
                <div className="py-14 text-center">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400 opacity-60" />
                  <p className="text-sm text-neutral-400">Hech kim qarzdor emas</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <AcceptPaymentModal
        open={!!payForStudent}
        onClose={() => setPayForStudent(null)}
        defaultStudentId={payForStudent?.id}
      />
    </div>
  );
}
