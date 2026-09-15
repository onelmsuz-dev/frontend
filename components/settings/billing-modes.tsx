"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import { formatUzDate } from "@/lib/date-uz";
import { Check, Lock, Info, CalendarClock, ShieldCheck } from "lucide-react";

/**
 * SOZLAMALAR → TO'LOV USULI — FAQAT KO'RSATADI.
 *
 * Markaz o'z usulini KO'RADI, lekin o'zgartira olmaydi: boshqasiga bosilsa
 * "adminga murojaat qiling" deb javob qaytadi.
 *
 * NEGA. Usul almashtirish "shunchaki sozlama" emas — u hisob-kitobni
 * tubdan o'zgartiradi: `billingModeSince` suriladi, langar ko'chadi, davr
 * kalitlari boshqacha yasaladi. Markaz buni bilmay bosardi va oqibati
 * o'quvchilarning puliga tegardi. Endi bu kelishilgan amal: markaz
 * murojaat qiladi, platforma `/admode/billing` dan o'zgartiradi.
 *
 * QULF SERVERDA ham bor (`PATCH /billing/mode` → 403) — bu yerdagisi
 * shunchaki tushuntirish, yagona to'siq EMAS.
 *
 * Kurs va guruh darajasidagi usulga bu qulf TEGISHLI EMAS — markaz o'ziga
 * ochilgan usullar ichida ularni hozirgidek belgilay oladi.
 */

interface ModeRow {
  mode: string; label: string; short: string; allowed: boolean; ready: boolean;
}

interface ModesData {
  current: string;
  since: string | null;
  shortTailDays: number;
  modes: ModeRow[];
}

export function BillingModes() {
  const { data, error, isLoading } = useSWR<ModesData>("/api/billing/modes", fetcher);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Bosish USULNI ALMASHTIRMAYDI — nima qilish kerakligini aytadi.
  // So'rov umuman yuborilmaydi: server baribir 403 qaytaradi va
  // foydalanuvchiga tarmoq xatosidek ko'rinadigan javob berishdan ko'ra
  // to'g'ridan-to'g'ri tushuntirgan yaxshi.
  function pick(mode: string) {
    if (mode === data?.current) return;
    const nomi = data?.modes.find((m) => m.mode === mode)?.label ?? "Bu";
    setMsg({ ok: false, text:
      `«${nomi}» usuliga o'tish uchun adminga murojaat qiling. ` +
      `To'lov usulini markaz o'zi o'zgartira olmaydi — u hisob-kitobni ` +
      `tubdan o'zgartiradi, shuning uchun biz bilan kelishib o'zgartiriladi.` });
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
        ))}
      </div>
    );
  }
  if (error || !data) {
    return (
      <p className="py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
        To&apos;lov rejimlarini yuklab bo&apos;lmadi
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Eng muhim xabar tepada: rejim o'zgarishi o'tmishga TA'SIR QILMAYDI. */}
      <div className="flex items-start gap-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 px-4 py-3">
        <CalendarClock className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400 mt-px" />
        <p className="text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
          Rejim o&apos;zgarsa, <span className="font-medium">o&apos;tmishdagi hisob-kitob
          o&apos;zgarmaydi</span> — allaqachon yozilgan qarzlar joyida qoladi.
          Yangi qoida{" "}
          {data.since
            ? <span className="font-medium">{formatUzDate(data.since)}</span>
            : "keyingi oy boshidan"}{" "}
          amal qiladi.
        </p>
      </div>

      {/* KIM BELGILAYDI — bosishdan OLDIN ko'rinsin. Xabar faqat bosilganda
          chiqadi, bu esa har doim turadi va "nega tanlanmayapti?" degan
          savolni umuman tug'dirmaydi. */}
      <div className="flex items-start gap-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 px-4 py-3">
        <ShieldCheck className="h-4 w-4 shrink-0 text-neutral-400 mt-px" />
        <p className="text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
          To&apos;lov usulini <span className="font-medium">admin belgilaydi</span>.
          Quyida markazingiz hozir ishlayotgan usul ko&apos;rinadi — boshqasiga
          o&apos;tish kerak bo&apos;lsa biz bilan bog&apos;laning.
        </p>
      </div>

      {msg && (
        <div className={cn("rounded-xl px-4 py-2.5 text-xs",
          msg.ok ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                 : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300")}>
          {msg.text}
        </div>
      )}

      <ul className="space-y-2">
        {data.modes.map((m) => {
          const active = m.mode === data.current;
          const locked = !m.allowed;
          return (
            <li key={m.mode}>
              {/* `disabled` QO'YILMAGAN: o'chirilgan tugma bosilmaydi, ya'ni
                  foydalanuvchi NEGA bo'lmasligini hech qachon bilmasdi —
                  ekran shunchaki javob bermayotgandek tuyulardi. Bosiladi,
                  lekin usulni almashtirmaydi, tushuntiradi. */}
              <button
                onClick={() => pick(m.mode)}
                className={cn(
                  "w-full text-left rounded-2xl border p-4 transition-colors",
                  active
                    ? "border-blue-500 bg-blue-50/60 dark:bg-blue-900/20 dark:border-blue-500"
                    : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900",
                  // Tanlov taassuroti berilmaydi — hover bilan "bosilsa
                  // tanlanadi" degan va'da paydo bo'lardi.
                  !active && "opacity-70 cursor-default",
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "mt-0.5 h-5 w-5 shrink-0 rounded-full grid place-items-center border-2",
                    active
                      ? "border-blue-500 bg-blue-500"
                      : "border-neutral-300 dark:border-neutral-600",
                  )}>
                    {active && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {m.label}
                      </span>
                      {active && (
                        <span className="rounded-md bg-blue-100 dark:bg-blue-900/50 px-1.5 py-px
                                         text-[10px] font-medium text-blue-700 dark:text-blue-300">
                          Hozirgi
                        </span>
                      )}
                      {locked && (
                        <span className="inline-flex items-center gap-1 rounded-md
                                         bg-neutral-100 dark:bg-neutral-800 px-1.5 py-px
                                         text-[10px] font-medium text-neutral-500 dark:text-neutral-400">
                          <Lock className="h-2.5 w-2.5" /> Ochilmagan
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                      {m.short}
                    </p>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex items-start gap-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 px-4 py-3">
        <Info className="h-4 w-4 shrink-0 text-neutral-400 mt-px" />
        <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
          Bu yerdagi usul butun markazga amal qiladi va uni admin belgilaydi.
          Alohida <span className="font-medium">kurs</span> yoki{" "}
          <span className="font-medium">guruh</span>{" "}uchun esa usulni
          o&apos;zingiz belgilay olasiz — masalan markazda hamma oylik
          to&apos;laydi, «IELTS intensiv» esa modul bo&apos;yicha. Qayerda:
          Kurslar yoki Guruhlar → tahrirlash → «To&apos;lov usuli». U yerda
          faqat markazingizga ochilgan usullar chiqadi.
        </p>
      </div>
    </div>
  );
}
