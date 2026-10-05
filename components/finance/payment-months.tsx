"use client";

/**
 * "QAYSI OY UCHUN" — to'lov oynasidagi blok (2026-10-05).
 *
 * MUAMMO. To'lov hech qaysi oyga bog'lanmasdi: pul guruhdagi eng eski
 * yopilmagan qarzga tushar, kassir esa buni oldindan KO'RMASDI. Shuning
 * uchun oyni izohga qo'lda yozishardi (Mudarris: oktabrdagi 18 to'lovdan
 * 14 tasida "ОКТЯБР ОЙИ УЧУН"), tizimda yo'q oy uchun to'lov esa jimgina
 * boshqa oyga tushardi.
 *
 * YECHIM. Guruhning yopilmagan oylari ro'yxati — pul qaysi oyni yopishi
 * to'lovdan OLDIN ko'rinadi:
 *   • oy belgilansa summa o'zi to'ladi, summa yozilsa oylar o'zi belgilanadi
 *     (tanlov summadan kelib chiqadi — ikkita holat bir-biridan uzilmaydi);
 *   • eski oyni o'tkazib yuborib bo'lmaydi — pul eng eskisidan yopiladi,
 *     aks holda chekda "oktabr" turib, pul aslida sentabrni yopardi;
 *   • ortgan pul "oldindan" — qaysi oy uchun ekanini kassir tanlaydi;
 *   • tizimda yo'q oy (masalan oktabrda kiritilgan o'quvchining sentabri)
 *     shu yerning o'zida qarz sifatida qo'shiladi va to'lov uni yopadi.
 *
 * Ro'yxat serverdagi taqsimotdan (`groupLedger.months`) keladi — karta,
 * chek va oyna bitta manbadan gapiradi.
 */

