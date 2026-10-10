"use client";

import { useState, useEffect, useMemo } from "react";
import { TopHeader } from "@/components/layout/top-header";
import { AcceptPaymentModal } from "@/components/finance/accept-payment-modal";
import { MaterialsReport } from "@/components/finance/materials-report";
import { ReceiptModal } from "@/components/payments/receipt-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  TrendingUp, TrendingDown, Wallet, Sparkles,
  Plus, X, CheckCircle, Clock, RefreshCw, BadgeCheck,
  AlertTriangle, ChevronRight, ReceiptText, Tags, Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PAYMENT_METHODS, SELECTABLE_METHODS, methodShort, methodCls,
} from "@/lib/payment-methods";
import { FinanceInsights } from "@/components/finance/finance-insights";
import { ExpenseCategoriesModal } from "@/components/finance/expense-categories-modal";
import Link from "next/link";
import { salaryDisplay, salaryTypeLabel } from "@/lib/salary";
import { usePayments } from "@/lib/hooks/usePayments";
import { useTeachers } from "@/lib/hooks/useTeachers";
import { useGroups } from "@/lib/hooks/useGroups";
import { useStudents } from "@/lib/hooks/useStudents";
import useSWR, { mutate } from "swr";
import { useBranch, useBranchQueryString } from "@/lib/contexts/branch-context";
import { BranchFilter, BranchPicker } from "@/components/layout/branch-filter";
import { fmtMonthYear, formatUzDate } from "@/lib/date-uz";
import { formatCurrency } from "@/lib/money";
import { TabGlide, TabPanel, segCls } from "@/components/ui/tab-glide";
import { useFeature } from "@/lib/hooks/useFeatures";
import { useMe, hasPerm } from "@/lib/hooks/useMe";
import { useSalaryAdvances, useSalaryAdvanceSummary } from "@/lib/hooks/useSalaryAdvances";
import { AvansTab } from "@/components/salary-advance/avans-tab";
import { TolandiOyna } from "@/components/salary-advance/tolandi-oyna";
import { StaffSalaries } from "@/components/staff/staff-salaries";
import { OyNomi, sanaQisqa, type AvansBandi, type OylikQatori } from "@/lib/salary-advance";
import { YopilmaganYuklab } from "@/components/salary-advance/yopilmagan";
import { MaoshEslatma } from "@/components/salary-advance/maosh-eslatma";


function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded-xl", className)} />;
}


