"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/money";
import { cn } from "@/lib/utils";
import { SomInput } from "./som-input";
import { sanaKun, soro, avansniYangila, type AvansQatori, type AvansRoyxati } from "@/lib/salary-advance";

type Rejim = "STANDART" | "ALOHIDA" | "YOQ";

/**
 * "KIMGA QANCHA" — har bir o'qituvchi va xodimning avans summasi.
 * Bitta komponent ikki joyda: Sozlamalar → Oylik avansi va Moliya →
 * Oylik avansi → "Summalar" (buxgalter Sozlamalarga kira olmaydi).
 */
export function KimgaQancha({ data }: { data: AvansRoyxati }) {
  const [chip, setChip] = useState<"ALL" | "TEACHER" | "STAFF">("ALL");
  const [qidiruv, setQidiruv] = useState("");
  const [ochiq, setOchiq] = useState<string | null>(null);
  const [rejim, setRejim] = useState<Rejim>("STANDART");
  const [summa, setSumma] = useState<number | null>(null);
  const [ishlamoqda, setIshlamoqda] = useState(false);
  const [xabar, setXabar] = useState<{ ok: boolean; matn: string } | null>(null);

  const odamlar = useMemo(() => data.rows.filter((r) => r.faol && !r.ochirilgan), [data.rows]);
  const rejadagilar = odamlar.filter((r) => r.advancePlanned > 0);
  const korinadi = odamlar
    .filter((r) => chip === "ALL" || r.kind === chip)
    .filter((r) => !qidiruv.trim() || r.name.toLowerCase().includes(qidiruv.trim().toLowerCase()));

  function och(q: AvansQatori) {
    if (!data.canManage) return;
    const id = `${q.kind}:${q.userId}`;
    if (ochiq === id) { setOchiq(null); return; }
    setOchiq(id);
    setRejim(q.advancePlan == null ? "STANDART" : q.advancePlan === 0 ? "YOQ" : "ALOHIDA");
    setSumma(q.advancePlan && q.advancePlan > 0 ? q.advancePlan : null);
    setXabar(null);
  }

  async function saqla(q: AvansQatori) {
    const plan = rejim === "STANDART" ? null : rejim === "YOQ" ? 0 : summa;
    if (rejim === "ALOHIDA" && (!summa || summa <= 0)) { setXabar({ ok: false, matn: "Summani kiriting" }); return; }
    setIshlamoqda(true);
    const r = await soro("PATCH", `/api/salary-advances/people/${q.userId}`, { kind: q.kind, plan });
    setIshlamoqda(false);
    if (!r.ok) { setXabar({ ok: false, matn: r.data?.error ?? "Xatolik" }); return; }
    avansniYangila();
    setOchiq(null);
    setXabar({ ok: true, matn: `${q.name}: ${plan == null ? "standart" : plan === 0 ? "avans yo'q" : formatCurrency(plan)} saqlandi` });
  }

  const chiplar: [typeof chip, string, number][] = [
    ["ALL", "Hammasi", odamlar.length],
    ["TEACHER", "O'qituvchilar", odamlar.filter((r) => r.kind === "TEACHER").length],
    ["STAFF", "Xodimlar", odamlar.filter((r) => r.kind === "STAFF").length],
  ];

  return (
    <div className="space-y-3" data-kimga-qancha>
      <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
        {`${sanaKun(data.avansKuni)}: ${rejadagilar.length} kishi · jami ${formatCurrency(rejadagilar.reduce((s, r) => s + r.advancePlanned, 0))}`}
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        {chiplar.map(([k, nom, n]) => (
          <button key={k} type="button" onClick={() => setChip(k)} aria-pressed={chip === k}
            className={cn("h-8 px-3 rounded-lg text-[12px] font-semibold border transition-colors",
              chip === k ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                : "border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-300")}>
            {`${nom} ${n}`}
          </button>
        ))}
        {odamlar.length > 10 && (
          <div className="relative ml-auto">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input value={qidiruv} onChange={(e) => setQidiruv(e.target.value)} placeholder="Ism bo'yicha qidirish"
              className="h-8 pl-8 pr-3 text-[12px] rounded-lg border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-800 outline-none w-48" />
          </div>
        )}
      </div>
      {xabar && (
        <p className={cn("text-[12.5px] font-medium", xabar.ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
          {xabar.matn}
        </p>
      )}

      <ul className="divide-y divide-neutral-100 dark:divide-white/5 rounded-xl border border-neutral-200 dark:border-white/10 overflow-hidden">
        {korinadi.length === 0 && (
          <li className="px-3 py-6 text-center text-[12.5px] text-neutral-400">Hech kim yo&apos;q</li>
        )}
        {korinadi.map((q) => {
          const id = `${q.kind}:${q.userId}`;
          const ochilgan = ochiq === id;
          const ogoh = ogohlantirish(q);
          return (
            <li key={id} data-odam={q.name}>
              <button type="button" onClick={() => och(q)} disabled={!data.canManage}
                className="w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-neutral-50 dark:hover:bg-white/[0.03] disabled:cursor-default">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                    {q.name}
                    {q.ikkiTizim && <span className="ml-1.5 text-[11px] font-medium text-neutral-400">{q.kind === "TEACHER" ? "(o'qituvchi)" : "(xodim)"}</span>}
                  </p>
                  <p className="text-[11.5px] text-neutral-500 dark:text-neutral-400 truncate">{`${q.tafsil} · ${q.maoshMatn}`}</p>
                  {q.ikkiTizim && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">Ikki oylikda: avansni bittasidan bering</p>
                  )}
                  {ogoh && <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">{ogoh}</p>}
                </div>
                <RejaBelgisi q={q} standart={data.sozlama.standart} />
              </button>
              {ochilgan && (
                <div className="px-3 pb-3 space-y-2.5">
                  {!q.maoshBor ? (
                    <p className="text-[12px] text-amber-700 dark:text-amber-400 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>
                        {q.kind === "STAFF" ? "Stavka yo'q: avans ayirilmaydi. " : "Maosh kiritilmagan: avans ayirilmaydi. "}
                        <Link href={q.kind === "STAFF" ? "/xodimlar" : "/teachers"} className="underline font-semibold">
                          {q.kind === "STAFF" ? "Stavka belgilash" : "O'qituvchi kartasi"}
                        </Link>
                      </span>
                    </p>
                  ) : (
                    <>
                      <div className="flex gap-1.5 flex-wrap">
                        {([["STANDART", q.egasi ? "Standart (egasi: yo'q)" : "Standart"], ["ALOHIDA", "Alohida summa"], ["YOQ", "Avans yo'q"]] as [Rejim, string][]).map(([k, nom]) => (
                          <button key={k} type="button" onClick={() => setRejim(k)} aria-pressed={rejim === k}
                            className={cn("h-8 px-3 rounded-lg text-[12px] font-semibold border transition-colors",
                              rejim === k ? "border-indigo-500 bg-indigo-600 text-white" : "border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-300")}>
                            {nom}
                          </button>
                        ))}
                      </div>
                      {rejim === "ALOHIDA" && <SomInput value={summa} onChange={setSumma} autoFocus />}
                      <div className="flex gap-2">
                        <button type="button" onClick={() => saqla(q)} disabled={ishlamoqda} data-reja-saqla
                          className="h-9 px-4 rounded-lg bg-indigo-600 text-white text-[12.5px] font-semibold disabled:opacity-60">
                          {ishlamoqda ? "Saqlanmoqda..." : "Saqlash"}
                        </button>
                        <button type="button" onClick={() => setOchiq(null)}
                          className="h-9 px-3 rounded-lg text-[12.5px] text-neutral-500 border border-neutral-200 dark:border-white/10">
                          Bekor
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <p className="text-[11.5px] text-neutral-500 dark:text-neutral-400">
        {"O'zgarish faqat hali berilmagan avansga ta'sir qiladi."}
      </p>
    </div>
  );
}

function RejaBelgisi({ q, standart }: { q: AvansQatori; standart: number }) {
  if (!q.maoshBor) return <span className="text-[11.5px] text-neutral-400 shrink-0">Avans ayirilmaydi</span>;
  if (q.planMode === "ALOHIDA") {
    return (
      <span className="text-[12px] font-bold text-indigo-600 dark:text-indigo-400 tabular-nums shrink-0">
        {`${formatCurrency(q.advancePlan ?? 0)} · alohida`}
      </span>
    );
  }
  if (q.planMode === "YOQ") return <span className="text-[12px] text-neutral-400 shrink-0">Avans yo&apos;q</span>;
  if (q.planMode === "EGASI") return <span className="text-[12px] text-neutral-400 shrink-0">Avans yo&apos;q (egasi)</span>;
  return (
    <span className="text-[12px] text-neutral-500 tabular-nums shrink-0">
      {`Standart · ${formatCurrency(standart)}`}
    </span>
  );
}

/** Yumshoq ogohlantirish — bloklamaydi. */
function ogohlantirish(q: AvansQatori): string | null {
  const reja = q.advancePlanned;
  if (!reja || !q.maoshBor) return null;
  if (q.oldingiOy != null && q.maoshMatn.startsWith("Foiz")) {
    return `Foizli: o'tgan oy hisoblangan ${formatCurrency(q.oldingiOy)}`;
  }
  if (q.taxminiy && reja > q.taxminiy / 2) {
    return `Avans oylikning yarmidan ko'p (oylik ${formatCurrency(q.taxminiy)})`;
  }
  return null;
}
