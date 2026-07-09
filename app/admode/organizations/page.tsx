"use client";

import { useState } from "react";
import useSWR from "swr";
import { cn } from "@/lib/utils";
import {
  Plus, X, Search, AlertCircle, CheckCircle, XCircle,
  Building2, Users, GraduationCap, TrendingUp, ExternalLink, Trash2, KeyRound,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

function fmtShort(v: number) {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000)     return `${(v / 1_000_000).toFixed(1)}M so'm`;
  if (v >= 1_000)         return `${(v / 1_000).toFixed(0)}K so'm`;
  return v ? `${v} so'm` : "—";
}

const PLAN_CFG: Record<string, { label: string; cls: string }> = {
  STARTER:    { label: "Starter",  cls: "bg-neutral-700 text-neutral-300" },
  BUSINESS:   { label: "Business", cls: "bg-blue-900/60 text-blue-300 border border-blue-800/40" },
  PREMIUM:    { label: "Premium",  cls: "bg-purple-900/60 text-purple-300 border border-purple-800/40" },
  // Legacy alias'lar (eski orglar uchun ko'rsatish)
  BASIC:      { label: "Starter",  cls: "bg-neutral-700 text-neutral-300" },
  PRO:        { label: "Business", cls: "bg-blue-900/60 text-blue-300 border border-blue-800/40" },
  ENTERPRISE: { label: "Premium",  cls: "bg-purple-900/60 text-purple-300 border border-purple-800/40" },
};
const PLANS = ["STARTER", "BUSINESS", "PREMIUM"] as const;

type OrgForm = {
  name: string; subdomain: string; plan: "STARTER" | "BUSINESS" | "PREMIUM";
  adminName: string; adminPhone: string; adminEmail: string; adminPassword: string;
};
const EMPTY: OrgForm = { name:"", subdomain:"", plan:"STARTER", adminName:"", adminPhone:"", adminEmail:"", adminPassword:"" };

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-neutral-400 mb-1.5 uppercase tracking-wide">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
const inputCls = "w-full h-9 px-3 text-[13px] rounded-lg border border-neutral-700 bg-neutral-800 text-white placeholder-neutral-600 outline-none focus:border-blue-500 transition-colors";

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-800 rounded-lg", className)} />;
}

