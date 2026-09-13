"use client";

import { useMemo, useState } from "react";
import { Users, Loader2, Check } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useLeadAssignees } from "@/lib/hooks/useLeads";
import { cn } from "@/lib/utils";

/**
 * LIDLARNI TAQSIMLASH — "1000 tasini 5 operatorga 200 tadan".
 *
 * NEGA KARTOCHKALARNI QO'LDA BELGILASH EMAS. Taxta sudrab-tashlash
 * (drag-and-drop) ustiga qurilgan; unga ko'p tanlash qo'shish ham
 * murakkab, ham foydasiz bo'lardi — 1000 ta kartochkani qo'l bilan
 * belgilash 1000 marta bosish degani. Shuning uchun tanlov MANBA
 * bo'yicha: "biriktirilmaganlar" yoki "ekranda ko'rinayotganlar".
 *
 * Natija OLDINDAN ko'rsatiladi ("200 tadan") — boshliq tugmani
 * bosishdan oldin nima bo'lishini biladi.
 */
export function DistributeModal({
  open, onClose, unassignedIds, visibleIds, onDone,
}: {
  open: boolean;
  onClose: () => void;
  unassignedIds: string[];
  visibleIds: string[];
  onDone: () => void;
}) {
  const { data: xodimlarRaw } = useLeadAssignees();
  const xodimlar = useMemo(() => xodimlarRaw ?? [], [xodimlarRaw]);

  const [manba, setManba] = useState<"savat" | "korinayotgan">("savat");
  const [tanlangan, setTanlangan] = useState<string[]>([]);
  const [saqlanmoqda, setSaqlanmoqda] = useState(false);
  const [xato, setXato] = useState("");
  const [natija, setNatija] = useState<string>("");

  const lidlar = manba === "savat" ? unassignedIds : visibleIds;
  const nechta = lidlar.length;
  const kishi = tanlangan.length;
  const ulush = kishi === 0 ? 0 : Math.floor(nechta / kishi);
  const qoldiq = kishi === 0 ? 0 : nechta % kishi;

  function belgila(id: string) {
    setTanlangan(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
    setNatija("");
  }

  async function yubor() {
    if (nechta === 0) { setXato("Taqsimlanadigan lid yo'q"); return; }
    if (kishi === 0)  { setXato("Kamida bitta xodim tanlang"); return; }
    setXato(""); setSaqlanmoqda(true);
    try {
      const r = await fetch("/api/leads/distribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds: lidlar, userIds: tanlangan }),
      });
      const d = await r.json();
      if (!r.ok) { setXato(d.error ?? "Taqsimlanmadi"); return; }
      setNatija(`${d.jami} ta lid ${kishi} ta xodimga taqsimlandi`);
      onDone();
    } catch {
      setXato("Serverga ulanib bo'lmadi");
    } finally {
      setSaqlanmoqda(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}
      title="Lidlarni taqsimlash"
      subtitle="Tanlangan xodimlarga navbat bilan teng bo'linadi"
      footer={
        <>
          <Button onClick={yubor} disabled={saqlanmoqda || nechta === 0 || kishi === 0}
            className="flex-1 h-9 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px]">
            {saqlanmoqda ? "Taqsimlanmoqda..." : "Taqsimlash"}
          </Button>
          <Button variant="outline" className="h-9 px-4 text-[13px]" onClick={onClose}>
            Yopish
          </Button>
        </>
      }>

      <div>
        <p className="text-[12px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
          Qaysi lidlar
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {([
            ["savat", "Biriktirilmaganlar", unassignedIds.length],
            ["korinayotgan", "Ekrandagilar", visibleIds.length],
          ] as const).map(([k, label, n]) => (
            <button key={k} type="button"
              onClick={() => { setManba(k); setNatija(""); }}
              className={cn("px-3 py-2 rounded-xl border text-left transition-colors",
                manba === k
                  ? "border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/30"
                  : "border-neutral-200 dark:border-white/10 hover:border-indigo-300")}>
              <span className="block text-[12px] font-semibold text-neutral-800 dark:text-neutral-200">
                {label}
              </span>
              <span className="block text-[11px] text-neutral-500">{n}{" "}ta</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <p className="text-[12px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
          Kimlarga <span className="text-neutral-400 font-normal">· {kishi}{" "}ta tanlandi</span>
        </p>
        <div className="max-h-52 overflow-y-auto rounded-xl border border-neutral-200 dark:border-white/10">
          {xodimlar.length === 0 && (
            <p className="px-3 py-4 text-[12px] text-neutral-400 text-center">Xodim yo&apos;q</p>
          )}
          {xodimlar.map(x => (
            <button key={x.id} type="button" onClick={() => belgila(x.id)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left
                hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors">
              <span className={cn("w-4 h-4 rounded border flex items-center justify-center shrink-0",
                tanlangan.includes(x.id)
                  ? "bg-indigo-600 border-indigo-600"
                  : "border-neutral-300 dark:border-white/20")}>
                {tanlangan.includes(x.id) && <Check className="w-3 h-3 text-white" />}
              </span>
              <span className="text-[12.5px] text-neutral-800 dark:text-neutral-200 truncate">
                {x.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* OLDINDAN KO'RSATISH — boshliq bosishdan oldin natijani biladi. */}
      {kishi > 0 && nechta > 0 && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30
          border border-indigo-200 dark:border-indigo-900/50 px-3 py-2.5">
          <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <p className="text-[12px] text-indigo-800 dark:text-indigo-300">
            {nechta}{" "}ta lid → {kishi}{" "}ta xodim →{" "}
            <span className="font-bold">
              {qoldiq === 0 ? `${ulush} tadan` : `${ulush}–${ulush + 1} tadan`}
            </span>
          </p>
        </div>
      )}

      {xato && (
        <p className="mt-2 text-[12px] font-medium text-red-600 dark:text-red-400">{xato}</p>
      )}
      {natija && (
        <p className="mt-2 text-[12px] font-medium text-emerald-600 dark:text-emerald-400">
          {natija}
        </p>
      )}
      {saqlanmoqda && (
        <div className="mt-2 flex justify-center">
          <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
        </div>
      )}
    </Modal>
  );
}
