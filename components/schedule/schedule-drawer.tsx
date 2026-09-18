"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, X } from "lucide-react";
import { useGroups } from "@/lib/hooks/useGroups";
import { useRooms } from "@/lib/hooks/useRooms";
import { RoomTimeGrid, type Guruh } from "@/components/schedule/room-grid";
import { useMe, hasPerm } from "@/lib/hooks/useMe";
import { businessTodayStr } from "@/lib/time";

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

const KUN_KALIT = ["YAKSHANBA", "DUSHANBA", "SESHANBA", "CHORSHANBA",
                   "PAYSHANBA", "JUMA", "SHANBA"];

export function ScheduleDrawer() {
  const { me } = useMe();
  const [ochiq, setOchiq] = useState(false);

  // Faqat ochilganda yuklaymiz.
  const { data: raw, isLoading } = useGroups(
    ochiq ? { status: "ACTIVE" } : undefined, { enabled: ochiq });
  const groups: Guruh[] = Array.isArray(raw) ? raw : [];
  const { data: roomsRaw } = useRooms();
  const rooms: { id: string; name: string }[] = Array.isArray(roomsRaw) ? roomsRaw : [];

  useEffect(() => {
    if (!ochiq) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOchiq(false); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [ochiq]);

  if (!hasPerm(me?.permissions, "schedule.view")) return null;

  const bugun = businessTodayStr();            // "YYYY-MM-DD"
  const kun = KUN_KALIT[new Date(`${bugun}T12:00:00Z`).getUTCDay()];

  /**
   * BUGUNGI DARSLAR — hafta kuni mos kelishi YETARLI EMAS: guruh
   * boshlanmagan yoki allaqachon tugagan bo'lishi mumkin. To'liq
   * jadvalda ham AYNAN shu qoida.
   */
  const bugungi = groups
    .filter((g) => (g.scheduleDays ?? []).includes(kun))
    .filter((g) => {
      const bosh = String(g.startDate ?? "").slice(0, 10);
      const oxir = g.endDate ? String(g.endDate).slice(0, 10) : null;
      return (!bosh || bosh <= bugun) && (!oxir || oxir >= bugun);
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

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
          <aside className="fixed right-0 top-0 bottom-0 z-50 w-[min(96vw,900px)]
            bg-white dark:bg-neutral-900 shadow-2xl flex flex-col
            border-l border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between px-4 py-3
              border-b border-neutral-100 dark:border-neutral-800">
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">
                  Bugungi jadval
                </p>
                <p className="text-[11px] text-neutral-400">
                  {isLoading ? "yuklanmoqda..." : `${bugungi.length} ta dars`}
                </p>
              </div>
              <button onClick={() => setOchiq(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg
                  text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 min-h-0 p-3">
              {isLoading && (
                <p className="text-[12px] text-neutral-400 text-center py-8">Yuklanmoqda...</p>
              )}
              {!isLoading && bugungi.length === 0 && (
                <p className="text-[12px] text-neutral-400 text-center py-8">
                  Bugun dars yo&apos;q
                </p>
              )}
              {!isLoading && bugungi.length > 0 && (
                <RoomTimeGrid groups={bugungi} rooms={rooms} compact showNow />
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