import { useState } from "react";
import { Plus, X, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/money";
import { UZ_MONTHS } from "@/lib/date-uz";
import { businessTodayStr } from "@/lib/time";

export interface OpenMonth {
  /** "YYYY-MM"; `null` — davrsiz qarz (bekor qilingan, qaytarilgan to'lov). */
  month: string | null;
  left: number;
  periodStart: string | null;
  periodEnd: string | null;
}
export interface GroupMonths {
  open: OpenMonth[];
  charged: string[];
  /**
   * "Ro'yxatda yo'q oy" faqat SHU oydan oldin: undan keyingi oylarni tizim
   * o'zi yozadi (qo'lda qo'shilsa ikki marta qarz bo'lardi). Server beradi.
   */
  addBefore?: string;
}

export interface MonthsValue {
  /**
   * Ortgan pul qaysi oy uchun oldindan. `undefined` — standart (eng yaqin
   * qarzi yozilmagan oy), `null` — kassir "oy belgilanmasin" ni tanlagan.
   */
  advanceMonth?: string | null;
  /** Ro'yxatda yo'q oy — to'lov bilan birga qarz sifatida qo'shiladi. */
  addMonth: { month: string; amount: number } | null;
}
export const EMPTY_MONTHS: MonthsValue = { advanceMonth: undefined, addMonth: null };

/** "2026-09" → "Sentabr 2026". */
export function oyLabel(m: string): string {
  const [y, mm] = m.split("-").map(Number);
  return `${UZ_MONTHS[mm - 1] ?? m} ${y}`;
}

const keyingiOy = (m: string) => {
  const [y, mm] = m.split("-").map(Number);
  return mm === 12 ? `${y + 1}-01` : `${y}-${String(mm + 1).padStart(2, "0")}`;
};
const oldingiOy = (m: string) => {
  const [y, mm] = m.split("-").map(Number);
  return mm === 1 ? `${y - 1}-12` : `${y}-${String(mm - 1).padStart(2, "0")}`;
};

/** Davr sanalari faqat sikl rejimida ko'rsatiladi (oy 1-sanasidan boshlanmasa). */
function davrSanasi(o: OpenMonth): string | null {
  if (!o.periodStart || !o.periodEnd || o.periodStart.endsWith("-01")) return null;
  const s = o.periodStart.split("-");
  const e = new Date(`${o.periodEnd}T00:00:00Z`);
  e.setUTCDate(e.getUTCDate() - 1);           // davr oxiri ochiq (eksklyuziv) saqlanadi
  const p = (n: number) => String(n).padStart(2, "0");
  return `${s[2]}.${s[1]} – ${p(e.getUTCDate())}.${p(e.getUTCMonth() + 1)}`;
}

interface Qator extends OpenMonth { month: string; yangi?: boolean }

function qatorlar(data: GroupMonths | null, value: MonthsValue): { rows: Qator[]; davrsiz: number } {
  const rows: Qator[] = (data?.open ?? [])
    .filter((o): o is Qator => o.month !== null)
    .map((o) => ({ ...o }));
  if (value.addMonth && !rows.some((r) => r.month === value.addMonth!.month)) {
    rows.push({ month: value.addMonth.month, left: value.addMonth.amount,
                periodStart: null, periodEnd: null, yangi: true });
  }
  rows.sort((a, b) => a.month.localeCompare(b.month));
  const davrsiz = (data?.open ?? []).filter((o) => o.month === null).reduce((s, o) => s + o.left, 0);
  return { rows, davrsiz };
}

/** Oldindan to'lov uchun oylar: joriy oydan boshlab hali qarzi yozilmaganlari. */
export function oldindanOylar(data: GroupMonths | null): string[] {
  const band = new Set([...(data?.charged ?? []), ...(data?.open ?? []).map((o) => o.month).filter(Boolean) as string[]]);
  const out: string[] = [];
  let m = businessTodayStr().slice(0, 7);
  for (let i = 0; i < 12 && out.length < 3; i++, m = keyingiOy(m)) if (!band.has(m)) out.push(m);
  return out;
}

/**
 * Summadan oylar: eng eskisidan boshlab qaysi oylar to'liq yoki qisman
 * yopiladi, qancha boshqa guruh qarziga ketadi va qancha oldindan qoladi.
 * Server ham AYNAN shu tartibda taqsimlaydi: avval shu guruhning tanlangan
 * oylari, keyin shu guruhning qolgan qarzi, keyin boshqa guruhlar.
 */
export function oylarTaqsimoti(data: GroupMonths | null, amountRaw: string, value: MonthsValue,
                               otherDebt = 0, calendar = true) {
  const { rows, davrsiz } = qatorlar(data, value);
  let qoldi = Math.max(0, Math.round(Number(String(amountRaw).replace(/\s/g, "")) || 0));
  const qamrov = rows.map((r) => {
    const tushadi = Math.min(qoldi, r.left);
    qoldi -= tushadi;
    return { ...r, tushadi };
  });
  // Davrsiz qarz (kam uchraydi) oylardan keyin yopiladi.
  qoldi = Math.max(0, qoldi - davrsiz);
  const boshqaga = Math.min(qoldi, Math.max(0, otherDebt));
  const oldindan = qoldi - boshqaga;
  // Standart oy faqat OYLIK KALENDAR rejimida: sikl markazida keyingi davr
  // boshqa oyda boshlanishi mumkin — yorliq noto'g'ri bo'lmasin.
  const oldindanOy = value.advanceMonth === undefined
    ? (calendar ? oldindanOylar(data)[0] ?? null : null)
    : value.advanceMonth;
  return { qamrov, davrsiz, boshqaga, oldindan, oldindanOy };
}

/**
 * Serverga yuboriladigan qism. `forMonths` — faqat HOZIR ochiq va shu to'lov
 * yopadigan oylar; oldindan oyi alohida (`advanceFor`) — u faqat chekdagi
 * yorliq, pulni kelajakdagi davrga "bog'lab" qo'ymaydi.
 */
export function oylarPayload(data: GroupMonths | null, amountRaw: string, value: MonthsValue,
                             otherDebt = 0, calendar = true) {
  const { qamrov, oldindan, oldindanOy } = oylarTaqsimoti(data, amountRaw, value, otherDebt, calendar);
  const forMonths = [...new Set(qamrov.filter((q) => q.tushadi > 0).map((q) => q.month))].sort();
  return {
    ...(forMonths.length ? { forMonths } : {}),
    ...(value.addMonth ? { addMonth: value.addMonth } : {}),
    ...(oldindan > 0 && oldindanOy ? { advanceFor: oldindanOy } : {}),
  };
}

interface Props {
  data: GroupMonths | null;
  amount: string;
  onAmount: (v: string) => void;
  value: MonthsValue;
  onChange: (v: MonthsValue) => void;
  /** Guruhning oylik narxi — yo'q oyni qo'shishda standart summa. */
  monthlyPrice: number;
  /** Qarz yozish huquqi (payments.update) — bo'lmasa oy qo'shish ko'rinmaydi. */
  canAddMonth: boolean;
  /** O'quvchining BOSHQA guruhlardagi (va guruhsiz) qarzi — ortgan pul avval shunga. */
  otherDebt?: number;
  /** A'zolik oylik kalendar rejimidami — oldindan oyining standarti shunga bog'liq. */
  calendar?: boolean;
}

export function PaymentMonths({ data, amount, onAmount, value, onChange, monthlyPrice, canAddMonth,
                                 otherDebt = 0, calendar = true }: Props) {
  const [qoshish, setQoshish] = useState(false);
  const [yangiOy, setYangiOy] = useState("");
  const [yangiSumma, setYangiSumma] = useState("");

  const { qamrov, davrsiz, boshqaga, oldindan: ortiqcha, oldindanOy: tanlanganOldindan } =
    oylarTaqsimoti(data, amount, value, otherDebt, calendar);
  const oldindan = oldindanOylar(data);

  // Qo'shsa bo'ladigan oylar: tizim hisoblashni boshlagan oydan OLDINGI va
  // qarzi yozilmagan oxirgi 12 oy. Joriy oy hech qachon (uni tizim yozadi).
  const band = new Set([...(data?.charged ?? []), ...qamrov.map((q) => q.month)]);
  const chegara = data?.addBefore ?? businessTodayStr().slice(0, 7);
  const qoshsaBoladi: string[] = [];
  for (let m = oldingiOy(chegara), i = 0; i < 12; i++, m = oldingiOy(m)) {
    if (!band.has(m)) qoshsaBoladi.push(m);
  }

  /**
   * Oy bosilsa — summa shu oygacha (shu oy ham) bo'lgan qarzlar yig'indisi.
   * To'liq yopilayotgan oy bosilsa — shu oydan boshlab olib tashlanadi;
   * qisman yopilayotgani bosilsa — to'liq yopiladi.
   */
  function bos(i: number) {
    const toliq = qamrov[i].tushadi > 0 && qamrov[i].tushadi >= qamrov[i].left;
    const gacha = toliq ? i : i + 1;
    const summa = qamrov.slice(0, gacha).reduce((s, q) => s + q.left, 0);
    onAmount(summa > 0 ? String(Math.round(summa)) : "");
  }

  function oyQoshish() {
    const summa = Math.round(Number(yangiSumma.replace(/\s/g, "")) || 0);
    if (!yangiOy || summa <= 0) return;
    const keyin: MonthsValue = { ...value, addMonth: { month: yangiOy, amount: summa } };
    onChange(keyin);
    // Qo'shilgan oy ham yopilsin: summa shu oygacha bo'lgan qarzlar yig'indisi.
    const { rows } = qatorlar(data, keyin);
    const gacha = rows.findIndex((r) => r.month === yangiOy);
    onAmount(String(Math.round(rows.slice(0, gacha + 1).reduce((s, r) => s + r.left, 0))));
    setQoshish(false); setYangiOy(""); setYangiSumma("");
  }

  return (
    <div className="rounded-xl border border-white/60 dark:border-white/10 px-3 py-2.5 space-y-2" data-oylar>
      <div className="flex items-center gap-1.5">
        <CalendarDays className="w-3.5 h-3.5 text-neutral-400" />
        <p className="text-[12px] font-semibold text-neutral-700 dark:text-neutral-200">Qaysi oy uchun</p>
        <p className="text-[11px] text-neutral-400 ml-auto">eng eski oydan yopiladi</p>
      </div>

      {qamrov.length === 0 && (
        <p className="text-[12px] text-neutral-500 dark:text-neutral-400">
          Bu guruhda yopilmagan oy yo&apos;q — to&apos;lov oldindan bo&apos;ladi.
        </p>
      )}

      {qamrov.map((q, i) => {
        const toliq = q.tushadi >= q.left && q.tushadi > 0;
        const qisman = q.tushadi > 0 && !toliq;
        const sana = davrSanasi(q);
        return (
          <div key={q.month} className="flex items-center gap-2" data-oy={q.month}>
            <button type="button" onClick={() => bos(i)}
              className="flex items-center gap-2 min-w-0 flex-1 text-left"
              aria-pressed={q.tushadi > 0}>
              <span className={cn("h-4 w-4 shrink-0 rounded border grid place-items-center text-[10px] font-bold",
                q.tushadi > 0
                  ? "bg-indigo-600 border-indigo-600 text-white dark:bg-indigo-500"
                  : "border-neutral-300 dark:border-neutral-600")}>
                {q.tushadi > 0 ? "✓" : ""}
              </span>
              <span className="text-[13px] font-medium text-neutral-800 dark:text-neutral-100 shrink-0">
                {oyLabel(q.month)}
              </span>
              {sana && <span className="text-[11px] text-neutral-400 truncate">{sana}</span>}
              {q.yangi && (
                <span title="To'lov bilan birga qarz sifatida qo'shiladi"
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 truncate">
                  yangi
                </span>
              )}
            </button>
            <span className="text-[12px] tabular-nums text-neutral-600 dark:text-neutral-300 shrink-0">
              {formatCurrency(q.left)}
            </span>
            <span className={cn("text-[11px] w-[88px] text-right shrink-0",
              toliq ? "text-green-600 dark:text-green-400" : qisman ? "text-amber-600 dark:text-amber-400" : "text-neutral-400")}>
              {toliq ? "yopiladi" : qisman ? `qisman ${formatCurrency(q.tushadi)}` : "—"}
            </span>
            {q.yangi && (
              <button type="button" aria-label="Qo'shilgan oyni olib tashlash"
                onClick={() => onChange({ ...value, addMonth: null })}
                className="p-0.5 text-neutral-400 hover:text-red-500">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      })}

      {davrsiz > 0 && (
        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
          Oysiz qarz: {formatCurrency(davrsiz)} — oylardan keyin yopiladi.
        </p>
      )}

      {boshqaga > 0 && (
        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 pt-1 border-t border-white/50 dark:border-white/10">
          Ortgan {formatCurrency(boshqaga)} boshqa guruhdagi qarzni yopadi.
        </p>
      )}

      {ortiqcha > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/50 dark:border-white/10" data-oldindan>
          <span className="text-[12px] text-neutral-600 dark:text-neutral-300">
            Oldindan: <b className="text-green-600 dark:text-green-400">{formatCurrency(ortiqcha)}</b>
          </span>
          {[...oldindan, null].map((m) => (
            <button key={m ?? "yoq"} type="button"
              onClick={() => onChange({ ...value, advanceMonth: m })}
              className={cn("px-2 h-7 rounded-lg text-[11px] font-semibold border transition-colors",
                tanlanganOldindan === m
                  ? "bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500"
                  : "border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-indigo-400")}>
              {m ? oyLabel(m) : "oy belgilanmasin"}
            </button>
          ))}
        </div>
      )}

      {canAddMonth && !value.addMonth && qoshsaBoladi.length > 0 && (
        qoshish ? (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/50 dark:border-white/10" data-oy-qoshish>
            <select value={yangiOy} onChange={(e) => {
                setYangiOy(e.target.value);
                if (!yangiSumma && monthlyPrice > 0) setYangiSumma(String(Math.round(monthlyPrice)));
              }}
              className="h-8 px-2 text-[12px] rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900">
              <option value="">Oy…</option>
              {qoshsaBoladi.map((m) => <option key={m} value={m}>{oyLabel(m)}</option>)}
            </select>
            <input type="number" inputMode="numeric" min="0" placeholder="Summa"
              value={yangiSumma} onChange={(e) => setYangiSumma(e.target.value)}
              className="h-8 w-28 px-2 text-[12px] rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900" />
            <button type="button" onClick={oyQoshish}
              disabled={!yangiOy || !(Number(yangiSumma) > 0)}
              className="h-8 px-2.5 rounded-lg text-[12px] font-semibold bg-indigo-600 text-white disabled:opacity-40">
              Qarz sifatida qo&apos;shish
            </button>
            <button type="button" onClick={() => setQoshish(false)}
              className="h-8 px-2 text-[12px] text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200">
              Bekor
            </button>
            <p className="w-full text-[11px] text-neutral-400">
              Masalan o&apos;quvchi tizimga keyin kiritilgan va oldingi oy qarzi yo&apos;q. Qarz va to&apos;lov birga yoziladi.
            </p>
          </div>
        ) : (
          <button type="button" onClick={() => setQoshish(true)}
            className="flex items-center gap-1 text-[12px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            <Plus className="w-3.5 h-3.5" />{" "}{"Ro'yxatda yo'q oyni qo'shish"}
          </button>
        )
      )}
    </div>
  );
}
