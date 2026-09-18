"use client";

import { cn } from "@/lib/utils";
import { businessTodayStr } from "@/lib/time";

/**
 * JADVAL FILTRI — ikki qavat, IKKALA EKRANDA BIR XIL.
 *
 * Yuqori qavat: Toq kunlar · Juft kunlar · Boshqa.
 * "Boshqa" tanlansagina ostida hafta kunlari ochiladi.
 *
 * NEGA IKKI QAVAT. Markazlarning aksariyati guruhni yo Du-Ch-Ju, yo
 * Se-Pa-Sha qilib qo'yadi — ular uchun bitta bosish yetadi. Qolgan
 * holatlar (har kuni, yakshanba bilan, aralash) esa ANIQ KUN talab
 * qiladi va ularni bitta "Boshqa" ro'yxatiga tiqib qo'yish foydasiz
 * bo'lardi: bir kunda nima borligini ko'rib bo'lmasdi (egasining
 * qarori, 2026-09-18).
 *
 * Komponent ALOHIDA faylda, chunki undan ikki joy foydalanadi: jadval
 * sahifasidagi "Xonalar" ko'rinishi va o'ng tomondagi yon panel.
 * Nusxa ko'chirilsa ular vaqt o'tib bir-biridan uzoqlashardi.
 */

export type JadvalTab = "toq" | "juft" | "boshqa";

const TOQ  = ["DUSHANBA", "CHORSHANBA", "JUMA"];
const JUFT = ["SESHANBA", "PAYSHANBA", "SHANBA"];

export const KUNLAR = [
  { kalit: "DUSHANBA",   qisqa: "Du",  toliq: "Dushanba"   },
  { kalit: "SESHANBA",   qisqa: "Se",  toliq: "Seshanba"   },
  { kalit: "CHORSHANBA", qisqa: "Ch",  toliq: "Chorshanba" },
  { kalit: "PAYSHANBA",  qisqa: "Pa",  toliq: "Payshanba"  },
  { kalit: "JUMA",       qisqa: "Ju",  toliq: "Juma"       },
  { kalit: "SHANBA",     qisqa: "Sha", toliq: "Shanba"     },
  { kalit: "YAKSHANBA",  qisqa: "Yak", toliq: "Yakshanba"  },
] as const;

const TAB_NOMI: Record<JadvalTab, string> = {
  toq: "Toq kunlar", juft: "Juft kunlar", boshqa: "Boshqa",
};

/** `getDay()` (yakshanba = 0) → `KUNLAR` indeksi (dushanba = 0). */
export const dushanbadan = (getDay: number) => (getDay + 6) % 7;

/** "2026-09-18" → o'sha kunning `Date` i (lokal yarim tun). */
export function kunDate(isoKun: string): Date {
  const [y, m, d] = isoKun.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function isoKun(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Bugun — `KUNLAR` indeksida. */
export function bugungiIndeks(): number {
  return dushanbadan(kunDate(businessTodayStr()).getDay());
}

/**
 * TANLANGAN KUNNING SHU HAFTADAGI SANASI.
 *
 * Kunni tanlash "har payshanba" degani emas, "SHU HAFTANING
 * payshanbasi": guruhning boshlanish/tugash sanalari aynan shunga
 * solishtiriladi, aks holda hali boshlanmagan yoki allaqachon tugagan
 * guruh ham ro'yxatga tushardi.
 */
export function haftaSanasi(kunIdx: number): string {
  const bugun = businessTodayStr();
  const d = kunDate(bugun);
  d.setDate(d.getDate() + (kunIdx - dushanbadan(d.getDay())));
  return isoKun(d);
}

interface Filtrlanadigan {
  scheduleDays?: string[];
  startDate?: string | null;
  endDate?: string | null;
  startTime: string;
}

/**
 * Tanlangan filtr bo'yicha guruhlar.
 *
 * Toq/juft — HAFTALIK TARH, sanaga bog'liq emas. "Boshqa" esa aniq
 * kun, ya'ni o'sha kundagi sanaga ham qaraydi.
 */
export function filtrla<T extends Filtrlanadigan>(
  groups: T[], tab: JadvalTab, kunIdx: number,
): T[] {
  const tartib = (a: T, b: T) => a.startTime.localeCompare(b.startTime);

  if (tab !== "boshqa") {
    const ruxsat = tab === "toq" ? TOQ : JUFT;
    return groups
      .filter((g) => {
        const d = g.scheduleDays ?? [];
        return d.length > 0 && d.every((x) => ruxsat.includes(x));
      })
      .sort(tartib);
  }

  const sana = haftaSanasi(kunIdx);
  return groups
    .filter((g) => (g.scheduleDays ?? []).includes(KUNLAR[kunIdx].kalit))
    .filter((g) => {
      const b = String(g.startDate ?? "").slice(0, 10);
      const o = g.endDate ? String(g.endDate).slice(0, 10) : null;
      return (!b || b <= sana) && (!o || o >= sana);
    })
    .sort(tartib);
}

export function ScheduleTabs({
  tab, onTab, kunIdx, onKun, compact = false,
}: {
  tab: JadvalTab;
  onTab: (t: JadvalTab) => void;
  kunIdx: number;
  onKun: (i: number) => void;
  compact?: boolean;
}) {
  const bugunIdx = bugungiIndeks();

  return (
    <div className="shrink-0">
      <div className={cn("flex items-center gap-1 overflow-x-auto",
        compact ? "px-3 pt-2 pb-1.5" : "px-3 pt-3 pb-2")}>
        {(["toq", "juft", "boshqa"] as JadvalTab[]).map((t) => (
          <button key={t} type="button" onClick={() => onTab(t)}
            className={cn("shrink-0 px-3 h-8 rounded-xl text-[12px] font-semibold transition-colors",
              tab === t
                ? "bg-indigo-600 text-white"
                : "text-neutral-500 dark:text-neutral-400 hover:bg-white/60 dark:hover:bg-white/10")}>
            {TAB_NOMI[t]}
          </button>
        ))}
      </div>

      {/* HAFTA KUNLARI — faqat "Boshqa" tanlanganda. */}
      {tab === "boshqa" && (
        <div className={cn("flex items-center gap-0.5 overflow-x-auto",
          compact ? "px-3 pb-2" : "px-3 pb-2.5")}>
          {KUNLAR.map((k, i) => (
            <button key={k.kalit} type="button" onClick={() => onKun(i)}
              title={k.toliq}
              className={cn("shrink-0 px-2.5 h-7 rounded-lg text-[12px] font-semibold",
                "transition-colors relative",
                kunIdx === i
                  ? "bg-indigo-600 text-white"
                  : "text-neutral-500 dark:text-neutral-400 hover:bg-white/60 dark:hover:bg-white/10")}>
              {k.qisqa}
              {/* BUGUN belgisi — tanlanmagan bo'lsa ham ko'rinib tursin,
                  aks holda "bugun qaysi biri" degani yo'qolardi. */}
              {i === bugunIdx && kunIdx !== i && (
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-indigo-500" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
