"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/money";
import { SomInput } from "./som-input";
import { Tanlov } from "./tolandi-oyna";
import { OyNomi, oyNomi, soro, avansniYangila, type AvansTuri, type OrtiqchaAmal } from "@/lib/salary-advance";

/**
 * YAKUNIY HISOB — ishdan ketgan (yoki oyligi avtomatik hisoblanmaydigan)
 * odam. Tizim oylikni kunlarga bo'lmaydi: hisoblangan summani buxgalter
 * o'zi kiritadi, avans undan ayiriladi va oy yopiladi.
 */
export function YakuniyOyna({
  open, onClose, userId, kind, name, month, avans, boshlangich, faol, onDone,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  kind: AvansTuri;
  name: string;
  month: string;
  /** Shu oyning ushlanmagan avanslari yig'indisi. */
  avans: number;
  /** Oyda hisoblangan qator bo'lsa — undan to'ldiriladi. */
  boshlangich: number | null;
  faol: boolean;
  onDone: (xabar: string) => void;
}) {
  const [H, setH] = useState<number | null>(boshlangich);
  const [amal, setAmal] = useState<OrtiqchaAmal>("QAYTARILDI");
  const [ishlamoqda, setIshlamoqda] = useState(false);
  const [xato, setXato] = useState("");

  const [oldingiOchiq, setOldingiOchiq] = useState(open);
  if (open !== oldingiOchiq) {
    setOldingiOchiq(open);
    if (open) { setH(boshlangich); setXato(""); setAmal(faol ? "KEYINGI_OY" : "QAYTARILDI"); }
  }

  const Hr = Math.max(0, Math.round(H ?? 0));
  const qoldiq = Math.max(0, Hr - avans);
  const ortiqcha = Math.max(0, avans - Hr);

  async function yakunla() {
    if (H == null) { setXato("Hisoblangan summani kiriting"); return; }
    setIshlamoqda(true); setXato("");
    const r = await soro("POST", "/api/salary-advances/final", {
      userId, kind, month, hisoblangan: Hr, expectedRemainder: qoldiq,
      ...(ortiqcha > 0 ? { ortiqchaAmal: amal } : {}),
    });
    setIshlamoqda(false);
    if (!r.ok) { setXato(r.data?.error ?? "Xatolik"); if (r.status === 409) avansniYangila(); return; }
    avansniYangila();
    onDone(`${name}: ${oyNomi(month)} yakuniy hisobi qilindi, qo'lga ${formatCurrency(qoldiq)}`);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${name}: yakuniy hisob (${oyNomi(month)})`}
      subtitle={faol ? undefined : "Ishdan ketgan"}
      footer={
        <>
          <Button onClick={yakunla} disabled={ishlamoqda || H == null} data-yakuniy-tasdiq
            className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-semibold">
            {ishlamoqda ? "Saqlanmoqda..." : `Yakunlash: ${formatCurrency(qoldiq)}`}
          </Button>
          <Button variant="outline" className="h-10 px-4 text-[13px]" onClick={onClose} disabled={ishlamoqda}>
            Yopish
          </Button>
        </>
      }
    >
      <p className="text-[12.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">
        {`${OyNomi(month)} uchun hisoblangan summani o'zingiz kiriting (ishlagan kunlariga qarab). Tizim oylikni kunlarga bo'lmaydi.`}
      </p>
      <div>
        <label className="text-[12px] font-medium text-neutral-500 mb-1.5 block" htmlFor="yakuniy-h">
          Hisoblangan (so&apos;m)
        </label>
        <SomInput id="yakuniy-h" value={H} onChange={setH} autoFocus />
      </div>
      <div className="rounded-xl bg-neutral-50 dark:bg-white/[0.03] p-3.5 space-y-1.5 text-[12.5px]">
        <div className="flex justify-between"><span className="text-neutral-500">Avans</span>
          <span className="font-semibold tabular-nums text-indigo-600 dark:text-indigo-400">-{formatCurrency(avans)}</span></div>
        <div className="flex justify-between border-t border-neutral-200 dark:border-white/10 pt-1.5">
          <span className="font-bold text-neutral-900 dark:text-neutral-100">Qo&apos;lga beriladi</span>
          <span className="font-black tabular-nums text-neutral-900 dark:text-neutral-100">{formatCurrency(qoldiq)}</span></div>
      </div>
      {ortiqcha > 0 && (
        <div className="space-y-2">
          <p className="text-[13px] font-semibold text-neutral-800 dark:text-neutral-200">
            {`Avans ${formatCurrency(ortiqcha)} ko'p. Ortig'i bilan nima qilamiz?`}
          </p>
          {faol && (
            <Tanlov on={amal === "KEYINGI_OY"} onClick={() => setAmal("KEYINGI_OY")}
              nom="Keyingi oy oyligidan ushlab qolinsin" />
          )}
          <Tanlov on={amal === "QAYTARILDI"} onClick={() => setAmal("QAYTARILDI")}
            nom="Pulni qaytardi" izoh="Ortiqcha pul kassaga qaytdi" />
          <Tanlov on={amal === "KECHIRILDI"} onClick={() => setAmal("KECHIRILDI")}
            nom="Kechirilsin" izoh={kind === "STAFF" ? "Xarajatlarga «Maosh» bo'lib yoziladi" : "Qaytarilmaydi"} />
        </div>
      )}
      {xato && <p className="text-[12.5px] text-red-600 dark:text-red-400 font-medium">{xato}</p>}
    </Modal>
  );
}
