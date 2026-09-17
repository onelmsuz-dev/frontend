"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { formatUzDate, fmtDateTime } from "@/lib/date-uz";

/**
 * GURUH RO'YXATIDA O'QUVCHI MA'LUMOTI — ustiga turganda / bosib turganda.
 *
 * Ro'yxatda faqat ism, qarz yorlig'i va telefon ko'rinadi. Qolgani uchun
 * o'quvchi sahifasini ochish kerak edi — davomat belgilayotgan xodim esa
 * har safar ro'yxatdan chiqib, qaytib kelishi kerak bo'lardi. Egasining
 * talabi (2026-09-17): ro'yxatdan chiqmasdan to'liq ma'lumot ko'rinsin.
 *
 * ICHKI EMAS, `fixed` JOYLASHUV. Ro'yxatning tashqi paneli
 * `overflow-hidden` (yumaloq burchaklar uchun), ya'ni `absolute` oyna
 * qirqilib ketardi. Shuning uchun joy `getBoundingClientRect()` bilan
 * o'lchanadi va oyna ekran bo'yicha qo'yiladi.
 *
 * SICHQONCHA va BARMOQ boshqacha ishlaydi:
 *
 *   · Sichqoncha — ustiga kelganda ochiladi, ketganda yopiladi.
 *   · Barmoq — UZOQ BOSISH (400 ms) bilan ochiladi va qo'yib
 *     yuborilgandan keyin ham OCHIQ qoladi. Sabab amaliy: barmoq
 *     ustida turganda o'qish mumkin emas, barmoqning o'zi yozuvni
 *     to'sib turadi. Yopish uchun tashqariga bosiladi.
 *
 * Uzoq bosishdan keyingi `click` BEKOR qilinadi — aks holda barmoq
 * ko'tarilganda ostidagi havola ishga tushib, o'quvchi sahifasiga
 * o'tib ketardi va oyna ko'rinmay qolardi.
 */

const KENGLIK = 288;   // w-72
const CHEKKA  = 8;     // ekran chetidan eng kam masofa
const UZOQ_MS = 400;   // "uzoq bosish" chegarasi

export interface PopoverStudent {
  name?: string;
  phone?: string | null;
  balance?: number | null;
  note?: string | null;
  noteByName?: string | null;
  noteAt?: string | null;
}

export interface PopoverMembership {
  joinedAt?: string | null;
  activatedAt?: string | null;
  enrollmentStatus?: string;
  groupNet?: number | null;
  otherNet?: number | null;
}

function Qator({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-[10.5px] text-neutral-400 shrink-0">{label}</span>
      <span className="text-[11px] text-neutral-700 dark:text-neutral-200 text-right min-w-0">
        {children}
      </span>
    </div>
  );
}

