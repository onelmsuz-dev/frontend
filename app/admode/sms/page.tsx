"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { cn } from "@/lib/utils";
import {
  MessageSquare, Check, X, Package, Plus, Receipt, Clock, Building2,
  FileText, Send, ArrowRight, ShieldCheck,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

function fmtMoney(v: number) {
  return new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 0 }).format(v) + " so'm";
}

const PRESETS = [100, 500, 1000];

const STATUS_COLOR: Record<string, string> = {
  PENDING:  "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  APPROVED: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  REJECTED: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-100 dark:bg-neutral-800 rounded-lg", className)} />;
}

const TPL_STATUS_LABEL: Record<string, string> = {
  PENDING: "Navbatda", IN_REVIEW: "Jarayonda", APPROVED: "Tasdiqlangan", REJECTED: "Rad etilgan",
};
const TPL_STATUS_COLOR: Record<string, string> = {
  PENDING:   "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
  IN_REVIEW: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  APPROVED:  "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  REJECTED:  "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function AdmodeSmsPage() {
  const { data: pendingRaw, isLoading: reqLoading } = useSWR(
    "/api/admode/sms/package-requests?status=PENDING", fetcher, { refreshInterval: 30_000 });
  const { data: orgsRaw, isLoading: orgLoading } = useSWR("/api/admode/organizations", fetcher);
  const { data: tplRaw, isLoading: tplLoading } = useSWR(
    "/api/admode/sms/templates", fetcher, { refreshInterval: 30_000 });

  const pending: any[] = Array.isArray(pendingRaw) ? pendingRaw : [];
  const orgs: any[] = Array.isArray(orgsRaw) ? orgsRaw : [];
  const templates: any[] = Array.isArray(tplRaw) ? tplRaw : [];
  const openTemplates = templates.filter(t => t.status === "PENDING" || t.status === "IN_REVIEW");

  const [busy, setBusy] = useState<string | null>(null);
  const [viewReceipt, setViewReceipt] = useState<string | null>(null);

  // Add package modal
  const [addOrg, setAddOrg] = useState<any>(null);
  const [addQty, setAddQty] = useState(100);
  const [addCustom, setAddCustom] = useState("");
  const [adding, setAdding] = useState(false);

  // Test SMS
  const [testPhone, setTestPhone] = useState("");
  const [testMsg, setTestMsg] = useState("Bu Eskiz dan test");
  const [testBusy, setTestBusy] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null);

  // Umumiy matn to'g'ridan-to'g'ri qo'shish (Eskiz kabinetida allaqachon tasdiqlangan)
  const [showAddTpl, setShowAddTpl] = useState(false);
  const [addTplTitle, setAddTplTitle] = useState("");
  const [addTplText, setAddTplText] = useState("");
  const [addTplShared, setAddTplShared] = useState(true);
  const [addTplBusy, setAddTplBusy] = useState(false);
  const [addTplErr, setAddTplErr] = useState("");

  async function review(id: string, action: "APPROVE" | "REJECT") {
    let note: string | undefined;
    if (action === "REJECT") note = window.prompt("Rad etish sababi (ixtiyoriy):") ?? undefined;
    setBusy(id);
    try {
      await fetch(`/api/admode/sms/package-requests/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      });
      mutate("/api/admode/sms/package-requests?status=PENDING");
      mutate("/api/admode/organizations");
    } finally { setBusy(null); }
  }

  async function reviewTemplate(id: string, action: "IN_REVIEW" | "APPROVE" | "REJECT") {
    let note: string | undefined;
    if (action === "REJECT") note = window.prompt("Rad etish sababi:") ?? undefined;
    setBusy(id);
    try {
      const res = await fetch(`/api/admode/sms/templates/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.error ?? "Xatolik"); }
      mutate("/api/admode/sms/templates");
    } finally { setBusy(null); }
  }

  async function toggleShared(id: string, next: boolean) {
    setBusy(id);
    try {
      await fetch(`/api/admode/sms/templates/${id}/shared`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isShared: next }),
      });
      mutate("/api/admode/sms/templates");
    } finally { setBusy(null); }
  }

  async function createGlobalTemplate() {
    setAddTplErr("");
    if (!addTplTitle.trim()) { setAddTplErr("Nom kiriting"); return; }
    if (addTplText.trim().length < 5) { setAddTplErr("Matn juda qisqa"); return; }
    setAddTplBusy(true);
    try {
      const res = await fetch("/api/admode/sms/templates", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: addTplTitle.trim(), text: addTplText.trim(), isShared: addTplShared }),
      });
      const data = await res.json();
      if (!res.ok) { setAddTplErr(data.error ?? "Xatolik"); return; }
      mutate("/api/admode/sms/templates");
      setShowAddTpl(false); setAddTplTitle(""); setAddTplText(""); setAddTplShared(true);
    } catch { setAddTplErr("Serverga ulanib bo'lmadi"); }
    finally { setAddTplBusy(false); }
  }

  async function sendTest() {
    if (!testPhone.trim() || !testMsg.trim()) return;
    setTestBusy(true); setTestResult(null);
    try {
      const res = await fetch("/api/admode/sms/test-send", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: testPhone.trim(), message: testMsg.trim() }),
      });
      const data = await res.json();
      setTestResult(res.ok
        ? { ok: true, text: `Yuborildi${data.eskizId ? ` (ID: ${data.eskizId})` : ""}` }
        : { ok: false, text: data.error ?? "Yuborilmadi" });
    } catch {
      setTestResult({ ok: false, text: "Serverga ulanib bo'lmadi" });
    } finally { setTestBusy(false); }
  }

  async function addPackage() {
    if (!addOrg) return;
    const qty = addCustom ? parseInt(addCustom) || 0 : addQty;
    if (qty <= 0) return;
    setAdding(true);
    try {
      await fetch("/api/admode/sms/add-package", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: addOrg.id, quantity: qty }),
      });
      mutate("/api/admode/organizations");
      setAddOrg(null); setAddCustom(""); setAddQty(100);
    } finally { setAdding(false); }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-black text-neutral-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" /> SMS paketlar
        </h1>
        <p className="text-sm text-neutral-500 mt-0.5">To'lov so'rovlarini tasdiqlang va markazlarga paket qo'shing</p>
      </div>

      {/* Test SMS — shlyuz kredensiallarini tekshirish */}
      <div>
        <p className="text-[13px] font-bold text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" /> Test SMS
        </p>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 space-y-3">
          <p className="text-[12px] text-neutral-400">
            Eskiz.uz kredensiallari (.env) to'g'ri ishlayotganini tekshiring — bu markaz balansidan yechilmaydi.
            Tasdiqlangan matningiz bo'lsa uni, bo'lmasa test rejimidagi tayyor matnlardan birini yuboring
            (masalan: "Bu Eskiz dan test").
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-2">
            <input value={testPhone} onChange={e => setTestPhone(e.target.value)} placeholder="+998901234567"
              className="h-10 px-3 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:border-blue-500" />
            <input value={testMsg} onChange={e => setTestMsg(e.target.value)} placeholder="Xabar matni"
              className="h-10 px-3 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={sendTest} disabled={testBusy || !testPhone.trim() || !testMsg.trim()}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-[12px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-60">
              <Send className="w-3.5 h-3.5" /> {testBusy ? "Yuborilmoqda..." : "Test yuborish"}
            </button>
            {testResult && (
              <span className={cn("text-[12px] font-semibold", testResult.ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                {testResult.text}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Matn moderatsiyasi */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[13px] font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-indigo-500" /> Matn moderatsiyasi
            {openTemplates.length > 0 && <span className="bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{openTemplates.length}</span>}
          </p>
          <button onClick={() => { setShowAddTpl(true); setAddTplErr(""); }}
            className="inline-flex items-center gap-1 h-8 px-3 rounded-lg text-[12px] font-semibold bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 text-white transition-colors">
            <Plus className="w-3.5 h-3.5" /> Umumiy matn qo'shish
          </button>
        </div>
        <p className="text-[11px] text-neutral-400 mb-2">
          Eskiz akkaunti platforma uchun bitta — "Umumiy" belgili tasdiqlangan matnni barcha markazlar ko'radi va ishlatadi.
          Eskiz kabinetida allaqachon tasdiqlangan matnni yuqoridagi tugma orqali to'g'ridan-to'g'ri qo'shing.
        </p>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
          {tplLoading ? (
            <div className="p-4 space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-14" />)}</div>
          ) : templates.length === 0 ? (
            <p className="text-[13px] text-neutral-400 text-center py-10">Hali matn yuborilmagan</p>
          ) : templates.map(t => (
            <div key={t.id} className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                      {t.title} <span className="text-neutral-400 font-normal">· {t.organization?.name ?? "Platforma"}</span>
                    </p>
                    {t.isShared && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                        Umumiy
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-1">{t.text}</p>
                  {t.note && <p className="text-[11px] text-neutral-400 mt-1">Izoh: {t.note}</p>}
                </div>
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0", TPL_STATUS_COLOR[t.status])}>
                  {TPL_STATUS_LABEL[t.status] ?? t.status}
                </span>
              </div>
              {(t.status === "PENDING" || t.status === "IN_REVIEW") && (
                <div className="flex items-center gap-1.5 mt-2.5">
                  {t.status === "PENDING" && (
                    <button onClick={() => reviewTemplate(t.id, "IN_REVIEW")} disabled={busy === t.id}
                      className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-[12px] font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-60">
                      <ArrowRight className="w-3.5 h-3.5" /> Eskiz'ga yubordim
                    </button>
                  )}
                  <button onClick={() => reviewTemplate(t.id, "APPROVE")} disabled={busy === t.id}
                    className="inline-flex items-center gap-1 h-8 px-3 rounded-lg text-[12px] font-semibold bg-green-600 hover:bg-green-500 text-white transition-colors disabled:opacity-60">
                    <Check className="w-3.5 h-3.5" /> Tasdiqlash
                  </button>
                  <button onClick={() => reviewTemplate(t.id, "REJECT")} disabled={busy === t.id}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {t.status === "APPROVED" && (
                <div className="mt-2.5">
                  <button onClick={() => toggleShared(t.id, !t.isShared)} disabled={busy === t.id}
                    className={cn("inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-semibold border transition-colors disabled:opacity-60",
                      t.isShared
                        ? "border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                        : "border-indigo-200 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20")}>
                    {t.isShared ? "Xususiy qilish" : "Barchaga ochish"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Kutayotgan so'rovlar */}
      <div>
        <p className="text-[13px] font-bold text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-amber-500" /> Kutayotgan so'rovlar
          {pending.length > 0 && <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pending.length}</span>}
        </p>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
          {reqLoading ? (
            <div className="p-4 space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-12" />)}</div>
          ) : pending.length === 0 ? (
            <p className="text-[13px] text-neutral-400 text-center py-10">Kutayotgan so'rov yo'q</p>
          ) : pending.map(r => (
            <div key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                  {r.organization?.name} <span className="text-neutral-400 font-normal">· {r.organization?.subdomain}</span>
                </p>
                <p className="text-[12px] text-neutral-500">
                  <strong className="text-neutral-700 dark:text-neutral-300">{r.quantity} ta SMS</strong> · {fmtMoney(r.amount)} · {new Date(r.createdAt).toLocaleDateString("uz-UZ")}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {r.receiptUrl && (
                  <button onClick={() => setViewReceipt(r.receiptUrl)}
                    className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-[12px] font-semibold border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                    <Receipt className="w-3.5 h-3.5" /> Chek
                  </button>
                )}
                <button onClick={() => review(r.id, "APPROVE")} disabled={busy === r.id}
                  className="inline-flex items-center gap-1 h-8 px-3 rounded-lg text-[12px] font-semibold bg-green-600 hover:bg-green-500 text-white transition-colors disabled:opacity-60">
                  <Check className="w-3.5 h-3.5" /> Tasdiqlash
                </button>
                <button onClick={() => review(r.id, "REJECT")} disabled={busy === r.id}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Markazlar balansi */}
      <div>
        <p className="text-[13px] font-bold text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-1.5">
          <Building2 className="w-4 h-4 text-blue-500" /> Markazlar SMS balansi
        </p>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
          {orgLoading ? (
            <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</div>
          ) : orgs.length === 0 ? (
            <p className="text-[13px] text-neutral-400 text-center py-10">Markazlar yo'q</p>
          ) : orgs.map(o => (
            <div key={o.id} className="flex items-center justify-between gap-3 px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 truncate">{o.name}</p>
                <p className="text-[11px] text-neutral-400">{o.subdomain}.oneroom.uz</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">
                  {o.smsBalance ?? 0} <span className="text-[11px] font-medium text-neutral-400">SMS</span>
                </span>
                <button onClick={() => { setAddOrg(o); setAddQty(100); setAddCustom(""); }}
                  className="inline-flex items-center gap-1 h-8 px-3 rounded-lg text-[12px] font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Paket
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chek rasm modal */}
      {viewReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setViewReceipt(null)}>
          <div className="max-w-lg w-full" onClick={e => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={viewReceipt} alt="Chek" className="w-full rounded-2xl" />
            <button onClick={() => setViewReceipt(null)} className="mt-3 mx-auto block text-white/80 hover:text-white text-sm">Yopish</button>
          </div>
        </div>
      )}

      {/* Paket qo'shish modal */}
      {addOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setAddOrg(null)}>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-sm p-5 space-y-4 border border-neutral-200 dark:border-neutral-800" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100">Paket qo'shish</p>
                <p className="text-[12px] text-neutral-500">{addOrg.name}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map(q => (
                <button key={q} onClick={() => { setAddQty(q); setAddCustom(""); }}
                  className={cn("rounded-xl border-2 py-2.5 text-center text-[15px] font-black transition-all",
                    !addCustom && addQty === q ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                                               : "border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400")}>
                  {q}
                </button>
              ))}
            </div>
            <div>
              <label className="text-[12px] font-medium text-neutral-500 mb-1 block">Yoki ixtiyoriy miqdor</label>
              <input type="number" min={1} value={addCustom} onChange={e => setAddCustom(e.target.value)}
                placeholder="Masalan: 250"
                className="w-full h-10 px-3 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:border-blue-500" />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={addPackage} disabled={adding}
                className="flex-1 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-semibold transition-colors disabled:opacity-60">
                {adding ? "Qo'shilmoqda..." : `${addCustom || addQty} ta qo'shish`}
              </button>
              <button onClick={() => setAddOrg(null)}
                className="h-10 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 text-[13px] font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                Bekor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Umumiy matn qo'shish modal */}
      {showAddTpl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowAddTpl(false)}>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md p-5 space-y-4 border border-neutral-200 dark:border-neutral-800" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100">Umumiy matn qo'shish</p>
                <p className="text-[12px] text-neutral-500">Eskiz kabinetida allaqachon tasdiqlangan matn uchun</p>
              </div>
            </div>
            <div>
              <label className="text-[12px] font-medium text-neutral-500 mb-1 block">Nom</label>
              <input value={addTplTitle} onChange={e => setAddTplTitle(e.target.value)} placeholder="To'lov eslatmasi"
                className="w-full h-10 px-3 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="text-[12px] font-medium text-neutral-500 mb-1 block">Matn (Eskiz'da tasdiqlangan ko'rinishida)</label>
              <textarea value={addTplText} onChange={e => setAddTplText(e.target.value)} rows={3}
                placeholder="Hurmatli o'quvchi, bugun yangi oy uchun to'lov qilishning oxirgi kuni..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:border-indigo-500 resize-none" />
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={addTplShared} onChange={e => setAddTplShared(e.target.checked)}
                className="w-4 h-4 rounded accent-indigo-600" />
              <span className="text-[12px] text-neutral-600 dark:text-neutral-300">Barcha markazlarga ochiq qilish (tavsiya etiladi)</span>
            </label>
            {addTplErr && <p className="text-[12px] text-red-600 dark:text-red-400">{addTplErr}</p>}
            <div className="flex gap-2 pt-1">
              <button onClick={createGlobalTemplate} disabled={addTplBusy}
                className="flex-1 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[13px] font-semibold transition-colors disabled:opacity-60">
                {addTplBusy ? "Qo'shilmoqda..." : "Tasdiqlangan deb qo'shish"}
              </button>
              <button onClick={() => setShowAddTpl(false)}
                className="h-10 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 text-[13px] font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                Bekor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
