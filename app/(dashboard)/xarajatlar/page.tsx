"use client";

import { useMemo, useState } from "react";
import useSWR, { mutate } from "swr";
import { Plus, Building2, Layers, Wallet, AlertCircle } from "lucide-react";
import { TopHeader } from "@/components/layout/top-header";
import { BranchFilter, BranchPicker } from "@/components/layout/branch-filter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { FormField } from "@/components/ui/form-field";
import { useBranch } from "@/lib/contexts/branch-context";
import { useMe, hasPerm } from "@/lib/hooks/useMe";
import { fetcher } from "@/lib/fetcher";
import { formatCurrency } from "@/lib/money";
import { cn } from "@/lib/utils";
import { OyHisobi } from "@/components/xarajat/xarajat-hisob";
import {
  GorizontalUstunlar, TarixGrafigi, type TarixOy,
} from "@/components/xarajat/xarajat-charts";

/**
 * XARAJATLAR — alohida bo'lim.
 *
 * Xarajat Moliya sahifasining ichidagi tab edi va to'lov, maosh,
 * qo'shimcha to'lovlar bilan bir qatorda turardi. U boshqa savolga
 * javob beradi — "pul qayerga ketdi va REAL foyda qancha qoldi".
 *
 * QAMROV — bo'limning o'zagi. Markazda ikki xil xarajat bor:
 *   · FILIAL xarajati — o'sha filialning ijara, kommunal, ta'miri;
 *   · UMUMIY xarajat  — markaz darajasidagi (SMS obunasi, bosh ofis).
 * Umumiy xarajat HECH BIR filial hisobotiga qo'shilmaydi, aks holda
 * u har bir filialda takrorlanib, filiallar yig'indisi jamidan katta
 * chiqardi. Ekran buni yashirmaydi — alohida aytadi.
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

const QAMROVLAR: { id: Qamrov; label: string; qisqa: string; icon: typeof Layers }[] = [
  { id: "hammasi", label: "Hammasi",        qisqa: "Hammasi", icon: Layers },
  { id: "filial",  label: "Filial bo'yicha", qisqa: "Filial",  icon: Building2 },
  { id: "umumiy",  label: "Umumiy",          qisqa: "Umumiy",  icon: Wallet },
];

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

/** Foizli o'zgarish. Oldingi 0 bo'lsa ko'rsatmaymiz — "cheksiz o'sish" ma'nosiz. */
function ozgarish(cur: number, prev: number): number | null {
  if (!prev) return null;
  return Math.round(((cur - prev) / prev) * 100);
}

/** Filtr boshqaruvlari — telefonda ham bir xil balandlikda. */
const FILTR_CLS =
  "h-9 px-2.5 text-xs rounded-lg border border-white/60 dark:border-white/10 glass-soft " +
  "text-neutral-700 dark:text-neutral-300 outline-none focus:border-indigo-500 transition-colors";

