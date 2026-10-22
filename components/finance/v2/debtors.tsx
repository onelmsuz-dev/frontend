"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR, { mutate } from "swr";
import { CheckCircle, ChevronRight, Clock, RefreshCw, Search } from "lucide-react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, usePagination } from "@/components/ui/pagination";
import { AcceptPaymentModal } from "@/components/finance/accept-payment-modal";
import { useStudents } from "@/lib/hooks/useStudents";
import { formatCurrency } from "@/lib/money";
import { cn } from "@/lib/utils";
import {
  Empty, FIELD_CLS, GhostBtn, MiniStat, Panel, PanelHead, Skeleton, Th, fetcher, royxat, type Qarzdor,
} from "./ui";

/** Qarzdor = balans manfiy va guruhdan chiqib ketmagan. */
export function useDebtors() {
  const { data, isLoading } = useStudents();
  const all = royxat<Qarzdor>(data);
  const debtors = all
    .filter((s) => s.balance < 0 && s.groups?.[0]?.enrollmentStatus !== "CHIQIB_KETGAN")
    .sort((a, b) => a.balance - b.balance);
  const total = debtors.reduce((sum, s) => sum + Math.abs(s.balance), 0);
  return { debtors, total, isLoading };
}

export function useDues() {
  return useSWR<{ month: string; pending: number; amount: number }>("/api/student-groups/dues-status", fetcher);
}

/** KIRIM → QARZDORLAR. */
export function DebtorsSection() {
  const { debtors, total, isLoading } = useDebtors();
  const { data: dues, mutate: mutateDues } = useDues();
  const [q, setQ] = useState("");
  const [payFor, setPayFor] = useState<Qarzdor | null>(null);
  const [charging, setCharging] = useState(false);
  const [chargeMsg, setChargeMsg] = useState("");

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return debtors;
    return debtors.filter((d) =>
      d.name?.toLowerCase().includes(s) || d.phone?.includes(s) ||
      d.groups?.[0]?.group?.name?.toLowerCase().includes(s));
  }, [debtors, q]);
  const pg = usePagination(list, q);
  const eng = debtors[0];

  async function charge() {
    setCharging(true); setChargeMsg("");
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
    finally { setCharging(false); }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
        <MiniStat label="Qarzdorlar" value={debtors.length} tone={debtors.length ? "red" : "green"} />
        <MiniStat label="Jami qarz" value={formatCurrency(total)} tone="red" />
        <MiniStat label="Eng katta qarz" value={eng ? formatCurrency(Math.abs(eng.balance)) : "—"} hint={eng?.name} />
      </div>

      {dues && dues.pending > 0 && (
        <div className="flex flex-wrap items-center gap-3 px-3.5 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40">
          <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="flex-1 min-w-0 text-[12.5px] text-amber-700 dark:text-amber-400">
            <b>{dues.pending} ta o&apos;quvchidan</b> bu oy uchun hali hisoblanmagan (taxminan {formatCurrency(dues.amount)}).
          </p>
          <button onClick={charge} disabled={charging}
            className="h-8 px-3 rounded-lg text-[12px] font-semibold border border-amber-300 text-amber-800 dark:text-amber-300 disabled:opacity-50">
            {charging ? "Hisoblanmoqda..." : "Hozir hisoblash"}
          </button>
        </div>
      )}

      <Panel>
        <PanelHead title="Qarzdor o'quvchilar"
          sub="Oylik to'lov har oy avtomatik yoziladi (birinchi kirishda) — tugma darhol tekshirish uchun">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ism, telefon, guruh..."
              className={cn(FIELD_CLS, "pl-8 w-52")} />
          </div>
          <GhostBtn onClick={charge} disabled={charging}>
            <RefreshCw className={cn("w-3.5 h-3.5", charging && "animate-spin")} />
            {charging ? "Hisoblanmoqda..." : "Oylik to'lovni hisoblash"}
          </GhostBtn>
        </PanelHead>
        {chargeMsg && <p className="px-5 pt-3 text-[12px] text-neutral-500 dark:text-neutral-400">{chargeMsg}</p>}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="glass-soft hover:bg-white/60 dark:hover:bg-white/10">
                <Th>O&apos;quvchi</Th>
                <Th>Guruh</Th>
                <Th>O&apos;qituvchi</Th>
                <Th className="text-right">Qarz</Th>
                <Th />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-3 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : pg.items.map((s) => {
                    const sg = s.groups?.[0];
                    return (
                      <TableRow key={s.id} className="hover:bg-white/60 dark:hover:bg-white/10 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-400 to-orange-400 flex items-center justify-center text-white text-[12px] font-bold shrink-0">
                              {s.name?.[0]}
                            </div>
                            <div>
                              <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">{s.name}</p>
                              <p className="text-[11px] text-neutral-400">{s.phone ?? s.parentPhone ?? ""}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-[13px] text-neutral-700 dark:text-neutral-300">{sg?.group?.name ?? "—"}</TableCell>
                        <TableCell className="text-[13px] text-neutral-500 dark:text-neutral-400">{sg?.group?.teacher?.user?.name ?? "—"}</TableCell>
                        <TableCell className="text-right text-[13px] font-bold text-red-600 dark:text-red-400 tabular-nums">
                          {formatCurrency(Math.abs(s.balance))}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => setPayFor(s)}
                              className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors whitespace-nowrap">
                              To&apos;lov qabul qilish
                            </button>
                            <Link href={`/students/${s.id}`}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
            </TableBody>
          </Table>
        </div>
        <Pagination p={pg} />
        {!isLoading && list.length === 0 && (
          <Empty>
            <CheckCircle className="w-8 h-8 text-green-400 opacity-60" />
            {q ? "Qidiruvga mos qarzdor yo'q" : "Hech kim qarzdor emas"}
          </Empty>
        )}
      </Panel>

      <AcceptPaymentModal open={!!payFor} onClose={() => setPayFor(null)} defaultStudentId={payFor?.id} />
    </div>
  );
}
