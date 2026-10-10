"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/money";
import { cn } from "@/lib/utils";
import {
  OyNomi, oyNomi, sanaQisqa, soro, avansniYangila,
  type AvansBandi, type AvansTuri, type OrtiqchaAmal,
} from "@/lib/salary-advance";

/**
 * "TO'LANDI" OYNASI — o'qituvchi va xodim oyligi uchun bitta komponent.
 *
 * Avansli qatorda doim chiqadi: kassir qo'lga beriladigan summani ko'rib
 * tasdiqlaydi. Server shu summani (`expectedRemainder`) o'zi hisoblagani
 * bilan solishtiradi — shu orada yangi avans yozilgan yoki oylik qayta
 * hisoblangan bo'lsa 409 qaytadi va oyna yangi raqamni ko'rsatadi.
 *
 * Avans oylikdan ko'p chiqsa (foizli oylik kam chiqqan) — uch tanlov
 * shu oynaning o'zida: keyingi oydan ushlash, pulni qaytardi, kechirildi.
 */
export function TolandiOyna({
  open, onClose, kind, rowId, name, month, hisoblangan, advanceTotal, advanceItems, faol, onDone,
}: {
  open: boolean;
  onClose: () => void;
  kind: AvansTuri;
  rowId: string;
  name: string;
  month: string;
  hisoblangan: number;
  advanceTotal: number;
  advanceItems: AvansBandi[];
  /** Ishdan ketgan odamda "keyingi oydan" tanlovi yo'q. */
  faol: boolean;
  onDone: (xabar: string) => void;
}) {
  const Hr = Math.max(0, Math.round(hisoblangan));
  const A = Math.max(0, Math.round(advanceTotal));
  const qoldiq = Math.max(0, Hr - A);
  const ortiqcha = Math.max(0, A - Hr);

  const [amal, setAmal] = useState<OrtiqchaAmal>(faol ? "KEYINGI_OY" : "QAYTARILDI");
  const [ishlamoqda, setIshlamoqda] = useState(false);
  const [xato, setXato] = useState("");

  // Oyna har ochilganda boshlang'ich holat (render paytida moslash — effektsiz).
  const [oldingiOchiq, setOldingiOchiq] = useState(open);
  if (open !== oldingiOchiq) {
    setOldingiOchiq(open);
    if (open) { setXato(""); setAmal(faol ? "KEYINGI_OY" : "QAYTARILDI"); }
  }

  async function tasdiqla() {
    setIshlamoqda(true); setXato("");
    const url = kind === "TEACHER" ? `/api/teacher-salaries/${rowId}` : `/api/staff-salaries/${rowId}/paid`;
    const r = await soro("PATCH", url, {
      expectedRemainder: qoldiq,
      ...(ortiqcha > 0 ? { ortiqchaAmal: amal } : {}),
    });
    setIshlamoqda(false);
    if (!r.ok) {
      setXato(r.data?.error ?? "Xatolik");
      // Qoldiq o'zgargan — ro'yxat yangilanadi va oyna yangi raqamni oladi.
      if (r.status === 409) avansniYangila();
      return;
    }
    avansniYangila();
    onDone(qoldiq > 0
      ? `${name}: ${oyNomi(month)} oyligi to'landi, qo'lga ${formatCurrency(qoldiq)}`
      : `${name}: ${oyNomi(month)} oyligi avans bilan yopildi`);
  }

  const tugma = ortiqcha > 0 ? "Tasdiqlash"
    : qoldiq === 0 ? "Yopildi deb belgilash"
    : `To'landi: ${formatCurrency(qoldiq)}`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${name}: ${oyNomi(month)} oyligi`}
      size="md"
      footer={
        <>
          <Button onClick={tasdiqla} disabled={ishlamoqda} data-tolandi-tasdiq
            className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-semibold">
            {ishlamoqda ? "Saqlanmoqda..." : tugma}
          </Button>
          <Button variant="outline" className="h-10 px-4 text-[13px]" onClick={onClose} disabled={ishlamoqda}>
            Yopish
          </Button>
        </>
      }
    >
      <div className="rounded-xl bg-neutral-50 dark:bg-white/[0.03] p-3.5 space-y-2" data-tolandi-hisob>
        <Satr nom="Hisoblangan" qiymat={formatCurrency(Hr)} />
        {advanceItems.map((a) => (
          <Satr key={a.id}
            nom={a.carriedFromMonth
              ? `${OyNomi(a.carriedFromMonth)}dan o'tgan ortiqcha avans`
              : `Avans (${sanaQisqa(a.givenOn).slice(0, 5)})`}
            qiymat={`-${formatCurrency(a.advanceSum)}`} manfiy />
        ))}
        <div className="border-t border-neutral-200 dark:border-white/10 pt-2">
          <Satr nom="Qo'lga beriladi" qiymat={formatCurrency(qoldiq)} kuchli />
        </div>
        {ortiqcha > 0 && (
          <Satr nom="Ortiqcha berilgan" qiymat={formatCurrency(ortiqcha)} qizil />
        )}
      </div>

      {qoldiq === 0 && ortiqcha === 0 && A > 0 && (
        <p className="text-[12.5px] text-neutral-600 dark:text-neutral-300">
          Oylik avans bilan to&apos;liq yopildi. Qo&apos;lga 0 so&apos;m.
        </p>
      )}

      {ortiqcha > 0 && (
        <div className="space-y-2" data-ortiqcha-tanlov>
          <p className="text-[13px] font-semibold text-neutral-800 dark:text-neutral-200">
            {`Avans oylikdan ${formatCurrency(ortiqcha)} ko'p. Ortig'i bilan nima qilamiz?`}
          </p>
          {faol ? (
            <Tanlov on={amal === "KEYINGI_OY"} onClick={() => setAmal("KEYINGI_OY")}
              nom="Keyingi oy oyligidan ushlab qolinsin" izoh="Ortig'i keyingi oyning avansi bo'lib turadi" />
          ) : (
            <p className="text-[12px] text-neutral-500">Ishdan ketgan: keyingi oy oyligi yo&apos;q.</p>
          )}
          <Tanlov on={amal === "QAYTARILDI"} onClick={() => setAmal("QAYTARILDI")}
            nom="Pulni qaytardi" izoh="Ortiqcha pul kassaga qaytdi" />
          <Tanlov on={amal === "KECHIRILDI"} onClick={() => setAmal("KECHIRILDI")}
            nom="Kechirilsin" izoh="Qaytarilmaydi va keyingi oydan ham ushlanmaydi" />
        </div>
      )}

      <p className="text-[12px] leading-relaxed text-neutral-500 dark:text-neutral-400">
        {kind === "TEACHER"
          ? `O'qituvchi oyligi Xarajatlarga avtomatik yozilmaydi. Qo'lda yozsangiz, TO'LIQ summani yozing: ${formatCurrency(Hr + (amal === "KECHIRILDI" ? ortiqcha : 0))}${A > 0 ? ` (avans ${formatCurrency(Math.min(A, Hr))} + qoldiq ${formatCurrency(qoldiq)})` : ""}.`
          : `Xarajatlarga «Maosh» ${formatCurrency(Hr + (ortiqcha > 0 && amal === "KECHIRILDI" ? ortiqcha : 0))} yoziladi${A > 0 ? ` (avans ham shu summa ichida)` : ""}. Qo'lda qayta yozmang.`}
      </p>

      {xato && (
        <p className="text-[12.5px] text-red-600 dark:text-red-400 font-medium" data-tolandi-xato>{xato}</p>
      )}
    </Modal>
  );
}

