"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock, CheckCircle2, Lock, Plus, Settings2, Users, Wallet, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useMe, hasPerm } from "@/lib/hooks/useMe";
import { useSalaryAdvances } from "@/lib/hooks/useSalaryAdvances";
import { formatCurrency } from "@/lib/money";
import { cn } from "@/lib/utils";
import {
  OyNomi, oyNomi, sanaKun, sanaQisqa, HOLAT_NOMI, type AvansQatori,
} from "@/lib/salary-advance";
import { BerildiOyna } from "./berildi-oyna";
import { HammasigaOyna } from "./hammasiga-oyna";
import { AmalOyna, type AmalNishoni, type AvansAmali } from "./amal-oyna";
import { KimgaQancha } from "./kimga-qancha";
import { Yopilmagan } from "./yopilmagan";

type Chip = "BERILMAGAN" | "BERILGAN" | "HAMMASI";

/**
 * MOLIYA → "OYLIK AVANSI".
 *
 * Avans kuni ro'yxat "Bugun avans kuni" bo'ladi; kassir pulni qo'lga berib
 * "Berildi" (yoki bir bosishda "Hammasiga berildi") bosadi. Tizim pulni
 * o'zi "berildi" deb yozmaydi.
 */
export function AvansTab({ onOylikgaOt }: { onOylikgaOt: (month: string) => void }) {
  const { me } = useMe();
  const [oy, setOy] = useState<string | undefined>(undefined);
  const { data, isLoading, error } = useSalaryAdvances(oy);
  const [chip, setChip] = useState<Chip | null>(null);
  const [xabar, setXabar] = useState("");
  const [berish, setBerish] = useState<{ qator: AvansQatori; qoshimcha: boolean } | null>(null);
  const [hammasiga, setHammasiga] = useState(false);
  const [amal, setAmal] = useState<{ amal: AvansAmali; nishon: AmalNishoni } | null>(null);
  const [summalar, setSummalar] = useState(false);
  const [boshqa, setBoshqa] = useState(false);


  const hisob = useMemo(() => {
    if (!data) return null;
    const joriy = data.month === data.joriyOy;
    const keyin = data.month > data.joriyOy;
    const kunKeldi = !keyin && (data.month < data.joriyOy || data.bugun >= data.avansKuni);
    const royxatda = data.rows.filter((r) => r.advancePlanned > 0
      || r.items.some((i) => i.status !== "BEKOR"));
    const berilmagan = royxatda.filter((r) => r.advanceRemaining > 0 && r.salaryStatus !== "PAID" && r.faol);
    const berilgan = royxatda.filter((r) => r.advanceGiven > 0 || r.advanceCarried > 0);
    // Bu oyga berish mumkinmi: joriy oy yoki (o'tgan oy, 1–5 kunlar).
    const berishMumkin = data.canManage && !!data.kechRuxsat;
    const boshqalar = data.rows.filter((r) => r.faol && r.maoshBor && r.salaryStatus !== "PAID"
      && !royxatda.some((x) => x.userId === r.userId && x.kind === r.kind));
    return { joriy, keyin, kunKeldi, royxatda, berilmagan, berilgan, berishMumkin, boshqalar };
  }, [data]);

  if (error) {
    return <p className="text-[13px] text-red-500">Oylik avansini yuklab bo&apos;lmadi</p>;
  }
  if (isLoading || !data || !hisob) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-neutral-200/60 dark:bg-neutral-800 animate-pulse" />
        ))}
      </div>
    );
  }

  const { joriy, kunKeldi, royxatda, berilmagan, berilgan, berishMumkin, boshqalar } = hisob;
  const faolChip: Chip = chip ?? (kunKeldi && berilmagan.length > 0 ? "BERILMAGAN" : "HAMMASI");
  const korinadi = faolChip === "BERILMAGAN" ? berilmagan : faolChip === "BERILGAN" ? berilgan : royxatda;
  const qoldiSumma = berilmagan.reduce((s, r) => s + r.advanceRemaining, 0);
  const kech = data.kechRuxsat === "KECH";

  const banner = (() => {
    if (!data.sozlama.enabled) {
      return { ton: "kulrang", matn: "Oylik avansi o'chiq. Yoqish: Sozlamalar → Pul va hisob → Oylik avansi." };
    }
    if (hisob.keyin || (joriy && data.bugun < data.avansKuni)) {
      return { ton: "kok", matn: `Avans kuni: ${data.avansKuniMatn} · ${data.jami.rejada} kishi · jami ${formatCurrency(data.jami.planned)}` };
    }
    if (joriy && data.bugun === data.avansKuni && berilmagan.length > 0) {
      return { ton: "sariq", matn: `Bugun avans kuni: ${berilmagan.length} kishiga hali berilmagan · ${formatCurrency(qoldiSumma)}`, hammasi: true };
    }
    if (berilmagan.length > 0) {
      return { ton: "sariq", matn: `Avans kuni o'tdi (${sanaKun(data.avansKuni)}): ${berilmagan.length} kishiga hali berilmagan · ${formatCurrency(qoldiSumma)}`, hammasi: joriy };
    }
    return { ton: "yashil", matn: `${OyNomi(data.month)} avanslari berildi: ${data.jami.givenCount} kishi · ${formatCurrency(data.jami.given)}` };
  })();

  const holat = (r: AvansQatori) => {
    if (r.salaryStatus === "PAID") return { matn: "Oylik to'langan", cls: "bg-neutral-100 text-neutral-500 dark:bg-white/5", lock: true };
    if (r.advancePlanned > 0 && r.advanceGiven >= r.advancePlanned) return { matn: "Berildi", cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" };
    if (r.advanceGiven > 0 && r.advanceGiven < r.advancePlanned) {
      return { matn: `Qisman ${formatCurrency(r.advanceGiven)} / ${formatCurrency(r.advancePlanned)}`, cls: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" };
    }
    if (r.advancePlanned > 0) {
      return kunKeldi
        ? { matn: "Berilmagan", cls: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" }
        : { matn: "Rejada", cls: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" };
    }
    if (r.advanceGiven > 0) return { matn: "Qo'shimcha", cls: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400" };
    return { matn: r.advanceCarried > 0 ? "O'tgan oydan" : "", cls: "bg-neutral-100 text-neutral-500 dark:bg-white/5" };
  };

  const chiplar: [Chip, string, number][] = [
    ["BERILMAGAN", "Berilmagan", berilmagan.length],
    ["BERILGAN", "Berilgan", berilgan.length],
    ["HAMMASI", "Hammasi", royxatda.length],
  ];

  return (
    <div className="space-y-4" data-avans-tab>
      {/* Oy, sozlama */}
      <div className="flex flex-wrap items-center gap-2.5">
        <label className="text-[12px] font-semibold text-neutral-500 dark:text-neutral-400" htmlFor="avans-oy">Oy:</label>
        <input id="avans-oy" type="month" value={data.month} onChange={(e) => { if (e.target.value) { setOy(e.target.value); setChip(null); } }}
          className="h-9 px-3 text-sm rounded-xl border border-white/60 dark:border-white/10 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none" />
        <span className="text-[12px] text-neutral-500 dark:text-neutral-400">
          {`Avans kuni: har oyning ${data.sozlama.day}-sanasi · Standart: ${formatCurrency(data.sozlama.standart)}`}
        </span>
        {data.canManage && (
          <div className="flex items-center gap-2 sm:ml-auto">
            {hasPerm(me?.permissions, "settings.view") && (
              <Link href="/settings?tab=avans"
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[12.5px] font-semibold border border-white/60 dark:border-white/10 text-neutral-700 dark:text-neutral-200 hover:bg-white/60 dark:hover:bg-white/10">
                <Settings2 className="w-3.5 h-3.5" />Sozlash
              </Link>
            )}
            <button type="button" onClick={() => setSummalar(true)} data-summalar
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[12.5px] font-semibold border border-white/60 dark:border-white/10 text-neutral-700 dark:text-neutral-200 hover:bg-white/60 dark:hover:bg-white/10">
              <Users className="w-3.5 h-3.5" />Summalar
            </button>
          </div>
        )}
      </div>

      {/* Banner */}
      <div data-avans-banner className={cn("rounded-2xl border px-4 py-3 flex items-center gap-3 flex-wrap",
        banner.ton === "sariq" && "border-amber-200 bg-amber-50/80 dark:border-amber-900/40 dark:bg-amber-950/30",
        banner.ton === "kok" && "border-blue-200 bg-blue-50/80 dark:border-blue-900/40 dark:bg-blue-950/30",
        banner.ton === "yashil" && "border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/40 dark:bg-emerald-950/30",
        banner.ton === "kulrang" && "border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-white/[0.03]")}>
        <CalendarClock className="w-4.5 h-4.5 shrink-0 text-neutral-500" />
        <p className="text-[13px] font-semibold text-neutral-800 dark:text-neutral-100 flex-1 min-w-0">{banner.matn}</p>
        {banner.hammasi && data.canManage && berilmagan.length >= 2 && (
          <button type="button" onClick={() => setHammasiga(true)} data-hammasiga
            className="h-9 px-3.5 rounded-xl bg-indigo-600 text-white text-[12.5px] font-semibold w-full sm:w-auto">
            Hammasiga berildi
          </button>
        )}
      </div>

      {xabar && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/30 px-3.5 py-2.5 flex items-center gap-2" data-avans-xabar>
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <p className="text-[12.5px] font-medium text-emerald-800 dark:text-emerald-300 flex-1">{xabar}</p>
          <button type="button" onClick={() => setXabar("")} className="text-emerald-700/60 hover:text-emerald-800"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Kartalar */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { nom: "Rejada", qiymat: data.jami.planned, cls: "text-blue-600 dark:text-blue-400" },
          { nom: "Berildi", qiymat: data.jami.given, cls: "text-emerald-600 dark:text-emerald-400" },
          { nom: "Qoldi", qiymat: qoldiSumma, cls: "text-amber-600 dark:text-amber-400" },
        ].map((k) => (
          <div key={k.nom} className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl px-3.5 py-3 min-w-0">
            <p className={cn("text-[15px] sm:text-[17px] font-black tabular-nums truncate", k.cls)} title={formatCurrency(k.qiymat)}>
              {formatCurrency(k.qiymat)}
            </p>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">{k.nom}</p>
          </div>
        ))}
      </div>
      <p className="text-[12px] text-neutral-500 dark:text-neutral-400">
        {`${OyNomi(data.month)}: berilgan avans ${formatCurrency(data.jami.given)}. Avans alohida xarajat emas: xodimlarniki oy oxirida oylik bilan Xarajatlarga tushadi.`}
      </p>

      {/* Ro'yxat */}
      <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-3 sm:px-4 py-3 border-b border-white/50 dark:border-white/10 flex-wrap">
          {chiplar.map(([k, nom, n]) => (
            <button key={k} type="button" onClick={() => setChip(k)} aria-pressed={faolChip === k}
              className={cn("h-8 px-3 rounded-lg text-[12px] font-semibold border transition-colors",
                faolChip === k ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                  : "border-white/60 dark:border-white/10 text-neutral-600 dark:text-neutral-300")}>
              {`${nom} ${n}`}
            </button>
          ))}
        </div>
        {korinadi.length === 0 ? (
          <div className="py-12 text-center">
            <Wallet className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
            <p className="text-[13px] text-neutral-400">
              {royxatda.length === 0 ? "Bu oy uchun oylik avansi yo'q" : "Bu ro'yxat bo'sh"}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-white/50 dark:divide-white/5">
            {korinadi.map((r) => {
              const h = holat(r);
              const berishOchiq = berishMumkin && r.salaryStatus !== "PAID" && r.faol && r.maoshBor;
              return (
                <li key={`${r.kind}:${r.userId}`} className="px-3 sm:px-4 py-3" data-avans-qator={r.name}>
                  {/* Telefonda ikki qavat: ism to'liq ko'rinsin, summa ostida. */}
                  <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
                    <div className="min-w-0 sm:flex-1">
                      <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 truncate">{r.name}</p>
                      <p className="text-[11.5px] text-neutral-500 dark:text-neutral-400 truncate">
                        {[r.tafsil, r.faol ? null : "ishdan ketgan"].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <div className="flex sm:block items-center justify-between gap-2 sm:text-right sm:shrink-0">
                      <p className="text-[13px] font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                        {formatCurrency(r.advanceGiven + r.advanceCarried)}
                        {r.advancePlanned > 0 && (
                          <span className="text-neutral-400 font-medium">{` / ${formatCurrency(r.advancePlanned)}`}</span>
                        )}
                      </p>
                      {h.matn && (
                        <span className={cn("inline-flex items-center gap-1 sm:mt-1 text-[10.5px] font-bold px-1.5 py-0.5 rounded", h.cls)}>
                          {h.lock && <Lock className="w-3 h-3" />}{h.matn}
                        </span>
                      )}
                    </div>
                    {berishOchiq && r.advanceRemaining > 0 && (
                      <button type="button" onClick={() => setBerish({ qator: r, qoshimcha: false })} data-berildi
                        className="w-full sm:w-auto h-10 sm:h-9 px-3.5 rounded-xl bg-indigo-600 text-white text-[12.5px] font-semibold shrink-0">
                        {r.advanceGiven > 0 ? "Qolganini berish" : "Berildi"}
                      </button>
                    )}
                  </div>

                  {/* Berilgan avanslar */}
                  {r.items.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {r.items.map((a) => (
                        <li key={a.id} className="flex items-center gap-2 flex-wrap text-[11.5px] text-neutral-500 dark:text-neutral-400">
                          <span className={cn(a.status === "BEKOR" && "line-through")}>
                            {a.carriedFromMonth
                              ? `${OyNomi(a.carriedFromMonth)}dan o'tgan ortiqcha avans · ${formatCurrency(a.advanceSum)}`
                              : `${sanaQisqa(a.givenOn)} · ${formatCurrency(a.advanceSum)}${a.extra ? " · qo'shimcha" : ""}${a.createdByName ? ` · kiritdi: ${a.createdByName}` : ""}`}
                          </span>
                          {a.status !== "BERILDI" && (
                            <span className="text-[10.5px] font-semibold text-neutral-400">
                              {`(${HOLAT_NOMI[a.status]}${a.closeReason && a.status !== "USHLANDI" ? `: ${a.closeReason}` : ""})`}
                            </span>
                          )}
                          {data.canManage && a.status === "BERILDI" && (
                            <>
                              {!a.carriedFromMonth && (
                                <button type="button" data-bekor
                                  onClick={() => setAmal({ amal: "BEKOR", nishon: { id: a.id, name: r.name, kind: r.kind, givenOn: a.givenOn, advanceSum: a.advanceSum, carriedFromMonth: a.carriedFromMonth } })}
                                  className="font-semibold text-red-500 hover:underline">Bekor qilish</button>
                              )}
                              <button type="button"
                                onClick={() => setAmal({ amal: "QAYTARILDI", nishon: { id: a.id, name: r.name, kind: r.kind, givenOn: a.givenOn, advanceSum: a.advanceSum, carriedFromMonth: a.carriedFromMonth } })}
                                className="font-semibold text-neutral-600 dark:text-neutral-300 hover:underline">Pul qaytarildi</button>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  {berishOchiq && r.advanceRemaining === 0 && (
                    <button type="button" onClick={() => setBerish({ qator: r, qoshimcha: true })} data-qoshimcha
                      className="mt-1.5 text-[11.5px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                      + Qo&apos;shimcha avans
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {berishMumkin && boshqalar.length > 0 && (
          <div className="px-3 sm:px-4 py-3 border-t border-white/50 dark:border-white/10">
            <button type="button" onClick={() => setBoshqa(true)} data-boshqa-odam
              className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-indigo-600 dark:text-indigo-400">
              <Plus className="w-3.5 h-3.5" />Ro&apos;yxatda yo&apos;q odamga avans
            </button>
          </div>
        )}
      </div>

      <Yopilmagan items={data.yopilmagan} canManage={data.canManage} onMsg={setXabar} onOylikgaOt={onOylikgaOt} />

      {/* Oynalar */}
      <BerildiOyna open={!!berish} qator={berish?.qator ?? null} qoshimcha={!!berish?.qoshimcha}
        month={data.month} bugun={data.bugun} kech={kech}
        onClose={() => setBerish(null)} onDone={(m) => { setBerish(null); setXabar(m); }} />
      <HammasigaOyna open={hammasiga} qatorlar={berilmagan} month={data.month} bugun={data.bugun}
        onClose={() => setHammasiga(false)} onDone={(m) => { setHammasiga(false); setXabar(m); }} />
      <AmalOyna open={!!amal} amal={amal?.amal ?? "BEKOR"} nishon={amal?.nishon ?? null}
        onClose={() => setAmal(null)} onDone={(m) => { setAmal(null); setXabar(m); }} />

      <Modal open={summalar} onClose={() => setSummalar(false)} title="Kimga qancha" subtitle="Oylik avansi summalari" size="lg"
        footer={<Button variant="outline" className="h-10 px-4 text-[13px] w-full sm:w-auto" onClick={() => setSummalar(false)}>Yopish</Button>}>
        <KimgaQancha data={data} />
      </Modal>

      <Modal open={boshqa} onClose={() => setBoshqa(false)} title="Ro'yxatda yo'q odamga avans"
        subtitle={`${OyNomi(data.month)}: rejadan tashqari, qo'shimcha avans`}
        footer={<Button variant="outline" className="h-10 px-4 text-[13px] w-full sm:w-auto" onClick={() => setBoshqa(false)}>Yopish</Button>}>
        <ul className="divide-y divide-neutral-100 dark:divide-white/5 rounded-xl border border-neutral-200 dark:border-white/10">
          {boshqalar.map((r) => (
            <li key={`${r.kind}:${r.userId}`}>
              <button type="button" onClick={() => { setBoshqa(false); setBerish({ qator: r, qoshimcha: true }); }}
                className="w-full text-left px-3 py-2.5 hover:bg-neutral-50 dark:hover:bg-white/[0.03]">
                <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">{r.name}</p>
                <p className="text-[11.5px] text-neutral-500">{`${r.tafsil} · ${r.maoshMatn}`}</p>
              </button>
            </li>
          ))}
        </ul>
        <p className="text-[11.5px] text-neutral-500">{`Avans kuni: ${sanaKun(data.avansKuni)} (${oyNomi(data.month)})`}</p>
      </Modal>
    </div>
  );
}
