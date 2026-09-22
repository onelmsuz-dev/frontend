"use client";

import { useMemo, useState } from "react";
import useSWR, { mutate } from "swr";
import {
  TrendingDown, TrendingUp, Wallet, Percent, Plus, Building2,
  Layers, X, AlertCircle,
} from "lucide-react";
import { TopHeader } from "@/components/layout/top-header";
import { BranchFilter, BranchPicker } from "@/components/layout/branch-filter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useBranch } from "@/lib/contexts/branch-context";
import { useMe, hasPerm } from "@/lib/hooks/useMe";
import { fetcher } from "@/lib/fetcher";
import { formatCurrency } from "@/lib/money";
import { cn } from "@/lib/utils";
import {
  GorizontalUstunlar, TarixGrafigi, type TarixOy,
} from "@/components/xarajat/xarajat-charts";

/**
 * XARAJATLAR — alohida bo'lim.
 *
 * Ilgari xarajat Moliya sahifasining ichidagi tab edi va u yerda
 * to'lov, maosh, qo'shimcha to'lovlar bilan bir qatorda turardi.
 * Xarajat esa boshqa savolga javob beradi: "pul qayerga ketdi va
 * REAL foyda qancha qoldi". Shuning uchun u o'z bo'limiga chiqdi.
 *
 * QAMROV — bo'limning o'zagi. Markazda ikki xil xarajat bor:
 *   · FILIAL xarajati — o'sha filialning ijara, kommunal, ta'miri;
 *   · UMUMIY xarajat  — markaz darajasidagi (SMS obunasi, bosh ofis).
 * Umumiy xarajat HECH BIR filial hisobotiga qo'shilmaydi, aks holda
 * u har bir filialda takrorlanib, filiallar yig'indisi jamidan katta
 * chiqardi. Ekran buni yashirmaydi — alohida qator bilan ko'rsatadi.
 */

type Qamrov = "hammasi" | "filial" | "umumiy";

type Analitika = {
  oy: string | null;
  jami: { xarajat: number; soni: number; tushum: number | null; foyda: number | null; ulush: number | null };
  oldingiOy: { xarajat: number; tushum: number | null; foyda: number | null } | null;
  kategoriyalar: { nom: string; summa: number; soni: number }[];
  filiallar: { id: string | null; nom: string; summa: number; soni: number }[];
  tarix: TarixOy[];
};

type Xarajat = {
  id: string; category: string; description: string;
  amount: number; date: string; branchId: string | null;
};

const QAMROVLAR: { id: Qamrov; label: string; icon: typeof Layers }[] = [
  { id: "hammasi", label: "Hammasi",       icon: Layers },
  { id: "filial",  label: "Filial bo'yicha", icon: Building2 },
  { id: "umumiy",  label: "Umumiy",        icon: Wallet },
];

function joriyOy() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Foizli o'zgarish. Oldingi 0 bo'lsa ko'rsatmaymiz — "cheksiz o'sish" ma'nosiz. */
function ozgarish(cur: number, prev: number): number | null {
  if (!prev) return null;
  return Math.round(((cur - prev) / prev) * 100);
}

const INPUT_CLS =
  "w-full h-9 px-3 text-sm rounded-lg border border-white/60 dark:border-white/10 " +
  "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none " +
  "focus:border-indigo-500 transition-colors";

