"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, X } from "lucide-react";
import { useGroups } from "@/lib/hooks/useGroups";
import { useRooms } from "@/lib/hooks/useRooms";
import { RoomTimeGrid, kunTuri, type Guruh } from "@/components/schedule/room-grid";
import { cn } from "@/lib/utils";
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

/**
 * PANEL TABLARI.
 *
 * Panel dastlab faqat BUGUNni ko'rsatardi. Amalda esa ikkinchi savol
 * darhol tug'iladi: "ertaga bu xona bo'shmi", "toq kunlarda nima bor".
 * Buning uchun jadval bo'limiga o'tish kerak edi — ya'ni panel yarim
 * yo'lda qoldirardi (egasining talabi, 2026-09-18).
 *
 * "HAMMASI" — "Boshqa" EMAS. Jadval sahifasida uchinchi tab toq/juftga
 * tushmagan guruhlarni ko'rsatadi; bu yerda esa BUTUN haftalik tarh
 * chiqadi. Sabab: aralash kunli guruh (masalan har kuni) toq tabida
 * ham, juft tabida ham ko'rinmaydi — panelda uni topadigan joy
 * bo'lishi kerak.
 */
type PanelTab = "bugun" | "toq" | "juft" | "hammasi";

const TAB_NOMI: Record<PanelTab, string> = {
  bugun: "Bugun", toq: "Toq", juft: "Juft", hammasi: "Hammasi",
};

const SARLAVHA: Record<PanelTab, string> = {
  bugun:   "Bugungi jadval",
  toq:     "Toq kunlar",
  juft:    "Juft kunlar",
  hammasi: "Haftalik jadval",
};

export function ScheduleDrawer() {
  const { me } = useMe();
  const [ochiq, setOchiq] = useState(false);
  const [tab, setTab] = useState<PanelTab>("bugun");

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

  /**
   * TANLANGAN TAB BO'YICHA RO'YXAT.
   *
   * Toq/juft/hammasi — HAFTALIK TARH, ya'ni sana bo'yicha filtrlanmaydi:
   * "toq kunlarda 3-xonada nima bor" degan savolga bugungi sana ta'sir
   * qilmaydi. Faqat "Bugun" tabi sanaga bog'liq.
   */
  const korinadi = tab === "bugun"
    ? bugungi
    : groups
        .filter((g) => tab === "hammasi" || kunTuri(g.scheduleDays) === tab)
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
                <p className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">
                  {SARLAVHA[tab]}
                </p>
                <p className="text-[11px] text-neutral-400">
                  {isLoading ? "yuklanmoqda..." : `${korinadi.length} ta dars`}
                </p>
              </div>
              <button onClick={() => setOchiq(false)} aria-label="Yopish"
                className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg
                  text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* TABLAR — gorizontal aylanadi, telefonda ham hammasi
                yetib boradi. Tugma balandligi 32px: barmoq uchun
                yetarli, lekin panelning tepasini yeb qo'ymaydi. */}
            <div className="shrink-0 flex items-center gap-1 px-3 sm:px-4 py-2 overflow-x-auto
              border-b border-neutral-100 dark:border-neutral-800">
              {(["bugun", "toq", "juft", "hammasi"] as PanelTab[]).map((t) => (
                <button key={t} type="button" onClick={() => setTab(t)}
                  className={cn("shrink-0 px-3 h-8 rounded-lg text-[12px] font-semibold",
                    "transition-colors",
                    tab === t
                      ? "bg-indigo-600 text-white"
                      : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5")}>
                  {TAB_NOMI[t]}
                </button>
              ))}
            </div>

            <div className="flex-1 min-h-0 p-2 sm:p-3">
              {isLoading && (
                <p className="text-[12px] text-neutral-400 text-center py-8">Yuklanmoqda...</p>
              )}
              {!isLoading && korinadi.length === 0 && (
                <p className="text-[12px] text-neutral-400 text-center py-8">
                  {tab === "bugun" ? "Bugun dars yo'q" : "Bu kunlarda guruh yo'q"}
                </p>
              )}
              {!isLoading && korinadi.length > 0 && (
                <RoomTimeGrid groups={korinadi} rooms={rooms} compact
                  showNow={tab === "bugun"} />
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
