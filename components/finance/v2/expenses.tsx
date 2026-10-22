"use client";

import { useMemo, useState } from "react";
import useSWR, { mutate } from "swr";
import { Plus, Tags, TrendingDown, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, usePagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExpenseCategoriesModal } from "@/components/finance/expense-categories-modal";
import { MaoshEslatma } from "@/components/salary-advance/maosh-eslatma";
import { BranchPicker } from "@/components/layout/branch-filter";
import { useBranch, useBranchQueryString } from "@/lib/contexts/branch-context";
import { formatUzDate } from "@/lib/date-uz";
import { formatCurrency } from "@/lib/money";
import {
  Empty, FIELD_CLS, Field, FilterBar, GhostBtn, MiniStat, Panel, PanelHead, PrimaryBtn, Skeleton, Th, fetcher,
  royxat, type Xarajat, type XarajatKategoriya,
} from "./ui";

const BOSH_FORMA = { category: "", description: "", amount: "", date: "", branchId: "" };

/** Xarajat qo'shish oynasi — bo'limdan ham, sahifa tepasidagi tezkor tugmadan ham ochiladi. */
export function ExpenseModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { activeBranchId, kopFilial } = useBranch();
  const { data: catsRaw } = useSWR("/api/expenses/categories", fetcher);
  const cats = royxat<XarajatKategoriya>(catsRaw);
  const [form,   setForm]   = useState(BOSH_FORMA);
  const [err,    setErr]    = useState("");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const close = () => { setForm(BOSH_FORMA); setErr(""); onClose(); };

  async function submit() {
    if (!form.category.trim() || !form.description.trim() || !form.amount) {
      setErr("Barcha maydonlarni to'ldiring"); return;
    }
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) { setErr("Summa to'g'ri kiriting"); return; }

    setSaving(true); setErr("");
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category:    form.category.trim(),
          description: form.description.trim(),
          amount,
          // Formada tanlangan filial ustun; tanlanmasa sarlavhadagisi.
          ...(form.branchId || activeBranchId ? { branchId: form.branchId || activeBranchId } : {}),
          ...(form.date ? { date: form.date } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "Xatolik"); return; }
      mutate((k: string) => typeof k === "string" && k.startsWith("/api/expenses"));
      mutate("/api/reports");
      close();
    } catch { setErr("Serverga ulanib bo'lmadi"); }
    finally { setSaving(false); }
  }

  const inputCls = "w-full h-9 px-3 text-sm rounded-lg border border-white/60 dark:border-white/10 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="glass-strong rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/50 dark:border-white/10">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-500" />
            <h2 className="font-bold text-[15px] text-neutral-900 dark:text-neutral-100">Xarajat qo&apos;shish</h2>
          </div>
          <button onClick={close}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/60 dark:hover:bg-white/10 text-neutral-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <Label className="text-xs font-medium text-neutral-500 mb-1.5 block">Kategoriya</Label>
            <select value={form.category}
              onChange={(e) => { setForm((p) => ({ ...p, category: e.target.value })); setErr(""); }}
              className={inputCls}>
              <option value="">Kategoriyani tanlang...</option>
              {cats.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <MaoshEslatma category={form.category} />
          {kopFilial && (
            <div>
              <Label className="text-xs font-medium text-neutral-500 mb-1.5 block">Filial</Label>
              <BranchPicker value={form.branchId || activeBranchId || ""}
                onChange={(v) => setForm((p) => ({ ...p, branchId: v }))}
                hammasiLabel="Filialga bog'lanmagan (umumiy)"
                className="h-9 rounded-lg text-sm" />
            </div>
          )}
          <div>
            <Label className="text-xs font-medium text-neutral-500 mb-1.5 block">Tavsif</Label>
            <Input placeholder="Masalan: Iyul oyi ijara to'lovi" value={form.description}
              onChange={(e) => { setForm((p) => ({ ...p, description: e.target.value })); setErr(""); }}
              className="h-9 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium text-neutral-500 mb-1.5 block">Summa (so&apos;m)</Label>
              <Input type="number" placeholder="1 000 000" value={form.amount} min="0"
                onChange={(e) => { setForm((p) => ({ ...p, amount: e.target.value })); setErr(""); }}
                className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs font-medium text-neutral-500 mb-1.5 block">Sana (ixtiyoriy)</Label>
              <input type="date" value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} className={inputCls} />
            </div>
          </div>
          {err && <p className="text-[12px] text-red-600 dark:text-red-400 font-medium">{err}</p>}
        </div>
        <div className="px-5 pb-5 flex gap-2">
          <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 h-10" disabled={saving} onClick={submit}>
            {saving ? "Saqlanmoqda..." : "Qo'shish"}
          </Button>
          <Button variant="outline" className="h-10 px-4" onClick={close}>Bekor</Button>
        </div>
      </div>
    </div>
  );
}

/**
 * CHIQIM → XARAJATLAR. Oy — umumiy tanlovdan; kategoriya va sana oralig'i
 * faqat RO'YXATNI toraytiradi (sahifa tepasidagi "Sof foyda" ga tegmaydi).
 */
