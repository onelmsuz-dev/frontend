"use client";

import { useMemo, useRef, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/money";
import { SomInput } from "./som-input";
import {
  OyNomi, oyNomi, sanaQisqa, soro, yangiKalit, avansniYangila, type AvansQatori,
} from "@/lib/salary-advance";

/**
 * "BERILDI" OYNASI — bitta odamga avans.
 *
 * Yozuv FAQAT shu yerda yaratiladi: kassir pulni qo'lga berib bosadi.
 * `requestKey` oyna ochilganda bir marta yaratiladi — tarmoq uzilib
 * "Qayta urinish" bosilsa ham avans ikkinchi marta yozilmaydi.
 *
 * "Qo'shimcha avans" — rejadan tashqari (25-sanada yana 300 000 kabi).
 */
export function BerildiOyna({
  open, onClose, qator, month, bugun, kech, qoshimcha, onDone,
}: {
  open: boolean;
  onClose: () => void;
  qator: AvansQatori | null;
  month: string;
  bugun: string;
  /** O'tgan oy uchun kech kiritish (keyingi oyning 1–5 kunlari). */
  kech: boolean;
  qoshimcha: boolean;
  onDone: (xabar: string) => void;
}) {
  const oyOxiri = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    return `${month}-${String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, "0")}`;
  }, [month]);
  const maxSana = bugun < oyOxiri ? bugun : oyOxiri;

  const [summa, setSumma] = useState<number | null>(null);
  const [sana, setSana] = useState(maxSana);
  const [izoh, setIzoh] = useState("");
  const [tushundim, setTushundim] = useState(false);
  // Takror yuborish kaliti: birinchi bosishda yaratiladi, oyna yopilguncha
  // o'zgarmaydi — "Qayta urinish" avansni ikkinchi marta yozmaydi.
  const kalit = useRef<string | null>(null);
  const [ishlamoqda, setIshlamoqda] = useState(false);
  const [xato, setXato] = useState("");

  // Oyna OCHILGANDA bir marta (render paytida moslash): ro'yxat fonda
  // yangilansa (SWR) yozilgan summa almashib ketmasin.
  const ochilish = open && qator ? `${qator.userId}:${qator.kind}:${qoshimcha}` : "";
  const [oldingi, setOldingi] = useState("");
  if (ochilish !== oldingi) {
    setOldingi(ochilish);
    if (ochilish) {
      setSumma(qoshimcha ? null : ((qator?.advanceRemaining ?? 0) || null));
      setSana(maxSana);
      setIzoh(""); setTushundim(false); setXato("");
    }
  }
  const yop = () => { kalit.current = null; onClose(); };

  if (!qator) return null;

  const jamiBolsa = qator.advanceGiven + qator.advanceCarried + (summa ?? 0);
  const oshadi = qator.taxminiy != null && qator.taxminiy > 0 && jamiBolsa > qator.taxminiy;

  async function ber() {
    if (!summa) { setXato("Summani kiriting"); return; }
    if (!Number.isInteger(summa) || summa <= 0) { setXato("Summa butun son va 0 dan katta bo'lsin"); return; }
    if (kech && !tushundim) { setXato("Kech kiritishni tasdiqlang"); return; }
    setIshlamoqda(true); setXato("");
    kalit.current ??= yangiKalit();
    const r = await soro("POST", "/api/salary-advances", {
      userId: qator!.userId, kind: qator!.kind, month, advanceSum: summa, givenOn: sana,
      extra: qoshimcha, kechTasdiq: kech && tushundim, note: izoh.trim() || undefined,
      requestKey: kalit.current,
    });
    setIshlamoqda(false);
    if (!r.ok) {
      setXato(r.status === 0
        ? "Serverga ulanib bo'lmadi. «Qayta urinish» bossangiz avans ikkinchi marta yozilmaydi"
        : (r.data?.error ?? "Xatolik"));
      return;
    }
    avansniYangila();
    kalit.current = null;
    onDone(`${qator!.name}ga ${formatCurrency(summa)} avans berildi`);
  }

  return (
    <Modal
      open={open}
      onClose={yop}
      title={`${qator.name}: ${oyNomi(month)} avansi${qoshimcha ? " (qo'shimcha)" : ""}`}
      subtitle={`${OyNomi(month)} oyligidan ayiriladi`}
      footer={
        <>
          <Button onClick={ber} disabled={ishlamoqda} data-berildi-tasdiq
            className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-semibold">
            {ishlamoqda ? "Saqlanmoqda..."
              : xato.startsWith("Serverga") ? "Qayta urinish"
              : `Berildi: ${formatCurrency(summa ?? 0)}`}
          </Button>
          <Button variant="outline" className="h-10 px-4 text-[13px]" onClick={yop} disabled={ishlamoqda}>
            Yopish
          </Button>
        </>
      }
    >
      <div>
        <label htmlFor="avans-summa" className="text-[12px] font-medium text-neutral-500 mb-1.5 block">Summa</label>
        <SomInput id="avans-summa" value={summa} onChange={(v) => { setSumma(v); setXato(""); }} autoFocus />
        <p className="text-[11.5px] text-neutral-500 dark:text-neutral-400 mt-1.5">
          {[
            qator.advancePlanned > 0 ? `Reja: ${formatCurrency(qator.advancePlanned)}` : null,
            qator.advanceGiven > 0 ? `berilgan: ${formatCurrency(qator.advanceGiven)}` : null,
            qator.maoshMatn || null,
            qator.oldingiOy != null ? `o'tgan oy hisoblangan: ${formatCurrency(qator.oldingiOy)}` : null,
          ].filter(Boolean).join(" · ")}
        </p>
      </div>
      <div>
        <label htmlFor="avans-sana" className="text-[12px] font-medium text-neutral-500 mb-1.5 block">Berilgan sana</label>
        <input id="avans-sana" type="date" value={sana} min={`${month}-01`} max={maxSana}
          onChange={(e) => setSana(e.target.value)}
          className="w-full h-10 px-3 text-sm rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none" />
      </div>
      <div>
        <label htmlFor="avans-izoh" className="text-[12px] font-medium text-neutral-500 mb-1.5 block">Izoh (ixtiyoriy)</label>
        <input id="avans-izoh" value={izoh} maxLength={300} onChange={(e) => setIzoh(e.target.value)}
          className="w-full h-10 px-3 text-sm rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none" />
      </div>

      {kech && (
        <label className="flex items-start gap-2.5 rounded-xl border border-amber-300/70 bg-amber-50 dark:bg-amber-950/30 p-3 text-[12.5px] text-amber-800 dark:text-amber-300 cursor-pointer">
          <input type="checkbox" checked={tushundim} onChange={(e) => setTushundim(e.target.checked)} className="mt-0.5" />
          <span>
            {`${OyNomi(month)} uchun kech kiritish. ${OyNomi(month)} oyligini allaqachon qo'lda berib bo'lgan bo'lsangiz, bu avansni joriy oy uchun bering. `}
            <b>Tushundim</b>
          </span>
        </label>
      )}

      {oshadi && (
        <p className="rounded-xl border border-amber-300/70 bg-amber-50 dark:bg-amber-950/30 p-3 text-[12.5px] text-amber-800 dark:text-amber-300">
          {`Diqqat: ${oyNomi(month)} avanslari jami ${formatCurrency(jamiBolsa)} bo'ladi, taxminiy oylik ${formatCurrency(qator.taxminiy ?? 0)}. Ortig'i oy oxirida keyingi oy oyligidan ushlanadi.`}
        </p>
      )}

      <p className="text-[12px] text-neutral-500 dark:text-neutral-400">
        {"Oylikning bir qismi. Oy oxirida oylikdan ayiriladi. Xarajatlarga alohida yozmang."}
      </p>
      {qator.items.filter((a) => a.status !== "BEKOR").length > 0 && (
        <div className="text-[11.5px] text-neutral-500 dark:text-neutral-400 space-y-0.5">
          {qator.items.filter((a) => a.status !== "BEKOR").map((a) => (
            <p key={a.id}>{`${sanaQisqa(a.givenOn)} · ${formatCurrency(a.advanceSum)}${a.carriedFromMonth ? " · o'tgan oydan" : ""}${a.createdByName ? ` · kiritdi: ${a.createdByName}` : ""}`}</p>
          ))}
        </div>
      )}
      {xato && <p className="text-[12.5px] text-red-600 dark:text-red-400 font-medium" data-berildi-xato>{xato}</p>}
    </Modal>
  );
}
