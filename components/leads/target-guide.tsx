"use client";

import { useState } from "react";
import {
  ChevronDown, Link2, Megaphone, Inbox, Phone, HelpCircle,
  Camera, CircleCheck, TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * "QANDAY FOYDALANILADI" — Target tabining ichida.
 *
 * Yig'ilgan holatda turadi: har kuni ishlaydigan xodimga u kerak
 * emas va ro'yxatni pastga surib yuborardi. Lekin BIRINCHI marta
 * ochgan odam nima qilishini bilmasa, havolani nusxa olib qo'yadi-yu
 * reklamada noto'g'ri joyga qo'yadi — va budjet behuda ketadi.
 *
 * Shuning uchun yo'riqnoma shu yerda, ro'yxat bilan BIR EKRANDA:
 * alohida sahifaga chiqarilsa uni hech kim topmasdi.
 */

const QADAMLAR = [
  {
    ikonka: Link2,
    sarlavha: "Havolani nusxa oling",
    matn: "Yuqoridagi «Nusxa olish» tugmasini bosing. Bu havola faqat sizning " +
          "markazingizniki — undan kelgan har bir ariza shu yerga tushadi.",
  },
  {
    ikonka: Megaphone,
    sarlavha: "Reklamaga qo'ying",
    matn: "Instagram yoki Facebook reklamasini yaratayotganda maqsad qilib " +
          "«Trafik» (Traffic) ni tanlang va havolani «Веб-сайт» maydoniga " +
          "joylashtiring. Tugma yozuvi: «Подробнее» yoki «Записаться».",
  },
  {
    ikonka: Inbox,
    sarlavha: "Arizalar o'zi tushadi",
    matn: "Mijoz formani to'ldirib «Yuborish» ni bossa, ariza bir soniyada " +
          "shu ro'yxatda va Lidlar taxtasining birinchi bosqichida paydo bo'ladi. " +
          "Xodimga bildirishnoma ham boradi.",
  },
  {
    ikonka: Phone,
    sarlavha: "Qo'ng'iroq qiling",
    matn: "Ro'yxatda telefon raqamni bossangiz — qo'ng'iroq boshlanadi. " +
          "Keyin lidni taxtada bosqichdan bosqichga surib boring.",
  },
];

const SAVOLLAR = [
  {
    s: "Instagram'da forma ochilmaydimi?",
    j: "Yo'q. Bu yo'lda mijoz havolani bosadi va brauzerda sizning ariza " +
       "sahifangiz ochiladi. Instagram ichidagi forma — bu boshqa imkoniyat " +
       "(Facebook Lead Ads), u hozircha tayyorlanmoqda.",
  },
  {
    s: "Bir odam bir necha marta yuborsa-chi?",
    j: "10 daqiqa ichida bir xil raqamdan kelgan takroriy ariza yozilmaydi. " +
       "Mijoz tugmani ikki marta bossa ham taxtada bitta lid bo'ladi.",
  },
  {
    s: "Ariza sahifasida nima ko'rinadi?",
    j: "Markazingiz nomi va uch maydon: ism, telefon raqam va ixtiyoriy izoh. " +
       "Telefon raqam +998 bilan qotirilgan, ya'ni mijoz uni noto'g'ri " +
       "formatda yoza olmaydi.",
  },
  {
    s: "Havolani saytga yoki Telegramga qo'ysam bo'ladimi?",
    j: "Ha. Havola oddiy manzil — uni istalgan joyga qo'yish mumkin: " +
       "Instagram bio, Telegram kanal, vizitka, SMS. Hammasi shu ro'yxatga tushadi.",
  },
];

export function TargetGuide() {
  const [ochiq, setOchiq] = useState(false);

  return (
    <div className="glass-panel rounded-2xl border border-white/60 dark:border-white/10 overflow-hidden">
      <button type="button" onClick={() => setOchiq(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left
          hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
        <div className="w-8 h-8 rounded-xl shrink-0 grid place-items-center
          bg-amber-100/80 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300">
          <HelpCircle className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13.5px] font-bold text-neutral-900 dark:text-neutral-100">
            Qanday foydalaniladi
          </p>
          <p className="text-[11.5px] text-neutral-500 dark:text-neutral-400">
            To&apos;rt qadam — reklamadan arizagacha
          </p>
        </div>
        <ChevronDown className={cn("w-4 h-4 shrink-0 text-neutral-400 transition-transform",
          ochiq && "rotate-180")} />
      </button>

      {ochiq && (
        <div className="px-4 pb-4 pt-1 space-y-5 border-t border-white/50 dark:border-white/10">

          {/* ── OQIM ── */}
          <div className="pt-4">
            <div className="flex items-center gap-2 flex-wrap text-[11.5px] font-semibold">
              {[
                { i: Camera,    l: "Instagram reklama" },
                { i: Link2,     l: "Ariza sahifangiz" },
                { i: Inbox,     l: "Shu ro'yxat" },
                { i: Phone,     l: "Qo'ng'iroq" },
              ].map((x, i, arr) => {
                const I = x.i;
                return (
                  <span key={x.l} className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl
                      glass-soft text-neutral-600 dark:text-neutral-300">
                      <I className="w-3.5 h-3.5" />{x.l}
                    </span>
                    {i < arr.length - 1 && <span className="text-neutral-300">→</span>}
                  </span>
                );
              })}
            </div>
          </div>

          {/* ── QADAMLAR ── */}
          <ol className="space-y-3">
            {QADAMLAR.map((q, i) => {
              const I = q.ikonka;
              return (
                <li key={q.sarlavha} className="flex gap-3">
                  {/* Raqam VA ikonka birga: raqam tartibni, ikonka
                      mazmunni beradi — ikkalasi bir qarashda o'qiladi. */}
                  <div className="shrink-0 flex flex-col items-center">
                    <div className="w-8 h-8 rounded-xl grid place-items-center
                      bg-indigo-600 text-white">
                      <I className="w-4 h-4" />
                    </div>
                    {i < QADAMLAR.length - 1 && (
                      <div className="w-px flex-1 mt-1 bg-neutral-200 dark:bg-white/10" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pb-1">
                    <p className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">
                      <span className="text-neutral-400 font-semibold">{i + 1}.</span>{" "}{q.sarlavha}
                    </p>
                    <p className="text-[12px] text-neutral-600 dark:text-neutral-400 mt-0.5 leading-relaxed">
                      {q.matn}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>

          {/* ── MASLAHAT ── */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl
            bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40">
            <TriangleAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[12px] text-amber-800 dark:text-amber-300 leading-relaxed">
              Reklamada maqsad qilib <b>«Lead generation»</b> emas, <b>«Traffic»</b> ni
              tanlang. «Lead generation» Instagram&apos;ning O&apos;Z formasini ochadi va
              u ariza bu yerga tushmaydi.
            </p>
          </div>

          {/* ── SAVOLLAR ── */}
          <div>
            <p className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400
              uppercase tracking-wider mb-2">
              Ko&apos;p so&apos;raladigan savollar
            </p>
            <div className="space-y-2.5">
              {SAVOLLAR.map(x => (
                <div key={x.s} className="flex gap-2.5">
                  <CircleCheck className="w-3.5 h-3.5 shrink-0 mt-0.5 text-neutral-400" />
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-semibold text-neutral-800 dark:text-neutral-200">
                      {x.s}
                    </p>
                    <p className="text-[12px] text-neutral-600 dark:text-neutral-400 mt-0.5 leading-relaxed">
                      {x.j}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
