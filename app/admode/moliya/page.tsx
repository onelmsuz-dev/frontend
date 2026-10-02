"use client";

import { useMemo, useState } from "react";
import useSWR, { mutate } from "swr";
import {
  ArrowDownRight, ArrowUpRight, Building2, ChevronLeft, ChevronRight, Coins,
  Minus, Pencil, Plus, RefreshCw, Trash2, TrendingDown, TrendingUp, Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetcher } from "@/lib/fetcher";
import { formatCurrency } from "@/lib/money";
import { UZ_MONTHS } from "@/lib/date-uz";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { DatePicker } from "@/components/ui/date-picker";
import { Segmented } from "@/components/ui/segmented";
import { Modal, ConfirmDeleteModal } from "@/components/ui/modal";
import { LedgerChart, qisqaSumma, useSeriesColors, type OyQatori } from "@/components/admode/ledger-chart";

/**
 * FOYDA VA XARAJATLAR — platformaning o'z puli, qo'lda (2026-10-02).
 *
 * Jamoa buni Telegram'da yuritardi ("4$ (48 000) DigitalOcean oktabr.
 * Umumiy: 971 000"). Endi bitta jadval: har qator = bitta haqiqiy pul
 * harakati. Tepada hisobot (shu oy, o'tgan oy bilan farq, 12 oy, umumiy),
 * pastda tez qo'shish formasi va oyning yozuvlari.
 */

type Kind = "DAROMAD" | "XARAJAT";
interface Entry {
  id: string; kind: Kind; date: string; amount: number; usdAmount: number | null;
  category: string; note: string; organization: { id: string; name: string } | null;
  createdByName: string; createdAt: string;
}
interface Summary {
  month: string;
  joriy: { daromad: number; xarajat: number; foyda: number };
  oldingi: { daromad: number; xarajat: number; foyda: number };
  oylar: OyQatori[];
  kategoriyalar: { kind: Kind; category: string; amount: number }[];
  umumiy: { daromad: number; xarajat: number; foyda: number; xarajatUsd: number; qatorlar: number };
  kategoriyaTakliflari: Record<Kind, string[]>;
}

