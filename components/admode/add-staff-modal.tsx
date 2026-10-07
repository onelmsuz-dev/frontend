"use client";

/**
 * ISTALGAN MARKAZGA XODIM QO'SHISH — platforma admini uchun (2026-10-06).
 *
 * Ilgari platforma admini markazga xodim qo'sha olmasdi: markaz egasidan
 * so'rash yoki uning hisobiga kirish kerak edi. Endi admode'dan bitta oyna:
 * markaz → ism, telefon → rol (markazning O'Z rollari ham) → filial → parol.
 * Server markazning o'zidagi "Xodim qo'shish" bilan AYNAN bir xil qoidalarni
 * qo'llaydi (telefon bandligi, tarif limiti, rol va filial tekshiruvi).
 *
 * Qo'shilgach login ma'lumotlari bir bosishda nusxalanadi — kassirga yoki
 * markaz egasiga Telegramda yuborish uchun.
 */

import { useState } from "react";
import useSWR from "swr";
import { X, Copy, Check, KeyRound, UserPlus, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export interface AdmodeOrg { id: string; name: string; subdomain: string }

interface StaffOptions {
  org: AdmodeOrg;
  staffRoles: { id: string; name: string }[];
  branches: { id: string; name: string }[];
  /** `max` — tarif + qo'shimcha o'rinlar (`extra`), server hisoblaydi. */
  limit: { used: number; max: number; extra: number; plan: string; isDemo: boolean };
}

/** Standart (eski) rollar — markazda maxsus rol bo'lmasa ham tanlash mumkin. */
const STANDART_ROLLAR = [
  { value: "RECEPTIONIST", label: "Qabulxona" },
  { value: "ACCOUNTANT",   label: "Buxgalter" },
  { value: "SUPER_ADMIN",  label: "Markaz egasi (Super Admin)" },
];

/** Adashtiradigan belgilarsiz (0/O, 1/l/I) 8 belgilik parol. */
function parolYarat(): string {
  const harflar = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const tasodif = new Uint32Array(8);
  crypto.getRandomValues(tasodif);
  return Array.from(tasodif, (n) => harflar[n % harflar.length]).join("");
}

const inputCls =
  "w-full h-10 px-3 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 " +
  "rounded-xl text-[13px] text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 " +
  "outline-none focus:border-blue-500 transition-colors";
const labelCls = "text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 block mb-1.5";

interface Props {
  orgs: AdmodeOrg[];
  /** Qaysi markazdan ochildi — bo'sh bo'lsa admin o'zi tanlaydi. */
  initialOrgId?: string;
  onClose: () => void;
  /** Xodim qo'shilgach — ro'yxatni yangilash uchun. */
  onDone: () => void;
}

export function AddStaffModal({ orgs, initialOrgId = "", onClose, onDone }: Props) {
  const [orgId, setOrgId]       = useState(initialOrgId);
  const [name, setName]         = useState("");
  const [phone, setPhone]       = useState("");
  const [rol, setRol]           = useState("");          // "STAFF:<id>" yoki standart rol
  const [filiallar, setFiliallar] = useState<string[]>([]);
  const [parol, setParol]       = useState("");
  const [korinsin, setKorinsin] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState("");
  const [tayyor, setTayyor]     = useState<{ name: string; phone: string; parol: string; org: AdmodeOrg; rol: string } | null>(null);
  const [nusxa, setNusxa]       = useState(false);

  const { data: opts, isLoading } = useSWR<StaffOptions>(
    orgId ? `/api/admode/organizations/${orgId}/staff-options` : null, fetcher);

  // Rol tanlanmagan bo'lsa — markazning birinchi maxsus roli, bo'lmasa qabulxona.
  const tanlanganRol = rol || (opts?.staffRoles?.[0] ? `STAFF:${opts.staffRoles[0].id}` : "RECEPTIONIST");
  const egami = tanlanganRol === "SUPER_ADMIN";
  const limitToldi = !!opts && !opts.limit.isDemo && opts.limit.used >= opts.limit.max;
  const raqamlar = phone.replace(/\D/g, "");

  function markazAlmash(id: string) {
    setOrgId(id); setRol(""); setFiliallar([]); setErr("");
  }

  async function saqlash() {
    if (!orgId) { setErr("Markazni tanlang"); return; }
    if (name.trim().length < 2) { setErr("Ismni kiriting"); return; }
    if (raqamlar.length < 9) { setErr("Telefon raqamini to'liq kiriting"); return; }
    if (egami && parol.length < 6) { setErr("Markaz egasi uchun parol majburiy (kamida 6 belgi)"); return; }
    if (parol && parol.length < 6) { setErr("Parol kamida 6 belgi bo'lsin yoki bo'sh qoldiring"); return; }
    setSaving(true); setErr("");
    try {
      const [role, staffRoleId] = tanlanganRol.startsWith("STAFF:")
        ? ["STAFF", tanlanganRol.slice(6)] : [tanlanganRol, undefined];
      const res = await fetch(`/api/admode/organizations/${orgId}/staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(), phone: raqamlar, role,
          ...(staffRoleId ? { staffRoleId } : {}),
          ...(filiallar.length ? { branchIds: filiallar } : {}),
          ...(parol ? { password: parol } : {}),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setErr(data?.error ?? "Xatolik yuz berdi"); return; }
      const rolNomi = data?.staffRole?.name
        ?? STANDART_ROLLAR.find((r) => r.value === role)?.label ?? role;
      setTayyor({ name: data?.name ?? name.trim(), phone: data?.phone ?? raqamlar, parol,
                  org: opts?.org ?? orgs.find((o) => o.id === orgId)!, rol: rolNomi });
      onDone();
    } catch { setErr("Serverga ulanib bo'lmadi"); }
    finally { setSaving(false); }
  }

  function yanaQoshish() {
    setTayyor(null); setName(""); setPhone(""); setParol(""); setKorinsin(false); setNusxa(false); setErr("");
  }

  // Parolsiz xodim tizimga kirmaydi — unga login havolasi yuborishning ma'nosi yo'q.
  const loginMatni = tayyor && (tayyor.parol
    ? [`${tayyor.org.name} — ${tayyor.rol}`,
       `Kirish: https://${tayyor.org.subdomain}.oneroom.uz/login`,
       `Login: ${tayyor.phone}`,
       `Parol: ${tayyor.parol}`]
    : [`${tayyor.org.name} — ${tayyor.rol}`, `Telefon: ${tayyor.phone}`]
  ).join("\n");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md max-h-[92dvh] overflow-y-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-2xl" data-xodim-oyna>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-blue-600" />
            <h3 className="text-[15px] font-bold text-neutral-900 dark:text-white">Xodim qo&apos;shish</h3>
          </div>
          <button onClick={onClose} aria-label="Yopish"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {tayyor ? (
          <div className="space-y-3" data-xodim-tayyor>
            <p className="text-[13px] text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/40 rounded-xl px-3 py-2.5">
              <b>{tayyor.name}</b>{" "}qo&apos;shildi.
              {tayyor.parol ? " Login ma'lumotlarini yuboring." : " Parol berilmadi — u tizimga kirmaydi, faqat ro'yxat va maosh uchun."}
            </p>
            <pre className="text-[12px] whitespace-pre-wrap bg-neutral-100 dark:bg-neutral-800 rounded-xl px-3 py-2.5 text-neutral-800 dark:text-neutral-200">{loginMatni}</pre>
            <div className="flex gap-2">
              {tayyor.parol && (
                <button
                  onClick={async () => { try { await navigator.clipboard.writeText(loginMatni ?? ""); setNusxa(true); } catch { /* ruxsat yo'q */ } }}
                  className="flex-1 h-9 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-semibold rounded-xl transition-colors">
                  {nusxa ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {nusxa ? "Nusxalandi" : "Nusxalash"}
                </button>
              )}
              <button onClick={yanaQoshish}
                className={cn("h-9 px-3 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-[13px] rounded-xl transition-colors",
                  !tayyor.parol && "flex-1")}>
                Yana qo&apos;shish
              </button>
              <button onClick={onClose}
                className="h-9 px-3 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-[13px] rounded-xl transition-colors">
                Yopish
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Markaz</label>
              <select value={orgId} onChange={(e) => markazAlmash(e.target.value)} className={inputCls} data-markaz>
                <option value="">Tanlang…</option>
                {orgs.map((o) => <option key={o.id} value={o.id}>{o.name} · {o.subdomain}</option>)}
              </select>
              {opts?.limit && (
                <p className={cn("text-[11px] mt-1.5", limitToldi ? "text-red-600 dark:text-red-400" : "text-neutral-500")} data-limit>
                  {opts.limit.isDemo
                    ? "Demo markaz — xodim limiti yo'q"
                    : `Xodimlar: ${opts.limit.used} / ${opts.limit.max} · ${opts.limit.plan} tarifi` +
                      (opts.limit.extra > 0 ? ` + ${opts.limit.extra} qo'shimcha` : "")}
                  {limitToldi && " — limit to'lgan: Tashkilotlar bo'limida qo'shimcha o'rin oching yoki tarifni oshiring"}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Ism</label>
                <input value={name} onChange={(e) => { setName(e.target.value); setErr(""); }}
                  placeholder="Ism Familiya" className={inputCls} autoFocus={!!initialOrgId} />
              </div>
              <div>
                <label className={labelCls}>Telefon (login)</label>
                <input value={phone} onChange={(e) => { setPhone(e.target.value); setErr(""); }}
                  inputMode="tel" placeholder="90 123 45 67" className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Rol</label>
              {orgId && isLoading ? (
                <p className="text-[12px] text-neutral-400">Yuklanmoqda…</p>
              ) : (
                <div className="flex flex-wrap gap-1.5" data-rollar>
                  {[...(opts?.staffRoles ?? []).map((r) => ({ value: `STAFF:${r.id}`, label: r.name })), ...STANDART_ROLLAR].map((r) => (
                    <button key={r.value} type="button" onClick={() => { setRol(r.value); setErr(""); }}
                      className={cn("px-2.5 h-8 rounded-lg text-[12px] font-semibold border transition-colors",
                        tanlanganRol === r.value
                          ? "bg-blue-600 text-white border-blue-600"
                          : "border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-blue-400")}>
                      {r.label}
                    </button>
                  ))}
                </div>
              )}
              {opts && opts.staffRoles.length === 0 && (
                <p className="text-[11px] text-neutral-400 mt-1.5">Bu markazda maxsus rol yo&apos;q — standart rollar tanlanadi.</p>
              )}
            </div>

            {(opts?.branches.length ?? 0) > 1 && (
              <div>
                <label className={labelCls}>Filiallar</label>
                <div className="flex flex-wrap gap-1.5">
                  {opts!.branches.map((b) => {
                    const bor = filiallar.includes(b.id);
                    return (
                      <button key={b.id} type="button"
                        onClick={() => setFiliallar((f) => (bor ? f.filter((x) => x !== b.id) : [...f, b.id]))}
                        className={cn("px-2.5 h-8 rounded-lg text-[12px] font-semibold border transition-colors",
                          bor ? "bg-blue-600 text-white border-blue-600"
                              : "border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-blue-400")}>
                        {b.name}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-neutral-400 mt-1.5">Hech biri tanlanmasa — barcha filiallar.</p>
              </div>
            )}

            <div>
              <label className={labelCls}>Parol {egami ? "(majburiy)" : "(ixtiyoriy)"}</label>
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <input type={korinsin ? "text" : "password"} value={parol}
                    onChange={(e) => { setParol(e.target.value); setErr(""); }}
                    placeholder={egami ? "Kamida 6 belgi" : "Bo'sh — tizimga kirmaydi"}
                    className={cn(inputCls, "pr-9")} />
                  <button type="button" onClick={() => setKorinsin((v) => !v)} aria-label="Parolni ko'rsatish"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">
                    {korinsin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button type="button" onClick={() => { setParol(parolYarat()); setKorinsin(true); setErr(""); }}
                  className="h-10 px-3 flex items-center gap-1 rounded-xl text-[12px] font-semibold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors">
                  <KeyRound className="w-3.5 h-3.5" />{" "}Yaratish
                </button>
              </div>
            </div>

            {err && (
              <p className="text-[12px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-lg px-3 py-2" data-xato>
                {err}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button onClick={saqlash} disabled={saving || limitToldi || !orgId}
                className="flex-1 h-9 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[13px] font-semibold rounded-xl transition-colors">
                {saving ? "Saqlanmoqda..." : "Qo'shish"}
              </button>
              <button onClick={onClose}
                className="h-9 px-4 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-[13px] rounded-xl transition-colors">
                Bekor
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
