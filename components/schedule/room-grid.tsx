"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { fmtShortDate } from "@/lib/date-uz";
import { blockColorFor } from "@/lib/course-colors";
import { businessMinutesOfDay } from "@/lib/time";

/**
 * XONALAR BO'YICHA JADVAL — vaqt (qator) × xona (ustun).
 *
 * Mavjud "kun/hafta/oy" ko'rinishlari VAQT o'qiga qurilgan: ular "soat
 * 10 da nima bo'lyapti" degan savolga javob beradi. Markaz ma'muriga
 * esa boshqa savol kerak: "2-xona bo'shmi, unga yangi guruh qo'ysam
 * bo'ladimi". Xona ma'lumoti jadvalda bor edi, lekin faqat kartochka
 * ichidagi yozuv sifatida — xonani O'Q qilib ko'rsatadigan ko'rinish
 * yo'q edi (egasining talabi, 2026-09-18).
 *
 * TOQ / JUFT — O'zbekistondagi markazlarning amaldagi bo'linishi:
 * guruh yo dushanba-chorshanba-juma, yo seshanba-payshanba-shanba
 * bo'ladi. Shu ikkisiga to'liq tushmagani (har kuni, yakshanba bilan,
 * yoki aralash) "Boshqa" ga tushadi — YASHIRILMAYDI, aks holda
 * jadvaldan guruh jimgina yo'qolardi.
 *
 * QATORLAR QAT'IY SOATLAR EMAS. Vaqtlar guruhlarning O'ZIDAN olinadi:
 * markazlarda dars 08:00 va 09:30 da boshlanishi mumkin va qat'iy
 * soatlik panjara ularning yarmini noto'g'ri qatorga qo'yardi.
 */

const TOQ  = ["DUSHANBA", "CHORSHANBA", "JUMA"];
const JUFT = ["SESHANBA", "PAYSHANBA", "SHANBA"];

type Tab = "toq" | "juft" | "boshqa";

const TAB_NOMI: Record<Tab, string> = {
  toq: "Toq kunlar", juft: "Juft kunlar", boshqa: "Boshqa",
};

/** Guruh qaysi turkumga tushadi. */
export function kunTuri(days: string[] | undefined): Tab {
  const d = days ?? [];
  if (d.length === 0) return "boshqa";
  if (d.every((x) => TOQ.includes(x)))  return "toq";
  if (d.every((x) => JUFT.includes(x))) return "juft";
  return "boshqa";
}

export interface Guruh {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  scheduleDays?: string[];
  startDate?: string | null;
  endDate?: string | null;
  maxStudents?: number;
  room?: { id?: string; name?: string } | null;
  course?: { name?: string; color?: string | null } | null;
  teacher?: { user?: { name?: string } | null } | null;
  _count?: { students?: number };
}

const DAYS_SHORT: Record<string, string> = {
  DUSHANBA: "Du", SESHANBA: "Se", CHORSHANBA: "Ch",
  PAYSHANBA: "Pa", JUMA: "Ju", SHANBA: "Sha", YAKSHANBA: "Yak",
};

/**
 * SOF PANJARA — vaqt (qator) × xona (ustun).
 *
 * Filtrsiz: kimga qaysi guruhlar berilsa, o'shani chizadi. Jadval
 * sahifasi unga toq/juft bo'yicha, yon panel esa BUGUNGI kun bo'yicha
 * saralangan ro'yxat beradi — panjara markupi ikki joyda takrorlanmasin.
 */
/**
 * PANJARA CHIZIG'I — daftar katagidek ko'rinishi uchun.
 *
 * `border-white/50` (avvalgi qiymat) shisha panel ustida chiroyli
 * ko'rinardi, lekin OQ fonda oq chiziq deyarli ko'rinmaydi: qatorlar
 * bilan ustunlar bir-biriga qo'shilib ketardi va "qaysi dars qaysi
 * xonada" degani ko'z bilan ajratilmasdi (egasining xabari,
 * 2026-09-18).
 */
const PANJARA = "border-neutral-300 dark:border-neutral-700";