export function StudentInfoPopover({
  student, membership, fmtMoney, children, className,
}: {
  student: PopoverStudent;
  membership: PopoverMembership;
  fmtMoney: (v: number) => string;
  children: React.ReactNode;
  className?: string;
}) {
  const [joy, setJoy] = useState<{ top: number; left: number; tepada: boolean } | null>(null);
  const tayanch = useRef<HTMLDivElement | null>(null);
  const taymer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Uzoq bosish oynani ochdi — keyingi `click` yutiladi. */
  const bosildi = useRef(false);

  const och = useCallback(() => {
    const el = tayanch.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    // Pastda joy yetmasa — tepaga. 240 px oynaning taxminiy bo'yi;
    // aniq bo'yi matnga bog'liq, shuning uchun faqat TOMONNI tanlashga
    // ishlatiladi, o'lchamga emas.
    const tepada = r.bottom + 240 > window.innerHeight && r.top > 240;
    const chap = Math.min(
      Math.max(r.left, CHEKKA),
      Math.max(window.innerWidth - KENGLIK - CHEKKA, CHEKKA),
    );
    setJoy({ top: tepada ? r.top - 6 : r.bottom + 6, left: chap, tepada });
  }, []);

  const yop = useCallback(() => {
    if (taymer.current) { clearTimeout(taymer.current); taymer.current = null; }
    setJoy(null);
  }, []);

  // Ochiq bo'lsa: tashqariga bosish, aylantirish va Escape yopadi.
  // Aylantirishda YOPILADI, ko'chirilmaydi — oyna sahifa bilan birga
  // siljimasa, ro'yxatdan ajralib qolib, boshqa qatorning ustida
  // turgandek ko'rinardi.
  useEffect(() => {
    if (!joy) return;
    const tashqi = (e: Event) => {
      if (!tayanch.current?.contains(e.target as Node)) yop();
    };
    const tugma = (e: KeyboardEvent) => { if (e.key === "Escape") yop(); };
    document.addEventListener("pointerdown", tashqi);
    document.addEventListener("keydown", tugma);
    window.addEventListener("scroll", yop, true);
    window.addEventListener("resize", yop);
    return () => {
      document.removeEventListener("pointerdown", tashqi);
      document.removeEventListener("keydown", tugma);
      window.removeEventListener("scroll", yop, true);
      window.removeEventListener("resize", yop);
    };
  }, [joy, yop]);

  useEffect(() => () => { if (taymer.current) clearTimeout(taymer.current); }, []);

  const guruhQarzi = membership.groupNet ?? null;
  const boshqaQarz = membership.otherNet ?? 0;
  const izoh       = (student.note ?? "").trim();

  /** Pul ko'rsatilmaydigan xodimda backend `null` qaytaradi. */
  const pul = (v: number | null | undefined) =>
    typeof v === "number" ? fmtMoney(v) : "—";

  return (
    <div
      ref={tayanch}
      className={cn("relative", className)}
      onMouseEnter={och}
      onMouseLeave={yop}
      onTouchStart={() => {
        bosildi.current = false;
        if (taymer.current) clearTimeout(taymer.current);
        taymer.current = setTimeout(() => { bosildi.current = true; och(); }, UZOQ_MS);
      }}
      onTouchMove={() => { if (taymer.current) { clearTimeout(taymer.current); taymer.current = null; } }}
      onTouchEnd={() => { if (taymer.current) { clearTimeout(taymer.current); taymer.current = null; } }}
      onClickCapture={(e) => {
        if (!bosildi.current) return;
        // Uzoq bosishdan keyingi bosish — havolaga o'tmaydi.
        e.preventDefault();
        e.stopPropagation();
        bosildi.current = false;
      }}
    >
      {children}

      {joy && (
        <div
          role="tooltip"
          style={{
            position: "fixed", top: joy.top, left: joy.left, width: KENGLIK,
            transform: joy.tepada ? "translateY(-100%)" : undefined,
            zIndex: 60,
          }}
          className="rounded-xl border border-neutral-200 dark:border-neutral-700
            bg-white dark:bg-neutral-900 shadow-xl p-3 space-y-1.5"
        >
          <p className="text-[12px] font-bold text-neutral-900 dark:text-neutral-100 pb-1
            border-b border-neutral-100 dark:border-neutral-800">
            {student.name || "—"}
          </p>

          <Qator label="Telefon">
            {student.phone
              ? <a href={`tel:${student.phone}`} className="hover:text-green-600">{student.phone}</a>
              : "—"}
          </Qator>

          <Qator label="Shu guruhdagi qarz">
            <span className={cn("font-semibold",
              guruhQarzi == null ? ""
                : guruhQarzi < 0 ? "text-red-600 dark:text-red-400"
                : guruhQarzi > 0 ? "text-emerald-600 dark:text-emerald-400" : "")}>
              {guruhQarzi == null ? "—"
                : guruhQarzi < 0 ? `Qarz ${pul(guruhQarzi)}`
                : guruhQarzi > 0 ? `Avans ${pul(guruhQarzi)}` : "Qarz yo'q"}
            </span>
          </Qator>

          {/* Boshqa guruhdagi qarz ATAYLAB alohida qator: bu guruhning
              narxiga aloqasi yo'q va qo'shib ko'rsatilsa "narx noto'g'ri
              hisoblangan" degan xulosaga olib borardi. */}
          {boshqaQarz < 0 && (
            <Qator label="Boshqa guruhdan">
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                {pul(boshqaQarz)}
              </span>
            </Qator>
          )}

          <Qator label="Umumiy balans">
            <span className={cn("font-semibold",
              (student.balance ?? 0) < 0
                ? "text-red-600 dark:text-red-400"
                : "text-emerald-600 dark:text-emerald-400")}>
              {pul(student.balance)}
            </span>
          </Qator>

          <Qator label="Guruhga qo'shilgan">
            {membership.joinedAt ? formatUzDate(membership.joinedAt) : "—"}
          </Qator>

          <Qator label="Faollashtirilgan">
            {membership.activatedAt
              ? formatUzDate(membership.activatedAt)
              : <span className="text-amber-600 dark:text-amber-400">
                  {membership.enrollmentStatus === "SINOV" ? "Hali sinovda" : "—"}
                </span>}
          </Qator>

          <div className="pt-1.5 border-t border-neutral-100 dark:border-neutral-800">
            <p className="text-[10.5px] text-neutral-400 mb-0.5">Izoh</p>
            {izoh ? (
              <>
                <p className="text-[11px] text-neutral-700 dark:text-neutral-200
                  whitespace-pre-line break-words">{izoh}</p>
                <p className="text-[10px] text-neutral-400 mt-1">
                  {/* Eski izohlarda muallif saqlanmagan — shuni YASHIRMAY
                      aytamiz, aks holda "kim yozgani yo'q" degan bo'sh joy
                      xatolikdek ko'rinardi. */}
                  {student.noteByName
                    ? `${student.noteByName}${student.noteAt ? ` · ${fmtDateTime(student.noteAt)}` : ""}`
                    : "kim yozgani saqlanmagan"}
                </p>
              </>
            ) : (
              <p className="text-[11px] text-neutral-400">yo&apos;q</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
