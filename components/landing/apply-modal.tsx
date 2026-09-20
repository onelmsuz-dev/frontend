"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { CONTACT_PHONE, CONTACT_PHONE_DISPLAY } from "@/lib/seo/site";
import { ApplyPanel } from "./apply-form";
import styles from "./apply-dialog.module.css";

/**
 * ARIZA MODALI — kartaning ichki qismi (konteyner, animatsiya va yopilish qoidalari
 * `apply-dialog.tsx` + `.module.css` da; forma dizayni `apply-form.tsx` da — footer tepasidagi
 * ariza bloki bilan umumiy).
 *
 * Kompyuterda ikki qism: chapda yorug' panel (hero'dagi 3D "eshik" bilan bir obraz), o'ngda forma.
 * Mobilda faqat forma, pastdan chiqadigan "sheet" ko'rinishida.
 *
 * O'LCHAM: izoh maydoni doim ochiq; kartaning balandligi forma va "rahmat" ko'rinishida bir xil
 * (`--m-h`). Forma oddiy ekranlarda (kompyuter, telefon) scroll talab qilmaydi: balandlik <=720px va
 * <=640px bo'lganda o'lchamlar bosqichma-bosqich qisqaradi (o'zgaruvchilar `.module.css` da).
 * Undan ham past bo'lsa (masalan, telefon yotiq yoki klaviatura ochiq) karta ichida scroll
 * zaxira sifatida qoladi.
 *
 * YOPISH: modal FAQAT `X` tugmasi bilan yopiladi (Escape, orqa fon va surish ishlamaydi).
 */

export function ApplyModalCard({ source, onClose }: { source: string; onClose: () => void }) {
  return (
    <div
      className={`${styles.card} relative grid max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain rounded-t-[1.75rem] bg-white shadow-2xl shadow-slate-950/30 md:min-h-[var(--m-h)] md:max-h-[calc(100dvh-2rem)] md:grid-cols-[5fr_6fr] md:rounded-[2rem]`}
    >
      {/* FORMA — DOM'da birinchi, shuning uchun modal ochilganda fokus ism maydoniga tushadi. */}
      <div className="order-2 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[var(--m-pt)] md:px-9 md:pb-[var(--m-pb)]">
        <ApplyPanel source={source} variant="modal" />
      </div>

      {/* CHAP PANEL (faqat kompyuterda): 3D "eshik" — hero bilan bir obraz. */}
      <aside className="relative isolate order-1 hidden flex-col justify-between overflow-hidden bg-[linear-gradient(165deg,#eff6ff_0%,#dbeafe_100%)] p-9 md:flex">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-[17px] font-bold tracking-[-0.03em] text-slate-900">
            <Image src="/logo.png" alt="" width={27} height={22} />
            OneRoom
          </div>
          <p className="mt-10 text-[2.5rem] font-bold leading-[1.02] tracking-[-0.05em] text-slate-900">
            <span className="inline-block text-blue-600">7 kun</span>{" "}
            <span className="inline-block">bepul</span>{" "}
            sinab ko&apos;ring
          </p>
        </div>

        <Image
          src="/home/hero-portal.webp"
          alt=""
          width={1254}
          height={1254}
          sizes="360px"
          aria-hidden
          className="pointer-events-none absolute -bottom-16 -right-16 w-[360px] max-w-none mix-blend-multiply"
        />

        <div className="relative z-10 mt-10">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Shoshilyapsizmi?</p>
          <a href={`tel:${CONTACT_PHONE}`} className="mt-1 inline-block text-lg font-bold tracking-[-0.02em] text-slate-900 hover:text-blue-700">{CONTACT_PHONE_DISPLAY}</a>
        </div>
      </aside>

      {/* Yopishning YAGONA yo'li. DOM'da oxirida (fokus tartibi ism maydonidan boshlansin). */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Yopish"
        className="absolute right-3.5 top-3.5 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900 max-md:right-4 max-md:top-4"
      >
        <X className="h-[18px] w-[18px]" aria-hidden />
      </button>
    </div>
  );
}
