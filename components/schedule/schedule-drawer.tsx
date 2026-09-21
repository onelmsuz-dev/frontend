"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, X } from "lucide-react";
import { useGroups } from "@/lib/hooks/useGroups";
import { useRooms } from "@/lib/hooks/useRooms";
import { useOrganization } from "@/lib/hooks/useOrganization";
import { RoomTimeGrid, type Guruh } from "@/components/schedule/room-grid";
import {
  ScheduleTabs, filtrla, bugungiIndeks, haftaSanasi, KUNLAR,
  type JadvalTab,
} from "@/components/schedule/schedule-tabs";
import { useMe, hasPerm } from "@/lib/hooks/useMe";
import { formatUzDate } from "@/lib/date-uz";

/**
 * YON JADVAL — har sahifadan bir bosishda "bugun nima bor".
 *
 * Jadval alohida bo'lim sifatida bor, lekin amaliy savol ko'pincha
 * boshqa ekranda turganda tug'iladi: "IELTS qaysi xonada?", "hozir
 * kim dars o'tyapti?". Buning uchun ishni to'xtatib jadval bo'limiga
 * o'tish, keyin qaytib kelish kerak edi (egasining talabi, 2026-09-18).
 *
 * BUGUNGI KUN, XONA × VAQT PANJARASI. Avval tekis ro'yxat edi, lekin
 * amaliy savol ("qaysi xona bo'sh", "bu soatda nechta dars ketyapti")
 * ro'yxatdan javob olmasdi — xona ustun bo'lgandagina ko'rinadi.
 * Panjara markupi jadval sahifasi bilan BIR XIL komponentdan
 * (`RoomTimeGrid`) — ikki ekran bir-biridan uzoqlashmasin.
 *
 * MA'LUMOT FAQAT OCHILGANDA so'raladi: panel har sahifada turadi va
 * yopiq holatda ham so'rov yuborsa, butun ilova bo'ylab har yuklanishda
 * ortiqcha so'rov bo'lardi.
 */

