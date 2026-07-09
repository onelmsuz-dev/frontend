"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { cn } from "@/lib/utils";
import { Search, KeyRound, ShieldOff, ShieldCheck, X } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  SUPER_ADMIN:  { label: "Super Admin",  color: "bg-red-900/40 text-red-300" },
  TEACHER:      { label: "O'qituvchi",   color: "bg-green-900/40 text-green-300" },
  RECEPTIONIST: { label: "Qabulxona",    color: "bg-blue-900/40 text-blue-300" },
  ACCOUNTANT:   { label: "Buxgalter",    color: "bg-purple-900/40 text-purple-300" },
};

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-800 rounded", className)} />;
}

export default function AdmodeUsersPage() {
  const [q, setQ]           = useState("");
  const [resetUser, setResetUser]     = useState<any>(null);
  const [newPass,   setNewPass]       = useState("");
  const [saving,    setSaving]        = useState(false);
  const [saveErr,   setSaveErr]       = useState("");
  const [saveOk,    setSaveOk]        = useState(false);

  const url = `/api/admode/users${q ? `?q=${encodeURIComponent(q)}` : ""}`;
  const { data, isLoading } = useSWR(url, fetcher);
  const users: any[] = Array.isArray(data) ? data : [];

  // Group by organization
  const byOrg: Record<string, { orgName: string; subdomain: string; users: any[] }> = {};
  for (const u of users) {
    const key = u.organizationId ?? "no-org";
    if (!byOrg[key]) {
      byOrg[key] = {
        orgName:   u.organization?.name ?? "—",
        subdomain: u.organization?.subdomain ?? "",
        users:     [],
      };
    }
    byOrg[key].users.push(u);
  }

  async function submitReset() {
    if (!resetUser) return;
    if (newPass.length < 6) { setSaveErr("Kamida 6 belgi kiriting"); return; }
    setSaving(true); setSaveErr(""); setSaveOk(false);
    try {
      const res = await fetch(`/api/admode/users/${resetUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPass }),
      });
      const json = await res.json();
      if (!res.ok) { setSaveErr(json.error ?? "Xatolik"); return; }
      setSaveOk(true);
      setTimeout(() => { setResetUser(null); setNewPass(""); setSaveOk(false); }, 1200);
      mutate(url);
    } catch { setSaveErr("Serverga ulanib bo'lmadi"); }
    finally { setSaving(false); }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-white">Foydalanuvchilar</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Barcha tashkilot hodimlarini boshqaring</p>
        </div>
        <span className="text-[12px] text-neutral-500 bg-neutral-800 px-3 py-1.5 rounded-lg">
          {isLoading ? "..." : `${users.length} ta hodim`}
        </span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Ism yoki telefon qidiring..."
          className="w-full h-10 pl-9 pr-4 bg-neutral-900 border border-neutral-800 rounded-xl text-[13px] text-white placeholder-neutral-600 outline-none focus:border-blue-600 transition-colors"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-neutral-600">
          <p className="text-sm">Hodim topilmadi</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byOrg).map(([key, group]) => (
            <div key={key}>
              {/* Org header */}
              <div className="flex items-center gap-2 mb-2">
                <p className="text-[12px] font-bold text-neutral-300">{group.orgName}</p>
                <span className="text-[10px] text-neutral-600">{group.subdomain}.oneroom.uz</span>
                <span className="text-[10px] text-neutral-600 ml-auto">{group.users.length} ta</span>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                {group.users.map((u, i) => {
                  const roleCfg = ROLE_LABELS[u.role] ?? { label: u.role, color: "bg-neutral-800 text-neutral-400" };
                  return (
                    <div key={u.id}
                      className={cn(
                        "flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors",
                        i < group.users.length - 1 && "border-b border-neutral-800"
                      )}>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-bold shrink-0",
                          u.isActive ? "bg-blue-600" : "bg-neutral-700"
                        )}>
                          {u.name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-[13px] font-semibold text-white">{u.name}</p>
                            {!u.isActive && (
                              <span className="text-[9px] font-bold bg-red-900/40 text-red-400 px-1.5 py-0.5 rounded">Bloklangan</span>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-500">{u.phone}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", roleCfg.color)}>
                          {roleCfg.label}
                        </span>
                        <button
                          onClick={() => { setResetUser(u); setNewPass(""); setSaveErr(""); setSaveOk(false); }}
                          title="Parolni tiklash"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-500 hover:text-amber-400 hover:bg-amber-900/20 transition-colors">
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Password reset modal */}
      {resetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-[15px] font-bold text-white">Parolni tiklash</h3>
                <p className="text-[12px] text-neutral-500 mt-0.5">{resetUser.name} · {resetUser.phone}</p>
              </div>
              <button
                onClick={() => { setResetUser(null); setNewPass(""); setSaveErr(""); }}
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
                  value={newPass}
                  onChange={e => { setNewPass(e.target.value); setSaveErr(""); }}
                  onKeyDown={e => e.key === "Enter" && submitReset()}
                  autoFocus
                  className="w-full h-10 px-3 bg-neutral-800 border border-neutral-700 rounded-xl text-[13px] text-white placeholder-neutral-600 outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {saveErr && (
                <p className="text-[12px] text-red-400 bg-red-900/20 border border-red-900/40 rounded-lg px-3 py-2">
                  {saveErr}
                </p>
              )}

              {saveOk && (
                <p className="text-[12px] text-green-400 bg-green-900/20 border border-green-900/40 rounded-lg px-3 py-2">
                  Parol muvaffaqiyatli yangilandi!
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={submitReset}
                  disabled={saving}
                  className="flex-1 h-9 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[13px] font-semibold rounded-xl transition-colors">
                  {saving ? "Saqlanmoqda..." : "Yangilash"}
                </button>
                <button
                  onClick={() => { setResetUser(null); setNewPass(""); setSaveErr(""); }}
                  className="h-9 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[13px] rounded-xl transition-colors">
                  Bekor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
