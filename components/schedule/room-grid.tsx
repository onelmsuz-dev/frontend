"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
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
 * ularning ostidan kartochkalar o'tadi. Fon shaffof bo'lsa matnlar
 * bir-birining ustiga tushib o'qib bo'lmasdi.
 */
const HOSHIYA = "bg-neutral-50 dark:bg-neutral-800";

/** Vaqt o'qi qadami — yarim soat. */
const QADAM = 30;

/** "09:30" → 570. Noto'g'ri qiymatda `null`. */
function daqiqa(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** 570 → "09:30". */
function soat(min: number): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(Math.floor(min / 60) % 24)}:${p(min % 60)}`;
}

/**
 * XONA ICHIDA USTMA-UST TUSHGAN DARSLAR — yonma-yon yo'laklarga.
 *
 * Bir xonada bir vaqtda ikki dars bo'lmasligi kerak va forma buni
 * tekshiradi, lekin eski ma'lumotda uchraydi. Bloklar bir-birining
 * ustiga chizilsa, pastdagisi butunlay ko'rinmay qolardi — shuning
 * uchun kengligi bo'linadi.
 */
function yolaklar(list: Guruh[]): { g: Guruh; yolak: number; jami: number }[] {
  const tartib = [...list].sort((a, b) =>
    (daqiqa(a.startTime) ?? 0) - (daqiqa(b.startTime) ?? 0));
  const oxirlar: number[] = [];                     // har yo'lakning tugash daqiqasi
  const joy = tartib.map((g) => {
    const b = daqiqa(g.startTime) ?? 0;
    const o = Math.max(daqiqa(g.endTime) ?? b + QADAM, b + QADAM);
    let y = oxirlar.findIndex((t) => t <= b);
    if (y === -1) { y = oxirlar.length; oxirlar.push(o); } else { oxirlar[y] = o; }
    return { g, yolak: y };
  });
  return joy.map((x) => ({ ...x, jami: oxirlar.length }));
}

export function RoomTimeGrid({
  groups, rooms, compact = false, showNow = false,
}: {
  groups: Guruh[];
  rooms: { id: string; name: string }[];
  /** Yon panel uchun torroq ustun va pastroq qator. */
  compact?: boolean;
  /**
   * "HOZIR SHU YERDASIZ" CHIZIG'I.
   *
   * FAQAT BUGUNGI jadval uchun. Haftalik tarhda (toq/juft) "hozir"
   * degan tushuncha yo'q va chiziq yolg'on ma'no berardi.
   */
  showNow?: boolean;
}) {
  /**
   * DAQIQALIK YANGILANISH — panel ochiq turganda chiziq eskirmasin.
   * Taymer FAQAT chiziq kerak bo'lganda ishlaydi.
   */
  const [tik, setTik] = useState(0);
  useEffect(() => {
    if (!showNow) return;
    const id = setInterval(() => setTik((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, [showNow]);

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

  /**
   * VAQT OYNASI — YARIM SOATLIK, UZLUKSIZ.
   *
   * Ilgari qatorlar faqat darslar BOSHLANADIGAN vaqtlar edi (09:00,
   * 14:00, 15:30) — oradagi soatlar umuman chizilmasdi va jadval
   * "qaysi vaqt bo'sh" degan savolga javob bermasdi. Endi o'q
   * uzluksiz: eng erta darsdan eng kech darsgacha har yarim soat
   * o'z qatoriga ega (egasining talabi, 2026-09-18).
   */
  const oyna = useMemo(() => {
    const boshlar = groups.map((g) => daqiqa(g.startTime)).filter((x): x is number => x !== null);
    const oxirlar = groups.map((g) => daqiqa(g.endTime)).filter((x): x is number => x !== null);
    if (boshlar.length === 0) return null;
    const b = Math.floor(Math.min(...boshlar) / QADAM) * QADAM;
    const o = Math.max(
      Math.ceil(Math.max(...oxirlar, Math.min(...boshlar) + QADAM) / QADAM) * QADAM,
      b + QADAM);
    return { bosh: b, oxir: o, qator: (o - b) / QADAM };
  }, [groups]);

  /** Guruhlar xona bo'yicha, har birida yo'laklar hisoblangan. */
  const xonaBoyicha = useMemo(() => {
    const m = new Map<string, ReturnType<typeof yolaklar>>();
    for (const r of ustunlar) {
      const ichi = groups.filter((g) => (g.room?.id ?? "__yoq__") === r.id);
      if (ichi.length) m.set(r.id, yolaklar(ichi));
    }
    return m;
  }, [groups, ustunlar]);

  const eniPx  = compact ? 150 : 190;
  const qatorH = compact ? 34 : 44;          // yarim soatning balandligi
  const gutter = compact ? 48 : 56;

  /** Daqiqa → pikselga. */
  const yPx = (min: number) => ((min - (oyna?.bosh ?? 0)) / QADAM) * qatorH;

  /**
   * "HOZIR" — endi ANIQ DAQIQADA.
   *
   * O'q uzluksiz bo'lgach chiziqni qatorlar orasiga emas, haqiqiy
   * balandligiga qo'yish mumkin: 10:15 — 10:00 va 10:30 qatorlari
   * ORASIDA, aynan yarmida.
   */
  const hozirY = useMemo(() => {
    if (!showNow || !oyna) return null;
    void tik;                                 // taymer qayta hisoblashni qo'zg'atadi
    const m = businessMinutesOfDay();
    if (m < oyna.bosh || m > oyna.oxir) return null;
    return { y: yPx(m), yorliq: soat(m) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showNow, oyna, tik, qatorH]);

  if (groups.length === 0 || !oyna) return null;

  const jadvalH = oyna.qator * qatorH;

  return (
    /* IKKALA O'Q BITTA IDISHDA aylanadi. `sticky` eng yaqin aylanadigan
       ota-onaga nisbatan ishlaydi — vertikal aylanish tashqarida bo'lsa
       sarlavha yopishib turolmasdi. `overflow-hidden` ham aylanish
       konteksti yaratadi, shuning uchun bu yerda YO'Q. */
    <div className={cn("h-full overflow-auto border rounded-lg", PANJARA)}>
      <div className="min-w-max">
        {/* ─── SARLAVHA: xonalar, tepada qotadi ─────────────────────── */}
        <div className={cn("flex border-b sticky top-0 z-20", PANJARA, HOSHIYA)}>
          <div className={cn("shrink-0 sticky left-0 z-30 border-r", PANJARA, HOSHIYA)}
            style={{ width: gutter }} />
          {ustunlar.map((r) => (
            <div key={r.id}
              className={cn("shrink-0 px-2 py-2 text-[11.5px] font-bold truncate",
                "text-neutral-600 dark:text-neutral-300", "border-l", PANJARA)}
              style={{ width: eniPx }}>
              {r.name}
            </div>
          ))}
        </div>

        {/* ─── TANA: chapda vaqt ustuni, o'ngda xonalar ─────────────── */}
        <div className="flex relative">
          {/* VAQT USTUNI — chapda qotadi */}
          <div className={cn("shrink-0 sticky left-0 z-10 border-r", PANJARA, HOSHIYA)}
            style={{ width: gutter, height: jadvalH }}>
            {Array.from({ length: oyna.qator }, (_, i) => {
              const min = oyna.bosh + i * QADAM;
              const butunSoat = min % 60 === 0;
              return (
                <div key={min}
                  className={cn("flex items-start justify-end pr-1.5",
                    "text-[10px] tabular-nums border-b", PANJARA,
                    butunSoat
                      ? "font-bold text-neutral-600 dark:text-neutral-300"
                      : "text-neutral-400 dark:text-neutral-500")}
                  style={{ height: qatorH }}>
                  {soat(min)}
                </div>
              );
            })}
          </div>

          {ustunlar.map((r) => (
            <div key={r.id}
              className={cn("shrink-0 relative border-l", PANJARA)}
              style={{ width: eniPx, height: jadvalH }}>
              {/* Yarim soatlik chiziqlar — daftar katagi */}
              {Array.from({ length: oyna.qator }, (_, i) => (
                <div key={i}
                  className={cn("absolute inset-x-0 border-b", PANJARA,
                    (oyna.bosh + i * QADAM) % 60 === 0 ? "" : "border-dashed")}
                  style={{ top: i * qatorH, height: qatorH }} />
              ))}

              {/* BLOKLAR — davomiyligi bo'yicha cho'ziladi */}
              {(xonaBoyicha.get(r.id) ?? []).map(({ g, yolak, jami }, i) => {
                const b = daqiqa(g.startTime) ?? oyna.bosh;
                const o = Math.max(daqiqa(g.endTime) ?? b + QADAM, b + QADAM);
                const h = Math.max(yPx(o) - yPx(b), 18);
                const w = 100 / jami;
                return (
                  <Link key={g.id} href={`/groups/${g.id}`}
                    className={cn("absolute rounded-md border-l-4 px-1.5 py-1",
                      "overflow-hidden transition-opacity hover:opacity-80",
                      blockColorFor(g, i))}
                    style={{
                      top: yPx(b) + 1, height: h - 2,
                      left: `calc(${yolak * w}% + 2px)`,
                      width: `calc(${w}% - 4px)`,
                    }}>
                    <p className="text-[11px] font-bold leading-tight truncate">{g.name}</p>
                    {/* Matn BLOK BALANDLIGIGA qarab qo'shiladi: qisqa
                        darsda hammasi sig'maydi va qirqilgan yozuv
                        bo'lmagandan yomonroq. */}
                    {h >= 44 && (
                      <p className="text-[9.5px] opacity-80 leading-tight truncate">
                        {g.teacher?.user?.name ?? "—"}
                      </p>
                    )}
                    {h >= 62 && (
                      <p className="text-[9px] opacity-70 leading-tight">
                        {g.startTime}&ndash;{g.endTime}
                      </p>
                    )}
                    {h >= 78 && (
                      <p className="text-[9px] font-bold opacity-90 leading-tight">
                        {g._count?.students ?? 0}{" / "}{g.maxStudents ?? 15}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}

          {/* ─── "HOZIR" CHIZIG'I — butun kenglik bo'ylab ──────────── */}
          {hozirY && (
            <div className="absolute left-0 right-0 pointer-events-none z-[15]"
              style={{ top: hozirY.y }} aria-label="Hozirgi vaqt">
              <div className="h-px bg-red-500" />
              <span className="absolute -top-2 left-0 px-1 py-0.5 rounded
                text-[9px] font-black tabular-nums bg-red-500 text-white">
                {hozirY.yorliq}
              </span>
            </div>
          )}
        </div>
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
