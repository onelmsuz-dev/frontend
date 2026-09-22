"use client";

import { useMemo, useState } from "react";
import useSWR, { mutate } from "swr";
import {
  Calculator, Check, Coins, Settings2, ChevronDown, AlertCircle, Wallet,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { FormField } from "@/components/ui/form-field";
import { useMe, hasPerm } from "@/lib/hooks/useMe";
import { fetcher } from "@/lib/fetcher";
import { formatCurrency } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * XODIM OYLIGI.
 *
 * Maosh UCH mustaqil qismdan yig'iladi: belgilangan oylik + tushumdan
 * foiz + har o'quvchi uchun summa. Ular bir-birini istisno qilmaydi,
 * shuning uchun ekranda ham TANLOV emas, QO'SHILUVCHILAR ko'rinishida
 * turadi — "6 mln + tushumdan 3%" degan shart bitta xodimda bemalol
 * bo'lishi mumkin.
 *
 * Bir nechta filialga biriktirilgan xodim har filialdan qancha
 * olganini ko'rishi kerak: yagona raqamni tekshirishning boshqa yo'li
 * yo'q. Shuning uchun qator ochilsa filiallar kesimi chiqadi.
 */

type Kesim = {
  branchId: string | null;
  branchName: string;
  revenue: number;
  students: number;
  percentAmount: number;
  perStudentAmount: number;
};

type Qator = {
  userId: string;
  name: string;
  phone: string;
  roleName: string;
  branches: string[];
  sozlama: { base: number; percent: number | null; perStudent: number | null };
  sozlanmagan: boolean;
  salary: {
    id: string; total: number; status: "PENDING" | "PAID"; paidAt: string | null;
    base: number; percentAmount: number; perStudentAmount: number;
    bonus: number; deduction: number; note: string | null;
    breakdown: Kesim[];
  } | null;
};

const UZ_OYLAR = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
];

function joriyOy() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function oyNomi(oy: string) {
  const [yil, m] = oy.split("-").map(Number);
  const nom = UZ_OYLAR[(m || 1) - 1] ?? oy;
  return yil === new Date().getFullYear() ? nom : `${nom} ${yil}`;
}