type Tab = "kirim" | "chiqim" | "materiallar" | "avans" | "oylik" | "qarzdorlar";

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
  // Chek — to'lovlar tarixidagi har bir qatordan ochiladi.
  const [chekId, setChekId] = useState<string | null>(null);

  // Xarajat
  const [showExpModal, setShowExpModal] = useState(false);
  const [expForm,      setExpForm]      = useState({ category: "", description: "", amount: "", date: "", branchId: "" });
  const [expErr,       setExpErr]       = useState("");
  const [expSaving,    setExpSaving]    = useState(false);

  // XARAJAT FILTRI — faqat RO'YXAT uchun.
  //
  // Yuqoridagi "Xarajatlar" va "Sof foyda" kartalari ALOHIDA so'rovdan
  // oziqlanadi va oy+filial qamrovida qoladi. Aks holda kategoriya
  // tanlangan zahoti "Sof foyda" o'sha kategoriyaga qarab o'zgarib
  // ketardi — ya'ni filtr hisobotni buzardi.
  const [expCat,   setExpCat]   = useState("");
  const [expFrom,  setExpFrom]  = useState("");
  const [expTo,    setExpTo]    = useState("");
  const [expMonth, setExpMonth] = useState(defaultPayMonth);
  const [showCatModal, setShowCatModal] = useState(false);

  // Oylik
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [salaryMonth,   setSalaryMonth]   = useState(defaultMonth);
  const [generating,    setGenerating]    = useState(false);
  const [payingId,      setPayingId]      = useState<string | null>(null);
  const [salaryErr,     setSalaryErr]     = useState("");
  const [salaryMsg,     setSalaryMsg]     = useState("");
  /** Avansli qator "To'landi" oynasi orqali yopiladi. */
  const [tolash,        setTolash]        = useState<OylikQatori | null>(null);
  /** "Oylik hisoblash": o'qituvchilar yoki xodimlar (buxgalter /xodimlar ga kira olmaydi). */
  const [oylikTur,      setOylikTur]      = useState<"oqituvchi" | "xodim">("oqituvchi");

  // Oylik avansi — bayroq va oylik huquqi bilan.
  const { me } = useMe();
  const oylikKoradi = hasPerm(me?.permissions, "salaries.view");
  const avansYoqiq = useFeature("salary-advance") === true && oylikKoradi;
  const { data: avansRoyxat } = useSalaryAdvances(undefined, avansYoqiq);
  const { data: avansXulosa } = useSalaryAdvanceSummary(salaryMonth, oylikKoradi);

  // Qarzdorlar
  const [payForStudent, setPayForStudent] = useState<any>(null);
  const [chargingDues,  setChargingDues]  = useState(false);
  const [chargeMsg,     setChargeMsg]     = useState("");

  const { activeBranchId, kopFilial } = useBranch();
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

  // FILTRLANGAN RO'YXAT. Aniq sanalar tanlansa oy YUBORILMAYDI —
  // serverda ham oraliq oydan ustun, ikkalasini birga yuborish faqat
  // chalkashtirardi.
  const expListQs = useBranchQueryString({
    month:    expFrom || expTo ? undefined : (expMonth || undefined),
    from:     expFrom || undefined,
    to:       expTo || undefined,
    category: expCat || undefined,
  });
  const { data: expListRaw, isLoading: expListLoading } =
    useSWR(`/api/expenses${expListQs}`, fetcher);
  // Jami ALOHIDA so'raladi: ro'yxat 500 qator bilan cheklangan, ekrandagi
  // yig'indi esa undan ko'p xarajati bor markazda yolg'on bo'lardi.
  const { data: expSum } = useSWR(`/api/expenses/summary${expListQs}`, fetcher);
  const { data: expCatsRaw }   = useSWR("/api/expenses/categories", fetcher);
  const { data: expFilterCats } = useSWR<string[]>("/api/expenses/categories/filter", fetcher);
  const { data: studentsRaw, isLoading: studentsLoading } = useStudents();
  // Oylik ham aktiv filial bo'yicha — yonidagi "To'lovlar" tabi allaqachon
  // filialga bog'langan, oylik esa butun markazni ko'rsatib turardi.
  const salaryQs = useBranchQueryString({ month: salaryMonth });
  const { data: salariesRaw, isLoading: salariesLoading, mutate: mutateSalaries } =
    useSWR(`/api/teacher-salaries${salaryQs}`, fetcher);

  const payments: any[] = Array.isArray(paymentsRaw) ? paymentsRaw : [];

  // Filtr variantlari: hamma tanlanadigan usul + shu markazda haqiqatan
  // ishlatilgan eski usullar.
  const filterMethods = useMemo(() => {
    const used = new Set(payments.map((p) => p.method));
    return PAYMENT_METHODS.filter((m) => !m.legacy || used.has(m.value));
  }, [payments]);
  const teachers: any[] = Array.isArray(teachersRaw) ? teachersRaw : [];
  const expenses: any[] = Array.isArray(expensesRaw) ? expensesRaw : [];
  const expList: any[] = Array.isArray(expListRaw) ? expListRaw : [];
  const expCats: any[] = Array.isArray(expCatsRaw) ? expCatsRaw : [];
  const expFiltered = !!(expCat || expFrom || expTo);
  const salaries: any[] = Array.isArray(salariesRaw) ? salariesRaw : [];
  /** Oyda avans bo'lsa jadvalga "Avans" va "Qo'lga" ustunlari qo'shiladi. */
  const avansBor = salaries.some((r) => (r.advanceTotal ?? 0) > 0);
  /** To'langan qatorda — to'lash paytidagi nusxa (keyin qayta hisoblanmaydi). */
  const hisoblanganOf = (r: OylikQatori): number =>
    r.status === "PAID" && r.settledSalary > 0 ? r.settledSalary : r.calculatedSalary;
  // "To'landi" oynasi ro'yxatning JONLI qatoridan oziqlanadi: 409 dan keyin
  // ro'yxat yangilanganda oyna yangi qoldiqni ko'rsatadi.
  const tolashQator = tolash ? (salaries.find((r) => r.id === tolash.id) ?? tolash) : null;
  const joriyOyStr = defaultMonth;
  const [yopilmaganKorin, setYopilmaganKorin] = useState(false);
  const allStudents: any[] = Array.isArray(studentsRaw) ? studentsRaw : [];

  // Qarzdor = balans manfiy va guruhdan chiqib ketmagan (sinovdagilar 0 balans bilan qarzdor emas)
  const debtors = allStudents
    .filter(s => s.balance < 0 && s.groups?.[0]?.enrollmentStatus !== "CHIQIB_KETGAN")
    .sort((a, b) => a.balance - b.balance);
  const totalDebt = debtors.reduce((sum, s) => sum + Math.abs(s.balance), 0);

  const totalPayments = payments.reduce((s, p) => s + p.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  /**
   * QO'SHIMCHA DAROMAD — kitob, forma, sertifikat.
   *
   * "Jami tushum" ga ATAYLAB QO'SHILMAYDI: aralashtirilsa kurs
   * to'lovlarining yig'ilish darajasi buziladi va "rejani bajardikmi"
   * degan savolga javob yolg'on bo'lardi. Alohida karta, lekin SOF
   * FOYDAGA kiradi — u markazga haqiqatan kirgan pul.
   */
  const matQs = useBranchQueryString({ month: payMonth });
  const { data: matRep } = useSWR<{
    total: number; count: number; debt: number;
    byCategory: { category: string; amount: number; count: number }[];
  }>(`/api/materials/report${matQs}`, fetcher);
  const qoshimcha = matRep?.total ?? 0;
  const profit        = totalPayments + qoshimcha - totalExpenses;

  /** Kategoriya ro'yxatini har ikkala joyda (tanlov + filtr) yangilaydi. */
  const refreshCats = () =>
    mutate((k: string) => typeof k === "string" && k.startsWith("/api/expenses"));

  // Avans kuni kelgan va hali berilmaganlar soni — tab nomida.
  const avansKutmoqda = (() => {
    const d = avansRoyxat;
    if (!d || !d.sozlama.enabled || d.month !== d.joriyOy || d.bugun < d.avansKuni) return 0;
    return d.rows.filter((r) => r.advanceRemaining > 0 && r.salaryStatus !== "PAID" && r.faol).length;
  })();

  const TABS: { id: Tab; label: string }[] = [
    { id: "kirim",      label: "To'lovlar (kirim)" },
    { id: "chiqim",     label: "Xarajatlar (chiqim)" },
    { id: "materiallar", label: "Qo'shimcha to'lovlar" },
    ...(avansYoqiq
      ? [{ id: "avans" as Tab, label: `Oylik avansi${avansKutmoqda ? ` (${avansKutmoqda})` : ""}` }] : []),
    // Oylik ro'yxati `salaries.view` so'raydi — ruxsatsiz rolga bo'sh tab ko'rsatilmasin.
    ...(oylikKoradi ? [{ id: "oylik" as Tab, label: "Oylik hisoblash" }] : []),
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
          // Formada tanlangan filial ustun; tanlanmasa sarlavhadagisi.
          // Ikkalasi ham bo'sh bo'lsa xarajat filialsiz qoladi va FAQAT
          // umumiy ko'rinishda sanaladi — filial hisobotini buzmaydi.
          ...(expForm.branchId || activeBranchId
            ? { branchId: expForm.branchId || activeBranchId }
            : {}),
          ...(expForm.date ? { date: expForm.date } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setExpErr(data.error ?? "Xatolik"); return; }
      mutate((k: string) => typeof k === "string" && k.startsWith("/api/expenses"));
      mutate("/api/reports");
      setShowExpModal(false);
      setExpForm({ category: "", description: "", amount: "", date: "", branchId: "" });
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

  /**
   * TO'LANDI. Avansli qator — tasdiq oynasi (qo'lga beriladigan summa).
   * Avanssizida bugungidek bir bosish, lekin ekrandagi summa baribir
   * yuboriladi: shu orada avans yozilgan bo'lsa server 409 qaytaradi.
   */
  async function markAsPaid(s: OylikQatori) {
    if ((s.advanceTotal ?? 0) > 0) { setTolash(s); return; }
    setPayingId(s.id); setSalaryErr(""); setSalaryMsg("");
    try {
      const res  = await fetch(`/api/teacher-salaries/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedRemainder: s.salaryRemainder ?? Math.round(s.calculatedSalary) }),
      });
      const data = await res.json();
      if (!res.ok) { setSalaryErr(data.error ?? "Xatolik"); mutateSalaries(); return; }
      mutateSalaries();
    } catch { setSalaryErr("Serverga ulanib bo'lmadi"); }
    finally { setPayingId(null); }
  }

  /**
   * Joriy oy uchun faol o'quvchilarga kurs to'lovini qo'lda hisoblash.
   * Tizim buni har kuni birinchi dashboard yuklanganda avtomatik ham qiladi —
   * bu tugma faqat darhol/qo'lda tekshirish uchun (qayta bosish xavfsiz).
   */
  const { data: dues, mutate: mutateDues } =
    useSWR<{ month: string; pending: number; amount: number }>(
      "/api/student-groups/dues-status", fetcher);

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
      mutateDues();
    } catch { setChargeMsg("Serverga ulanib bo'lmadi"); }
    finally { setChargingDues(false); }
  }

  return (
    <div>
      <TopHeader
        title="Moliya"
        subtitle={`${fmtMonthYear(new Date())} — moliyaviy hisobot`}
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
                  {/* Ro'yxat MARKAZNIKI — ilgari bu yerda sakkizta qator
                      qattiq yozilgan edi va o'zinikini qo'shib bo'lmasdi. */}
                  {expCats.map((c: any) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <MaoshEslatma category={expForm.category} />
              {kopFilial && (
                <div>
                  <Label className="text-xs font-medium text-neutral-500 mb-1.5 block">Filial</Label>
                  <BranchPicker value={expForm.branchId || activeBranchId || ""}
                    onChange={(v) => setExpForm(p => ({ ...p, branchId: v }))}
                    hammasiLabel="Filialga bog'lanmagan (umumiy)"
                    className="h-9 rounded-lg text-sm" />
                </div>
              )}
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
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2.5">
          {[
            { label: "Jami tushum",       value: formatCurrency(totalPayments), icon: TrendingUp,  bg: "bg-emerald-50 dark:bg-emerald-950/40",  text: "text-emerald-600 dark:text-emerald-400", hint: undefined as string | undefined },
            { label: "Xarajatlar",        value: formatCurrency(totalExpenses), icon: TrendingDown, bg: "bg-red-50 dark:bg-red-950/40",           text: "text-red-600 dark:text-red-400", hint: undefined as string | undefined },
            { label: "Sof foyda",         value: formatCurrency(profit),        icon: Sparkles,    bg: "bg-violet-50 dark:bg-violet-950/40",     text: "text-violet-600 dark:text-violet-400", hint: undefined as string | undefined },
            { label: "Qo'shimcha daromad", value: formatCurrency(qoshimcha),    icon: Package,     bg: "bg-amber-50 dark:bg-amber-950/40",       text: "text-amber-600 dark:text-amber-400",
              hint: matRep?.debt ? `qarz ${formatCurrency(matRep.debt)}` : undefined },
            { label: "To'lovlar soni",    value: payments.length,               icon: Wallet,      bg: "bg-blue-50 dark:bg-blue-950/40",         text: "text-blue-600 dark:text-blue-400", hint: undefined as string | undefined },
          ].map(s => {
            const Icon = s.icon;
            return (
              /* IXCHAM PLITKA (dashboard bilan bir xil): ikonka yonda, raqam va
                 yozuv ikki qatorda. Ilgari ikonka ustida turib, har bir karta
                 ~120px balandlik olardi. */
              <div key={s.label}
                className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl px-3.5 py-3 min-w-0 flex items-center gap-3">
                <div className={cn("hidden sm:flex w-9 h-9 rounded-xl items-center justify-center shrink-0", s.bg)}>
                  <Icon className={cn("w-4.5 h-4.5", s.text)} />
                </div>
                <div className="min-w-0 flex-1">
                  {paymentsLoading
                    ? <Skeleton className="h-5 w-24 mb-1" />
                    : <p className="text-[15px] sm:text-[16px] font-black text-neutral-900 dark:text-neutral-100 leading-tight tabular-nums truncate"
                        title={String(s.value)}>{s.value}</p>
                  }
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
                    {s.label}
                    {s.hint && (
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">{" · "}{s.hint}</span>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tahlil — yig'ilish darajasi, qarzdorlar, to'lov usullari */}
        <FinanceInsights />

        {/* Tabs */}
        {/* Telefonda uchta tab ekrandan keng — sig'masa yon tomonga suriladi
            (ilgari oxirgi tab ekrandan tashqarida qolib, bosib bo'lmasdi). */}
        <TabGlide variant="segment" watch={activeTab} className="flex gap-0.5 glass-soft p-1 rounded-xl w-fit max-w-full overflow-x-auto no-scrollbar">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              data-tab-active={activeTab === tab.id} aria-pressed={activeTab === tab.id}
              className={segCls(activeTab === tab.id, "px-3 sm:px-4 py-1.5 text-sm font-medium")}>
              {tab.label}
            </button>
          ))}
        </TabGlide>

        {/* Tab kontenti — almashganda yengil ko'tarilib ochiladi. */}
        <TabPanel k={activeTab} className="space-y-5">
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

            <BranchFilter className={FILTER_CLS} />

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
              {/* Eski usul (Click/Payme) faqat SHU markazda haqiqatan
                  shunday to'lov bo'lsa ko'rinadi. Doim ko'rsatsak, hech
                  qachon ishlatmagan markazlarga ikkita o'lik variant
                  bo'lardi; umuman yashirsak, eskisi bor markaz o'z
                  to'lovini topa olmasdi. */}
              {filterMethods.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
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
                {/* Afsona faqat TANLANADIGAN usullarni ko'rsatadi —
                    ilgari u rang jadvalining kalitlaridan qurilardi va
                    bazada birorta yozuv bo'lmasa ham "Click"/"Payme"
                    nishonchalari turaverardi. */}
                {SELECTABLE_METHODS.map((m) => (
                  <span key={m.value}
                    className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", m.cls)}>
                    {m.short}
                  </span>
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
                  <TableHead className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider text-right">Chek</TableHead>
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
                        <TableCell className="text-right"><Skeleton className="h-6 w-6 rounded-lg ml-auto" /></TableCell>
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
                          {formatUzDate(p.date)}
                        </TableCell>
                        <TableCell>
                          <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-medium", methodCls(p.method))}>
                            {methodShort(p.method)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {p.amount < 0 ? (
                            <span className="text-[13px] font-bold text-red-600 dark:text-red-400" title="Qaytarilgan to'lov">
                              −{formatCurrency(-p.amount)}
                            </span>
                          ) : (
                            <span className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(p.amount)}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {p.amount > 0 && <button type="button" onClick={() => setChekId(p.id)}
                            title="Chekni ko'rish va chop etish"
                            className="w-7 h-7 inline-flex items-center justify-center rounded-lg
                              text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50
                              dark:hover:bg-indigo-500/10 transition-colors">
                            <ReceiptText className="w-4 h-4" />
                          </button>}
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
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
                  Xarajatlar ({expSum?.count ?? expList.length} ta)
                </p>
                {/* JAMI — filtr nima uchun qo'yilganiga javob. "Reklama shu
                    oyda qancha bo'ldi?" degan savol filtrsiz javobsiz
                    qolardi: ekranda faqat qatorlar bor edi, summa yo'q. */}
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Jami:{" "}
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    {formatCurrency(expSum?.total ?? 0)}
                  </span>
                  {expFiltered && " · filtr bo'yicha"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowCatModal(true)}
                  className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3 h-9 rounded-xl
                    border border-white/60 dark:border-white/10 text-neutral-600 dark:text-neutral-300
                    hover:bg-white/60 dark:hover:bg-white/10 transition-colors">
                  <Tags className="w-4 h-4" /> Kategoriyalar
                </button>
              {/* Asosiy amal — ko'rinadigan (to'ldirilgan) tugma bo'lishi kerak.
                  Ilgari shaffof fonli, och kulrang matnli edi va deyarli
                  bilinmasdi. */}
              <button onClick={() => { setExpErr(""); setExpForm({ category: "", description: "", amount: "", date: "", branchId: "" }); setShowExpModal(true); }}
                className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3.5 h-9 rounded-xl
                  bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-sm
                  transition-colors">
                <Plus className="w-4 h-4" /> Xarajat qo'shish
              </button>
              </div>
            </div>

            {/* ── FILTR ── */}
            <div className="flex flex-wrap items-end gap-2 px-5 py-3 border-b border-white/50 dark:border-white/10">
              {kopFilial && (
                <div className="min-w-[150px]">
                  <Label className="text-[11px] font-medium text-neutral-500 mb-1 block">Filial</Label>
                  <BranchFilter className="w-full h-9 px-2.5 text-[13px] bg-white dark:bg-neutral-800" />
                </div>
              )}
              <div className="min-w-[150px]">
                <Label className="text-[11px] font-medium text-neutral-500 mb-1 block">Kategoriya</Label>
                <select value={expCat} onChange={e => setExpCat(e.target.value)}
                  className="w-full h-9 px-2.5 text-[13px] rounded-lg border border-white/60 dark:border-white/10 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none">
                  <option value="">Hammasi</option>
                  {/* Ro'yxatda O'CHIRILGAN kategoriyalar ham bor — ular
                      bilan yozilgan eski xarajatlarni ajratib ko'rish
                      mumkin bo'lsin. */}
                  {(expFilterCats ?? []).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="min-w-[130px]">
                <Label className="text-[11px] font-medium text-neutral-500 mb-1 block">Oy</Label>
                <input type="month" value={expMonth} disabled={!!(expFrom || expTo)}
                  onChange={e => setExpMonth(e.target.value)}
                  className="w-full h-9 px-2.5 text-[13px] rounded-lg border border-white/60 dark:border-white/10 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none disabled:opacity-50" />
              </div>
              <div className="min-w-[140px]">
                <Label className="text-[11px] font-medium text-neutral-500 mb-1 block">Sanadan</Label>
                <input type="date" value={expFrom} onChange={e => setExpFrom(e.target.value)}
                  className="w-full h-9 px-2.5 text-[13px] rounded-lg border border-white/60 dark:border-white/10 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none" />
              </div>
              <div className="min-w-[140px]">
                <Label className="text-[11px] font-medium text-neutral-500 mb-1 block">Sanagacha</Label>
                <input type="date" value={expTo} onChange={e => setExpTo(e.target.value)}
                  className="w-full h-9 px-2.5 text-[13px] rounded-lg border border-white/60 dark:border-white/10 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none" />
              </div>
              {expFiltered && (
                <button onClick={() => { setExpCat(""); setExpFrom(""); setExpTo(""); }}
                  className="h-9 px-3 rounded-lg text-[12.5px] font-semibold text-neutral-600 dark:text-neutral-300
                    hover:bg-white/60 dark:hover:bg-white/10 transition-colors">
                  Tozalash
                </button>
              )}
              {(expFrom || expTo) && (
                <p className="text-[11px] text-neutral-400 w-full">
                  Sana oralig&apos;i tanlangan — &laquo;Oy&raquo; e&apos;tiborga olinmaydi.
                  Oraliq ikki chetini ham o&apos;z ichiga oladi.
                </p>
              )}
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
                {expList.map((e: any) => (
                  <TableRow key={e.id} className="hover:bg-white/60 dark:hover:bg-white/10 transition-colors">
                    <TableCell>
                      <span className="text-[11px] bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 px-2.5 py-1 rounded-lg font-medium">
                        {e.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-[13px] text-neutral-700 dark:text-neutral-300">{e.description}</TableCell>
                    <TableCell className="text-[13px] text-neutral-500 dark:text-neutral-400">
                      {formatUzDate(e.date)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-[13px] font-bold text-red-600 dark:text-red-400">-{formatCurrency(e.amount)}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
            {!expListLoading && expList.length === 0 && (
              <div className="py-12 flex flex-col items-center gap-3">
                <p className="text-sm text-neutral-400">
                  {expFiltered ? "Bu filtrga mos xarajat yo'q" : "Bu oyda xarajat yozilmagan"}
                </p>
                <button onClick={() => { setExpErr(""); setExpForm({ category: "", description: "", amount: "", date: "", branchId: "" }); setShowExpModal(true); }}
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
        {activeTab === "materiallar" && (
          <MaterialsReport month={payMonth} onMonth={setPayMonth} />
        )}

        {activeTab === "avans" && avansYoqiq && (
          <AvansTab onOylikgaOt={(m) => { setSalaryMonth(m); setOylikTur("oqituvchi"); setActiveTab("oylik"); }} />
        )}

        {activeTab === "oylik" && (
          <div className="space-y-4">
            {/* O'qituvchilar / Xodimlar — buxgalter /xodimlar sahifasiga kira olmaydi
                (u `staff.view` so'raydi), xodim oyligi esa uning ishi. */}
            <TabGlide variant="segment" watch={oylikTur} className="flex gap-0.5 glass-soft p-1 rounded-xl w-fit max-w-full">
              {([["oqituvchi", "O'qituvchilar"], ["xodim", "Xodimlar"]] as const).map(([k, nom]) => (
                <button key={k} onClick={() => setOylikTur(k)} data-oylik-tur={k}
                  data-tab-active={oylikTur === k} aria-pressed={oylikTur === k}
                  className={segCls(oylikTur === k, "px-3 sm:px-4 py-1.5 text-sm font-medium")}>
                  {nom}
                </button>
              ))}
            </TabGlide>

            {/* Avans bannerlari — o'qituvchi ham, xodim ham */}
            {avansXulosa && (avansXulosa.hisoblanmagan > 0 || avansXulosa.tolanmagan.length > 0 || avansXulosa.yopilmagan > 0) && (
              <div className="space-y-2" data-oylik-avans-banner>
                {avansXulosa.hisoblanmagan > 0 && avansXulosa.month === salaryMonth && (
                  <p className="rounded-xl border border-blue-200 bg-blue-50/80 dark:border-blue-900/40 dark:bg-blue-950/30 px-3.5 py-2.5 text-[12.5px] text-blue-800 dark:text-blue-300">
                    {`Avansi bor, lekin oyligi hisoblanmagan: ${avansXulosa.hisoblanmagan} kishi. «Oylikni hisoblash»ni bosing.`}
                  </p>
                )}
                {avansXulosa.tolanmagan.filter((t) => t.month !== salaryMonth).map((t) => (
                  <div key={t.month} className="rounded-xl border border-amber-200 bg-amber-50/80 dark:border-amber-900/40 dark:bg-amber-950/30 px-3.5 py-2.5 flex items-center gap-3 flex-wrap">
                    <p className="text-[12.5px] text-amber-800 dark:text-amber-300 flex-1 min-w-0">
                      {`${OyNomi(t.month)}: ${t.count} ta oylikda avans bor, «To'landi» bosilmagan: avans hali ushlanmagan.`}
                    </p>
                    <button type="button" onClick={() => setSalaryMonth(t.month)}
                      className="h-8 px-3 rounded-lg text-[12px] font-semibold border border-amber-300 text-amber-800 dark:text-amber-300">
                      {`${OyNomi(t.month)}ni ochish`}
                    </button>
                  </div>
                ))}
                {avansXulosa.yopilmagan > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/80 dark:border-amber-900/40 dark:bg-amber-950/30 px-3.5 py-2.5 flex items-center gap-3 flex-wrap">
                    <p className="text-[12.5px] text-amber-800 dark:text-amber-300 flex-1">
                      {`Yopilmagan avanslar: ${avansXulosa.yopilmagan}`}
                    </p>
                    <button type="button" data-yopilmagan-kor
                      onClick={() => (avansYoqiq ? setActiveTab("avans") : setYopilmaganKorin((v) => !v))}
                      className="h-8 px-3 rounded-lg text-[12px] font-semibold border border-amber-300 text-amber-800 dark:text-amber-300">
                      Ko&apos;rish
                    </button>
                  </div>
                )}
                {yopilmaganKorin && !avansYoqiq && (
                  <YopilmaganYuklab onMsg={setSalaryMsg}
                    onOylikgaOt={(m) => { setSalaryMonth(m); setOylikTur("oqituvchi"); }} />
                )}
              </div>
            )}

            {salaryMsg && (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/30 px-3.5 py-2.5 text-[12.5px] font-medium text-emerald-800 dark:text-emerald-300" data-oylik-xabar>
                {salaryMsg}
              </p>
            )}

            {oylikTur === "xodim" ? <StaffSalaries /> : (
            <>
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
                <span className="text-[12px] text-red-500 font-medium" data-oylik-xato>{salaryErr}</span>
              )}
            </div>

            {/* Summary cards */}
            {salaries.length > 0 && (
              <div className={cn("grid grid-cols-2 gap-3", avansBor ? "md:grid-cols-4" : "md:grid-cols-3")}>
                <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-4">
                  <p className="text-[11px] text-neutral-400 mb-1">{avansBor ? "Jami oylik" : "Jami o'qituvchilar"}</p>
                  <p className="text-[20px] font-black text-neutral-900 dark:text-neutral-100">
                    {avansBor ? formatCurrency(salaries.reduce((s: number, r: OylikQatori) => s + hisoblanganOf(r), 0)) : salaries.length}
                  </p>
                </div>
                {avansBor ? (
                  <>
                    <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-4">
                      <p className="text-[11px] text-neutral-400 mb-1">Berilgan avans</p>
                      <p className="text-[20px] font-black text-indigo-600 dark:text-indigo-400">
                        {formatCurrency(salaries.reduce((s: number, r: OylikQatori) => s + (r.advanceTotal ?? 0), 0))}
                      </p>
                    </div>
                    <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-4">
                      <p className="text-[11px] text-neutral-400 mb-1">Qo&apos;lga to&apos;lanadi</p>
                      <p className="text-[20px] font-black text-violet-600 dark:text-violet-400">
                        {formatCurrency(salaries.filter((r: OylikQatori) => r.status !== "PAID").reduce((s: number, r: OylikQatori) => s + (r.salaryRemainder ?? r.calculatedSalary), 0))}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-4">
                    <p className="text-[11px] text-neutral-400 mb-1">Jami oylik</p>
                    <p className="text-[20px] font-black text-violet-600 dark:text-violet-400">
                      {formatCurrency(salaries.reduce((s: number, r: any) => s + r.calculatedSalary, 0))}
                    </p>
                  </div>
                )}
                <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-4">
                  <p className="text-[11px] text-neutral-400 mb-1">To&apos;langan</p>
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
                  O&apos;qituvchilar oylik hisobi — {salaryMonth}
                </p>
                <span className="text-[11px] text-neutral-400">{salaries.length} ta o&apos;qituvchi</span>
              </div>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="glass-soft hover:bg-white/60 dark:hover:bg-white/10">
                    <TableHead className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">O&apos;qituvchi</TableHead>
                    <TableHead className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Turi</TableHead>
                    <TableHead className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider text-right" title="Faqat shu oyga tegishli tushum — oldindan to'langan ortiqcha summa keyingi oyga o'tadi">Yig&apos;ilgan (shu oy)</TableHead>
                    <TableHead className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider text-right">Hisoblangan</TableHead>
                    {avansBor && (
                      <>
                        <TableHead className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider text-right">Avans</TableHead>
                        <TableHead className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider text-right">Qo&apos;lga</TableHead>
                      </>
                    )}
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
                    : salaries.map((s: any) => {
                        const avans = s.advanceTotal ?? 0;
                        const oyTugagan = s.month < joriyOyStr;
                        return (
                        <TableRow key={s.id} className="hover:bg-white/60 dark:hover:bg-white/10 transition-colors" data-oylik-qator={s.teacher?.user?.name}>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 bg-gradient-to-br from-violet-400 to-blue-500 rounded-xl flex items-center justify-center text-white text-[13px] font-bold shrink-0">
                                {s.teacher?.user?.name?.[0] ?? "?"}
                              </div>
                              <div>
                                <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">{s.teacher?.user?.name}</p>
                                <p className="text-[11px] text-neutral-400">
                                  {s.teacher?.status === "INACTIVE" ? "Ishdan ketgan" : s.teacher?.user?.email}
                                </p>
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
                            <span className={cn("font-black text-neutral-900 dark:text-neutral-100", avansBor ? "text-[13px]" : "text-[14px]")}>
                              {formatCurrency(hisoblanganOf(s))}
                            </span>
                          </TableCell>
                          {avansBor && (
                            <>
                              <TableCell className="text-right">
                                {avans > 0 ? (
                                  <span className="text-[13px] font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums"
                                    title={(s.advanceItems ?? []).map((a: AvansBandi) => `${sanaQisqa(a.givenOn).slice(0, 5)} · ${formatCurrency(a.advanceSum)}`).join("\n")}>
                                    -{formatCurrency(avans)}
                                  </span>
                                ) : <span className="text-neutral-300">—</span>}
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="text-[14px] font-black text-neutral-900 dark:text-neutral-100 tabular-nums">
                                  {formatCurrency(s.salaryRemainder ?? s.calculatedSalary)}
                                </span>
                                {(s.overAdvance ?? 0) > 0 && (
                                  <span className={cn("block text-[10.5px] font-semibold mt-0.5",
                                    s.status === "PAID" || oyTugagan ? "text-red-600 dark:text-red-400" : "text-neutral-400")}>
                                    {`Ortiqcha avans ${formatCurrency(s.overAdvance)}${s.status !== "PAID" && !oyTugagan ? " (hozircha)" : ""}`}
                                  </span>
                                )}
                              </TableCell>
                            </>
                          )}
                          <TableCell className="text-center">
                            {s.status === "PAID" ? (
                              <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-lg font-medium">
                                <CheckCircle className="w-3 h-3" />{" "}To&apos;landi
                              </span>
                            ) : (
                              <span className="inline-flex flex-col items-center gap-1">
                                <span className="inline-flex items-center gap-1 text-[11px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-lg font-medium">
                                  <Clock className="w-3 h-3" /> Kutilmoqda
                                </span>
                                {avans > 0 && (
                                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">Avans berildi</span>
                                )}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {s.status !== "PAID" && (
                              <button
                                onClick={() => markAsPaid(s)}
                                disabled={payingId === s.id}
                                data-tolandi
                                className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg
                                  bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50">
                                <BadgeCheck className="w-3 h-3" />
                                {payingId === s.id ? "..." : "To'landi"}
                              </button>
                            )}
                          </TableCell>
                        </TableRow>
                        );
                      })
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
            {avansBor && (
              <p className="text-[11.5px] text-neutral-500 dark:text-neutral-400">
                {"O'qituvchi oyligi Xarajatlarga avtomatik yozilmaydi. Qo'lda yozsangiz, TO'LIQ hisoblangan summani yozing (avans ham shu summa ichida)."}
              </p>
            )}
            </>
            )}

            {tolashQator && (
              <TolandiOyna open={!!tolashQator} onClose={() => setTolash(null)} kind="TEACHER"
                rowId={tolashQator.id} name={tolashQator.teacher?.user?.name ?? ""} month={tolashQator.month}
                hisoblangan={tolashQator.calculatedSalary} advanceTotal={tolashQator.advanceTotal ?? 0}
                advanceItems={tolashQator.advanceItems ?? []} faol={tolashQator.teacher?.status !== "INACTIVE"}
                onDone={(m) => { setTolash(null); setSalaryMsg(m); mutateSalaries(); }} />
            )}
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

            {/* HALI HISOBLANMAGAN a'zoliklar.
                Foydalanuvchi "nega bu o'quvchi qarzdor emas?" deb hayron
                bo'lmasligi uchun: bugun qo'shilgan o'quvchi kunlik hisoblash
                ishlagunicha qarzsiz turadi va buni hech qayerda ko'rsatilmasdi. */}
            {dues && dues.pending > 0 && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl
                bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 -mt-1">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <p className="text-[12px] text-amber-700 dark:text-amber-400">
                  <b>{dues.pending} ta o&apos;quvchidan</b> bu oy uchun hali
                  hisoblanmagan (taxminan {formatCurrency(dues.amount)}). Yuqoridagi
                  &quot;Oylik to&apos;lovni hisoblash&quot; tugmasini bosing.
                </p>
              </div>
            )}

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
        </TabPanel>
      </div>

      <AcceptPaymentModal
        open={!!payForStudent}
        onClose={() => setPayForStudent(null)}
        defaultStudentId={payForStudent?.id}
      />

      <ExpenseCategoriesModal
        open={showCatModal}
        onClose={() => setShowCatModal(false)}
        categories={expCats}
        onChanged={refreshCats}
      />

      <ReceiptModal paymentId={chekId} open={!!chekId}
        onClose={() => setChekId(null)} />
    </div>
  );
}
