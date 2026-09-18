"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { fmtShortDate } from "@/lib/date-uz";
import { blockColorFor } from "@/lib/course-colors";

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
export function RoomTimeGrid({
  groups, rooms, compact = false,
}: {
  groups: Guruh[];
  rooms: { id: string; name: string }[];
  /** Yon panel uchun torroq ustun va kichikroq matn. */
  compact?: boolean;
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

  if (groups.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-max">
        <div className="flex border-b border-white/50 dark:border-white/10">
          <div className="w-14 shrink-0" />
          {ustunlar.map((r) => (
            <div key={r.id}
              className={cn(eni, "shrink-0 px-3 py-2.5 text-[12px] font-bold",
                "text-neutral-600 dark:text-neutral-300",
                "border-l border-white/50 dark:border-white/10")}>
              {r.name}
            </div>
          ))}
        </div>

        {vaqtlar.map((vaqt) => (
          <div key={vaqt} className="flex border-b border-white/50 dark:border-white/10 last:border-0">
            <div className="w-14 shrink-0 px-2 py-3 text-[11px] font-bold tabular-nums
              text-neutral-500 dark:text-neutral-400">
              {vaqt}
            </div>
            {ustunlar.map((r) => (
              <div key={r.id}
                className={cn(eni, "shrink-0 p-1.5 space-y-1.5",
                  "border-l border-white/50 dark:border-white/10")}>
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
        ))}
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
    <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-1 px-3 pt-3 pb-2 border-b border-white/50
        dark:border-white/10 overflow-x-auto">
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
        <RoomTimeGrid groups={korinadi} rooms={rooms} />
      )}
    </div>
  );
}