export default function OrganizationsPage() {
  const { data, isLoading, mutate } = useSWR("/api/admode/stats", fetcher);
  const orgs: any[] = data?.orgs ?? [];

  const [search,     setSearch]     = useState("");
  const [planFilter, setPlanFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [form,       setForm]       = useState<OrgForm>(EMPTY);
  const [saving,     setSaving]     = useState(false);
  const [createErr,  setCreateErr]  = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Password reset state
  const [resetOrg,  setResetOrg]   = useState<any>(null);
  const [resetPass, setResetPass]  = useState("");
  const [resetSaving, setResetSaving] = useState(false);
  const [resetErr,  setResetErr]   = useState("");
  const [resetOk,   setResetOk]    = useState(false);

  const filtered = orgs.filter(o => {
    const matchSearch = !search || o.name.toLowerCase().includes(search.toLowerCase()) || o.subdomain.includes(search.toLowerCase());
    const matchPlan   = planFilter === "ALL" || o.plan === planFilter;
    const matchStatus = statusFilter === "ALL" || (statusFilter === "ACTIVE" ? o.isActive : !o.isActive);
    return matchSearch && matchPlan && matchStatus;
  });

  function setF(k: keyof OrgForm, v: string) {
    setForm(p => ({ ...p, [k]: v }));
    setCreateErr("");
  }

  async function createOrg() {
    if (!form.name || !form.subdomain || !form.adminName || !form.adminPhone || !form.adminPassword) {
      setCreateErr("Barcha majburiy maydonlar to'ldirilsin"); return;
    }
    setSaving(true); setCreateErr("");
    try {
      const res = await fetch("/api/admode/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, subdomain: form.subdomain, plan: form.plan,
          adminName: form.adminName, adminPhone: form.adminPhone,
          adminEmail: form.adminEmail || undefined, adminPassword: form.adminPassword,
        }),
      });
      const d = await res.json();
      if (!res.ok) { setCreateErr(d.error ?? "Xatolik"); return; }
      mutate();
      setShowCreate(false);
      setForm(EMPTY);
    } catch { setCreateErr("Serverga ulanib bo'lmadi"); }
    finally { setSaving(false); }
  }

  async function toggleActive(id: string, cur: boolean) {
    setTogglingId(id);
    try {
      await fetch(`/api/admode/organizations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !cur }),
      });
      mutate();
    } finally { setTogglingId(null); }
  }

  async function changePlan(id: string, plan: string) {
    await fetch(`/api/admode/organizations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    mutate();
  }

  async function resetAdminPassword() {
    if (!resetOrg || resetPass.length < 6) { setResetErr("Kamida 6 belgi kiriting"); return; }
    setResetSaving(true); setResetErr(""); setResetOk(false);
    try {
      const res = await fetch(`/api/admode/organizations/${resetOrg.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: resetPass }),
      });
      const d = await res.json();
      if (!res.ok) { setResetErr(d.error ?? "Xatolik"); return; }
      setResetOk(true);
      setTimeout(() => { setResetOrg(null); setResetPass(""); setResetOk(false); }, 1400);
    } catch { setResetErr("Serverga ulanib bo'lmadi"); }
    finally { setResetSaving(false); }
  }

  async function deleteOrg(id: string, name: string) {
    if (!confirm(`"${name}" tashkilotini o'chirasizmi? Bu amalni qaytarib bo'lmaydi!`)) return;
    setDeletingId(id);
    try {
      await fetch(`/api/admode/organizations/${id}`, { method: "DELETE" });
      mutate();
    } finally { setDeletingId(null); }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Password reset modal */}
      {resetOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-[15px] font-bold text-white">Admin parolini tiklash</h3>
                <p className="text-[12px] text-neutral-500 mt-0.5">{resetOrg.name} — Super Admin</p>
              </div>
              <button
                onClick={() => { setResetOrg(null); setResetPass(""); setResetErr(""); }}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-neutral-400 block mb-1.5">Yangi parol</label>
                <input
                  type="password"
                  placeholder="Kamida 6 belgi"
                  value={resetPass}
                  onChange={e => { setResetPass(e.target.value); setResetErr(""); }}
                  onKeyDown={e => e.key === "Enter" && resetAdminPassword()}
                  autoFocus
                  className="w-full h-10 px-3 bg-neutral-800 border border-neutral-700 rounded-xl text-[13px] text-white placeholder-neutral-600 outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              {resetErr && (
                <p className="text-[12px] text-red-400 bg-red-900/20 border border-red-900/40 rounded-lg px-3 py-2">{resetErr}</p>
              )}
              {resetOk && (
                <p className="text-[12px] text-green-400 bg-green-900/20 border border-green-900/40 rounded-lg px-3 py-2">
                  Parol muvaffaqiyatli yangilandi!
                </p>
              )}
              <div className="flex gap-2 pt-1">
                <button onClick={resetAdminPassword} disabled={resetSaving}
                  className="flex-1 h-9 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[13px] font-semibold rounded-xl transition-colors">
                  {resetSaving ? "Saqlanmoqda..." : "Yangilash"}
                </button>
                <button onClick={() => { setResetOrg(null); setResetPass(""); setResetErr(""); }}
                  className="h-9 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[13px] rounded-xl transition-colors">
                  Bekor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={e => e.target === e.currentTarget && (setShowCreate(false), setForm(EMPTY), setCreateErr(""))}>
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 sticky top-0 bg-neutral-900 z-10">
              <div>
                <h2 className="font-bold text-[15px] text-white">Yangi tashkilot</h2>
                <p className="text-[11px] text-neutral-500 mt-0.5">Yangi o'quv markaz va admin qo'shish</p>
              </div>
              <button onClick={() => { setShowCreate(false); setForm(EMPTY); setCreateErr(""); }}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-neutral-800 text-neutral-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Org info */}
              <div className="space-y-3">
                <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Markaz ma'lumotlari</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Markaz nomi" required>
                    <input className={inputCls} placeholder="Yulduz Academy" value={form.name} onChange={e => setF("name", e.target.value)} />
                  </Field>
                  <Field label="Subdomain" required>
                    <div className="flex h-9 rounded-lg border border-neutral-700 bg-neutral-800 overflow-hidden focus-within:border-blue-500 transition-colors">
                      <input
                        className="flex-1 px-3 text-[13px] bg-transparent text-white placeholder-neutral-600 outline-none"
                        placeholder="yulduz"
                        value={form.subdomain}
                        onChange={e => setF("subdomain", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      />
                      <span className="px-2 text-[10px] text-neutral-500 self-center whitespace-nowrap border-l border-neutral-700">.oneroom.uz</span>
                    </div>
                  </Field>
                </div>
                <Field label="Tarif rejasi">
                  <div className="grid grid-cols-3 gap-2">
                    {PLANS.map(p => (
                      <button key={p} onClick={() => setF("plan", p)}
                        className={cn(
                          "py-2 rounded-lg text-[12px] font-semibold border transition-all",
                          form.plan === p ? "bg-blue-600 border-blue-600 text-white" : "border-neutral-700 text-neutral-400 hover:border-neutral-600 hover:text-neutral-300"
                        )}>
                        {PLAN_CFG[p].label}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>

              {/* Admin info */}
              <div className="space-y-3 pt-2 border-t border-neutral-800">
                <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Admin ma'lumotlari</p>
                <Field label="To'liq ism" required>
                  <input className={inputCls} placeholder="Rahimov Jamshid" value={form.adminName} onChange={e => setF("adminName", e.target.value)} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Telefon" required>
                    <input className={inputCls} type="tel" placeholder="+998901234567" value={form.adminPhone} onChange={e => setF("adminPhone", e.target.value)} />
                  </Field>
                  <Field label="Parol" required>
                    <input className={inputCls} type="password" placeholder="min 6 belgi" value={form.adminPassword} onChange={e => setF("adminPassword", e.target.value)} />
                  </Field>
                </div>
                <Field label="Email (ixtiyoriy)">
                  <input className={inputCls} type="email" placeholder="admin@email.com" value={form.adminEmail} onChange={e => setF("adminEmail", e.target.value)} />
                </Field>
              </div>

              {createErr && (
                <div className="flex items-center gap-2 bg-red-900/20 border border-red-800/40 rounded-xl px-3 py-2.5">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <p className="text-[12px] text-red-400">{createErr}</p>
                </div>
              )}
            </div>

            <div className="px-6 pb-6 flex gap-2">
              <button onClick={createOrg} disabled={saving}
                className="flex-1 h-10 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[13px] font-bold rounded-xl transition-colors">
                {saving ? "Yaratilmoqda..." : "Tashkilot yaratish"}
              </button>
              <button onClick={() => { setShowCreate(false); setForm(EMPTY); setCreateErr(""); }}
                className="px-4 h-10 border border-neutral-700 rounded-xl text-[13px] text-neutral-400 hover:bg-neutral-800 transition-colors">
                Bekor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-black text-white">Tashkilotlar</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{orgs.length} ta markaz ro'yxatda</p>
        </div>
        <button onClick={() => { setForm(EMPTY); setCreateErr(""); setShowCreate(true); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-[13px] text-white font-semibold transition-colors">
          <Plus className="w-4 h-4" />
          Yangi markaz
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
          <input
            className="w-full h-9 pl-8 pr-3 text-[13px] rounded-xl border border-neutral-700 bg-neutral-900 text-white placeholder-neutral-600 outline-none focus:border-neutral-600 transition-colors"
            placeholder="Markaz nomi yoki subdomain..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select value={planFilter} onChange={e => setPlanFilter(e.target.value)}
          className="h-9 px-3 text-[12px] rounded-xl border border-neutral-700 bg-neutral-900 text-neutral-300 outline-none focus:border-neutral-600 cursor-pointer">
          <option value="ALL">Barcha tariflar</option>
          <option value="STARTER">Starter</option>
          <option value="BUSINESS">Business</option>
          <option value="PREMIUM">Premium</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="h-9 px-3 text-[12px] rounded-xl border border-neutral-700 bg-neutral-900 text-neutral-300 outline-none focus:border-neutral-600 cursor-pointer">
          <option value="ALL">Barcha holatlar</option>
          <option value="ACTIVE">Faol</option>
          <option value="BLOCKED">Bloklangan</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/80">
                {["Tashkilot", "Tarif", "O'quvchi", "O'qituvchi", "Guruh", "Daromad", "Holat", "Qo'shilgan", "Amallar"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-neutral-800/50">
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} className="px-4 py-3.5"><Skeleton className="h-3.5 w-full" /></td>
                      ))}
                    </tr>
                  ))
                : filtered.map(org => {
                    const plan = PLAN_CFG[org.plan as keyof typeof PLAN_CFG] ?? PLAN_CFG.BASIC;
                    return (
                      <tr key={org.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/20 transition-colors">
                        {/* Name */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-blue-900/30 border border-blue-900/40 flex items-center justify-center shrink-0">
                              <Building2 className="w-3.5 h-3.5 text-blue-400" />
                            </div>
                            <div>
                              <p className="text-[13px] font-semibold text-white">{org.name}</p>
                              <div className="flex items-center gap-1">
                                <p className="text-[10px] text-neutral-500">{org.subdomain}.oneroom.uz</p>
                                <a href={`https://${org.subdomain}.oneroom.uz`} target="_blank" rel="noopener noreferrer"
                                  className="text-neutral-600 hover:text-neutral-400 transition-colors">
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              </div>
                            </div>
                          </div>
                        </td>
                        {/* Plan */}
                        <td className="px-4 py-3.5">
                          <select value={org.plan} onChange={e => changePlan(org.id, e.target.value)}
                            className={cn("text-[10px] font-bold px-2 py-1 rounded-full border-0 outline-none cursor-pointer", plan.cls)}>
                            {PLANS.map(p => (
                              <option key={p} value={p}>{PLAN_CFG[p].label}</option>
                            ))}
                          </select>
                        </td>
                        {/* Stats */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1">
                            <GraduationCap className="w-3 h-3 text-green-500" />
                            <span className="text-[13px] font-bold text-green-400">{org._count.students}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-purple-500" />
                            <span className="text-[13px] font-bold text-purple-400">{org._count.teachers}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-[13px] font-semibold text-neutral-300">{org._count.groups}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-emerald-500" />
                            <span className="text-[12px] font-bold text-emerald-400">{fmtShort(org.revenue)}</span>
                          </div>
                        </td>
                        {/* Status */}
                        <td className="px-4 py-3.5">
                          {org.isActive
                            ? <div className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /><span className="text-[11px] text-emerald-400 font-medium">Faol</span></div>
                            : <div className="flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5 text-red-400" /><span className="text-[11px] text-red-400 font-medium">Blok</span></div>
                          }
                        </td>
                        {/* Date */}
                        <td className="px-4 py-3.5">
                          <span className="text-[11px] text-neutral-500">
                            {new Date(org.createdAt).toLocaleDateString("uz-UZ")}
                          </span>
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => { setResetOrg(org); setResetPass(""); setResetErr(""); setResetOk(false); }}
                              title="Admin parolini tiklash"
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-neutral-800 hover:bg-amber-900/30 text-neutral-500 hover:text-amber-400 transition-colors">
                              <KeyRound className="w-3 h-3" />
                            </button>
                            <button onClick={() => toggleActive(org.id, org.isActive)} disabled={togglingId === org.id}
                              className={cn(
                                "text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-colors disabled:opacity-40",
                                org.isActive
                                  ? "bg-red-900/30 text-red-400 hover:bg-red-900/50"
                                  : "bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50"
                              )}>
                              {togglingId === org.id ? "..." : org.isActive ? "Bloklash" : "Ochish"}
                            </button>
                            <button onClick={() => deleteOrg(org.id, org.name)} disabled={deletingId === org.id}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-neutral-800 hover:bg-red-900/30 text-neutral-500 hover:text-red-400 transition-colors disabled:opacity-40">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
              }
            </tbody>
          </table>

          {!isLoading && filtered.length === 0 && (
            <div className="py-16 text-center">
              <Building2 className="w-8 h-8 mx-auto mb-2 text-neutral-700" />
              <p className="text-[13px] text-neutral-600 mb-3">
                {orgs.length === 0 ? "Hali tashkilot qo'shilmagan" : "Filtr bo'yicha natija topilmadi"}
              </p>
              {orgs.length === 0 && (
                <button onClick={() => { setForm(EMPTY); setCreateErr(""); setShowCreate(true); }}
                  className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Birinchi markazni yaratish
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