export default function XarajatlarPage() {
  const { me } = useMe();
  const qoshaOladi = hasPerm(me?.permissions, "expenses.create");
  const pulKoradi =
    hasPerm(me?.permissions, "reports.view") || hasPerm(me?.permissions, "payments.view");

  const { activeBranchId, kopFilial, branches } = useBranch();

  const [qamrov, setQamrov] = useState<Qamrov>("hammasi");
  const [oy, setOy]         = useState(joriyOy);
  const [kategoriya, setKategoriya] = useState("");

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("month", oy);
    p.set("qamrov", qamrov);
    // "Umumiy" qamrovida filial ma'nosiz — yuborilmaydi, aks holda
    // ikki shart bir-birini inkor qilib ro'yxat doim bo'sh chiqardi.
    if (activeBranchId && qamrov !== "umumiy") p.set("branchId", activeBranchId);
    if (kategoriya) p.set("category", kategoriya);
    return p.toString();
  }, [oy, qamrov, activeBranchId, kategoriya]);

  const { data: analitika, isLoading: aLoading } =
    useSWR<Analitika>(`/api/expenses/analytics?${qs}`, fetcher);
  const { data: royxatRaw, isLoading: rLoading } =
    useSWR<Xarajat[]>(`/api/expenses?${qs}`, fetcher);
  const { data: kategoriyalar } =
    useSWR<string[]>("/api/expenses/categories/filter", fetcher);

  const royxat: Xarajat[] = Array.isArray(royxatRaw) ? royxatRaw : [];
  const filialNomi = useMemo(
    () => new Map(branches.map((b) => [b.id, b.name])),
    [branches],
  );

  // ── Yangi xarajat ──────────────────────────────────────────────────────────
  const [ochiq, setOchiq] = useState(false);
  const [forma, setForma] = useState({
    category: "", description: "", amount: "", date: "", branchId: "", umumiy: false,
  });
  const [saqlanmoqda, setSaqlanmoqda] = useState(false);
  const [xato, setXato] = useState("");

  function ochish() {
    // Qaysi qamrovda turgan bo'lsa, forma ham shunga tayyorlanadi:
    // "Umumiy" tabidan qo'shilgan xarajat filialsiz bo'lishi kerak.
    setForma({
      category: "", description: "", amount: "", date: "",
      branchId: qamrov === "umumiy" ? "" : (activeBranchId ?? ""),
      umumiy: qamrov === "umumiy",
    });
    setXato(""); setOchiq(true);
  }

  async function saqlash() {
    if (!forma.category.trim() || !forma.description.trim() || !forma.amount) {
      setXato("Kategoriya, tavsif va summa majburiy"); return;
    }
    const summa = parseFloat(forma.amount);
    if (isNaN(summa) || summa <= 0) { setXato("Summani to'g'ri kiriting"); return; }
    if (kopFilial && !forma.umumiy && !forma.branchId) {
      setXato("Filialni tanlang yoki \"umumiy xarajat\" ni belgilang"); return;
    }

    setSaqlanmoqda(true); setXato("");
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: forma.category.trim(),
          description: forma.description.trim(),
          amount: summa,
          ...(forma.umumiy ? {} : forma.branchId ? { branchId: forma.branchId } : {}),
          ...(forma.date ? { date: forma.date } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setXato(data.error ?? "Xatolik"); return; }
      void mutate((k) => typeof k === "string" && k.startsWith("/api/expenses"));
      void mutate((k) => typeof k === "string" && k.startsWith("/api/reports"));
      void mutate((k) => typeof k === "string" && k.startsWith("/api/dashboard"));
      setOchiq(false);
    } catch { setXato("Serverga ulanib bo'lmadi"); }
    finally { setSaqlanmoqda(false); }
  }

  // ── KPI ────────────────────────────────────────────────────────────────────
  const j = analitika?.jami;
  const o = analitika?.oldingiOy;
  const xarajatOzgarish = j && o ? ozgarish(j.xarajat, o.xarajat) : null;

  const kartochkalar = [
    {
      label: "Xarajat", value: j ? formatCurrency(j.xarajat) : "—",
      izoh: j ? `${j.soni} ta yozuv` : null,
      delta: xarajatOzgarish,
      // Xarajatning O'SISHI yomon xabar — shuning uchun ishora teskari.
      deltaYaxshi: xarajatOzgarish != null ? xarajatOzgarish <= 0 : null,
      icon: TrendingDown, bg: "bg-orange-50 dark:bg-orange-950/40", text: "text-orange-600 dark:text-orange-400",
    },
    {
      label: "Tushum", value: j?.tushum != null ? formatCurrency(j.tushum) : "—",
      izoh: null, delta: null, deltaYaxshi: null,
      icon: TrendingUp, bg: "bg-indigo-50 dark:bg-indigo-950/40", text: "text-indigo-600 dark:text-indigo-400",
    },
    {
      label: "Sof foyda",
      value: j?.foyda != null
        ? `${j.foyda >= 0 ? "" : "−"}${formatCurrency(Math.abs(j.foyda))}`
        : "—",
      izoh: j?.foyda != null ? "tushum − xarajat" : null,
      delta: null, deltaYaxshi: null,
      icon: Wallet,
      bg: (j?.foyda ?? 0) >= 0 ? "bg-emerald-50 dark:bg-emerald-950/40" : "bg-red-50 dark:bg-red-950/40",
      text: (j?.foyda ?? 0) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
    },
    {
      label: "Tushumdan xarajatga",
      value: j?.ulush != null ? `${j.ulush}%` : "—",
      izoh: j?.ulush != null ? "qancha qismi ketdi" : null,
      delta: null, deltaYaxshi: null,
      icon: Percent, bg: "bg-neutral-100 dark:bg-white/5", text: "text-neutral-600 dark:text-neutral-400",
    },
  ].filter((k) => pulKoradi || k.label === "Xarajat");

  // Filiallar kesimi — "Umumiy (filialsiz)" qatori ajratib ko'rsatiladi.
  const filialQatorlari = (analitika?.filiallar ?? []).map((f) => ({
    nom: f.nom, summa: f.summa, soni: f.soni, ajratilgan: f.id === null,
  }));
  const umumiySumma = analitika?.filiallar.find((f) => f.id === null)?.summa ?? 0;

  return (
    <div>
      <TopHeader
        title="Xarajatlar"
        subtitle={aLoading ? "Yuklanmoqda..." : `${analitika?.jami.soni ?? 0} ta yozuv`}
        action={qoshaOladi ? { label: "Xarajat qo'shish", onClick: ochish } : undefined}
      />

      <div className="p-5 space-y-5 pb-24">

        {/* ── QAMROV ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex p-1 gap-0.5 glass-soft rounded-xl">
            {QAMROVLAR.filter((q) => kopFilial || q.id === "hammasi").map((q) => {
              const Icon = q.icon;
              return (
                <button key={q.id} onClick={() => setQamrov(q.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                    qamrov === q.id
                      ? "bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-neutral-100"
                      : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200",
                  )}>
                  <Icon className="w-3.5 h-3.5" />{q.label}
                </button>
              );
            })}
          </div>

          <input type="month" value={oy} onChange={(e) => setOy(e.target.value)}
            className="h-9 px-2.5 text-xs rounded-lg border border-white/60 dark:border-white/10 glass-soft
              text-neutral-700 dark:text-neutral-300 outline-none focus:border-indigo-500 transition-colors" />

          {qamrov !== "umumiy" && <BranchFilter />}

          <select value={kategoriya} onChange={(e) => setKategoriya(e.target.value)}
            className="h-9 px-2.5 text-xs rounded-lg border border-white/60 dark:border-white/10 glass-soft
              text-neutral-700 dark:text-neutral-300 outline-none focus:border-indigo-500 transition-colors">
            <option value="">Barcha kategoriyalar</option>
            {(kategoriyalar ?? []).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* "Umumiy" xarajat filial hisobiga kirmasligini AYTIB turamiz —
            aks holda markaz egasi filiallar yig'indisi jamiga teng
            kelmaganini xato deb o'ylardi. */}
        {kopFilial && qamrov === "filial" && umumiySumma > 0 && (
          <div className="flex items-start gap-2 rounded-xl px-3 py-2.5
            bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[12px] text-amber-700 dark:text-amber-300">
              Bu oyda {formatCurrency(umumiySumma)} umumiy xarajat bor — u hech bir
              filial hisobiga qo&apos;shilmagan. Markaz bo&apos;yicha real foydani
              ko&apos;rish uchun &laquo;Hammasi&raquo; ni tanlang.
            </p>
          </div>
        )}

        {/* ── KPI ─────────────────────────────────────────────────────────── */}
        <div className={cn("grid gap-3", pulKoradi ? "grid-cols-2 md:grid-cols-4" : "grid-cols-1 sm:max-w-xs")}>
          {kartochkalar.map((k) => {
            const Icon = k.icon;
            return (
              <div key={k.label}
                className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", k.bg)}>
                    <Icon className={cn("w-4.5 h-4.5", k.text)} />
                  </div>
                  {k.delta != null && (
                    <span className={cn(
                      "text-[11px] font-bold px-1.5 py-0.5 rounded-md",
                      k.deltaYaxshi
                        ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
                        : "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40",
                    )}>
                      {k.delta > 0 ? "+" : ""}{k.delta}%
                    </span>
                  )}
                </div>
                <p className="text-[22px] font-black text-neutral-900 dark:text-neutral-100 leading-none tabular-nums">
                  {aLoading ? "…" : k.value}
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                  {k.label}
                  {k.izoh && <span className="text-neutral-400 dark:text-neutral-600"> · {k.izoh}</span>}
                </p>
              </div>
            );
          })}
        </div>

        {/* ── TAHLIL ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <GorizontalUstunlar
            bosh="Kategoriya bo'yicha"
            qatorlar={(analitika?.kategoriyalar ?? []).map((k) => ({
              nom: k.nom, summa: k.summa, soni: k.soni,
            }))}
            jami={analitika?.jami.xarajat}
          />
          {kopFilial ? (
            <GorizontalUstunlar bosh="Filiallar kesimi" qatorlar={filialQatorlari} />
          ) : (
            <TarixGrafigi tarix={analitika?.tarix ?? []} />
          )}
        </div>

        {kopFilial && <TarixGrafigi tarix={analitika?.tarix ?? []} />}

        {/* ── RO'YXAT ─────────────────────────────────────────────────────── */}
        <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/50 dark:border-white/10">
            <h3 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">
              Yozuvlar
            </h3>
          </div>
          {rLoading ? (
            <div className="p-5 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-neutral-100 dark:bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : royxat.length === 0 ? (
            <p className="p-8 text-center text-[13px] text-neutral-400 dark:text-neutral-500">
              Bu davrda xarajat yo&apos;q
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="text-left text-neutral-500 dark:text-neutral-400">
                    <th className="font-semibold px-5 py-2.5">Sana</th>
                    <th className="font-semibold px-5 py-2.5">Kategoriya</th>
                    <th className="font-semibold px-5 py-2.5">Tavsif</th>
                    {kopFilial && <th className="font-semibold px-5 py-2.5">Filial</th>}
                    <th className="font-semibold px-5 py-2.5 text-right">Summa</th>
                  </tr>
                </thead>
                <tbody>
                  {royxat.map((x) => (
                    <tr key={x.id}>
                      <td className="px-5 py-2.5 text-neutral-500 dark:text-neutral-400 whitespace-nowrap tabular-nums">
                        {String(x.date).slice(0, 10).split("-").reverse().join(".")}
                      </td>
                      <td className="px-5 py-2.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold
                          bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-300">
                          {x.category}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-neutral-700 dark:text-neutral-300">{x.description}</td>
                      {kopFilial && (
                        <td className="px-5 py-2.5 text-neutral-500 dark:text-neutral-400">
                          {x.branchId
                            ? (filialNomi.get(x.branchId) ?? "—")
                            : <span className="text-neutral-400 dark:text-neutral-600">Umumiy</span>}
                        </td>
                      )}
                      <td className="px-5 py-2.5 text-right font-bold text-neutral-900 dark:text-neutral-100 tabular-nums whitespace-nowrap">
                        {formatCurrency(x.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── YANGI XARAJAT ─────────────────────────────────────────────────── */}
      {ochiq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && setOchiq(false)}>
          <div className="glass-strong rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/50 dark:border-white/10">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-orange-500" />
                <h2 className="font-bold text-[15px] text-neutral-900 dark:text-neutral-100">
                  Xarajat qo&apos;shish
                </h2>
              </div>
              <button onClick={() => setOchiq(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/60 dark:hover:bg-white/10 text-neutral-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {kopFilial && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-neutral-500 block">Kimning xarajati</Label>
                  {/* Ikki tanlov ochiq turadi: "filial" va "umumiy". Ilgari
                      umumiy xarajat kiritishning yo'li shunchaki filialni
                      bo'sh qoldirish edi va uning ma'nosi ekranda hech
                      qayerda yozilmagandi. */}
                  <div className="flex gap-2">
                    <button type="button"
                      onClick={() => setForma((p) => ({ ...p, umumiy: false }))}
                      className={cn(
                        "flex-1 h-9 rounded-lg text-[12px] font-semibold border transition-colors",
                        !forma.umumiy
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "border-white/60 dark:border-white/10 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300",
                      )}>
                      Filial xarajati
                    </button>
                    <button type="button"
                      onClick={() => setForma((p) => ({ ...p, umumiy: true }))}
                      className={cn(
                        "flex-1 h-9 rounded-lg text-[12px] font-semibold border transition-colors",
                        forma.umumiy
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "border-white/60 dark:border-white/10 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300",
                      )}>
                      Umumiy
                    </button>
                  </div>
                  {forma.umumiy ? (
                    <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
                      Markaz darajasidagi xarajat. Filial hisobotiga kirmaydi,
                      faqat umumiy foydadan ayiriladi.
                    </p>
                  ) : (
                    <BranchPicker value={forma.branchId}
                      onChange={(v) => setForma((p) => ({ ...p, branchId: v }))}
                      hammasiOchiq={false}
                      className="h-9 rounded-lg text-sm" />
                  )}
                </div>
              )}

              <div>
                <Label className="text-xs font-medium text-neutral-500 mb-1.5 block">Kategoriya</Label>
                <select value={forma.category} className={INPUT_CLS}
                  onChange={(e) => { setForma((p) => ({ ...p, category: e.target.value })); setXato(""); }}>
                  <option value="">Kategoriyani tanlang...</option>
                  {(kategoriyalar ?? []).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <Label className="text-xs font-medium text-neutral-500 mb-1.5 block">Tavsif</Label>
                <Input placeholder="Masalan: Sentabr oyi ijara to'lovi" value={forma.description}
                  onChange={(e) => { setForma((p) => ({ ...p, description: e.target.value })); setXato(""); }}
                  className="h-9 text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium text-neutral-500 mb-1.5 block">Summa (so&apos;m)</Label>
                  <Input type="number" inputMode="numeric" placeholder="1 000 000" value={forma.amount}
                    onChange={(e) => { setForma((p) => ({ ...p, amount: e.target.value })); setXato(""); }}
                    className="h-9 text-sm" min="0" />
                </div>
                <div>
                  <Label className="text-xs font-medium text-neutral-500 mb-1.5 block">Sana</Label>
                  <input type="date" value={forma.date} className={INPUT_CLS}
                    onChange={(e) => setForma((p) => ({ ...p, date: e.target.value }))} />
                </div>
              </div>

              {xato && (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-xl px-3 py-2.5">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <p className="text-[12px] font-medium text-red-600 dark:text-red-400">{xato}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 px-5 py-4 border-t border-white/50 dark:border-white/10">
              <Button onClick={saqlash} disabled={saqlanmoqda}
                className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-semibold">
                <Plus className="w-3.5 h-3.5" />
                {saqlanmoqda ? "Saqlanmoqda..." : "Qo'shish"}
              </Button>
              <Button variant="outline" className="h-10 px-4 text-[13px]"
                onClick={() => setOchiq(false)} disabled={saqlanmoqda}>
                Bekor
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