export function StaffSalaries() {
  const { me } = useMe();
  const boshqara = hasPerm(me?.permissions, "salaries.manage");

  const [oy, setOy] = useState(joriyOy);
  const [ochilgan, setOchilgan] = useState<string | null>(null);
  const [ishlamoqda, setIshlamoqda] = useState(false);
  const [xato, setXato] = useState("");

  const { data, isLoading } =
    useSWR<{ month: string; rows: Qator[] }>(`/api/staff-salaries?month=${oy}`, fetcher);
  const qatorlar = useMemo(() => data?.rows ?? [], [data]);

  const jami = useMemo(() => {
    const hisoblangan = qatorlar.filter((q) => q.salary);
    return {
      jami:      hisoblangan.reduce((s, q) => s + (q.salary?.total ?? 0), 0),
      tolangan:  hisoblangan.filter((q) => q.salary?.status === "PAID")
                   .reduce((s, q) => s + (q.salary?.total ?? 0), 0),
      kutilmoqda: hisoblangan.filter((q) => q.salary?.status !== "PAID").length,
      sozlanmagan: qatorlar.filter((q) => q.sozlanmagan).length,
    };
  }, [qatorlar]);

  function yangila() {
    void mutate((k) => typeof k === "string" && k.startsWith("/api/staff-salaries"));
    void mutate((k) => typeof k === "string" && k.startsWith("/api/expenses"));
    void mutate((k) => typeof k === "string" && k.startsWith("/api/reports"));
  }

  async function hisobla() {
    setIshlamoqda(true); setXato("");
    try {
      const res = await fetch("/api/staff-salaries/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: oy }),
      });
      const d = await res.json();
      if (!res.ok) { setXato(d.error ?? "Xatolik"); return; }
      yangila();
    } catch { setXato("Serverga ulanib bo'lmadi"); }
    finally { setIshlamoqda(false); }
  }

  async function tolandi(id: string) {
    setIshlamoqda(true); setXato("");
    try {
      const res = await fetch(`/api/staff-salaries/${id}/paid`, { method: "PATCH" });
      const d = await res.json();
      if (!res.ok) { setXato(d.error ?? "Xatolik"); return; }
      yangila();
    } catch { setXato("Serverga ulanib bo'lmadi"); }
    finally { setIshlamoqda(false); }
  }

  // ── Stavka sozlash ─────────────────────────────────────────────────────────
  const [sozlash, setSozlash] = useState<Qator | null>(null);
  const [stavka, setStavka] = useState({ base: "", percent: "", perStudent: "" });

  function sozlashniOch(q: Qator) {
    setStavka({
      base:       q.sozlama.base ? String(q.sozlama.base) : "",
      percent:    q.sozlama.percent != null ? String(q.sozlama.percent) : "",
      perStudent: q.sozlama.perStudent != null ? String(q.sozlama.perStudent) : "",
    });
    setXato(""); setSozlash(q);
  }

  async function stavkaniSaqla() {
    if (!sozlash) return;
    const son = (v: string) => (v.trim() === "" ? null : Number(v.replace(/\s/g, "")));
    const foiz = son(stavka.percent);
    if (foiz != null && (isNaN(foiz) || foiz < 0 || foiz > 100)) {
      setXato("Foiz 0 va 100 orasida bo'lsin"); return;
    }
    setIshlamoqda(true); setXato("");
    try {
      const res = await fetch(`/api/staff-salaries/config/${sozlash.userId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salaryBase:       son(stavka.base) ?? 0,
          salaryPercent:    foiz,
          salaryPerStudent: son(stavka.perStudent),
        }),
      });
      const d = await res.json();
      if (!res.ok) { setXato(d.error ?? "Xatolik"); return; }
      setSozlash(null);
      yangila();
    } catch { setXato("Serverga ulanib bo'lmadi"); }
    finally { setIshlamoqda(false); }
  }

  // ── Bonus / ushlab qolish ──────────────────────────────────────────────────
  const [tuzatish, setTuzatish] = useState<Qator | null>(null);
  const [tuz, setTuz] = useState({ bonus: "", deduction: "", note: "" });

  function tuzatishniOch(q: Qator) {
    setTuz({
      bonus:     q.salary?.bonus ? String(q.salary.bonus) : "",
      deduction: q.salary?.deduction ? String(q.salary.deduction) : "",
      note:      q.salary?.note ?? "",
    });
    setXato(""); setTuzatish(q);
  }

  async function tuzatishniSaqla() {
    if (!tuzatish?.salary) return;
    const son = (v: string) => (v.trim() === "" ? 0 : Number(v.replace(/\s/g, "")));
    setIshlamoqda(true); setXato("");
    try {
      const res = await fetch(`/api/staff-salaries/${tuzatish.salary.id}/adjust`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bonus: son(tuz.bonus), deduction: son(tuz.deduction),
          note: tuz.note.trim() || undefined,
        }),
      });
      const d = await res.json();
      if (!res.ok) { setXato(d.error ?? "Xatolik"); return; }
      setTuzatish(null);
      yangila();
    } catch { setXato("Serverga ulanib bo'lmadi"); }
    finally { setIshlamoqda(false); }
  }

  return (
    <div className="space-y-4">
      {/* ── Boshqaruv ─────────────────────────────────────────────────────── */}
      <div className="-mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 w-max sm:w-auto">
          <input type="month" value={oy} onChange={(e) => setOy(e.target.value)}
            aria-label="Oy"
            className="h-9 px-2.5 text-xs rounded-lg border border-white/60 dark:border-white/10 glass-soft
              text-neutral-700 dark:text-neutral-300 outline-none focus:border-indigo-500 transition-colors shrink-0" />
          {boshqara && (
            <button onClick={hisobla} disabled={ishlamoqda}
              className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold
                bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors">
              <Calculator className="w-3.5 h-3.5" />
              {ishlamoqda ? "Hisoblanmoqda..." : "Hisoblash"}
            </button>
          )}
        </div>
      </div>

      {xato && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-xl px-3 py-2.5">
          <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
          <p className="text-[12px] font-medium text-red-600 dark:text-red-400">{xato}</p>
        </div>
      )}

      {/* ── Yig'ma ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: `${oyNomi(oy)} jami`, value: formatCurrency(jami.jami) },
          { label: "To'langan", value: formatCurrency(jami.tolangan) },
          { label: "Kutilmoqda", value: `${jami.kutilmoqda} ta` },
          { label: "Stavkasiz", value: `${jami.sozlanmagan} ta` },
        ].map((k) => (
          <div key={k.label}
            className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-3.5">
            <p className="text-[16px] sm:text-[18px] font-black text-neutral-900 dark:text-neutral-100 leading-none tabular-nums">
              {isLoading ? "…" : k.value}
            </p>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* ── Ro'yxat ──────────────────────────────────────────────────────── */}
      <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 rounded-lg bg-neutral-100 dark:bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : qatorlar.length === 0 ? (
          <p className="px-5 py-10 text-center text-[13px] text-neutral-400 dark:text-neutral-500">
            Xodim yo&apos;q
          </p>
        ) : (
          <ul className="divide-y divide-white/50 dark:divide-white/5">
            {qatorlar.map((q) => {
              const s = q.salary;
              const ochiq = ochilgan === q.userId;
              return (
                <li key={q.userId}>
                  <div className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                            {q.name}
                          </p>
                          {s?.status === "PAID" && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded
                              bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                              <Check className="w-3 h-3" />To&apos;landi
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5 truncate">
                          {q.roleName}
                          {q.branches.length > 0 && ` · ${q.branches.join(", ")}`}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        {q.sozlanmagan ? (
                          boshqara ? (
                            <button onClick={() => sozlashniOch(q)}
                              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[11.5px] font-semibold
                                border border-dashed border-neutral-300 dark:border-neutral-600
                                text-neutral-500 dark:text-neutral-400 hover:text-indigo-600 hover:border-indigo-400 transition-colors">
                              <Settings2 className="w-3.5 h-3.5" />Stavka belgilash
                            </button>
                          ) : (
                            <span className="text-[11.5px] text-neutral-400 dark:text-neutral-500">
                              Stavka yo&apos;q
                            </span>
                          )
                        ) : (
                          <>
                            <p className="text-[15px] font-black text-neutral-900 dark:text-neutral-100 tabular-nums leading-none">
                              {s ? formatCurrency(s.total) : "—"}
                            </p>
                            <p className="text-[10.5px] text-neutral-400 dark:text-neutral-500 mt-1">
                              {s ? "hisoblangan" : "hali hisoblanmagan"}
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Amallar + kesimni ochish */}
                    {s && (
                      <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                        <button onClick={() => setOchilgan(ochiq ? null : q.userId)}
                          className="inline-flex items-center gap-1 text-[11.5px] font-semibold
                            text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors">
                          Nimadan yig&apos;ildi
                          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", ochiq && "rotate-180")} />
                        </button>
                        {boshqara && s.status !== "PAID" && (
                          <>
                            <button onClick={() => tuzatishniOch(q)}
                              className="inline-flex items-center gap-1 text-[11.5px] font-semibold
                                text-neutral-500 dark:text-neutral-400 hover:text-indigo-600 transition-colors">
                              <Coins className="w-3.5 h-3.5" />Bonus / ushlab qolish
                            </button>
                            <button onClick={() => tolandi(s.id)} disabled={ishlamoqda}
                              className="ml-auto inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11.5px] font-bold
                                bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors">
                              <Check className="w-3.5 h-3.5" />To&apos;landi
                            </button>
                          </>
                        )}
                        {boshqara && s.status !== "PAID" && (
                          <button onClick={() => sozlashniOch(q)}
                            className="inline-flex items-center gap-1 text-[11.5px] font-semibold
                              text-neutral-500 dark:text-neutral-400 hover:text-indigo-600 transition-colors">
                            <Settings2 className="w-3.5 h-3.5" />Stavka
                          </button>
                        )}
                      </div>
                    )}

                    {/* NIMADAN YIG'ILDI — yagona raqamga ishonish uchun
                        uning qismlari ko'rinishi shart. */}
                    {s && ochiq && (
                      <div className="mt-3 rounded-xl bg-neutral-50 dark:bg-white/[0.03] p-3 space-y-1.5">
                        <Satr nom="Oylik summa" qiymat={s.base} />
                        {s.percentAmount > 0 && <Satr nom="Tushumdan foiz" qiymat={s.percentAmount} />}
                        {s.perStudentAmount > 0 && <Satr nom="O'quvchi ulushi" qiymat={s.perStudentAmount} />}
                        {s.bonus > 0 && <Satr nom="Bonus" qiymat={s.bonus} />}
                        {s.deduction > 0 && <Satr nom="Ushlab qolish" qiymat={-s.deduction} />}
                        <div className="border-t border-neutral-200 dark:border-white/10 pt-1.5">
                          <Satr nom="Jami" qiymat={s.total} kuchli />
                        </div>

                        {s.breakdown.length > 1 && (
                          <div className="pt-2 mt-1 border-t border-neutral-200 dark:border-white/10 space-y-1.5">
                            <p className="text-[10.5px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">
                              Filiallar bo&apos;yicha
                            </p>
                            {s.breakdown.map((b) => (
                              <div key={b.branchId ?? "yoq"} className="flex items-center justify-between gap-2">
                                <span className="text-[11.5px] text-neutral-600 dark:text-neutral-400 truncate">
                                  {b.branchName}
                                  <span className="text-neutral-400 dark:text-neutral-600">
                                    {" · "}{formatCurrency(b.revenue)}{" "}tushum{" · "}
                                    {b.students}{" "}o&apos;quvchi
                                  </span>
                                </span>
                                <span className="text-[11.5px] font-bold text-neutral-900 dark:text-neutral-100 tabular-nums shrink-0">
                                  {formatCurrency(b.percentAmount + b.perStudentAmount)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {s.note && (
                          <p className="pt-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 italic">
                            {s.note}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ── STAVKA ─────────────────────────────────────────────────────────── */}
      <Modal
        open={!!sozlash}
        onClose={() => setSozlash(null)}
        title={sozlash ? `${sozlash.name} — maosh stavkasi` : ""}
        subtitle="Uchta qism QO'SHILADI. Keraksizini bo'sh qoldiring"
        size="sm"
        footer={
          <>
            <Button onClick={stavkaniSaqla} disabled={ishlamoqda}
              className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-semibold">
              {ishlamoqda ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
            <Button variant="outline" className="h-10 px-4 text-[13px]"
              onClick={() => setSozlash(null)} disabled={ishlamoqda}>Bekor</Button>
          </>
        }
      >
        <FormField label="Oylik summa (so'm)" hint="Belgilangan oylik. Yo'q bo'lsa bo'sh qoldiring">
          <Input type="number" inputMode="numeric" placeholder="4 000 000" className="h-10"
            value={stavka.base}
            onChange={(e) => { setStavka((p) => ({ ...p, base: e.target.value })); setXato(""); }} />
        </FormField>

        <FormField label="Tushumdan foiz (%)"
          hint="Xodim biriktirilgan filial(lar) tushumidan. Uch filialda ishlasa — uchalasidan">
          <Input type="number" inputMode="decimal" placeholder="3" className="h-10" min="0" max="100"
            value={stavka.percent}
            onChange={(e) => { setStavka((p) => ({ ...p, percent: e.target.value })); setXato(""); }} />
        </FormField>

        <FormField label="Har o'quvchi uchun (so'm)"
          hint="Faol o'quvchi soniga ko'paytiriladi. Masalan 50 000">
          <Input type="number" inputMode="numeric" placeholder="50 000" className="h-10"
            value={stavka.perStudent}
            onChange={(e) => { setStavka((p) => ({ ...p, perStudent: e.target.value })); setXato(""); }} />
        </FormField>

        <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 bg-neutral-50 dark:bg-white/[0.03]">
          <Wallet className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
          <p className="text-[11.5px] text-neutral-500 dark:text-neutral-400">
            Stavka o&apos;zgarsa — o&apos;tgan oylarning hisobi o&apos;zgarmaydi.
            Har oyning yozuvi o&apos;sha paytdagi stavka bilan saqlanadi.
          </p>
        </div>

        {xato && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-xl px-3 py-2.5">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <p className="text-[12px] font-medium text-red-600 dark:text-red-400">{xato}</p>
          </div>
        )}
      </Modal>

      {/* ── BONUS / USHLAB QOLISH ─────────────────────────────────────────── */}
      <Modal
        open={!!tuzatish}
        onClose={() => setTuzatish(null)}
        title={tuzatish ? `${tuzatish.name} — ${oyNomi(oy)}` : ""}
        subtitle="Faqat shu oyga ta'sir qiladi"
        size="sm"
        footer={
          <>
            <Button onClick={tuzatishniSaqla} disabled={ishlamoqda}
              className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-semibold">
              {ishlamoqda ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
            <Button variant="outline" className="h-10 px-4 text-[13px]"
              onClick={() => setTuzatish(null)} disabled={ishlamoqda}>Bekor</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Bonus (so'm)">
            <Input type="number" inputMode="numeric" placeholder="0" className="h-10"
              value={tuz.bonus}
              onChange={(e) => setTuz((p) => ({ ...p, bonus: e.target.value }))} />
          </FormField>
          <FormField label="Ushlab qolish (so'm)">
            <Input type="number" inputMode="numeric" placeholder="0" className="h-10"
              value={tuz.deduction}
              onChange={(e) => setTuz((p) => ({ ...p, deduction: e.target.value }))} />
          </FormField>
        </div>
        <FormField label="Izoh" hint="Nima uchun — keyin eslab qolish uchun">
          <Input placeholder="Masalan: yanvar bayramidagi qo'shimcha ish" className="h-10"
            value={tuz.note}
            onChange={(e) => setTuz((p) => ({ ...p, note: e.target.value }))} />
        </FormField>

        {xato && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-xl px-3 py-2.5">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <p className="text-[12px] font-medium text-red-600 dark:text-red-400">{xato}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Satr({ nom, qiymat, kuchli }: { nom: string; qiymat: number; kuchli?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className={cn(
        "text-[11.5px]",
        kuchli
          ? "font-bold text-neutral-900 dark:text-neutral-100"
          : "text-neutral-600 dark:text-neutral-400",
      )}>
        {nom}
      </span>
      <span className={cn(
        "tabular-nums shrink-0",
        kuchli
          ? "text-[13px] font-black text-neutral-900 dark:text-neutral-100"
          : "text-[11.5px] font-semibold text-neutral-700 dark:text-neutral-300",
      )}>
        {qiymat < 0 ? "−" : ""}{formatCurrency(Math.abs(qiymat))}
      </span>
    </div>
  );
}