export default function XarajatlarPage() {
  const { me } = useMe();
  const qoshaOladi = hasPerm(me?.permissions, "expenses.create");
  const pulKoradi =
    hasPerm(me?.permissions, "reports.view") || hasPerm(me?.permissions, "payments.view");

  const { activeBranchId, kopFilial, branches, activeBranch } = useBranch();

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
      setXato("Filialni tanlang yoki \"Umumiy\" ni belgilang"); return;
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

  const j = analitika?.jami;
  const o = analitika?.oldingiOy;

  const qamrovLabel =
    qamrov === "umumiy" ? "Umumiy xarajatlar"
    : activeBranch ? activeBranch.name
    : kopFilial ? "Barcha filiallar"
    : "Markaz bo'yicha";

  const filialQatorlari = (analitika?.filiallar ?? []).map((f) => ({
    nom: f.nom, summa: f.summa, soni: f.soni, ajratilgan: f.id === null,
  }));
  const umumiySumma = analitika?.filiallar.find((f) => f.id === null)?.summa ?? 0;

  return (
    <div>
      <TopHeader
        title="Xarajatlar"
        subtitle={aLoading ? "Yuklanmoqda..." : `${oyNomi(oy)} · ${j?.soni ?? 0} ta yozuv`}
        action={qoshaOladi ? { label: "Xarajat qo'shish", onClick: ochish } : undefined}
      />

      <div className="p-4 sm:p-5 space-y-4 pb-24">

        {/* ── FILTRLAR ────────────────────────────────────────────────────────
            Telefonda o'ralib ketmasin: bitta qator bo'lib yon tomonga
            suriladi. Ilgari `flex-wrap` edi va tor ekranda to'rtta
            boshqaruv to'rt qatorga tushib, ekranning yarmini egallardi. */}
        <div className="-mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 w-max sm:w-auto sm:flex-wrap">
            {kopFilial && (
              <div className="flex p-1 gap-0.5 glass-soft rounded-xl shrink-0">
                {QAMROVLAR.map((q) => {
                  const Icon = q.icon;
                  return (
                    <button key={q.id} onClick={() => setQamrov(q.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                        qamrov === q.id
                          ? "bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-neutral-100"
                          : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200",
                      )}>
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="sm:hidden">{q.qisqa}</span>
                      <span className="hidden sm:inline">{q.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <input type="month" value={oy} onChange={(e) => setOy(e.target.value)}
              aria-label="Oy" className={cn(FILTR_CLS, "shrink-0")} />

            {qamrov !== "umumiy" && <BranchFilter className="shrink-0" />}

            <select value={kategoriya} onChange={(e) => setKategoriya(e.target.value)}
              aria-label="Kategoriya" className={cn(FILTR_CLS, "shrink-0 max-w-[170px]")}>
              <option value="">Barcha kategoriyalar</option>
              {(kategoriyalar ?? []).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Umumiy xarajat filial hisobiga kirmasligini AYTIB turamiz —
            aks holda markaz egasi filiallar yig'indisi jamiga teng
            kelmaganini xato deb o'ylardi. */}
        {kopFilial && qamrov === "filial" && umumiySumma > 0 && (
          <button type="button" onClick={() => setQamrov("hammasi")}
            className="w-full flex items-start gap-2 rounded-xl px-3 py-2.5 text-left
              bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40
              hover:border-amber-300 dark:hover:border-amber-800 transition-colors">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <span className="text-[12px] text-amber-700 dark:text-amber-300">
              Yana {formatCurrency(umumiySumma)} umumiy xarajat bor — u hech bir filial
              hisobiga qo&apos;shilmagan. Real foydani ko&apos;rish uchun bosing.
            </span>
          </button>
        )}

        {/* ── OYNING HISOBI ─────────────────────────────────────────────────── */}
        <OyHisobi
          tushum={pulKoradi ? (j?.tushum ?? 0) : null}
          xarajat={j?.xarajat ?? 0}
          foyda={j?.foyda ?? 0}
          ulush={j?.ulush ?? null}
          oyLabel={oyNomi(oy)}
          qamrovLabel={qamrovLabel}
          ozgarish={j && o ? ozgarish(j.xarajat, o.xarajat) : null}
          yuklanmoqda={aLoading}
        />

        {/* ── TAHLIL ──────────────────────────────────────────────────────── */}
        <div className={cn("grid gap-4", kopFilial && "lg:grid-cols-2")}>
          <GorizontalUstunlar
            bosh="Pul qayerga ketdi"
            qatorlar={(analitika?.kategoriyalar ?? []).map((k) => ({
              nom: k.nom, summa: k.summa, soni: k.soni,
            }))}
            jami={analitika?.jami.xarajat}
          />
          {kopFilial && (
            <GorizontalUstunlar bosh="Filiallar kesimi" qatorlar={filialQatorlari} />
          )}
        </div>

        <TarixGrafigi tarix={analitika?.tarix ?? []} />

        {/* ── RO'YXAT ─────────────────────────────────────────────────────── */}
        <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
          <div className="flex items-baseline justify-between gap-2 px-4 sm:px-5 py-3 border-b border-white/50 dark:border-white/10">
            <h3 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">Yozuvlar</h3>
            <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
              {royxat.length} ta
            </span>
          </div>

          {rLoading ? (
            <div className="p-4 sm:p-5 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-11 rounded-lg bg-neutral-100 dark:bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : royxat.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-[13px] text-neutral-400 dark:text-neutral-500">
                Bu davrda xarajat yo&apos;q
              </p>
              {qoshaOladi && (
                <button onClick={ochish}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                    bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
                  <Plus className="w-3.5 h-3.5" />Birinchisini qo&apos;shish
                </button>
              )}
            </div>
          ) : (
            <>
              {/* TELEFON — kartochka. Jadvalni yon tomonga surish
                  telefonda eng noqulay naqsh: ustunlar ekrandan chiqib
                  ketadi va summani ko'rish uchun har qatorni surish
                  kerak bo'lardi. */}
              <ul className="sm:hidden divide-y divide-white/50 dark:divide-white/5">
                {royxat.map((x) => (
                  <li key={x.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 break-words">
                          {x.description}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-semibold
                            bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-300">
                            {x.category}
                          </span>
                          <span className="text-[11px] text-neutral-400 dark:text-neutral-500 tabular-nums">
                            {String(x.date).slice(0, 10).split("-").reverse().join(".")}
                          </span>
                          {kopFilial && (
                            <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                              · {x.branchId ? (filialNomi.get(x.branchId) ?? "—") : "Umumiy"}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[13.5px] font-bold text-neutral-900 dark:text-neutral-100 tabular-nums whitespace-nowrap shrink-0">
                        {formatCurrency(x.amount)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              <table className="hidden sm:table w-full text-[12.5px]">
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
            </>
          )}
        </div>
      </div>

      {/* ── YANGI XARAJAT ─────────────────────────────────────────────────── */}
      <Modal
        open={ochiq}
        onClose={() => setOchiq(false)}
        title="Xarajat qo'shish"
        subtitle={oyNomi(oy)}
        size="sm"
        footer={
          <>
            <Button onClick={saqlash} disabled={saqlanmoqda}
              className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-semibold">
              <Plus className="w-3.5 h-3.5" />
              {saqlanmoqda ? "Saqlanmoqda..." : "Qo'shish"}
            </Button>
            <Button variant="outline" className="h-10 px-4 text-[13px]"
              onClick={() => setOchiq(false)} disabled={saqlanmoqda}>
              Bekor
            </Button>
          </>
        }
      >
        {kopFilial && (
          <FormField
            label="Kimning xarajati"
            hint={forma.umumiy
              ? "Markaz darajasidagi xarajat: filial hisobotiga kirmaydi, faqat umumiy foydadan ayiriladi"
              : undefined}
          >
            {/* Ikki tanlov OCHIQ turadi. Ilgari umumiy xarajat
                kiritishning yagona yo'li filialni bo'sh qoldirish edi
                va buning ma'nosi ekranda hech qayerda yozilmagandi. */}
            <div className="flex gap-2">
              {[
                { u: false, label: "Filial xarajati" },
                { u: true,  label: "Umumiy" },
              ].map((t) => (
                <button key={t.label} type="button"
                  onClick={() => { setForma((p) => ({ ...p, umumiy: t.u })); setXato(""); }}
                  className={cn(
                    "flex-1 h-10 rounded-lg text-[12.5px] font-semibold border transition-colors",
                    forma.umumiy === t.u
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "border-white/60 dark:border-white/10 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300",
                  )}>
                  {t.label}
                </button>
              ))}
            </div>
            {!forma.umumiy && (
              <div className="mt-2">
                <BranchPicker value={forma.branchId}
                  onChange={(v) => { setForma((p) => ({ ...p, branchId: v })); setXato(""); }}
                  hammasiOchiq={false} />
              </div>
            )}
          </FormField>
        )}

        <FormField label="Kategoriya" required>
          <select value={forma.category}
            onChange={(e) => { setForma((p) => ({ ...p, category: e.target.value })); setXato(""); }}
            className="w-full h-10 px-3 text-[13px] rounded-xl border border-white/60 dark:border-white/10
              bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none
              focus:border-indigo-500 transition-colors">
            <option value="">Tanlang...</option>
            {(kategoriyalar ?? []).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </FormField>

        <FormField label="Tavsif" required>
          <Input placeholder="Masalan: Sentabr oyi ijara to'lovi" value={forma.description}
            onChange={(e) => { setForma((p) => ({ ...p, description: e.target.value })); setXato(""); }}
            className="h-10" />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Summa (so'm)" required>
            <Input type="number" inputMode="numeric" placeholder="1 000 000" value={forma.amount}
              onChange={(e) => { setForma((p) => ({ ...p, amount: e.target.value })); setXato(""); }}
              className="h-10" min="0" />
          </FormField>
          <FormField label="Sana" hint="Bo'sh — bugun">
            <input type="date" value={forma.date}
              onChange={(e) => setForma((p) => ({ ...p, date: e.target.value }))}
              className="w-full h-10 px-3 text-[13px] rounded-xl border border-white/60 dark:border-white/10
                bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none
                focus:border-indigo-500 transition-colors" />
          </FormField>
        </div>

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
