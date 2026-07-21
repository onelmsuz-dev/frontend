"use client";

import { useMemo, useState } from "react";
import { mutate } from "swr";
import {
  MessageSquare, Send, Users, GraduationCap, UserCog, Wallet,
  CheckCircle2, XCircle, AlertTriangle, Search, Package, Clock,
} from "lucide-react";
import { TopHeader } from "@/components/layout/top-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { FormField } from "@/components/ui/form-field";
import { ReceiptUpload } from "@/components/ui/receipt-upload";
import { cn } from "@/lib/utils";
import { useSms } from "@/lib/hooks/useSms";
import { useStudents } from "@/lib/hooks/useStudents";
import { useTeachers } from "@/lib/hooks/useTeachers";

function fmtMoney(v: number) {
  return new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 0 }).format(v) + " so'm";
}

type Audience = "students" | "parents" | "teachers";
const AUDIENCE_CFG: { key: Audience; label: string; icon: any }[] = [
  { key: "students", label: "O'quvchilar", icon: GraduationCap },
  { key: "parents",  label: "Ota-onalar", icon: Users },
  { key: "teachers", label: "O'qituvchilar", icon: UserCog },
];

const STATUS_LABEL: Record<string, string> = { PENDING: "Kutilmoqda", APPROVED: "Tasdiqlangan", REJECTED: "Rad etilgan" };
const STATUS_COLOR: Record<string, string> = {
  PENDING:  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  APPROVED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function SmsPage() {
  const { data: sms, isLoading } = useSms();
  const { data: studentsRaw } = useStudents();
  const { data: teachersRaw } = useTeachers();
  const students: any[] = Array.isArray(studentsRaw) ? studentsRaw : [];
  const teachers: any[] = Array.isArray(teachersRaw) ? teachersRaw : [];

  const balance = sms?.balance ?? 0;
  const configured = sms?.configured ?? false;

  // Compose
  const [message, setMessage] = useState("");
  const [audiences, setAudiences] = useState<Set<Audience>>(new Set(["students"]));
  const [scope, setScope] = useState<"all" | "selected">("all");
  const [selStudents, setSelStudents] = useState<Set<string>>(new Set());
  const [selTeachers, setSelTeachers] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [err, setErr] = useState("");

  // Buy package
  const [showBuy, setShowBuy] = useState(false);
  const [buyQty, setBuyQty] = useState(100);
  const [buyCustom, setBuyCustom] = useState("");
  const [receipt, setReceipt] = useState("");
  const [buyNote, setBuyNote] = useState("");
  const [buying, setBuying] = useState(false);
  const [buyErr, setBuyErr] = useState("");

  const hasPending = sms?.requests?.some(r => r.status === "PENDING");

  const filteredStudents = useMemo(() =>
    students.filter(s => s.name?.toLowerCase().includes(search.toLowerCase()) || s.phone?.includes(search)),
    [students, search]);
  const filteredTeachers = useMemo(() =>
    teachers.filter(t => t.user?.name?.toLowerCase().includes(search.toLowerCase()) || t.phone?.includes(search)),
    [teachers, search]);

  // Taxminiy oluvchilar soni
  const estimate = useMemo(() => {
    if (scope === "selected") {
      let n = 0;
      if (audiences.has("students")) n += selStudents.size;
      if (audiences.has("parents"))  n += students.filter(s => selStudents.has(s.id) && s.parentPhone).length;
      if (audiences.has("teachers")) n += selTeachers.size;
      return n;
    }
    let n = 0;
    const active = students.filter(s => s.isActive);
    if (audiences.has("students")) n += active.filter(s => s.phone).length;
    if (audiences.has("parents"))  n += active.filter(s => s.parentPhone).length;
    if (audiences.has("teachers")) n += teachers.filter(t => t.phone).length;
    return n;
  }, [scope, audiences, selStudents, selTeachers, students, teachers]);

  function toggleAudience(a: Audience) {
    setAudiences(prev => {
      const next = new Set(prev);
      next.has(a) ? next.delete(a) : next.add(a);
      return next;
    });
  }
  function toggleSet(setter: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) {
    setter(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  async function sendSms() {
    setErr(""); setResult(null);
    if (!message.trim()) { setErr("Xabar matnini kiriting"); return; }
    if (audiences.size === 0) { setErr("Kamida bitta oluvchi turini tanlang"); return; }
    if (estimate === 0) { setErr("Oluvchi topilmadi"); return; }
    if (estimate > balance) { setErr(`Balans yetarli emas: ${estimate} ta kerak, ${balance} ta bor`); return; }

    setSending(true);
    try {
      const res = await fetch("/api/sms/send", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          audiences: [...audiences],
          scope,
          ...(scope === "selected" ? { studentIds: [...selStudents], teacherIds: [...selTeachers] } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "Yuborishda xatolik"); return; }
      setResult({ sent: data.sent, failed: data.failed, total: data.total });
      setMessage("");
      mutate("/api/sms");
    } catch { setErr("Serverga ulanib bo'lmadi"); }
    finally { setSending(false); }
  }

  const pkg = (sms?.packages ?? []).find(p => p.quantity === buyQty);
  const effectiveQty = buyCustom ? Math.max(0, parseInt(buyCustom) || 0) : buyQty;
  const effectiveAmount = pkg && !buyCustom ? pkg.price : Math.round(effectiveQty * 400);

  async function submitBuy() {
    setBuyErr("");
    if (effectiveQty <= 0) { setBuyErr("Miqdorni kiriting"); return; }
    setBuying(true);
    try {
      const res = await fetch("/api/sms/package-requests", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: effectiveQty, amount: effectiveAmount, note: buyNote || undefined, receiptUrl: receipt || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setBuyErr(data.error ?? "Xatolik"); return; }
      mutate("/api/sms");
      setShowBuy(false); setReceipt(""); setBuyNote(""); setBuyCustom("");
    } catch { setBuyErr("Serverga ulanib bo'lmadi"); }
    finally { setBuying(false); }
  }

  return (
    <div>
      <TopHeader title="SMS xabarlar" subtitle="O'quvchi, ota-ona va o'qituvchilarga xabar yuborish" />

      <div className="p-5 space-y-5 max-w-4xl">
        {/* Balans + paket */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="border border-neutral-200 dark:border-neutral-800 shadow-none sm:col-span-2">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-[11px] text-neutral-500">SMS balansi</p>
                  <p className="text-[26px] font-black text-neutral-900 dark:text-neutral-100 leading-none">
                    {isLoading ? "..." : balance} <span className="text-[13px] font-medium text-neutral-400">ta</span>
                  </p>
                </div>
              </div>
              <Button onClick={() => { setShowBuy(true); setBuyErr(""); }} disabled={hasPending}
                className="gap-1.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 h-9 text-[13px]">
                <Package className="w-4 h-4" /> Paket sotib olish
              </Button>
            </CardContent>
          </Card>
          <Card className="border border-neutral-200 dark:border-neutral-800 shadow-none">
            <CardContent className="p-4">
              <p className="text-[11px] text-neutral-500 mb-1">Holat</p>
              {configured ? (
                <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-4 h-4" /> Shlyuz ulangan
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-4 h-4" /> Sozlanmagan
                </span>
              )}
            </CardContent>
          </Card>
        </div>

        {hasPending && (
          <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/40 rounded-xl px-3 py-2.5">
            <Clock className="w-4 h-4 text-blue-600 shrink-0" />
            <p className="text-[12px] font-medium text-blue-700 dark:text-blue-400">Tasdiqlanmagan paket so'rovingiz bor. Admin javobini kuting.</p>
          </div>
        )}

        {/* Xabar yuborish */}
        <Card className="border border-neutral-200 dark:border-neutral-800 shadow-none">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-neutral-400" />
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Yangi xabar</p>
            </div>

            <FormField label="Xabar matni" hint={`${message.length} belgi${message.length > 160 ? " · 160 dan oshsa 2 SMS hisoblanadi" : ""}`}>
              <Textarea rows={3} placeholder="Assalomu alaykum! ..." value={message}
                onChange={e => setMessage(e.target.value)} />
            </FormField>

            {/* Oluvchi turlari */}
            <div>
              <p className="text-[12px] font-medium text-neutral-500 mb-1.5">Kimga</p>
              <div className="flex flex-wrap gap-2">
                {AUDIENCE_CFG.map(({ key, label, icon: Icon }) => {
                  const on = audiences.has(key);
                  return (
                    <button key={key} type="button" onClick={() => toggleAudience(key)}
                      className={cn("inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[12px] font-semibold border-2 transition-all",
                        on ? "border-neutral-900 dark:border-neutral-100 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
                           : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-neutral-400")}>
                      <Icon className="w-3.5 h-3.5" /> {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Qamrov */}
            <div>
              <p className="text-[12px] font-medium text-neutral-500 mb-1.5">Qamrov</p>
              <div className="flex gap-2">
                {([["all", "Hammaga"], ["selected", "Tanlab"]] as const).map(([v, l]) => (
                  <button key={v} type="button" onClick={() => setScope(v)}
                    className={cn("h-9 px-4 rounded-xl text-[12px] font-semibold border transition-all",
                      scope === v ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900"
                                  : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-neutral-400")}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Tanlab — ro'yxat */}
            {scope === "selected" && (
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <div className="p-2.5 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                    <Input placeholder="Qidirish..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800">
                  {(audiences.has("students") || audiences.has("parents")) && filteredStudents.map(s => (
                    <label key={s.id} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <input type="checkbox" checked={selStudents.has(s.id)} onChange={() => toggleSet(setSelStudents, s.id)}
                        className="w-4 h-4 rounded accent-neutral-900 dark:accent-neutral-100" />
                      <span className="text-[13px] text-neutral-800 dark:text-neutral-200 flex-1">{s.name}</span>
                      <span className="text-[11px] text-neutral-400">{s.phone}</span>
                    </label>
                  ))}
                  {audiences.has("teachers") && filteredTeachers.map(t => (
                    <label key={t.id} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <input type="checkbox" checked={selTeachers.has(t.id)} onChange={() => toggleSet(setSelTeachers, t.id)}
                        className="w-4 h-4 rounded accent-neutral-900 dark:accent-neutral-100" />
                      <span className="text-[13px] text-neutral-800 dark:text-neutral-200 flex-1">{t.user?.name} <span className="text-[11px] text-purple-500">· ustoz</span></span>
                      <span className="text-[11px] text-neutral-400">{t.phone}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Xulosa + yuborish */}
            <div className="flex items-center justify-between pt-1">
              <p className="text-[12px] text-neutral-500">
                Taxminan <strong className="text-neutral-800 dark:text-neutral-200">{estimate}</strong> ta SMS
                {estimate > balance && <span className="text-red-500"> · balans yetarli emas</span>}
              </p>
              <Button onClick={sendSms} disabled={sending || !configured || balance === 0}
                className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white h-9 text-[13px]">
                <Send className="w-4 h-4" /> {sending ? "Yuborilmoqda..." : "Yuborish"}
              </Button>
            </div>

            {err && (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-100 rounded-xl px-3 py-2.5">
                <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <p className="text-[12px] font-medium text-red-600 dark:text-red-400">{err}</p>
              </div>
            )}
            {result && (
              <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-100 rounded-xl px-3 py-2.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                <p className="text-[12px] font-medium text-green-700 dark:text-green-400">
                  {result.sent} ta yuborildi{result.failed > 0 ? `, ${result.failed} ta xato` : ""} (jami {result.total})
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tarix */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card className="border border-neutral-200 dark:border-neutral-800 shadow-none">
            <CardContent className="p-0">
              <p className="px-4 py-3 text-[13px] font-bold text-neutral-900 dark:text-neutral-100 border-b border-neutral-100 dark:border-neutral-800">So'nggi yuborilganlar</p>
              {(sms?.messages ?? []).length === 0 ? (
                <p className="text-[12px] text-neutral-400 p-6 text-center">Hali SMS yuborilmagan</p>
              ) : (sms?.messages ?? []).slice(0, 15).map(m => (
                <div key={m.id} className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                  <div className="min-w-0">
                    <p className="text-[12px] font-medium text-neutral-800 dark:text-neutral-200 truncate">{m.recipientName ?? m.phone}</p>
                    <p className="text-[11px] text-neutral-400 truncate">{m.phone} · {new Date(m.createdAt).toLocaleDateString("uz-UZ")}</p>
                  </div>
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0",
                    m.status === "SENT" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400")}>
                    {m.status === "SENT" ? "Yuborildi" : "Xato"}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border border-neutral-200 dark:border-neutral-800 shadow-none">
            <CardContent className="p-0">
              <p className="px-4 py-3 text-[13px] font-bold text-neutral-900 dark:text-neutral-100 border-b border-neutral-100 dark:border-neutral-800">Paket so'rovlari</p>
              {(sms?.requests ?? []).length === 0 ? (
                <p className="text-[12px] text-neutral-400 p-6 text-center">So'rovlar yo'q</p>
              ) : (sms?.requests ?? []).map(r => (
                <div key={r.id} className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                  <div>
                    <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">{r.quantity} ta · {fmtMoney(r.amount)}</p>
                    <p className="text-[11px] text-neutral-400">{new Date(r.createdAt).toLocaleDateString("uz-UZ")}</p>
                  </div>
                  <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-semibold", STATUS_COLOR[r.status])}>
                    {STATUS_LABEL[r.status] ?? r.status}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Paket sotib olish modal */}
      <Modal open={showBuy} onClose={() => setShowBuy(false)}
        title="SMS paket sotib olish" subtitle="Paketni tanlang va to'lov chekini yuklang" size="md"
        footer={
          <>
            <Button onClick={submitBuy} disabled={buying}
              className="flex-1 h-9 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 text-white text-[13px]">
              {buying ? "Yuborilmoqda..." : "So'rov yuborish"}
            </Button>
            <Button variant="outline" className="h-9 px-4 text-[13px]" onClick={() => setShowBuy(false)}>Bekor</Button>
          </>
        }>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {(sms?.packages ?? []).map(p => (
              <button key={p.quantity} type="button" onClick={() => { setBuyQty(p.quantity); setBuyCustom(""); }}
                className={cn("rounded-xl border-2 p-3 text-center transition-all",
                  !buyCustom && buyQty === p.quantity ? "border-neutral-900 dark:border-neutral-100 bg-neutral-50 dark:bg-neutral-800"
                                                       : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-400")}>
                <p className="text-[16px] font-black text-neutral-900 dark:text-neutral-100">{p.quantity}</p>
                <p className="text-[11px] text-neutral-500">{fmtMoney(p.price)}</p>
              </button>
            ))}
          </div>
          <FormField label="Yoki ixtiyoriy miqdor" hint="1 SMS ≈ 400 so'm">
            <Input type="number" min={1} placeholder="Masalan: 250" value={buyCustom}
              onChange={e => setBuyCustom(e.target.value)} className="h-10" />
          </FormField>
          <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3 flex justify-between text-[13px]">
            <span className="text-neutral-500">Jami ({effectiveQty} ta)</span>
            <span className="font-bold">{fmtMoney(effectiveAmount)}</span>
          </div>
          <FormField label="Chek rasmi" hint="To'lov chekini rasm ko'rinishida yuklang">
            <ReceiptUpload value={receipt} onChange={setReceipt} />
          </FormField>
          <FormField label="Izoh" hint="Ixtiyoriy">
            <Textarea rows={2} placeholder="Qo'shimcha ma'lumot" value={buyNote} onChange={e => setBuyNote(e.target.value)} />
          </FormField>
          {buyErr && <p className="text-[12px] text-red-600 dark:text-red-400">{buyErr}</p>}
        </div>
      </Modal>
    </div>
  );
}
