"use client";

import { useRef, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/money";
import { oyNomi, sanaQisqa, soro, yangiKalit, avansniYangila, type AvansQatori } from "@/lib/salary-advance";

/**
 * "HAMMASIGA BERILDI" — avans kuni bir bosishda. Har odamga ekranda
 * ko'rinib turgan qolgan summa yoziladi; shu orada olgan yoki summasi
 * o'zgargan odamni server o'tkazib yuboradi va sababini aytadi.
 */
export function HammasigaOyna({
  open, onClose, qatorlar, month, bugun, onDone,
}: {
  open: boolean;
  onClose: () => void;
  qatorlar: AvansQatori[];
  month: string;
  bugun: string;
  onDone: (xabar: string) => void;
}) {
  // Takror yuborish kaliti — birinchi bosishda yaratiladi va oyna yopilguncha
  // saqlanadi: "Qayta urinish" bir xil kalit yuboradi.
  const kalit = useRef<string | null>(null);
  const [ishlamoqda, setIshlamoqda] = useState(false);
  const [xato, setXato] = useState("");
  const [royxat, setRoyxat] = useState<AvansQatori[]>([]);

  // Ro'yxat oyna OCHILGAN paytdagi holicha qotiriladi — tasdiqlangan
  // summalar fondagi yangilanish bilan jim o'zgarib ketmasin.
  const [oldingiOchiq, setOldingiOchiq] = useState(false);
  if (open !== oldingiOchiq) {
    setOldingiOchiq(open);
    if (open) { setXato(""); setRoyxat(qatorlar); }
  }
  const yop = () => { kalit.current = null; onClose(); };

  const jami = royxat.reduce((s, q) => s + q.advanceRemaining, 0);

  async function tasdiqla() {
    setIshlamoqda(true); setXato("");
    kalit.current ??= yangiKalit();
    const r = await soro<{
      error?: string; berildi?: { advanceSum: number }[]; otkazildi?: { name: string; sabab: string }[];
    }>("POST", "/api/salary-advances/bulk", {
      month, requestKey: kalit.current,
      items: royxat.map((q) => ({ userId: q.userId, kind: q.kind, advanceSum: q.advanceRemaining })),
    });
    setIshlamoqda(false);
    if (!r.ok) {
      setXato(r.status === 0 ? "Serverga ulanib bo'lmadi. Qayta bossangiz avans ikki marta yozilmaydi" : (r.data?.error ?? "Xatolik"));
      return;
    }
    avansniYangila();
    kalit.current = null;
    const b = r.data.berildi ?? [];
    const o = r.data.otkazildi ?? [];
    const summa = b.reduce((s, x) => s + x.advanceSum, 0);
    onDone(o.length === 0
      ? `${b.length} kishiga jami ${formatCurrency(summa)} avans berildi`
      : `${b.length} kishiga ${formatCurrency(summa)} berildi. ${o.length} kishi o'tkazib yuborildi: `
        + o.map((x) => `${x.name} (${x.sabab})`).join(", "));
  }

  return (
    <Modal
      open={open}
      onClose={yop}
      title="Hammasiga avans berildi deb yozilsinmi?"
      subtitle={`${oyNomi(month)} avansi`}
      footer={
        <>
          <Button onClick={tasdiqla} disabled={ishlamoqda || royxat.length === 0} data-hammasiga-tasdiq
            className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-semibold">
            {ishlamoqda ? "Saqlanmoqda..." : "Ha, hammasiga berildi"}
          </Button>
          <Button variant="outline" className="h-10 px-4 text-[13px]" onClick={yop} disabled={ishlamoqda}>
            Yopish
          </Button>
        </>
      }
    >
      <ul className="divide-y divide-neutral-100 dark:divide-white/5 rounded-xl border border-neutral-200 dark:border-white/10 max-h-72 overflow-y-auto">
        {royxat.map((q) => (
          <li key={`${q.kind}:${q.userId}`} className="flex items-center justify-between gap-3 px-3 py-2">
            <span className="text-[13px] text-neutral-800 dark:text-neutral-200 truncate">{q.name}</span>
            <span className="text-[13px] font-semibold tabular-nums shrink-0">{formatCurrency(q.advanceRemaining)}</span>
          </li>
        ))}
      </ul>
      <p className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">
        {`Jami: ${royxat.length} kishi · ${formatCurrency(jami)}`}
      </p>
      <p className="text-[12px] text-neutral-500 dark:text-neutral-400">
        {`Sana: bugun (${sanaQisqa(bugun)}). Pul haqiqatan qo'lga berilganiga ishonch hosil qiling.`}
      </p>
      {xato && <p className="text-[12.5px] text-red-600 dark:text-red-400 font-medium">{xato}</p>}
    </Modal>
  );
}