export function ScheduleDrawer() {
  const { me } = useMe();
  const [ochiq, setOchiq] = useState(false);
  /**
   * PANEL "HAMMASI" DAN BOSHLANADI.
   *
   * Ilgari u bugungi kundan boshlanardi — "hozir nima bo'lyapti"
   * degan savol uchun. Lekin darssiz kunda (yakshanba, bayram)
   * panel BO'SH ochilib, buzilgandek ko'rinardi (egasi xabar berdi,
   * 2026-09-20). Bo'sh ekran hech qanday savolga javob bermaydi.
   *
   * Bugungi kun bir bosishda: "Boshqa" → kun allaqachon bugunga
   * qo'yilgan.
   */
  const [tab, setTab] = useState<JadvalTab>("hamma");
  const [kunIdx, setKunIdx] = useState(() => bugungiIndeks());

  // Faqat ochilganda yuklaymiz.
  const { data: raw, isLoading } = useGroups(
    ochiq ? { status: "ACTIVE" } : undefined, { enabled: ochiq });
  const groups: Guruh[] = Array.isArray(raw) ? raw : [];
  // Ish vaqti — panjara o'qining chegarasi. Sozlamalar sahifasi ham
  // shu kalitni o'qiydi, ya'ni qo'shimcha so'rov ketmaydi.
  const { data: org } = useOrganization() as { data?: { workStart?: string; workEnd?: string } };
  const { data: roomsRaw } = useRooms();
  const rooms: { id: string; name: string }[] = Array.isArray(roomsRaw) ? roomsRaw : [];

  useEffect(() => {
    if (!ochiq) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOchiq(false); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [ochiq]);

  if (!hasPerm(me?.permissions, "schedule.view")) return null;

  const bugunIdx = bugungiIndeks();
  const kunmi = tab === "boshqa";
  const bugunmi = kunmi && kunIdx === bugunIdx;
  const sana = haftaSanasi(kunIdx);

  const korinadi = filtrla(groups, tab, kunIdx);

  return (
    <>
      {/* O'NG CHEKKADAGI TUGMA — kontentni surmaydi (`fixed`), va
          telefonda pastki menyudan tepada turadi. */}
      {!ochiq && (
        <button type="button" onClick={() => setOchiq(true)}
          title="Bugungi jadval"
          className="fixed right-0 top-1/2 -translate-y-1/2 z-40
            flex items-center justify-center w-9 h-16 rounded-l-xl
            bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg
            transition-colors">
          <CalendarClock className="w-4 h-4" />
        </button>
      )}

      {ochiq && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
            onClick={() => setOchiq(false)} />

          {/* PANJARA KENGLIK TALAB QILADI. Tor panelda xona ustunlari
              bir-biriga tiqilib, o'qib bo'lmasdi — shuning uchun panel
              ekranning kattaroq qismini egallaydi va ichida gorizontal
              aylanadi. Telefonda deyarli to'liq ekran. */}
          {/* MOBILDA deyarli to'liq ekran: panjara ustun-ustun bo'lib
              chiziladi va tor panelda faqat bitta xona ko'rinardi.
              `z-50` pastki menyudan tepada — aks holda "To'liq jadval"
              havolasi menyu ostida qolardi. */}
          <aside className="fixed right-0 top-0 bottom-0 z-50 w-[min(100vw,900px)]
            sm:w-[min(96vw,900px)]
            bg-white dark:bg-neutral-900 shadow-2xl flex flex-col
            border-l border-neutral-200 dark:border-neutral-800">
            <div className="shrink-0 flex items-center justify-between px-3 sm:px-4 py-2.5
              border-b border-neutral-100 dark:border-neutral-800">
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100 truncate">
                  {kunmi ? KUNLAR[kunIdx].toliq
                    : tab === "hamma" ? "Barcha guruhlar"
                    : tab === "toq" ? "Toq kunlar" : "Juft kunlar"}
                  {bugunmi && (
                    <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded
                      bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                      bugun
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-neutral-400">
                  {/* Sana faqat ANIQ KUN tanlanganda ma'noli — toq/juft
                      haftalik tarh va unga bitta sana tegishli emas. */}
                  {kunmi ? `${formatUzDate(sana)} · ` : ""}
                  {/* "Hammasi" da bular bir kunning darslari EMAS — butun
                      haftaning guruhlari. "15 ta dars" deb yozish xodimni
                      chalg'itardi. */}
                  {isLoading ? "yuklanmoqda..."
                    : `${korinadi.length} ta ${tab === "hamma" ? "guruh" : "dars"}`}
                </p>
              </div>
              <button onClick={() => setOchiq(false)} aria-label="Yopish"
                className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg
                  text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="border-b border-neutral-100 dark:border-neutral-800">
              <ScheduleTabs tab={tab} onTab={setTab}
                kunIdx={kunIdx} onKun={setKunIdx} compact hammasiBilan />
            </div>

            <div className="flex-1 min-h-0 p-2 sm:p-3">
              {isLoading && (
                <p className="text-[12px] text-neutral-400 text-center py-8">Yuklanmoqda...</p>
              )}
              {!isLoading && korinadi.length === 0 && (
                <p className="text-[12px] text-neutral-400 text-center py-8">
                  {kunmi
                    ? `${KUNLAR[kunIdx].toliq} kuni dars yo'q`
                    : tab === "hamma" ? "Faol guruh yo'q"
                    : "Bu kunlarda guruh yo'q"}
                </p>
              )}
              {!isLoading && korinadi.length > 0 && (
                <RoomTimeGrid groups={korinadi} rooms={rooms} compact
                  ishBoshi={org?.workStart} ishOxiri={org?.workEnd}
                  showNow={bugunmi} />
              )}
            </div>

            <Link href="/schedule" onClick={() => setOchiq(false)}
              className="block px-4 py-3 text-center text-[12px] font-semibold
                border-t border-neutral-100 dark:border-neutral-800
                text-indigo-600 dark:text-indigo-400 hover:bg-neutral-50 dark:hover:bg-white/5">
              To&apos;liq jadval →
            </Link>
          </aside>
        </>
      )}
    </>
  );
}
