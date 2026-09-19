"use client";

import { useState } from "react";
import useSWR from "swr";
import { Type, Check, Users, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetcher } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { applyFontScale, FONT_OPTIONS, type FontScale } from "@/lib/font-scale";

/**
 * KO'RINISH — hozircha bitta sozlama: shrift o'lchami.
 *
 * Talab (2026-09-19): "yozuvlar kichikligi tufayli ma'lumot o'qish
 * qiyin". Bitta markazga qarab hammani kattalashtirish noto'g'ri
 * bo'lardi — kimdir katta monitorda ishlaydi va unda joy behuda
 * ketardi. Shuning uchun tanlov markazning o'ziga berildi.
 *
 * MARKAZ BO'YICHA, foydalanuvchi bo'yicha emas: markazda bitta
 * kompyuterdan bir necha xodim navbat bilan ishlaydi, va sozlama
 * shaxsiy bo'lsa har kirganda qaytadan o'zgarib turardi.
 *
 * TANLAGAN ZAHOTI QO'LLANADI, "Saqlash" ni kutmasdan — odam natijani
 * ko'rib turib qaror qiladi. Saqlamasdan chiqib ketsa, keyingi
 * yuklanishda server qiymati o'z joyiga qaytaradi.
 */
export function AppearanceSection({ canEdit }: { canEdit: boolean }) {
  // `useOrganization()` bilan AYNAN bir xil kalit — sozlamalar sahifasi
  // allaqachon shu so'rovni qilgan, ya'ni ikkinchi so'rov ketmaydi va
  // saqlagandan keyin ikkala joy birdek yangilanadi.
  const { data: org, mutate } = useSWR<{ uiFontScale?: FontScale }>(
    "/api/organization", fetcher);

  const saqlangan: FontScale = org?.uiFontScale ?? "STANDART";
  /**
   * `null` — "foydalanuvchi hali tegmadi", ya'ni serverdagi qiymat
   * ko'rsatiladi. Holatni `useEffect` bilan serverdan KO'CHIRIB olish
   * ham mumkin edi, lekin unda so'rov yangilanganda odamning hali
   * saqlanmagan tanlovi jimgina almashib ketardi.
   */
  const [qolda, setQolda] = useState<FontScale | null>(null);
  const tanlov = qolda ?? saqlangan;
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function koroq(v: FontScale) {
    setQolda(v);
    setMsg(null);
    applyFontScale(v);          // jonli ko'rish
  }

  async function save() {
    setSaving(true); setMsg(null);
    try {
      const res = await fetch("/api/organization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uiFontScale: tanlov }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setMsg({ ok: false, text: data?.error ?? "Saqlanmadi" }); return; }
      setMsg({ ok: true, text: "Saqlandi — barcha xodimga qo'llanadi" });
      setQolda(null);           // endi yana server qiymatiga ergashamiz
      mutate();
    } catch {
      setMsg({ ok: false, text: "Serverga ulanib bo'lmadi" });
    } finally { setSaving(false); }
  }

  const ozgardi = tanlov !== saqlangan;

  return (
    <div className="space-y-4">
      <div className="glass-panel rounded-2xl border border-white/60 dark:border-white/10 p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-2xl shrink-0 grid place-items-center
            bg-indigo-100/70 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300">
            <Type className="w-4.5 h-4.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100">
              Shrift o&apos;lchami
            </p>
            <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5">
              Butun platformaga qo&apos;llanadi — sahifalar, jadvallar, tugmalar va menyu
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4">
              {FONT_OPTIONS.map(o => {
                const on = tanlov === o.v;
                return (
                  <button key={o.v} type="button"
                    disabled={!canEdit}
                    onClick={() => koroq(o.v)}
                    className={cn("text-left rounded-xl border p-3 transition-colors",
                      !canEdit && "opacity-60 cursor-not-allowed",
                      on
                        ? "border-indigo-500 bg-indigo-50/70 dark:bg-indigo-400/10"
                        : "border-white/60 dark:border-white/10 glass-soft hover:border-indigo-300")}>
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn("text-[13px] font-bold",
                        on ? "text-indigo-700 dark:text-indigo-300"
                           : "text-neutral-800 dark:text-neutral-100")}>
                        {o.label}
                      </span>
                      {on && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {o.hint}
                    </p>
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] text-neutral-400 mt-3">
              Tanlaganingiz shu zahoti ko&apos;rinadi. Boshqa xodimlarda
              saqlaganingizdan keyin qo&apos;llanadi.
            </p>
          </div>
        </div>
      </div>

      {/* NAMUNA — haqiqiy ekranlardan olingan elementlar.
          Faqat "Aa" harfi ko'rsatilsa, odam jadval katagi yoki tugma
          qanday ko'rinishini tasavvur qila olmasdi. */}
      <div className="glass-panel rounded-2xl border border-white/60 dark:border-white/10 p-5">
        <p className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400
          uppercase tracking-wider mb-3">
          Namuna
        </p>

        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl grid place-items-center
              bg-emerald-50 dark:bg-emerald-950/40">
              <Wallet className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-[18px] font-black text-neutral-900 dark:text-neutral-100 leading-none">
                12 450 000
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                Jami tushum
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-white/60 dark:border-white/10 overflow-hidden">
            <div className="glass-soft px-3 py-2 flex gap-4">
              <span className="text-[11px] font-bold uppercase tracking-wider
                text-neutral-500 dark:text-neutral-400 flex-1">O&apos;quvchi</span>
              <span className="text-[11px] font-bold uppercase tracking-wider
                text-neutral-500 dark:text-neutral-400">Qarz</span>
            </div>
            <div className="px-3 py-2 flex gap-4 border-t border-white/50 dark:border-white/10">
              <span className="text-[12.5px] font-medium text-neutral-800 dark:text-neutral-100 flex-1">
                Aziza Karimova
              </span>
              <span className="text-[12.5px] font-bold text-red-600 dark:text-red-400 tabular-nums">
                350 000
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold
              px-3 py-1.5 rounded-xl bg-indigo-600 text-white">
              <Users className="w-3.5 h-3.5" />{" "}Guruhga qo&apos;shish
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg
              bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
              Faol
            </span>
          </div>
        </div>
      </div>

      {canEdit && (
        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={saving || !ozgardi}
            className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 h-9">
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
          {ozgardi && !saving && (
            <button type="button"
              onClick={() => { setQolda(null); setMsg(null); applyFontScale(saqlangan); }}
              className="text-[12px] font-semibold text-neutral-500 dark:text-neutral-400
                hover:text-neutral-700 dark:hover:text-neutral-200">
              Bekor qilish
            </button>
          )}
          {msg && (
            <span className={cn("text-[12px] font-medium",
              msg.ok ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
              {msg.text}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