/**
 * YOPISHIB TURADIGAN QISMLARNING FONI — SHAFFOF BO'LMASLIGI SHART.
 *
 * Sarlavha qatori va vaqt ustuni surilganda joyida qoladi, ya'ni
 * ularning ostidan kartochkalar o'tadi. Fon shaffof bo'lsa (avvalgi
 * `dark:bg-white/5`) matnlar bir-birining ustiga tushib o'qib
 * bo'lmasdi.
 */
const HOSHIYA = "bg-neutral-50 dark:bg-neutral-800";

/** "09:30" → 570. Noto'g'ri qiymatda `null`. */
function daqiqa(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/**
 * "HOZIR" CHIZIG'I — panjara kengligida, ustunlar bilan aniq tekis.
 *
 * Modul darajasida: render ichida e'lon qilinsa React uni har safar
 * YANGI komponent deb biladi va ostidagi daraxtni qayta yaratadi.
 */
function HozirChizigi({ yorliq, eniPx }: { yorliq: string; eniPx: number }) {
  return (
    <div className="flex items-center" aria-label="Hozirgi vaqt">
      {/* Chap hoshiya vaqt ustuni bilan bir xil fonda — chiziq
          panjaraning ichidan o'tayotgandek ko'rinsin. */}
      <div className={cn("w-14 shrink-0 pr-1 text-right self-stretch",
        "flex items-center justify-end",
        "sticky left-0 z-10 border-r", PANJARA, HOSHIYA)}>
        <span className="inline-block px-1 py-0.5 rounded text-[9.5px] font-black
          tabular-nums bg-red-500 text-white">
          {yorliq}
        </span>
      </div>
      <div className="h-px bg-red-500 shrink-0" style={{ width: eniPx }} />
    </div>
  );
}

export function RoomTimeGrid({
  groups, rooms, compact = false, showNow = false,
}: {
  groups: Guruh[];
  rooms: { id: string; name: string }[];
  /** Yon panel uchun torroq ustun va kichikroq matn. */
  compact?: boolean;
  /**
   * "HOZIR SHU YERDASIZ" CHIZIG'I.
   *
   * FAQAT BUGUNGI jadval uchun. Jadval sahifasidagi xonalar
   * ko'rinishi — haftalik takrorlanadigan TARH (toq/juft), u yerda
   * "hozir" degan tushuncha yo'q va chiziq yolg'on ma'no berardi.
   */
  showNow?: boolean;
}) {
  /**
   * USTUNLAR — faqat BAND xonalar, oxirida "Xonasiz".
   * Bo'sh xonani ustun qilib chizish panjarani kengaytirar, lekin hech
   * narsa aytmasdi.
   */
  const ustunlar = useMemo(() => {
    const band = new Set(groups.map((g) => g.room?.id).filter(Boolean) as string[]);
    const list = rooms.filter((r) => band.has(r.id));
    const xonasizBor = groups.some((g) => !g.room?.id);
    return xonasizBor ? [...list, { id: "__yoq__", name: "Xonasiz" }] : list;
  }, [groups, rooms]);

  /** Qatorlar — guruhlarning haqiqiy boshlanish vaqtlari. */
  const vaqtlar = useMemo(
    () => [...new Set(groups.map((g) => g.startTime))].sort(),
    [groups]);

  const katak = (vaqt: string, xonaId: string) =>
    groups.filter((g) => g.startTime === vaqt && (g.room?.id ?? "__yoq__") === xonaId);

  const eni = compact ? "w-[150px]" : "w-[190px]";
  const eniPx = compact ? 150 : 190;

  /**
   * CHIZIQ QAYSI IKKI QATOR ORASIGA TUSHADI.
   *
   * Qatorlar uzluksiz vaqt o'qi EMAS — ular darslarning haqiqiy
   * boshlanish vaqtlari (09:00, 14:00, 15:30). Shuning uchun chiziqni
   * "soat 10:15 balandligiga" qo'yib bo'lmaydi: u faqat qatorlar
   * ORASIDA turishi mumkin. O'tib ketgan oxirgi qatordan keyin,
   * keyingisidan oldin.
   *
   * `null` — chiziq umuman chizilmaydi (bugungi jadval emas).
   * Barcha darslar tugagan bo'lsa chiziq eng pastda turadi va bu ham
   * ma'noli: "bugungi darslar tugadi".
   */
  /**
   * DAQIQALIK YANGILANISH — panel ochiq turganda chiziq eskirmasin.
   *
   * Bir marta hisoblansa, xodim panelni ochib qo'yib ishlashda davom
   * etsa, chiziq o'z joyida qotib qolardi va "hozir" degan yozuv
   * jimgina yolg'on bo'lardi. Taymer FAQAT chiziq kerak bo'lganda
   * ishlaydi.
   */
  const [tik, setTik] = useState(0);
  useEffect(() => {
    if (!showNow) return;
    const id = setInterval(() => setTik((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, [showNow]);

  const hoziroq = useMemo(() => {
    if (!showNow) return null;
    void tik;                     // taymer qayta hisoblashni qo'zg'atadi
    const hozir = businessMinutesOfDay();
    const idx = vaqtlar.findIndex((v) => {
      const d = daqiqa(v);
      return d !== null && d > hozir;
    });
    const p = (n: number) => String(n).padStart(2, "0");
    return {
      oldin: idx === -1 ? vaqtlar.length : idx,
      yorliq: `${p(Math.floor(hozir / 60))}:${p(hozir % 60)}`,
    };
  }, [showNow, vaqtlar, tik]);

  if (groups.length === 0) return null;

  return (
    /* IKKALA O'Q BITTA IDISHDA aylanadi. Ilgari gorizontal aylanish shu
       yerda, vertikal esa TASHQARIDA (panel/sahifa) edi — `sticky` esa
       eng yaqin aylanadigan ota-onaga nisbatan ishlaydi, ya'ni
       sarlavha hech qachon yopishib turolmasdi.
       `overflow-hidden` ham OLIB TASHLANDI: u ham aylanish konteksti
       yaratadi va `sticky` ni jimgina o'chirib qo'yardi. Burchak
       yumaloqligi endi shu tashqi idishda. */
    <div className={cn("h-full overflow-auto border rounded-lg", PANJARA)}>
      {/* DAFTAR KATAGI. Ilgari chiziqlar `white/50` edi va yorug' fonda
          deyarli ko'rinmasdi — qatorlar bilan ustunlar bir-biriga
          qo'shilib ketardi. Endi har katak to'liq yopilgan. */}
      <div className="min-w-max">
        {/* SARLAVHA — vertikal surilganda tepada qoladi. */}
        <div className={cn("flex border-b sticky top-0 z-20", PANJARA, HOSHIYA)}>
          {/* BURCHAK — ikkala o'q bo'yicha ham qotadi, shuning uchun
              eng yuqori qatlamda. */}
          <div className={cn("w-14 shrink-0 sticky left-0 z-30 border-r", PANJARA, HOSHIYA)} />
          {ustunlar.map((r) => (
            <div key={r.id}
              className={cn(eni, "shrink-0 px-3 py-2.5 text-[12px] font-bold",
                "text-neutral-600 dark:text-neutral-300", "border-l", PANJARA)}>
              {r.name}
            </div>
          ))}
        </div>

        {vaqtlar.map((vaqt, qi) => (
          <Fragment key={vaqt}>
          {hoziroq && hoziroq.oldin === qi && (
            <HozirChizigi yorliq={hoziroq.yorliq}
              eniPx={Math.max(ustunlar.length, 1) * eniPx} />
          )}
          <div className={cn("flex border-b last:border-b-0", PANJARA)}>
            <div className={cn("w-14 shrink-0 px-2 py-3 text-[11px] font-bold tabular-nums",
              "text-neutral-500 dark:text-neutral-400",
              "sticky left-0 z-10 border-r", PANJARA, HOSHIYA)}>
              {vaqt}
            </div>
            {ustunlar.map((r) => (
              <div key={r.id}
                className={cn(eni, "shrink-0 p-1.5 space-y-1.5", "border-l", PANJARA)}>
                {katak(vaqt, r.id).map((g, i) => (
                  <Link key={g.id} href={`/groups/${g.id}`}
                    className={cn("block rounded-lg border-l-4 px-2 py-1.5",
                      "transition-opacity hover:opacity-80", blockColorFor(g, i))}>
                    {g.course?.name && (
                      <span className="inline-block text-[9.5px] font-bold px-1 py-0.5 rounded
                        bg-white/70 dark:bg-black/30 mb-0.5">
                        {g.course.name}
                      </span>
                    )}
                    <p className="text-[12px] font-bold leading-tight break-words">{g.name}</p>
                    <p className="text-[10.5px] opacity-80 leading-tight break-words">
                      {g.teacher?.user?.name ?? "—"}
                    </p>
                    <p className="text-[9.5px] opacity-70 mt-0.5">
                      {g.startTime}&ndash;{g.endTime}
                      {!compact && (g.scheduleDays ?? []).length > 0 && (
                        <>{" · "}{(g.scheduleDays ?? []).map((d) => DAYS_SHORT[d] ?? d).join(", ")}</>
                      )}
                    </p>
                    {!compact && g.startDate && (
                      <p className="text-[9.5px] opacity-70">
                        {fmtShortDate(g.startDate)}
                        {g.endDate ? ` — ${fmtShortDate(g.endDate)}` : ""}
                      </p>
                    )}
                    <p className="text-[9.5px] font-bold opacity-90 mt-0.5">
                      {g._count?.students ?? 0}{" / "}{g.maxStudents ?? 15}{" "}o&apos;quvchi
                    </p>
                  </Link>
                ))}
              </div>
            ))}
          </div>
          </Fragment>
        ))}
        {/* Hamma dars o'tib bo'lgan bo'lsa — chiziq eng pastda. */}
        {hoziroq && hoziroq.oldin >= vaqtlar.length && (
          <HozirChizigi yorliq={hoziroq.yorliq}
            eniPx={Math.max(ustunlar.length, 1) * eniPx} />
        )}
      </div>
    </div>
  );
}

export function RoomGrid({
  groups, rooms,
}: {
  groups: Guruh[];
  rooms: { id: string; name: string }[];
}) {
  const [tab, setTab] = useState<Tab>("toq");

  const sanoq = useMemo(() => {
    const s: Record<Tab, number> = { toq: 0, juft: 0, boshqa: 0 };
    for (const g of groups) s[kunTuri(g.scheduleDays)]++;
    return s;
  }, [groups]);

  const korinadi = useMemo(
    () => groups.filter((g) => kunTuri(g.scheduleDays) === tab),
    [groups, tab]);

  return (
    /* `overflow-hidden` OLIB TASHLANDI — u aylanish konteksti yaratib,
       ichkaridagi `sticky` sarlavhani jimgina o'chirib qo'yardi.
       Ustun (`flex-col`) qilib olindi: tablar tepada qotadi, panjara
       esa qolgan balandlikni to'liq egallaydi va o'zi aylanadi. */
    <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl
      h-full flex flex-col">
      <div className="shrink-0 flex items-center gap-1 px-3 pt-3 pb-2 border-b
        border-white/50 dark:border-white/10 overflow-x-auto">
        {(["toq", "juft", "boshqa"] as Tab[]).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={cn("shrink-0 px-3 h-8 rounded-xl text-[12px] font-semibold transition-colors",
              tab === t
                ? "bg-indigo-600 text-white"
                : "text-neutral-500 dark:text-neutral-400 hover:bg-white/60 dark:hover:bg-white/10")}>
            {TAB_NOMI[t]}
            <span className={cn("ml-1.5 text-[11px] font-black",
              tab === t ? "text-white/70" : "text-neutral-400")}>
              {sanoq[t]}
            </span>
          </button>
        ))}
      </div>

      {korinadi.length === 0 ? (
        <p className="text-[12.5px] text-neutral-400 text-center py-12">
          Bu kunlarda guruh yo&apos;q
        </p>
      ) : (
        <div className="flex-1 min-h-0 p-2">
          <RoomTimeGrid groups={korinadi} rooms={rooms} />
        </div>
      )}
    </div>
  );
}