export function ExpensesSection({ month, onAdd }: { month: string; onAdd: () => void }) {
  const [cat,  setCat]  = useState("");
  const [from, setFrom] = useState("");
  const [to,   setTo]   = useState("");
  const [showCats, setShowCats] = useState(false);

  // Aniq sanalar tanlansa oy yuborilmaydi — serverda ham oraliq oydan ustun.
  const qs = useBranchQueryString({
    month:    from || to ? undefined : month,
    from:     from || undefined,
    to:       to || undefined,
    category: cat || undefined,
  });
  const { data: listRaw, isLoading } = useSWR(`/api/expenses${qs}`, fetcher);
  // Jami alohida: ro'yxat 500 qator bilan cheklangan.
  const { data: sum } = useSWR(`/api/expenses/summary${qs}`, fetcher);
  const { data: catsRaw }    = useSWR("/api/expenses/categories", fetcher);
  const { data: filterCats } = useSWR<string[]>("/api/expenses/categories/filter", fetcher);

  const list = useMemo(() => royxat<Xarajat>(listRaw), [listRaw]);
  const cats = royxat<XarajatKategoriya>(catsRaw);
  const filtered = !!(cat || from || to);
  const pg = usePagination(list, qs);

  // Kategoriya kesimi — qaysi xarajat qancha joy egallaydi.
  const byCat = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of list) m.set(e.category, (m.get(e.category) ?? 0) + e.amount);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [list]);
  const listTotal = byCat.reduce((s, [, v]) => s + v, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
        <MiniStat label={filtered ? "Jami (filtr bo'yicha)" : "Jami xarajat"} value={formatCurrency(sum?.total ?? 0)} tone="red" />
        <MiniStat label="Yozuvlar soni" value={sum?.count ?? list.length} />
        <MiniStat label="Eng katta kategoriya" value={byCat[0]?.[0] ?? "—"}
          hint={byCat[0] ? formatCurrency(byCat[0][1]) : undefined} />
      </div>

      {byCat.length > 1 && (
        <Panel className="px-5 py-4 space-y-2.5">
          <p className="text-[12px] font-semibold text-neutral-500 dark:text-neutral-400">Kategoriyalar bo&apos;yicha</p>
          {byCat.slice(0, 6).map(([c, v]) => (
            <button key={c} type="button" onClick={() => setCat(cat === c ? "" : c)}
              className="w-full flex items-center gap-3 text-left group">
              <span className="w-32 shrink-0 truncate text-[12.5px] text-neutral-700 dark:text-neutral-300 group-hover:text-indigo-600">{c}</span>
              <span className="flex-1 h-2 rounded-full bg-neutral-200/70 dark:bg-white/10 overflow-hidden">
                <span className="block h-full rounded-full bg-gradient-to-r from-orange-400 to-red-500"
                  style={{ width: `${listTotal ? Math.max(3, (v / listTotal) * 100) : 0}%` }} />
              </span>
              <span className="w-28 shrink-0 text-right text-[12.5px] font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
                {formatCurrency(v)}
              </span>
            </button>
          ))}
        </Panel>
      )}

      <Panel>
        <PanelHead title="Xarajatlar ro'yxati" sub={`${sum?.count ?? list.length} ta yozuv`}>
          <GhostBtn onClick={() => setShowCats(true)}><Tags className="w-4 h-4" /> Kategoriyalar</GhostBtn>
          <PrimaryBtn onClick={onAdd}><Plus className="w-4 h-4" /> Xarajat qo&apos;shish</PrimaryBtn>
        </PanelHead>
        <FilterBar>
          <Field label="Kategoriya">
            <select value={cat} onChange={(e) => setCat(e.target.value)} className={FIELD_CLS}>
              <option value="">Hammasi</option>
              {/* O'chirilgan kategoriyalar ham — eski xarajatlarni topish uchun. */}
              {(filterCats ?? []).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Sanadan">
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={FIELD_CLS} />
          </Field>
          <Field label="Sanagacha">
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={FIELD_CLS} />
          </Field>
          {filtered && (
            <GhostBtn onClick={() => { setCat(""); setFrom(""); setTo(""); }}>
              <X className="w-3.5 h-3.5" /> Tozalash
            </GhostBtn>
          )}
          {(from || to) && (
            <p className="text-[11px] text-neutral-400 w-full">
              Sana oralig&apos;i tanlangan — yuqoridagi oy e&apos;tiborga olinmaydi. Oraliq ikki chetini ham o&apos;z ichiga oladi.
            </p>
          )}
        </FilterBar>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="glass-soft hover:bg-white/60 dark:hover:bg-white/10">
                <Th>Kategoriya</Th>
                <Th>Tavsif</Th>
                <Th>Sana</Th>
                <Th className="text-right">Summa</Th>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 4 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-3 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : pg.items.map((e) => (
                    <TableRow key={e.id} className="hover:bg-white/60 dark:hover:bg-white/10 transition-colors">
                      <TableCell>
                        <span className="text-[11px] bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 px-2.5 py-1 rounded-lg font-medium">
                          {e.category}
                        </span>
                      </TableCell>
                      <TableCell className="text-[13px] text-neutral-700 dark:text-neutral-300">{e.description}</TableCell>
                      <TableCell className="text-[13px] text-neutral-500 dark:text-neutral-400">{formatUzDate(e.date)}</TableCell>
                      <TableCell className="text-right">
                        <span className="text-[13px] font-bold text-red-600 dark:text-red-400">-{formatCurrency(e.amount)}</span>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>
        <Pagination p={pg} />
        {!isLoading && list.length === 0 && (
          <Empty>
            {filtered ? "Bu filtrga mos xarajat yo'q" : "Bu oyda xarajat yozilmagan"}
            <PrimaryBtn onClick={onAdd}><Plus className="w-4 h-4" /> Xarajat qo&apos;shish</PrimaryBtn>
          </Empty>
        )}
      </Panel>

      <ExpenseCategoriesModal open={showCats} onClose={() => setShowCats(false)} categories={cats}
        onChanged={() => mutate((k: string) => typeof k === "string" && k.startsWith("/api/expenses"))} />
    </div>
  );
}
