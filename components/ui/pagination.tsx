"use client";

/**
 * RO'YXAT SAHIFALASH — brauzer tomonida (2026-10-14).
 *
 * Moliya bo'limidagi ro'yxatlar (to'lovlar, xarajatlar, oyliklar,
 * qarzdorlar, qo'shimcha to'lovlar) to'liq yuklanadi va 100+ qatorda
 * sahifa juda uzun aylanardi. Endi har sahifada 10 tadan (tanlanadi),
 * pastda "1–10 / 100" va sahifa raqamlari.
 *
 * Jami summalar, filtrlar va eksport TO'LIQ ro'yxat bo'yicha qoladi —
 * faqat jadvalda ko'rsatiladigan qatorlar bo'linadi.
 */

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const HAJMLAR = [10, 25, 50, 100] as const;

/**
 * `resetKey` o'zgarsa (filtr, oy, qidiruv) — birinchi sahifaga qaytiladi,
 * aks holda 5-sahifada turib filtr o'zgartirilsa bo'sh sahifa chiqardi.
 * Effekt emas, render paytidagi solishtirish (React tavsiya qilgan usul).
 */
export function usePagination<T>(list: T[], resetKey: unknown = null, boshHajm = 10) {
  const [page, setPage] = useState(1);
  const [hajm, setHajm] = useState(boshHajm);
  const [oldingiKalit, setOldingiKalit] = useState(resetKey);
  if (!Object.is(oldingiKalit, resetKey)) {
    setOldingiKalit(resetKey);
    setPage(1);
  }
  const jami = list.length;
  const sahifalar = Math.max(1, Math.ceil(jami / hajm));
  const joriy = Math.min(page, sahifalar);           // ro'yxat qisqarsa — chegarada
  const boshi = (joriy - 1) * hajm;
  return {
    items: list.slice(boshi, boshi + hajm),
    page: joriy, sahifalar, jami, hajm, boshi,
    setPage,
    setHajm: (n: number) => { setHajm(n); setPage(1); },
  };
}

/** 1 … 4 5 [6] 7 8 … 20 — joriy atrofida ikkitadan. */
function raqamlar(joriy: number, jami: number): (number | "…")[] {
  if (jami <= 7) return Array.from({ length: jami }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const b = Math.max(2, joriy - 1);
  const o = Math.min(jami - 1, joriy + 1);
  if (b > 2) out.push("…");
  for (let i = b; i <= o; i++) out.push(i);
  if (o < jami - 1) out.push("…");
  out.push(jami);
  return out;
}

export function Pagination({ p, className }: { p: ReturnType<typeof usePagination>; className?: string }) {
  // 10 tadan kam — sahifalash kerak emas, ortiqcha qator chizilmaydi.
  if (p.jami <= HAJMLAR[0]) return null;
  const tugma = "flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-[12.5px] font-semibold tabular-nums transition-colors";
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3 border-t border-white/50 px-4 py-3 dark:border-white/10", className)}>
      <div className="flex items-center gap-3 text-[12.5px] text-neutral-500 dark:text-neutral-400">
        <span className="tabular-nums">
          <span className="font-semibold text-neutral-800 dark:text-neutral-100">{p.boshi + 1}–{Math.min(p.boshi + p.hajm, p.jami)}</span>
          {" / "}{p.jami}
        </span>
        <select value={p.hajm} onChange={(e) => p.setHajm(Number(e.target.value))} aria-label="Har sahifada"
          className="h-8 rounded-lg border border-white/60 bg-white px-2 text-[12px] text-neutral-700 outline-none dark:border-white/10 dark:bg-neutral-800 dark:text-neutral-200">
          {HAJMLAR.map((n) => <option key={n} value={n}>{n} tadan</option>)}
        </select>
      </div>

      {p.sahifalar > 1 && (
        <nav className="flex items-center gap-1" aria-label="Sahifalar">
          <button type="button" onClick={() => p.setPage(p.page - 1)} disabled={p.page === 1} aria-label="Oldingi sahifa"
            className={cn(tugma, "text-neutral-500 hover:bg-white/70 disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-white/10")}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          {raqamlar(p.page, p.sahifalar).map((r, i) => r === "…" ? (
            <span key={`n${i}`} className="px-1 text-[12px] text-neutral-400">…</span>
          ) : (
            <button key={r} type="button" onClick={() => p.setPage(r)} aria-current={r === p.page ? "page" : undefined}
              className={cn(tugma, r === p.page
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-neutral-600 hover:bg-white/70 dark:text-neutral-300 dark:hover:bg-white/10")}>
              {r}
            </button>
          ))}
          <button type="button" onClick={() => p.setPage(p.page + 1)} disabled={p.page === p.sahifalar} aria-label="Keyingi sahifa"
            className={cn(tugma, "text-neutral-500 hover:bg-white/70 disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-white/10")}>
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      )}
    </div>
  );
}
