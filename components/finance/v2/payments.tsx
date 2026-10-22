"use client";

import { useMemo, useState } from "react";
import { ReceiptText, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, usePagination } from "@/components/ui/pagination";
import { ReceiptModal } from "@/components/payments/receipt-modal";
import { usePayments } from "@/lib/hooks/usePayments";
import { useGroups } from "@/lib/hooks/useGroups";
import { PAYMENT_METHODS, methodShort, methodCls } from "@/lib/payment-methods";
import { formatUzDate } from "@/lib/date-uz";
import { formatCurrency } from "@/lib/money";
import { cn } from "@/lib/utils";
import {
  Empty, FIELD_CLS, Field, FilterBar, GhostBtn, MiniStat, Panel, PanelHead, Skeleton, Th, royxat, type Tolov,
} from "./ui";

/**
 * KIRIM → TO'LOVLAR. Oy — sahifaning umumiy tanlovidan; bu yerda faqat
 * ro'yxatni toraytiruvchi filtrlar (sana, guruh, usul).
 */
export function PaymentsSection({ month }: { month: string }) {
  const [date,    setDate]    = useState("");
  const [groupId, setGroupId] = useState("");
  const [method,  setMethod]  = useState("");
  const [chekId,  setChekId]  = useState<string | null>(null);

  const { data: raw, isLoading } = usePayments({
    month:   date ? undefined : month,   // aniq sana tanlansa oy shart emas
    date:    date || undefined,
    groupId: groupId || undefined,
    method:  method || undefined,
  });
  const { data: groupsRaw } = useGroups();
  const groups: { id: string; name: string }[] = Array.isArray(groupsRaw) ? groupsRaw : [];
  const payments = useMemo(() => royxat<Tolov>(raw), [raw]);

  // Eski usul (Click/Payme) faqat shu markazda haqiqatan ishlatilgan bo'lsa.
  const methods = useMemo(() => {
    const used = new Set(payments.map((p) => p.method));
    return PAYMENT_METHODS.filter((m) => !m.legacy || used.has(m.value));
  }, [payments]);

  const total    = payments.reduce((s, p) => s + p.amount, 0);
  const refunds  = payments.filter((p) => p.amount < 0).reduce((s, p) => s - p.amount, 0);
  const byMethod = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of payments) if (p.amount > 0) m.set(p.method, (m.get(p.method) ?? 0) + p.amount);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [payments]);

  const filtered = !!(date || groupId || method);
  const pg = usePagination(payments, `${month}|${date}|${groupId}|${method}`);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <MiniStat label={filtered ? "Jami (filtr bo'yicha)" : "Jami tushum"} value={formatCurrency(total)} tone="green" />
        <MiniStat label="To'lovlar soni" value={payments.length} />
        <MiniStat label="O'rtacha to'lov"
          value={formatCurrency(payments.length ? Math.round(total / payments.length) : 0)} />
        <MiniStat label="Qaytarilgan" value={formatCurrency(refunds)} tone={refunds ? "red" : "neutral"} />
      </div>

      {byMethod.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {byMethod.map(([m, sum]) => (
            <span key={m} className={cn("inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-full font-medium", methodCls(m))}>
              {methodShort(m)} <b className="tabular-nums">{formatCurrency(sum)}</b>
            </span>
          ))}
        </div>
      )}

      <Panel>
        <PanelHead title="To'lovlar tarixi" sub={`${payments.length} ta to'lov`} />
        <FilterBar>
          <Field label="Aniq sana">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={FIELD_CLS} />
          </Field>
          <Field label="Guruh">
            <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className={FIELD_CLS}>
              <option value="">Barcha guruhlar</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </Field>
          <Field label="To'lov usuli">
            <select value={method} onChange={(e) => setMethod(e.target.value)} className={FIELD_CLS}>
              <option value="">Barcha usullar</option>
              {methods.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </Field>
          {filtered && (
            <GhostBtn onClick={() => { setDate(""); setGroupId(""); setMethod(""); }}>
              <X className="w-3.5 h-3.5" /> Tozalash
            </GhostBtn>
          )}
          {date && (
            <p className="text-[11px] text-neutral-400 w-full">Aniq sana tanlangan — yuqoridagi oy e&apos;tiborga olinmaydi.</p>
          )}
        </FilterBar>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="glass-soft hover:bg-white/60 dark:hover:bg-white/10">
                <Th>O&apos;quvchi</Th>
                <Th>Guruh</Th>
                <Th>Sana</Th>
                <Th>Usul</Th>
                <Th className="text-right">Summa</Th>
                <Th className="text-right">Chek</Th>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-3 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : pg.items.map((p) => (
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
                      <TableCell className="text-[13px] text-neutral-500 dark:text-neutral-400">{formatUzDate(p.date)}</TableCell>
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
                        {p.amount > 0 && (
                          <button type="button" onClick={() => setChekId(p.id)} title="Chekni ko'rish va chop etish"
                            className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors">
                            <ReceiptText className="w-4 h-4" />
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>
        <Pagination p={pg} />
        {!isLoading && payments.length === 0 && (
          <Empty>{filtered ? "Bu filtrga mos to'lov yo'q" : "Bu oyda hali to'lov yo'q"}</Empty>
        )}
      </Panel>

      <ReceiptModal paymentId={chekId} open={!!chekId} onClose={() => setChekId(null)} />
    </div>
  );
}
