"use client";

import { useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePayments } from "@/lib/hooks/usePayments";
import { useTeachers } from "@/lib/hooks/useTeachers";
import useSWR, { mutate } from "swr";

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

type Tab = "kirim" | "chiqim" | "oylik";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function FinancePage() {
  const [activeTab,    setActiveTab]    = useState<Tab>("kirim");
  const now2 = new Date();
  const defaultPayMonth = `${now2.getFullYear()}-${String(now2.getMonth() + 1).padStart(2, "0")}`;
  const [payMonth, setPayMonth] = useState(defaultPayMonth);
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

  const { data: paymentsRaw, isLoading: paymentsLoading } = usePayments({ month: payMonth });
  const { data: teachersRaw }                             = useTeachers();
  const { data: expensesRaw, isLoading: expensesLoading } = useSWR("/api/expenses", fetcher);
  const { data: salariesRaw, isLoading: salariesLoading, mutate: mutateSalaries } =
    useSWR(`/api/teacher-salaries?month=${salaryMonth}`, fetcher);

  const payments: any[] = Array.isArray(paymentsRaw) ? paymentsRaw : [];
  const teachers: any[] = Array.isArray(teachersRaw) ? teachersRaw : [];
  const expenses: any[] = Array.isArray(expensesRaw) ? expensesRaw : [];
  const salaries: any[] = Array.isArray(salariesRaw) ? salariesRaw : [];

  const totalPayments = payments.reduce((s, p) => s + p.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const profit        = totalPayments - totalExpenses;

  const TABS: { id: Tab; label: string }[] = [
    { id: "kirim",  label: "To'lovlar (kirim)" },
    { id: "chiqim", label: "Xarajatlar (chiqim)" },
    { id: "oylik",  label: "Oylik hisoblash" },
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
          ...(expForm.date ? { date: expForm.date } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setExpErr(data.error ?? "Xatolik"); return; }
      mutate("/api/expenses");
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
        body: JSON.stringify({ month: salaryMonth }),
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
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-500" />
                <h2 className="font-bold text-[15px] text-neutral-900 dark:text-neutral-100">Xarajat qo'shish</h2>
              </div>
              <button onClick={() => setShowExpModal(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <Label className="text-xs font-medium text-neutral-500 mb-1.5 block">Kategoriya</Label>
                <select value={expForm.category}
                  onChange={e => { setExpForm(p => ({...p, category: e.target.value})); setExpErr(""); }}
                  className="w-full h-9 px-3 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none">
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
                  className="w-full h-9 px-3 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none" />
              </div>
              {expErr && (
                <p className="text-[12px] text-red-600 dark:text-red-400 font-medium">{expErr}</p>
              )}
            </div>
            <div className="px-5 pb-5 flex gap-2">
              <Button
                className="flex-1 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 h-10"
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
                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4">
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

        {/* Tabs */}
        <div className="flex gap-0.5 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl w-fit">
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

        {/* To'lovlar */}
        {activeTab === "kirim" && (
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[13px] font-semibold text-neutral-700 dark:text-neutral-300">Oy:</span>
            <input
              type="month"
              value={payMonth}
              onChange={e => setPayMonth(e.target.value)}
              className="h-9 px-3 text-[13px] rounded-xl border border-neutral-200 dark:border-neutral-700
                bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none
                focus:border-neutral-400 transition-colors"
            />
            <span className="text-[12px] text-neutral-400">{payments.length} ta to'lov</span>
            <span className="ml-auto text-[13px] font-bold text-green-600 dark:text-green-400">
              Jami: {formatCurrency(totalPayments)}
            </span>
          </div>
        )}
        {activeTab === "kirim" && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
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
                <TableRow className="bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-50 dark:hover:bg-neutral-800/60">
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
                      <TableRow key={p.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
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
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
              <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">Xarajatlar ({expenses.length} ta)</p>
              <button onClick={() => { setExpErr(""); setExpForm({ category: "", description: "", amount: "", date: "" }); setShowExpModal(true); }}
                className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Xarajat qo'shish
              </button>
            </div>
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-50 dark:hover:bg-neutral-800/60">
                  <TableHead className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Kategoriya</TableHead>
                  <TableHead className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Tavsif</TableHead>
                  <TableHead className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Sana</TableHead>
                  <TableHead className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider text-right">Summa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((e: any) => (
                  <TableRow key={e.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
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
              <div className="py-12 text-center text-sm text-neutral-400">Hali xarajat yo'q</div>
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
                  className="h-9 px-3 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700
                    bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none"
                />
              </div>
              <button
                onClick={generateSalaries}
                disabled={generating}
                className="flex items-center gap-2 h-9 px-4 rounded-xl bg-neutral-900 dark:bg-neutral-100
                  text-white dark:text-neutral-900 text-[13px] font-semibold hover:opacity-80 transition-opacity disabled:opacity-50">
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
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4">
                  <p className="text-[11px] text-neutral-400 mb-1">Jami o'qituvchilar</p>
                  <p className="text-[20px] font-black text-neutral-900 dark:text-neutral-100">{salaries.length}</p>
                </div>
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4">
                  <p className="text-[11px] text-neutral-400 mb-1">Jami oylik</p>
                  <p className="text-[20px] font-black text-violet-600 dark:text-violet-400">
                    {formatCurrency(salaries.reduce((s: number, r: any) => s + r.calculatedSalary, 0))}
                  </p>
                </div>
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4">
                  <p className="text-[11px] text-neutral-400 mb-1">To'langan</p>
                  <p className="text-[20px] font-black text-emerald-600 dark:text-emerald-400">
                    {salaries.filter((r: any) => r.status === "PAID").length} / {salaries.length}
                  </p>
                </div>
              </div>
            )}

            {/* Salary table */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
                <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
                  O'qituvchilar oylik hisobi — {salaryMonth}
                </p>
                <span className="text-[11px] text-neutral-400">{salaries.length} ta o'qituvchi</span>
              </div>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-50 dark:hover:bg-neutral-800/60">
                    <TableHead className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">O'qituvchi</TableHead>
                    <TableHead className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Turi</TableHead>
                    <TableHead className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider text-right">Yig'ilgan</TableHead>
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
                        <TableRow key={s.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
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
                            {s.teacher?.salaryType === "FIXED" ? (
                              <span className="text-[11px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
                                Belgilangan
                              </span>
                            ) : (
                              <span className="text-[11px] bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 px-2 py-0.5 rounded-full font-medium">
                                Foizli — {s.teacher?.salary}%
                              </span>
                            )}
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
                      bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:opacity-80 transition-opacity">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Oylikni hisoblash
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
