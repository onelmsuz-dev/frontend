"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/money";
import { cn } from "@/lib/utils";
import { sanaQisqa, soro, avansniYangila, type AvansTuri } from "@/lib/salary-advance";

export type AvansAmali = "BEKOR" | "QAYTARILDI" | "KECHIRISH";

export interface AmalNishoni {
  id: string;
  name: string;
  kind: AvansTuri;
  givenOn: string;
  advanceSum: number;
  carriedFromMonth: string | null;
}

/**
 * Avansni yopish: BEKOR (xato kiritilgan — yozuv o'chmaydi, tarixda
 * qoladi), QAYTARILDI (pul kassaga qaytdi), KECHIRISH (qaytarilmaydi va
 * oylikdan ham ushlanmaydi; xodimda "Maosh" xarajati yoziladi).
 */
export function AmalOyna({
  open, onClose, amal, nishon, onDone,
}: {
  open: boolean;
  onClose: () => void;
  amal: AvansAmali;
  nishon: AmalNishoni | null;
  onDone: (xabar: string) => void;
}) {
  const [sababTuri, setSababTuri] = useState<"" | "XATO" | "BOSHQA">("");
  const [sabab, setSabab] = useState("");
  const [ishlamoqda, setIshlamoqda] = useState(false);
  const [xato, setXato] = useState("");

  const [oldingiOchiq, setOldingiOchiq] = useState(open);
  if (open !== oldingiOchiq) {
    setOldingiOchiq(open);
    if (open) { setSababTuri(amal === "BEKOR" ? "" : "BOSHQA"); setSabab(""); setXato(""); }
  }

  if (!nishon) return null;
  const summa = formatCurrency(nishon.advanceSum);

  async function bajar() {
    const reason = sababTuri === "XATO" ? "Xato kiritilgan" : sabab.trim();
    if (amal !== "QAYTARILDI" && reason.length < 2) { setXato("Sababni tanlang"); return; }
    setIshlamoqda(true); setXato("");
    const yol = amal === "BEKOR" ? "cancel" : amal === "QAYTARILDI" ? "return" : "forgive";
    const r = await soro("POST", `/api/salary-advances/${nishon!.id}/${yol}`,
      amal === "QAYTARILDI" ? {} : { reason });
    setIshlamoqda(false);
    if (!r.ok) { setXato(r.data?.error ?? "Xatolik"); return; }
    avansniYangila();
    onDone(amal === "BEKOR" ? `${nishon!.name}: avans bekor qilindi`
      : amal === "QAYTARILDI" ? `${nishon!.name}: avans qaytarildi deb belgilandi`
      : `${nishon!.name}: ${summa} kechirildi`);
  }

  const sarlavha = amal === "BEKOR" ? "Avansni bekor qilish"
    : amal === "QAYTARILDI" ? "Pul qaytarildimi?" : "Avans kechirilsinmi?";
  const tugma = amal === "BEKOR" ? "Avansni bekor qilish" : amal === "QAYTARILDI" ? "Ha, qaytardi" : "Kechirish";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={sarlavha}
      size="sm"
      footer={
        <>
          <Button onClick={bajar} disabled={ishlamoqda} data-amal-tasdiq
            className={cn("flex-1 h-10 text-white text-[13px] font-semibold",
              amal === "BEKOR" ? "bg-red-600 hover:bg-red-700" : "bg-indigo-600 hover:bg-indigo-700")}>
            {ishlamoqda ? "Saqlanmoqda..." : tugma}
          </Button>
          <Button variant="outline" className="h-10 px-4 text-[13px]" onClick={onClose} disabled={ishlamoqda}>
            Yopish
          </Button>
        </>
      }
    >
      <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
        {`${nishon.name} · ${sanaQisqa(nishon.givenOn)} · ${summa}`}
      </p>
      <p className="text-[12.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">
        {amal === "BEKOR"
          ? "Bekor qilingan avans oylikdan ayirilmaydi, yozuv tarixda qoladi."
          : amal === "QAYTARILDI"
            ? `${nishon.name} pulni kassaga qaytardimi? ${summa}. Avans yopiladi va oylikdan ayirilmaydi.`
            : `${summa} kechirilsinmi? Qaytarilmaydi va oylikdan ham ushlanmaydi. `
              + (nishon.kind === "STAFF"
                ? `Xarajatlarga «Maosh» ${summa} yoziladi.`
                : `O'qituvchi oyligini Xarajatlarga qo'lda yozsangiz, bu ${summa}ni ham yozing.`)}
      </p>
      {amal === "BEKOR" && (
        <div className="flex gap-2 flex-wrap">
          {([["XATO", "Xato kiritilgan"], ["BOSHQA", "Boshqa..."]] as const).map(([k, nom]) => (
            <button key={k} type="button" onClick={() => setSababTuri(k)} aria-pressed={sababTuri === k}
              className={cn("h-8 px-3 rounded-lg text-[12px] font-semibold border transition-colors",
                sababTuri === k ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                  : "border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-300")}>
              {nom}
            </button>
          ))}
        </div>
      )}
      {amal !== "QAYTARILDI" && sababTuri === "BOSHQA" && (
        <textarea value={sabab} onChange={(e) => setSabab(e.target.value)} maxLength={300} rows={2}
          placeholder="Sabab"
          className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none" />
      )}
      {xato && <p className="text-[12.5px] text-red-600 dark:text-red-400 font-medium">{xato}</p>}
    </Modal>
  );
}
