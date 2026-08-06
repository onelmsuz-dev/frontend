"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { cn } from "@/lib/utils";
import {
  ShieldCheck, Building2, GraduationCap, Users, Wallet,
  Lock, Check, Loader2, AlertCircle, Eye, EyeOff, CreditCard, Trophy,
} from "lucide-react";
import {
  usePlatformSettings, useUpdatePlatformSettings, formatCardNumber,
} from "@/lib/hooks/usePlatformSettings";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function fmtMoney(v: number) {
  return new Intl.NumberFormat("uz-UZ", { style: "currency", currency: "UZS", maximumFractionDigits: 0 }).format(v);
}

// common/plans.ts bilan mos (STARTER / BUSINESS / PREMIUM).
const PLANS = [
  { key: "STARTER",  label: "Starter",  price: 270_000, maxStudents: 200,  maxBranches: 1, maxStaff: 3,  text: "text-neutral-300 dark:text-neutral-700 dark:text-neutral-300", ring: "border-neutral-300 dark:border-neutral-700" },
  { key: "BUSINESS", label: "Business", price: 570_000, maxStudents: 500,  maxBranches: 3, maxStaff: 5,  text: "text-blue-700 dark:text-blue-300",    ring: "border-blue-200 dark:border-blue-900/40" },
  { key: "PREMIUM",  label: "Premium",  price: 870_000, maxStudents: 1000, maxBranches: 8, maxStaff: 12, text: "text-purple-700 dark:text-purple-300",  ring: "border-purple-200 dark:border-purple-900/40" },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const { data: stats } = useSWR("/api/admode/stats", fetcher);
  const user = session?.user as any;
  const totals = stats?.totals;

  // Parolni o'zgartirish
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // To'lov kartasi
  const { data: platformSettings, mutate: mutateSettings } = usePlatformSettings();
  const { trigger: saveCard, isMutating: cardSaving } = useUpdatePlatformSettings();
  const [cardNumber, setCardNumber] = useState("");
  const [cardOwner,  setCardOwner]  = useState("");
  const [cardMsg,    setCardMsg]    = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [gamiSaving, setGamiSaving] = useState(false);

  useEffect(() => {
    if (platformSettings) {
      setCardNumber(platformSettings.paymentCardNumber ?? "");
      setCardOwner(platformSettings.paymentCardOwner ?? "");
    }
  }, [platformSettings]);

  async function submitCard(e: React.FormEvent) {
    e.preventDefault();
    setCardMsg(null);
    const digits = cardNumber.replace(/\D/g, "");
    if (digits.length < 12) { setCardMsg({ type: "err", text: "Karta raqami noto'g'ri" }); return; }
    try {
      await saveCard({ paymentCardNumber: digits, paymentCardOwner: cardOwner.trim() || undefined } as any);
      mutateSettings();
      setCardMsg({ type: "ok", text: "Karta ma'lumoti saqlandi" });
    } catch (err: any) {
      setCardMsg({ type: "err", text: err?.error ?? "Xatolik yuz berdi" });
    }
  }

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (next.length < 6) return setMsg({ type: "err", text: "Yangi parol kamida 6 ta belgi bo'lishi kerak" });
    if (next !== confirm) return setMsg({ type: "err", text: "Yangi parollar mos emas" });

    setBusy(true);
    try {
      const res = await fetch("/api/me/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: cur, newPassword: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ type: "err", text: data?.error ?? "Parolni o'zgartirishda xatolik" });
      } else {
        setMsg({ type: "ok", text: "Parol muvaffaqiyatli o'zgartirildi" });
        setCur(""); setNext(""); setConfirm("");
      }
    } catch {
      setMsg({ type: "err", text: "Server bilan bog'lanib bo'lmadi" });
    } finally {
      setBusy(false);
    }
  }

  const platformStats = totals ? [
    { label: "O'quv markazlar", value: totals.orgs,     icon: Building2,     color: "text-blue-600 dark:text-blue-400" },
    { label: "O'quvchilar",     value: totals.students, icon: GraduationCap, color: "text-green-600 dark:text-green-400" },
    { label: "O'qituvchilar",   value: totals.teachers, icon: Users,         color: "text-purple-600 dark:text-purple-400" },
  ] : [];

  const inputCls = "w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-[13px] text-neutral-900 dark:text-white text-neutral-400 dark:text-neutral-600 outline-none focus:border-neutral-400 dark:focus:border-neutral-600";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-neutral-900 dark:text-white">Sozlamalar</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Hisob va platforma sozlamalari</p>
      </div>

      {/* Profil */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5">
        <h2 className="text-[13px] font-bold text-neutral-900 dark:text-white mb-4">Mening hisobim</h2>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
            <span className="text-[20px] font-black text-blue-600 dark:text-blue-400">
              {user?.name?.[0]?.toUpperCase() ?? "A"}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-neutral-900 dark:text-white truncate">{user?.name ?? "Admin"}</p>
            <p className="text-[12px] text-neutral-500">{user?.phone ?? "—"}</p>
            <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
              <ShieldCheck className="w-3 h-3" /> Platform Admin
            </span>
          </div>
        </div>
      </div>

      {/* Xavfsizlik — parolni o'zgartirish */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
          <h2 className="text-[13px] font-bold text-neutral-900 dark:text-white">Parolni o'zgartirish</h2>
        </div>
        <form onSubmit={submitPassword} className="space-y-3 max-w-sm">
          <div>
            <label className="block text-[11px] text-neutral-500 mb-1">Joriy parol</label>
            <input type={show ? "text" : "password"} value={cur} onChange={(e) => setCur(e.target.value)}
              autoComplete="current-password" className={inputCls} required />
          </div>
          <div>
            <label className="block text-[11px] text-neutral-500 mb-1">Yangi parol</label>
            <div className="relative">
              <input type={show ? "text" : "password"} value={next} onChange={(e) => setNext(e.target.value)}
                autoComplete="new-password" className={inputCls} required />
              <button type="button" onClick={() => setShow((s) => !s)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-neutral-500 mb-1">Yangi parolni tasdiqlang</label>
            <input type={show ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password" className={inputCls} required />
          </div>

          {msg && (
            <div className={cn(
              "flex items-center gap-2 text-[12px] px-3 py-2 rounded-lg",
              msg.type === "ok" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300" : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300",
            )}>
              {msg.type === "ok" ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              {msg.text}
            </div>
          )}

          <button type="submit" disabled={busy}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl text-[12px] font-semibold text-white transition-colors">
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Saqlash
          </button>
        </form>
      </div>

      {/* To'lov kartasi — tarif/SMS-paket sotib olishda markazlarga ko'rsatiladi */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <CreditCard className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
          <h2 className="text-[13px] font-bold text-neutral-900 dark:text-white">To'lov kartasi</h2>
        </div>
        <p className="text-[11px] text-neutral-500 mb-4">
          Markazlar tarif va SMS-paket sotib olishda shu kartaga to'lov o'tkazadi (hozir: <strong>{formatCardNumber(platformSettings?.paymentCardNumber ?? "")}</strong>)
        </p>
        <form onSubmit={submitCard} className="space-y-3 max-w-sm">
          <div>
            <label className="block text-[11px] text-neutral-500 mb-1">Karta raqami</label>
            <input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)}
              placeholder="9860 3501 4289 8617" className={inputCls} required />
          </div>
          <div>
            <label className="block text-[11px] text-neutral-500 mb-1">Karta egasi (ixtiyoriy)</label>
            <input value={cardOwner} onChange={(e) => setCardOwner(e.target.value)}
              placeholder="Ism Familiya" className={inputCls} />
          </div>

          {cardMsg && (
            <div className={cn(
              "flex items-center gap-2 text-[12px] px-3 py-2 rounded-lg",
              cardMsg.type === "ok" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300" : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300",
            )}>
              {cardMsg.type === "ok" ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              {cardMsg.text}
            </div>
          )}

          <button type="submit" disabled={cardSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl text-[12px] font-semibold text-white transition-colors">
            {cardSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Saqlash
          </button>
        </form>
      </div>

      {/* Gamifikatsiya — GLOBAL kalit (1-daraja) */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
          <h2 className="text-[13px] font-bold text-neutral-900 dark:text-white">Gamifikatsiya (global)</h2>
        </div>
        <p className="text-[11px] text-neutral-500 mb-4">
          O&apos;chirilsa <strong>barcha markazlarda</strong> ishlamaydi — markaz o&apos;z sozlamasini
          yoqib qo&apos;ygan bo&apos;lsa ham. Yig&apos;ilgan ballar o&apos;chmaydi, faqat yangi ball berilmaydi.
          Alohida markazni cheklash uchun &quot;Markazlar&quot; sahifasidan foydalaning.
        </p>

        <div className="flex items-start justify-between gap-3 bg-neutral-100/50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 max-w-sm">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-neutral-900 dark:text-white">
              {platformSettings?.gamificationEnabled === false ? "O'chirilgan" : "Yoqilgan"}
            </p>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              {platformSettings?.gamificationEnabled === false
                ? "Hech bir markazda ishlamayapti"
                : "Markazlar o'zi yoqib ishlata oladi"}
            </p>
          </div>
          <button
            onClick={async () => {
              setGamiSaving(true);
              try {
                await saveCard({ gamificationEnabled: !(platformSettings?.gamificationEnabled ?? true) } as any);
                mutateSettings();
              } catch { /* xato bo'lsa holat o'zgarmaydi */ }
              finally { setGamiSaving(false); }
            }}
            disabled={gamiSaving}
            className={cn(
              "relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-60",
              (platformSettings?.gamificationEnabled ?? true) ? "bg-emerald-500" : "bg-neutral-300 dark:bg-neutral-600",
            )}>
            <span className={cn(
              "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform",
              (platformSettings?.gamificationEnabled ?? true) && "translate-x-5",
            )} />
          </button>
        </div>
      </div>

      {/* Platforma holati */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5">
        <h2 className="text-[13px] font-bold text-neutral-900 dark:text-white mb-4">Platforma holati</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {platformStats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-neutral-100/50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3">
                <Icon className={cn("w-4 h-4 mb-2", s.color)} />
                <p className="text-[18px] font-black text-neutral-900 dark:text-white leading-none">{Number(s.value).toLocaleString()}</p>
                <p className="text-[10px] text-neutral-500 mt-1">{s.label}</p>
              </div>
            );
          })}
          <div className="bg-neutral-100/50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3">
            <Wallet className="w-4 h-4 mb-2 text-emerald-600 dark:text-emerald-400" />
            <p className="text-[15px] font-black text-emerald-600 dark:text-emerald-400 leading-none">{fmtMoney(totals?.revenue ?? 0)}</p>
            <p className="text-[10px] text-neutral-500 mt-1">Jami daromad</p>
          </div>
        </div>
      </div>

      {/* Tarif rejalari (katalog) */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5">
        <h2 className="text-[13px] font-bold text-neutral-900 dark:text-white mb-1">Tarif rejalari</h2>
        <p className="text-[11px] text-neutral-500 mb-4">Markazlar sotib oladigan tariflar (ma'lumot uchun)</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PLANS.map((p) => (
            <div key={p.key} className={cn("bg-neutral-100/40 dark:bg-neutral-800/40 border rounded-xl p-4", p.ring)}>
              <p className={cn("text-[13px] font-bold", p.text)}>{p.label}</p>
              <p className="text-[18px] font-black text-neutral-900 dark:text-white mt-1">{fmtMoney(p.price)}<span className="text-[11px] font-medium text-neutral-500">/oy</span></p>
              <div className="mt-3 space-y-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                <p>{p.maxStudents} tagacha o'quvchi</p>
                <p>{p.maxBranches} ta filial</p>
                <p>{p.maxStaff} ta xodim</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
