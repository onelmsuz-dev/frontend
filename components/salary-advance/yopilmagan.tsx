"use client";

import { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/money";
import { oyNomi, type YopilmaganAvans } from "@/lib/salary-advance";
import { AmalOyna, type AmalNishoni, type AvansAmali } from "./amal-oyna";
import { YakuniyOyna } from "./yakuniy-oyna";
import { useSalaryAdvances } from "@/lib/hooks/useSalaryAdvances";

/**
 * YOPILMAGAN AVANSLAR — oylikdan hali ushlanmagan va osilib qolganlari:
 * o'tgan oyda berilgan, lekin oyligi "To'landi" qilinmagan; yoki odam
 * ishdan ketgan. Avans faqat "To'landi" yoki "Yakuniy hisob" bosilganda
 * oylikdan ushlangan deb yopiladi.
 */
export function Yopilmagan({
  items, canManage, onMsg, onOylikgaOt,
}: {
  items: YopilmaganAvans[];
  canManage: boolean;
  onMsg: (m: string) => void;
  onOylikgaOt?: (month: string) => void;
}) {
  const [amal, setAmal] = useState<{ amal: AvansAmali; nishon: AmalNishoni } | null>(null);
  const [yakuniy, setYakuniy] = useState<YopilmaganAvans | null>(null);

  const guruhlar = useMemo(() => ({
    TOLANMAGAN: items.filter((i) => i.holat === "TOLANMAGAN"),
    KETGAN: items.filter((i) => i.holat === "KETGAN"),
  }), [items]);

  if (items.length === 0) return null;

  // Yakuniy hisob butun oy uchun: shu odamning shu oydagi barcha ochiq avanslari.
  const oyAvansi = (y: YopilmaganAvans) => items
    .filter((i) => i.userId === y.userId && i.kind === y.kind && i.month === y.month)
    .reduce((s, i) => s + i.advanceSum, 0);

  const nishon = (y: YopilmaganAvans): AmalNishoni => ({
    id: y.id, name: y.name, kind: y.kind, givenOn: y.givenOn,
    advanceSum: y.advanceSum, carriedFromMonth: y.carriedFromMonth,
  });

  const qatorlar = (royxat: YopilmaganAvans[], ketgan: boolean) => royxat.map((y) => {
    const qatorYoq = !y.salaryRow || y.salaryRow.status !== "PENDING" || !y.maoshBor;
    return (
      <li key={y.id} className="px-3 py-2.5 flex items-center gap-3 flex-wrap" data-yopilmagan={y.name}>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 truncate">
            {`${y.name} · ${oyNomi(y.month)} · ${formatCurrency(y.advanceSum)}`}
          </p>
          <p className="text-[11.5px] text-neutral-500 dark:text-neutral-400">
            {[y.kind === "TEACHER" ? "O'qituvchi" : "Xodim",
              ketgan ? (y.ochirilgan ? "o'chirilgan" : "ishdan ketgan") : null,
              y.carriedFromMonth ? `${oyNomi(y.carriedFromMonth)}dan o'tgan ortiqcha` : null,
            ].filter(Boolean).join(" · ")}
          </p>
        </div>
        {canManage && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {!ketgan && !qatorYoq && onOylikgaOt && (
              <button type="button" onClick={() => onOylikgaOt(y.month)}
                className="h-8 px-2.5 rounded-lg text-[11.5px] font-semibold border border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-200">
                Oylik hisoblashga o&apos;tish
              </button>
            )}
            {(ketgan || qatorYoq) && !y.ochirilgan && (
              <button type="button" onClick={() => setYakuniy(y)} data-yakuniy-och
                className="h-8 px-2.5 rounded-lg text-[11.5px] font-semibold bg-indigo-600 text-white">
                Yakuniy hisob
              </button>
            )}
            {ketgan && (
              <>
                <button type="button" onClick={() => setAmal({ amal: "QAYTARILDI", nishon: nishon(y) })}
                  className="h-8 px-2.5 rounded-lg text-[11.5px] font-semibold border border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-200">
                  Pul qaytarildi
                </button>
                <button type="button" onClick={() => setAmal({ amal: "KECHIRISH", nishon: nishon(y) })}
                  className="h-8 px-2.5 rounded-lg text-[11.5px] font-semibold border border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-200">
                  Kechirish
                </button>
              </>
            )}
          </div>
        )}
      </li>
    );
  });

  return (
    <div className="glass-panel border border-amber-200/70 dark:border-amber-900/40 rounded-2xl overflow-hidden" data-yopilmagan-blok>
      <div className="px-4 py-3 border-b border-white/50 dark:border-white/10 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        <p className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">{`Yopilmagan avanslar (${items.length})`}</p>
      </div>
      {guruhlar.TOLANMAGAN.length > 0 && (
        <div>
          <p className="px-3 pt-2.5 text-[11px] font-bold uppercase tracking-wide text-neutral-400">Oyligi to&apos;lanmagan</p>
          <ul className="divide-y divide-neutral-100 dark:divide-white/5">{qatorlar(guruhlar.TOLANMAGAN, false)}</ul>
        </div>
      )}
      {guruhlar.KETGAN.length > 0 && (
        <div>
          <p className="px-3 pt-2.5 text-[11px] font-bold uppercase tracking-wide text-neutral-400">Ishdan ketgan</p>
          <ul className="divide-y divide-neutral-100 dark:divide-white/5">{qatorlar(guruhlar.KETGAN, true)}</ul>
        </div>
      )}
      <p className="px-4 py-2.5 text-[11.5px] text-neutral-500 dark:text-neutral-400 border-t border-white/50 dark:border-white/10">
        {"Avans faqat «To'landi» yoki «Yakuniy hisob» bosilganda oylikdan ushlangan deb yopiladi."}
      </p>

      <AmalOyna open={!!amal} amal={amal?.amal ?? "QAYTARILDI"} nishon={amal?.nishon ?? null}
        onClose={() => setAmal(null)} onDone={(m) => { setAmal(null); onMsg(m); }} />
      {yakuniy && (
        <YakuniyOyna open={!!yakuniy} onClose={() => setYakuniy(null)}
          userId={yakuniy.userId} kind={yakuniy.kind} name={yakuniy.name} month={yakuniy.month}
          avans={oyAvansi(yakuniy)}
          boshlangich={yakuniy.salaryRow?.status === "PENDING" ? Math.round(yakuniy.salaryRow.H) : null}
          faol={yakuniy.holat !== "KETGAN"}
          onDone={(m) => { setYakuniy(null); onMsg(m); }} />
      )}
    </div>
  );
}

/**
 * "Oylik hisoblash"dagi havola uchun: bayroq o'chiq markazda ham
 * yopilmagan avanslar ko'rinib, yopilishi kerak (avans osilib qolmasin).
 */
export function YopilmaganYuklab({ onMsg, onOylikgaOt }: {
  onMsg: (m: string) => void;
  onOylikgaOt?: (month: string) => void;
}) {
  const { data } = useSalaryAdvances(undefined);
  if (!data) return <div className="h-20 rounded-2xl bg-neutral-200/60 dark:bg-neutral-800 animate-pulse" />;
  if (data.yopilmagan.length === 0) {
    return <p className="text-[12.5px] text-neutral-500">Yopilmagan avans yo&apos;q</p>;
  }
  return <Yopilmagan items={data.yopilmagan} canManage={data.canManage} onMsg={onMsg} onOylikgaOt={onOylikgaOt} />;
}