function Satr({ nom, qiymat, kuchli, manfiy, qizil }: {
  nom: string; qiymat: string; kuchli?: boolean; manfiy?: boolean; qizil?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={cn("text-[12.5px]", kuchli ? "font-bold text-neutral-900 dark:text-neutral-100" : "text-neutral-600 dark:text-neutral-400")}>
        {nom}
      </span>
      <span className={cn("tabular-nums shrink-0",
        kuchli ? "text-[15px] font-black text-neutral-900 dark:text-neutral-100" : "text-[13px] font-semibold",
        manfiy && "text-indigo-600 dark:text-indigo-400",
        qizil && "text-red-600 dark:text-red-400")}>
        {qiymat}
      </span>
    </div>
  );
}

export function Tanlov({ on, onClick, nom, izoh }: { on: boolean; onClick: () => void; nom: string; izoh?: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on}
      className={cn("w-full text-left flex items-start gap-2.5 rounded-xl border px-3 py-2.5 transition-colors",
        on ? "border-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/30" : "border-neutral-200 dark:border-white/10 hover:bg-white/60 dark:hover:bg-white/5")}>
      <span className={cn("mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center",
        on ? "border-indigo-600" : "border-neutral-300 dark:border-neutral-600")}>
        {on && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">{nom}</span>
        {izoh && <span className="block text-[11.5px] text-neutral-500 dark:text-neutral-400 mt-0.5">{izoh}</span>}
      </span>
    </button>
  );
}