const TAKLIF: Record<Kind, string[]> = {
  XARAJAT: ["Server (DigitalOcean)", "Domen", "SMS shlyuzi (Eskiz)", "Reklama", "Maosh", "Xizmatlar", "Boshqa"],
  DAROMAD: ["Obuna to'lovi", "SMS paketi", "O'rnatish va sozlash", "Boshqa"],
};
const KIND_OPTS = [
  { value: "XARAJAT", label: "Xarajat" },
  { value: "DAROMAD", label: "Daromad" },
] as const;

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const joriyOy = () => today().slice(0, 7);
const oyQoshish = (m: string, n: number) => {
  const [y, mm] = m.split("-").map(Number);
  const d = new Date(Date.UTC(y, mm - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};
const oyNomi = (m: string) => {
  const [y, mm] = m.split("-").map(Number);
  return `${UZ_MONTHS[mm - 1]} ${y}`;
};
const kunNomi = (iso: string) => {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${UZ_MONTHS[m - 1]?.slice(0, 3).toLowerCase() ?? ""}`;
};
const inputCls = "w-full h-10 px-3 text-[13px] rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 outline-none focus:border-indigo-400 transition-colors";

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded-lg", className)} />;
}

/** Stat tile: yorliq, qiymat, o'tgan oyga nisbatan farq. */
function Tile({ label, value, delta, yaxshi, icon: Icon, ton, sub, loading }: {
  label: string; value: number; delta?: number | null; yaxshi?: "oshsa" | "kamaysa";
  icon: typeof Wallet; ton: string; sub?: string; loading?: boolean;
}) {
  const yon = delta == null ? null : delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  const foyda = yon === "flat" || yon === null ? null
    : (yon === "up") === (yaxshi === "oshsa");
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div className={cn("w-9 h-9 rounded-xl grid place-items-center", ton)}><Icon className="w-4 h-4" /></div>
        {yon && (
          <span className={cn("inline-flex items-center gap-0.5 text-[11px] font-semibold rounded-full px-2 py-0.5",
            foyda === null ? "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
              : foyda ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400")}>
            {yon === "up" ? <ArrowUpRight className="w-3 h-3" /> : yon === "down" ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {yon === "flat" ? "o'zgarmadi" : `${Math.abs(delta!).toFixed(0)}%`}
          </span>
        )}
      </div>
      {loading ? <Skeleton className="h-7 w-28 mt-3" /> : (
        <p className={cn("mt-3 text-[22px] font-black leading-none", value < 0 ? "text-rose-600 dark:text-rose-400" : "text-neutral-900 dark:text-white")}
          title={formatCurrency(value)}>
          {qisqaSumma(value)}
        </p>
      )}
      <p className="text-[11px] text-neutral-500 mt-1.5">{label}</p>
      {sub && <p className="text-[10.5px] text-neutral-400 mt-0.5 truncate" title={sub}>{sub}</p>}
    </div>
  );
}

const foiz = (hozir: number, oldin: number): number | null =>
  oldin === 0 ? (hozir === 0 ? 0 : null) : ((hozir - oldin) / Math.abs(oldin)) * 100;

/** Yozuv formasi — yangi va tahrirlash uchun bitta. */
function EntryForm({ initial, takliflar, orgs, onDone, onCancel }: {
  initial?: Entry | null;
  takliflar: Record<Kind, string[]>;
  orgs: { id: string; name: string }[];
  onDone: () => void; onCancel?: () => void;
}) {
  const [kind, setKind] = useState<Kind>(initial?.kind ?? "XARAJAT");
  const [date, setDate] = useState(initial?.date ?? today());
  const [category, setCategory] = useState(initial?.category ?? "");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [usd, setUsd] = useState(initial?.usdAmount ? String(initial.usdAmount) : "");
  const [kurs, setKurs] = useState(initial?.usdAmount ? String(Math.round(initial.amount / initial.usdAmount)) : "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [orgId, setOrgId] = useState(initial?.organization?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const son = (s: string) => Number(s.replace(/[^\d.]/g, ""));
  // USD × kurs → so'm (ikkalasi yozilganda); so'm maydoni qo'lda ham o'zgartiriladi.
  const valyuta = (u: string, k: string) => {
    setUsd(u); setKurs(k);
    if (son(u) > 0 && son(k) > 0) setAmount(String(Math.round(son(u) * son(k))));
  };
  const takliflarHammasi = useMemo(
    () => [...new Set([...(takliflar[kind] ?? []), ...TAKLIF[kind]])],
    [takliflar, kind]);

  async function save() {
    const a = Math.round(son(amount));
    if (!category.trim()) { setErr("Kategoriyani yozing"); return; }
    if (!(a > 0)) { setErr("Summani kiriting (so'mda, 0 dan katta)"); return; }
    setSaving(true); setErr("");
    try {
      const body = {
        kind, date, category: category.trim(), amount: a, note: note.trim(),
        usdAmount: son(usd) > 0 ? son(usd) : null,
        organizationId: kind === "DAROMAD" && orgId ? orgId : null,
      };
      const r = await fetch(initial ? `/api/admode/ledger/${initial.id}` : "/api/admode/ledger", {
        method: initial ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setErr(d?.error ?? "Saqlab bo'lmadi"); return; }
      onDone();
      if (!initial) { setCategory(""); setAmount(""); setUsd(""); setKurs(""); setNote(""); setOrgId(""); }
    } catch { setErr("Serverga ulanib bo'lmadi"); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Turi">
          <Segmented options={KIND_OPTS} value={kind} onChange={(v) => { setKind(v); setCategory(""); }} grid />
        </FormField>
        <FormField label="Sana">
          <DatePicker value={date} onChange={setDate} max={today()} />
        </FormField>
      </div>
      <FormField label="Kategoriya" required hint="Ro'yxatdan tanlang yoki o'zingiz yozing">
        <input list={`kat-${kind}`} value={category} onChange={(e) => setCategory(e.target.value)}
          placeholder={kind === "XARAJAT" ? "Server (DigitalOcean)" : "Obuna to'lovi"} className={inputCls} maxLength={40} />
        <datalist id={`kat-${kind}`}>{takliflarHammasi.map((k) => <option key={k} value={k} />)}</datalist>
      </FormField>
      <div className="grid grid-cols-3 gap-3">
        <FormField label="USD" hint="Ixtiyoriy">
          <Input inputMode="decimal" value={usd} onChange={(e) => valyuta(e.target.value, kurs)} placeholder="4" className="h-10" />
        </FormField>
        <FormField label="Kurs" hint="1 $ necha so'm">
          <Input inputMode="numeric" value={kurs} onChange={(e) => valyuta(usd, e.target.value)} placeholder="12 000" className="h-10" />
        </FormField>
        <FormField label="Summa, so'm" required>
          <Input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="48 000" className="h-10 font-semibold" />
        </FormField>
      </div>
      {kind === "DAROMAD" && (
        <FormField label="Qaysi markazdan" hint="Ixtiyoriy">
          <select value={orgId} onChange={(e) => setOrgId(e.target.value)} className={inputCls}>
            <option value="">Markazga bog&apos;lanmagan</option>
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </FormField>
      )}
      <FormField label="Izoh">
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Masalan: oktabr oyi uchun" className="h-10" maxLength={300} />
      </FormField>
      {err && <p className="text-[12px] text-red-600 dark:text-red-400">{err}</p>}
      <div className="flex gap-2 pt-1">
        <Button onClick={save} disabled={saving} className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 text-white text-[13px]">
          {saving ? "Saqlanmoqda..." : initial ? "Saqlash" : <><Plus className="w-4 h-4 mr-1" />Qo&apos;shish</>}
        </Button>
        {onCancel && <Button variant="outline" className="h-10 px-4 text-[13px]" onClick={onCancel}>Bekor</Button>}
      </div>
    </div>
  );
}

export default function AdmodeMoliyaPage() {
  const [month, setMonth] = useState(joriyOy);
  const [filtr, setFiltr] = useState<"hammasi" | Kind>("hammasi");
  const [edit, setEdit] = useState<Entry | null>(null);
  const [del, setDel] = useState<Entry | null>(null);
  const [deleting, setDeleting] = useState(false);
  const colors = useSeriesColors();

  const summaryKey = `/api/admode/ledger/summary?month=${month}`;
  const listKey = `/api/admode/ledger?month=${month}${filtr === "hammasi" ? "" : `&kind=${filtr}`}`;
  const { data: s, isLoading: sLoading } = useSWR<Summary>(summaryKey, fetcher);
  const { data: rows, isLoading: rLoading } = useSWR<Entry[]>(listKey, fetcher, { keepPreviousData: true });
  const { data: orgsRaw } = useSWR<{ id: string; name: string }[]>("/api/admode/organizations", fetcher);
  const orgs = useMemo(() => (Array.isArray(orgsRaw) ? orgsRaw.map((o) => ({ id: o.id, name: o.name })) : []), [orgsRaw]);

  const yangila = () => { void mutate(summaryKey); void mutate((k) => typeof k === "string" && k.startsWith("/api/admode/ledger?")); };

  async function ochir() {
    if (!del) return;
    setDeleting(true);
    try {
      const r = await fetch(`/api/admode/ledger/${del.id}`, { method: "DELETE" });
      if (r.ok) { setDel(null); yangila(); }
    } finally { setDeleting(false); }
  }

  const list = useMemo(() => (Array.isArray(rows) ? rows : []), [rows]);
  const oyJami = useMemo(() => list.reduce((acc, r) => {
    if (r.kind === "DAROMAD") acc.daromad += r.amount; else acc.xarajat += r.amount;
    return acc;
  }, { daromad: 0, xarajat: 0 }), [list]);
  const kat = (k: Kind) => (s?.kategoriyalar ?? []).filter((c) => c.kind === k);
  const katJami = (k: Kind) => kat(k).reduce((a, c) => a + c.amount, 0);
  const kelajak = month >= joriyOy();

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Sarlavha va oy tanlovi */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-neutral-900 dark:text-white">Foyda va xarajatlar</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Platformaning o&apos;z puli. Har qator qo&apos;lda kiritiladi.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl">
            <button type="button" onClick={() => setMonth((m) => oyQoshish(m, -1))} className="w-9 h-9 grid place-items-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white" title="Oldingi oy"><ChevronLeft className="w-4 h-4" /></button>
            <span className="min-w-[130px] text-center text-[13px] font-semibold text-neutral-900 dark:text-white">{oyNomi(month)}</span>
            <button type="button" onClick={() => setMonth((m) => oyQoshish(m, 1))} disabled={kelajak} className="w-9 h-9 grid place-items-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30" title="Keyingi oy"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <button onClick={yangila}
            className="flex items-center gap-1.5 px-3 h-9 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl text-[12px] text-neutral-500 dark:text-neutral-400 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />Yangilash
          </button>
        </div>
      </div>

      {/* Ko'rsatkichlar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile label={`Daromad · ${oyNomi(month)}`} value={s?.joriy.daromad ?? 0} delta={s ? foiz(s.joriy.daromad, s.oldingi.daromad) : null} yaxshi="oshsa"
          icon={TrendingUp} ton="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" loading={sLoading}
          sub={s ? `O'tgan oy: ${formatCurrency(s.oldingi.daromad)}` : undefined} />
        <Tile label={`Xarajat · ${oyNomi(month)}`} value={s?.joriy.xarajat ?? 0} delta={s ? foiz(s.joriy.xarajat, s.oldingi.xarajat) : null} yaxshi="kamaysa"
          icon={TrendingDown} ton="bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" loading={sLoading}
          sub={s ? `O'tgan oy: ${formatCurrency(s.oldingi.xarajat)}` : undefined} />
        <Tile label={`Foyda · ${oyNomi(month)}`} value={s?.joriy.foyda ?? 0} delta={s ? foiz(s.joriy.foyda, s.oldingi.foyda) : null} yaxshi="oshsa"
          icon={Wallet} ton="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" loading={sLoading}
          sub={s ? `O'tgan oy: ${formatCurrency(s.oldingi.foyda)}` : undefined} />
        <Tile label="Umumiy foyda (butun tarix)" value={s?.umumiy.foyda ?? 0} icon={Coins}
          ton="bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300" loading={sLoading}
          sub={s ? `Daromad ${qisqaSumma(s.umumiy.daromad)} · xarajat ${qisqaSumma(s.umumiy.xarajat)}${s.umumiy.xarajatUsd ? ` (${Math.round(s.umumiy.xarajatUsd)} $)` : ""} · ${s.umumiy.qatorlar} qator` : undefined} />
      </div>

      {/* 12 oy + kategoriyalar */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <LedgerChart oylar={s?.oylar ?? []} loading={sLoading} />
        </div>
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="text-[13px] font-bold text-neutral-900 dark:text-white">{oyNomi(month)} bo&apos;yicha</h3>
            <p className="text-[11px] text-neutral-500 mt-0.5">Kategoriyalar bo&apos;yicha taqsimot</p>
          </div>
          {(["XARAJAT", "DAROMAD"] as Kind[]).map((k) => {
            const items = kat(k); const jami = katJami(k);
            return (
              <div key={k}>
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: k === "XARAJAT" ? colors.xarajat : colors.daromad }} />{k === "XARAJAT" ? "Xarajatlar" : "Daromadlar"}</span>
                  <span className="normal-case tracking-normal text-neutral-700 dark:text-neutral-300 tabular-nums">{formatCurrency(jami)}</span>
                </div>
                {items.length === 0 ? (
                  <p className="text-[12px] text-neutral-400">Bu oyda yozuv yo&apos;q</p>
                ) : (
                  <div className="space-y-1.5">
                    {items.slice(0, 6).map((c) => (
                      <div key={c.category}>
                        <div className="flex items-center justify-between text-[12px]">
                          <span className="text-neutral-700 dark:text-neutral-300 truncate pr-3">{c.category}</span>
                          <span className="tabular-nums font-medium text-neutral-900 dark:text-white shrink-0">{formatCurrency(c.amount)}</span>
                        </div>
                        <div className="h-1.5 mt-1 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${jami ? Math.max(2, (c.amount / jami) * 100) : 0}%`, background: k === "XARAJAT" ? colors.xarajat : colors.daromad }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Yangi yozuv */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5">
        <h3 className="text-[13px] font-bold text-neutral-900 dark:text-white mb-3">Yangi yozuv</h3>
        <EntryForm takliflar={s?.kategoriyaTakliflari ?? { DAROMAD: [], XARAJAT: [] }} orgs={orgs} onDone={yangila} />
      </div>

      {/* Oy yozuvlari */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h3 className="text-[13px] font-bold text-neutral-900 dark:text-white">{oyNomi(month)} yozuvlari</h3>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              {list.length} ta · daromad {formatCurrency(oyJami.daromad)} · xarajat {formatCurrency(oyJami.xarajat)}
            </p>
          </div>
          <div className="flex p-1 gap-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
            {([["hammasi", "Barchasi"], ["DAROMAD", "Daromad"], ["XARAJAT", "Xarajat"]] as const).map(([v, l]) => (
              <button key={v} type="button" onClick={() => setFiltr(v)}
                className={cn("px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors",
                  filtr === v ? "bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white" : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200")}>
                {l}
              </button>
            ))}
          </div>
        </div>
        {rLoading && !rows ? (
          <div className="p-5 space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : list.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-neutral-400">Bu oyda yozuv yo&apos;q. Yuqoridagi formadan qo&apos;shing.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-neutral-500 bg-neutral-50 dark:bg-neutral-800/50">
                  <th className="px-5 py-2.5 font-semibold">Sana</th>
                  <th className="px-3 py-2.5 font-semibold">Kategoriya</th>
                  <th className="px-3 py-2.5 font-semibold hidden md:table-cell">Izoh</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Summa</th>
                  <th className="px-3 py-2.5 font-semibold hidden sm:table-cell">Kim</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id} className="border-t border-neutral-100 dark:border-neutral-800/70 hover:bg-neutral-50/70 dark:hover:bg-neutral-800/30">
                    <td className="px-5 py-2.5 whitespace-nowrap text-neutral-700 dark:text-neutral-300">{kunNomi(r.date)}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: r.kind === "XARAJAT" ? colors.xarajat : colors.daromad }} />
                        <span className="font-medium text-neutral-900 dark:text-white truncate">{r.category}</span>
                        {r.organization && (
                          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-neutral-500 truncate"><Building2 className="w-3 h-3" />{r.organization.name}</span>
                        )}
                      </div>
                      {r.note && <p className="md:hidden text-[11px] text-neutral-400 truncate">{r.note}</p>}
                    </td>
                    <td className="px-3 py-2.5 hidden md:table-cell text-neutral-500 max-w-[280px] truncate" title={r.note}>{r.note || "—"}</td>
                    <td className={cn("px-3 py-2.5 text-right whitespace-nowrap tabular-nums font-semibold",
                      r.kind === "XARAJAT" ? "text-neutral-900 dark:text-white" : "text-indigo-700 dark:text-indigo-300")}>
                      {r.kind === "XARAJAT" ? "−" : "+"}{formatCurrency(r.amount)}
                      {r.usdAmount != null && <span className="block text-[11px] font-normal text-neutral-400">{r.usdAmount} $</span>}
                    </td>
                    <td className="px-3 py-2.5 hidden sm:table-cell text-neutral-500 whitespace-nowrap">{r.createdByName || "—"}</td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <button type="button" onClick={() => setEdit(r)} title="Tahrirlash" className="w-8 h-8 inline-grid place-items-center rounded-lg text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => setDel(r)} title="O'chirish" className="w-8 h-8 inline-grid place-items-center rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)} title="Yozuvni tahrirlash" subtitle={edit ? `${kunNomi(edit.date)} · ${edit.category}` : ""} footer={null}>
        {edit && (
          <EntryForm key={edit.id} initial={edit} takliflar={s?.kategoriyaTakliflari ?? { DAROMAD: [], XARAJAT: [] }} orgs={orgs}
            onDone={() => { setEdit(null); yangila(); }} onCancel={() => setEdit(null)} />
        )}
      </Modal>

      <ConfirmDeleteModal open={!!del} onClose={() => setDel(null)} onConfirm={ochir} loading={deleting}
        title="Yozuvni o'chirish"
        description={del ? <><span className="font-semibold text-neutral-700 dark:text-neutral-300">{del.category} · {formatCurrency(del.amount)}</span> o&apos;chirilsinmi? Qaytarib bo&apos;lmaydi.</> : null} />
    </div>
  );
}
