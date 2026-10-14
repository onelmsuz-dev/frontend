"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Clock, UserRound, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { blockColorFor } from "@/lib/course-colors";
import { businessMinutesOfDay } from "@/lib/time";
import {
  ScheduleTabs, filtrla, bugungiIndeks, KUNLAR,
  type JadvalTab,
} from "@/components/schedule/schedule-tabs";

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
  ishBoshi, ishOxiri,
}: {
  groups: Guruh[];
  rooms: { id: string; name: string }[];
  /**
   * MARKAZNING ISH VAQTI ("08:00" / "20:00") — o'qning chegarasi.
   *
   * Berilmasa o'q faqat darslar bo'yicha quriladi. Berilsa — butun
   * ish kuni ko'rinadi va "qaysi soat bo'sh" degan savolga javob
   * bo'ladi (egasining talabi, 2026-09-21).
   */
  ishBoshi?: string | null;
  ishOxiri?: string | null;
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
   * USTUNLAR — oxirida "Xonasiz".
   *
   * Asosiy jadvalda HAMMA xona (2026-10-14): "qaysi xona bo'sh" degan
   * savolning javobi aynan bo'sh ustun — ilgari bo'sh xona umuman
   * chizilmas va xonalar "to'liq ko'rinmayapti" deb qabul qilinardi.
   * Tartib: avval BAND xonalar, keyin bo'shlari (torroq ustunda) —
   * xona ko'p bo'lsa darsli xonalar ekrandan o'ngga surilib ketmasin.
   * Yon panelda (`compact`) — faqat band xonalar: u tor.
   */
  const ustunlar = useMemo(() => {
    const band = new Set(groups.map((g) => g.room?.id).filter(Boolean) as string[]);
    const bandlar = rooms.filter((r) => band.has(r.id));
    const list = compact ? bandlar : [...bandlar, ...rooms.filter((r) => !band.has(r.id))];
    const xonasizBor = groups.some((g) => !g.room?.id);
    return xonasizBor ? [...list, { id: "__yoq__", name: "Xonasiz" }] : list;
  }, [groups, rooms, compact]);

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
    const ishB = daqiqa(ishBoshi ?? "");
    const ishO = daqiqa(ishOxiri ?? "");
    if (boshlar.length === 0 && ishB === null) return null;

    /**
     * DARS ISH VAQTIDAN TASHQARIDA BO'LSA HAM KO'RINADI.
     *
     * O'q faqat `workStart`–`workEnd` bilan cheklansa, 07:30 dagi yoki
     * 21:00 dagi dars jadvaldan JIMGINA yo'qolardi — va aynan shunday
     * dars e'tiborni ko'proq talab qiladi. Shuning uchun chegara ikkovi
     * orasidan kengrog'i bo'yicha olinadi.
     */
    const eng = (a: number[], b: number | null, f: (...x: number[]) => number) =>
      b === null ? f(...a) : (a.length ? f(...a, b) : b);

    const b = Math.floor(eng(boshlar, ishB, Math.min) / QADAM) * QADAM;
    const o = Math.max(
      Math.ceil(eng(oxirlar, ishO, Math.max) / QADAM) * QADAM,
      b + QADAM);
    return { bosh: b, oxir: o, qator: (o - b) / QADAM };
  }, [groups, ishBoshi, ishOxiri]);

  /** Guruhlar xona bo'yicha, har birida yo'laklar hisoblangan. */
  const xonaBoyicha = useMemo(() => {
    const m = new Map<string, ReturnType<typeof yolaklar>>();
    for (const r of ustunlar) {
      const ichi = groups.filter((g) => (g.room?.id ?? "__yoq__") === r.id);
      if (ichi.length) m.set(r.id, yolaklar(ichi));
    }
    return m;
  }, [groups, ustunlar]);

  /** Ustunning ENG KAM eni — keng ekranda ustunlar shundan ham kengayadi. */
  const eniPx  = compact ? 150 : 200;
  /** Bo'sh xona ustuni — ichida kartochka yo'q, kengligi kerak emas. */
  const boshEniPx = 110;
  const ustunUslub = (id: string) => (xonaBoyicha.has(id) || compact
    ? { minWidth: eniPx, flexGrow: 2 }
    : { minWidth: boshEniPx, flexGrow: 1 });
  const qatorH = compact ? 34 : 48;          // BAND yarim soatning balandligi
  const boshH  = compact ? 16 : 22;          // bo'sh yarim soat — torroq
  const gutter = compact ? 48 : 56;

  /**
   * HAR QATORNING BALANDLIGI — darsi borlari CHO'ZILADI.
   *
   * O'q butun ish kunini qamragach jadval juda baland bo'lib ketdi:
   * 08:00–20:00 = 24 qator, va ularning ko'pi bo'sh. Hammasi bir xil
   * balandlikda bo'lsa, ekranga sig'may qoladi va darslar orasida
   * uzoq bo'shliq turadi.
   *
   * Shuning uchun darsi bor qator TO'LIQ balandlikda (matn butun
   * ko'rinadi), bo'sh qator esa torroq. "Bir kunda 3-4 ta dars bo'lsa
   * o'sha qator to'liq ko'rinishi uchun cho'zilsin" — egasining
   * talabi, 2026-09-21.
   */
  const band = useMemo(() => {
    if (!oyna) return [] as boolean[];
    const b = new Array<boolean>(oyna.qator).fill(false);
    for (const g of groups) {
      const bosh = daqiqa(g.startTime);
      if (bosh === null) continue;
      const oxir = Math.max(daqiqa(g.endTime) ?? bosh + QADAM, bosh + QADAM);
      const bi = Math.max(0, Math.floor((bosh - oyna.bosh) / QADAM));
      const oi = Math.min(oyna.qator, Math.ceil((oxir - oyna.bosh) / QADAM));
      for (let i = bi; i < oi; i++) b[i] = true;
    }
    return b;
  }, [groups, oyna]);

  const qatorBal = (i: number) => (band[i] ? qatorH : boshH);

  /** Qator boshigacha bo'lgan yig'indi balandlik. */
  const yigindi = useMemo(() => {
    const out = [0];
    for (let i = 0; i < band.length; i++) out.push(out[i] + qatorBal(i));
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [band, qatorH, boshH]);

  /**
   * Daqiqa → pikselga. Qatorlar har xil balandlikda bo'lgani uchun
   * oddiy ko'paytirish YETMAYDI — yig'indi jadvalidan olinadi va
   * qator ICHIDAGI ulush alohida qo'shiladi (10:15 kabi vaqtlar
   * qatorning aynan yarmiga tushishi uchun).
   */
  const yPx = (min: number) => {
    if (!oyna) return 0;
    const ulush = (min - oyna.bosh) / QADAM;
    const i = Math.max(0, Math.min(band.length - 1, Math.floor(ulush)));
    return (yigindi[i] ?? 0) + (ulush - i) * qatorBal(i);
  };

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

  const jadvalH = yigindi[yigindi.length - 1] ?? 0;

  return (
    /* IKKALA O'Q BITTA IDISHDA aylanadi. `sticky` eng yaqin aylanadigan
       ota-onaga nisbatan ishlaydi — vertikal aylanish tashqarida bo'lsa
       sarlavha yopishib turolmasdi. `overflow-hidden` ham aylanish
       konteksti yaratadi, shuning uchun bu yerda YO'Q. */
    <div className={cn("h-full overflow-auto border rounded-lg", PANJARA)}>
      {/* `min-w-full` + ustunlarda `flex-1`: keng ekranda panjara butun
          enni egallaydi (ilgari ustunlar qotib 190px edi va o'ng tomoni
          bo'm-bo'sh, chiziqlar o'rtada uzilib qolardi). Tor ekranda
          `minWidth` bo'yicha yonga aylanadi. */}
      <div className="min-w-full w-max">
        {/* ─── SARLAVHA: xonalar, tepada qotadi ─────────────────────── */}
        <div className={cn("flex border-b sticky top-0 z-20", PANJARA, HOSHIYA)}>
          <div className={cn("shrink-0 sticky left-0 z-30 border-r", PANJARA, HOSHIYA)}
            style={{ width: gutter }} />
          {ustunlar.map((r) => {
            const soni = xonaBoyicha.get(r.id)?.length ?? 0;
            return (
              <div key={r.id}
                className={cn("basis-0 min-w-0 border-l", compact ? "px-2 py-2" : "px-3 py-2.5", PANJARA)}
                style={ustunUslub(r.id)}>
                <p className={cn("truncate font-bold text-neutral-700 dark:text-neutral-200", compact ? "text-[11.5px]" : "text-[13px]")}>
                  {r.name}
                </p>
                {!compact && (
                  <p className={cn("text-[11px] font-medium",
                    soni ? "text-neutral-400 dark:text-neutral-500" : "text-emerald-600 dark:text-emerald-400")}>
                    {soni ? `${soni} ta dars` : "Bo'sh"}
                  </p>
                )}
              </div>
            );
          })}
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
                  style={{ height: qatorBal(i) }}>
                  {/* Bo'sh, toraytirilgan qatorda faqat BUTUN soat
                      yoziladi — 16px ga ikki qator raqam sig'maydi. */}
                  {band[i] || butunSoat ? soat(min) : ""}
                </div>
              );
            })}
          </div>

          {ustunlar.map((r) => (
            <div key={r.id}
              className={cn("basis-0 min-w-0 relative border-l", PANJARA,
                !xonaBoyicha.has(r.id) && "bg-neutral-50/40 dark:bg-white/[0.02]")}
              style={{ ...ustunUslub(r.id), height: jadvalH }}>
              {/* Yarim soatlik chiziqlar — daftar katagi */}
              {Array.from({ length: oyna.qator }, (_, i) => (
                <div key={i}
                  className={cn("absolute inset-x-0 border-b", PANJARA,
                    (oyna.bosh + i * QADAM) % 60 === 0 ? "" : "border-dashed")}
                  style={{ top: yigindi[i], height: qatorBal(i) }} />
              ))}

              {/* BLOKLAR — davomiyligi bo'yicha cho'ziladi */}
              {(xonaBoyicha.get(r.id) ?? []).map(({ g, yolak, jami }, i) => {
                const b = daqiqa(g.startTime) ?? oyna.bosh;
                const o = Math.max(daqiqa(g.endTime) ?? b + QADAM, b + QADAM);
                const h = Math.max(yPx(o) - yPx(b), 18);
                const w = 100 / jami;
                const soni = g._count?.students ?? 0;
                const sigim = g.maxStudents ?? 15;
                const toliq = soni >= sigim;
                return (
                  <Link key={g.id} href={`/groups/${g.id}`}
                    title={`${g.name} · ${g.startTime}–${g.endTime}`}
                    className={cn("group/blok absolute flex flex-col overflow-hidden border-l-4",
                      "shadow-sm ring-1 ring-black/[0.04] transition-all hover:z-[5] hover:shadow-md hover:-translate-y-px dark:ring-white/5",
                      compact ? "rounded-md px-1.5 py-1" : "rounded-lg px-2.5 py-2",
                      blockColorFor(g, i))}
                    style={{
                      top: yPx(b) + 2, height: h - 4,
                      left: `calc(${yolak * w}% + 3px)`,
                      width: `calc(${w}% - 6px)`,
                    }}>
                    <p className={cn("font-bold leading-tight truncate", compact ? "text-[11px]" : "text-[13px]")}>{g.name}</p>
                    {/* Matn BLOK BALANDLIGIGA qarab qo'shiladi: qisqa
                        darsda hammasi sig'maydi va qirqilgan yozuv
                        bo'lmagandan yomonroq. */}
                    {h >= 44 && (
                      <p className={cn("mt-1 flex min-w-0 items-center gap-1 opacity-80 leading-tight", compact ? "text-[9.5px]" : "text-[11.5px]")}>
                        {!compact && <UserRound className="h-3 w-3 shrink-0" />}
                        <span className="truncate">{g.teacher?.user?.name ?? "—"}</span>
                      </p>
                    )}
                    {h >= 62 && (
                      <p className={cn("mt-0.5 flex items-center gap-1 opacity-75 leading-tight tabular-nums", compact ? "text-[9px]" : "text-[11.5px]")}>
                        {!compact && <Clock className="h-3 w-3 shrink-0" />}
                        {g.startTime}&ndash;{g.endTime}
                      </p>
                    )}
                    {/* O'QUVCHILAR SONI — pastda; to'lgan guruh qizil belgi
                        bilan (yangi o'quvchini boshqa guruhga yo'naltirish uchun). */}
                    {h >= 84 && (
                      <div className="mt-auto pt-1.5">
                        <div className="flex items-center justify-between gap-1">
                          <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-bold tabular-nums",
                            compact ? "text-[9px]" : "text-[11px]",
                            toliq ? "bg-red-500 text-white" : "bg-white/70 dark:bg-white/10")}>
                            {!compact && <Users className="h-3 w-3" />}
                            {soni}{" / "}{sigim}
                          </span>
                          {toliq && !compact && <span className="text-[10.5px] font-semibold text-red-600 dark:text-red-400">To&apos;lgan</span>}
                        </div>
                        {!compact && (
                          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-black/[0.07] dark:bg-white/10">
                            <div className={cn("h-full rounded-full", toliq ? "bg-red-500" : "bg-current opacity-60")}
                              style={{ width: `${Math.min(100, Math.round((soni / Math.max(1, sigim)) * 100))}%` }} />
                          </div>
                        )}
                      </div>
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
  groups, rooms, ishBoshi, ishOxiri,
}: {
  groups: Guruh[];
  rooms: { id: string; name: string }[];
  /** Markazning ish vaqti — o'q shu oraliqni to'liq ko'rsatadi. */
  ishBoshi?: string | null;
  ishOxiri?: string | null;
}) {
  /**
   * TOQ/JUFT/BOSHQA VA KUN MANZILDA — `?view=xona&xt=boshqa&xk=2`: sahifa
   * yangilanganda tanlangan bo'lim saqlanadi (jadval sahifasidagi
   * `view`/`sana` bilan bir xil yondashuv).
   */
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("xt");
  const urlKun = Number(searchParams.get("xk"));
  const [tab, setTab] = useState<JadvalTab>(
    urlTab === "toq" || urlTab === "juft" || urlTab === "boshqa" || urlTab === "hamma" ? urlTab : "toq");
  const [kunIdx, setKunIdx] = useState(() =>
    Number.isInteger(urlKun) && urlKun >= 0 && urlKun < KUNLAR.length && searchParams.has("xk")
      ? urlKun : bugungiIndeks());

  useEffect(() => {
    const url = new URL(window.location.href);
    if (tab === "toq") url.searchParams.delete("xt"); else url.searchParams.set("xt", tab);
    // Kun faqat "Boshqa"da tanlanadi va u bugundan farq qilsagina yoziladi.
    if (tab === "boshqa" && kunIdx !== bugungiIndeks()) url.searchParams.set("xk", String(kunIdx));
    else url.searchParams.delete("xk");
    const yangi = url.pathname + url.search + url.hash;
    if (yangi !== window.location.pathname + window.location.search + window.location.hash) {
      window.history.replaceState(null, "", yangi);
    }
  }, [tab, kunIdx]);

  const korinadi = useMemo(
    () => filtrla(groups, tab, kunIdx), [groups, tab, kunIdx]);

  return (
    /* `overflow-hidden` YO'Q — u aylanish konteksti yaratib,
       ichkaridagi yopishgan sarlavhani o'chirib qo'yardi. */
    <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl
      h-full flex flex-col">
      <div className="border-b border-white/50 dark:border-white/10">
        <ScheduleTabs tab={tab} onTab={setTab} kunIdx={kunIdx} onKun={setKunIdx} />
      </div>

      {korinadi.length === 0 ? (
        <p className="text-[12.5px] text-neutral-400 text-center py-12">
          {tab === "boshqa"
            ? `${KUNLAR[kunIdx].toliq} kuni dars yo'q`
            : "Bu kunlarda guruh yo'q"}
        </p>
      ) : (
        <div className="flex-1 min-h-0 p-2">
          <RoomTimeGrid groups={korinadi} rooms={rooms}
            ishBoshi={ishBoshi} ishOxiri={ishOxiri}
            showNow={tab === "boshqa" && kunIdx === bugungiIndeks()} />
        </div>
      )}
    </div>
  );
}
