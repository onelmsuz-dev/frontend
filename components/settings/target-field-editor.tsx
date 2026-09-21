"use client";

import { Check, GripVertical, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Maydon } from "@/components/target/target-page-view";

/**
 * QO'SHIMCHA SAVOLLAR MUHARRIRI — ko'pi bilan 3 ta.
 *
 * NEGA 3 TA: uzun forma to'ldirilmaydi. Reklamadan kelgan odam
 * ikki-uch maydondan keyin chiqib ketadi va lid BUTUNLAY yo'qoladi —
 * ya'ni ko'proq ma'lumot emas, kamroq lid bo'lardi. Chegara markazni
 * eng muhim uchta savolni tanlashga majbur qiladi.
 */

/** Markazning O'Z savollari — shuncha. Tayyor variantlar bundan tashqari. */
export const MAX_CUSTOM = 3;

/**
 * TAYYOR VARIANTLAR — bir bosishda qo'shiladi.
 *
 * Markazlarning aksariyati AYNAN shularni so'raydi. Ularni har safar
 * qo'lda yozdirish (yorliq + tur + majburiylik) uch qadamlik ish
 * bo'lardi va xato yozilgan tur mobilda noto'g'ri klaviatura ochardi.
 *
 * `id` QAT'IY va o'zgarmaydi: javoblar shunga bog'lanadi, ya'ni
 * markaz variantni o'chirib qayta yoqsa ham eski lidlardagi javob
 * o'z yorlig'i bilan qoladi.
 */
export const TAYYOR: (Maydon & { izoh: string })[] = [
  { id: "p_yosh",     label: "Yoshingiz",       type: "RAQAM", izoh: "Necha yoshda" },
  { id: "p_manzil",   label: "Manzilingiz",     type: "JOY",   izoh: "Tuman, mahalla" },
  { id: "p_email",    label: "Email",           type: "EMAIL", izoh: "Pochta manzili" },
  { id: "p_tel2",     label: "Qo'shimcha telefon", type: "TEL", izoh: "Ota-ona raqami" },
  { id: "p_username", label: "Telegram username", type: "MATN", izoh: "@bilan yoki bilan emas" },
];

const tayyormi = (f: Maydon) => f.id.startsWith("p_");

const TURLAR: { v: Maydon["type"]; nom: string; izoh: string }[] = [
  { v: "MATN",   nom: "Matn",     izoh: "Ism, username, ixtiyoriy javob" },
  { v: "RAQAM",  nom: "Raqam",    izoh: "Yosh, bolalar soni" },
  { v: "TEL",    nom: "Telefon",  izoh: "Qo'shimcha raqam (ota-ona)" },
  { v: "EMAIL",  nom: "Email",    izoh: "Pochta manzili" },
  { v: "JOY",    nom: "Manzil",   izoh: "Tuman, mahalla, lokatsiya" },
  { v: "TANLOV", nom: "Tanlov",   izoh: "Tayyor variantlardan biri" },
];

export function TargetFieldEditor({
  value, onChange,
}: {
  value: Maydon[];
  onChange: (v: Maydon[]) => void;
}) {
  const oz = (i: number, p: Partial<Maydon>) =>
    onChange(value.map((f, j) => (j === i ? { ...f, ...p } : f)));

  const ozlari = value.filter((f) => !tayyormi(f));

  /** Tayyor variantni yoqadi/o'chiradi. Tartib TAYYOR ro'yxatidagidek. */
  function tayyorAlmash(t: Maydon) {
    const bor = value.some((f) => f.id === t.id);
    if (bor) { onChange(value.filter((f) => f.id !== t.id)); return; }
    // Tayyorlar doim oldinda, o'z savollari keyin — forma tartibi
    // har safar boshqacha bo'lib qolmasin.
    const yangi = [...value, { id: t.id, label: t.label, type: t.type, required: false }];
    onChange([
      ...TAYYOR.filter((x) => yangi.some((f) => f.id === x.id))
        .map((x) => yangi.find((f) => f.id === x.id)!),
      ...yangi.filter((f) => !tayyormi(f)),
    ]);
  }

  function qosh() {
    if (ozlari.length >= MAX_CUSTOM) return;
    onChange([...value, {
      // `id` BIR MARTA yaratiladi va o'zgarmaydi: javoblar shunga
      // bog'lanadi, yorliq esa keyin tahrirlanishi mumkin.
      id: `f${Date.now().toString(36)}`,
      label: "", type: "MATN", required: false,
    }]);
  }

  return (
    <div className="space-y-3">

      {/* TAYYOR VARIANTLAR — bir bosishda. */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
          Tayyor savollar
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {TAYYOR.map((t) => {
            const on = value.some((f) => f.id === t.id);
            return (
              <button key={t.id} type="button" onClick={() => tayyorAlmash(t)}
                className={cn("flex items-start gap-2 px-2.5 py-2 rounded-xl border text-left transition-colors",
                  on ? "border-indigo-500 bg-indigo-50/70 dark:bg-indigo-400/10"
                     : "border-white/60 dark:border-white/10 hover:border-indigo-300")}>
                <span className={cn("h-4 w-4 shrink-0 mt-0.5 rounded border grid place-items-center",
                  on ? "bg-indigo-600 border-indigo-600" : "border-neutral-300 dark:border-neutral-600")}>
                  {on && <Check className="w-3 h-3 text-white" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-[12px] font-semibold text-neutral-800 dark:text-neutral-100 truncate">
                    {t.label}
                  </span>
                  <span className="block text-[10.5px] text-neutral-500 dark:text-neutral-400 truncate">
                    {t.izoh}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
          O&apos;z savolingiz
          <span className="font-normal normal-case tracking-normal">
            {" "}· {ozlari.length}/{MAX_CUSTOM}
          </span>
        </p>
      </div>

      {value.length === 0 && (
        <p className="text-[11.5px] text-neutral-400">
          Qo&apos;shimcha savol yo&apos;q — faqat ism va telefon so&apos;raladi.
        </p>
      )}

      {/* Tayyor variantlar bu yerda CHIZILMAYDI — ular yuqoridagi
          kataklardan boshqariladi. Ikki joyda ko'rsatish "qaysi biri
          haqiqiy" degan savol tug'dirardi. Faqat majburiylik
          belgisini o'zgartirish mumkin (pastda). */}
      {value.map((f, i) => (tayyormi(f) ? null : (
        <div key={f.id}
          className="rounded-xl border border-white/60 dark:border-white/10 p-3 space-y-2.5">
          <div className="flex items-center gap-2">
            <GripVertical className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
            <input value={f.label} onChange={e => oz(i, { label: e.target.value })}
              placeholder="Savol matni — masalan «Yoshingiz»" maxLength={60}
              className="flex-1 min-w-0 h-9 px-3 rounded-lg glass-soft border border-white/60
                dark:border-white/10 text-[12.5px] text-neutral-800 dark:text-neutral-100
                placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))}
              aria-label="O'chirish"
              className="w-8 h-8 shrink-0 grid place-items-center rounded-lg text-neutral-400
                hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {TURLAR.map(t => (
              <button key={t.v} type="button" title={t.izoh}
                onClick={() => oz(i, {
                  type: t.v,
                  // Tur o'zgarsa variantlar ma'nosini yo'qotadi.
                  options: t.v === "TANLOV" ? (f.options ?? ["", ""]) : undefined,
                })}
                className={cn("px-2.5 h-7 rounded-lg text-[11.5px] font-semibold border transition-colors",
                  f.type === t.v
                    ? "bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900 dark:border-white"
                    : "border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-neutral-400")}>
                {t.nom}
              </button>
            ))}
          </div>

          {f.type === "TANLOV" && (
            <div className="space-y-1.5 pl-1">
              {(f.options ?? []).map((o, oi) => (
                <div key={oi} className="flex items-center gap-1.5">
                  <input value={o}
                    onChange={e => oz(i, {
                      options: (f.options ?? []).map((x, xi) => (xi === oi ? e.target.value : x)),
                    })}
                    placeholder={`${oi + 1}-variant`} maxLength={60}
                    className="flex-1 min-w-0 h-8 px-2.5 rounded-lg glass-soft border border-white/60
                      dark:border-white/10 text-[12px] focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
                  {(f.options ?? []).length > 2 && (
                    <button type="button" aria-label="Variantni o'chirish"
                      onClick={() => oz(i, { options: (f.options ?? []).filter((_, xi) => xi !== oi) })}
                      className="w-7 h-7 shrink-0 grid place-items-center rounded-lg text-neutral-400 hover:text-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
              {(f.options ?? []).length < 12 && (
                <button type="button"
                  onClick={() => oz(i, { options: [...(f.options ?? []), ""] })}
                  className="text-[11.5px] font-semibold text-indigo-600 dark:text-indigo-400">
                  + variant
                </button>
              )}
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={!!f.required}
              onChange={e => oz(i, { required: e.target.checked })}
              className="w-3.5 h-3.5 accent-indigo-600" />
            <span className="text-[11.5px] text-neutral-600 dark:text-neutral-300">
              Majburiy — to&apos;ldirmasa yuborib bo&apos;lmaydi
            </span>
          </label>
        </div>
      )))}

      {/* TAYYORLARNING MAJBURIYLIGI — alohida, ixcham qatorda. */}
      {value.some(tayyormi) && (
        <div className="rounded-xl border border-white/60 dark:border-white/10 p-2.5 space-y-1">
          <p className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
            Majburiy qilish
          </p>
          {value.filter(tayyormi).map((f) => (
            <label key={f.id} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!f.required}
                onChange={e => oz(value.indexOf(f), { required: e.target.checked })}
                className="w-3.5 h-3.5 accent-indigo-600" />
              <span className="text-[11.5px] text-neutral-600 dark:text-neutral-300">{f.label}</span>
            </label>
          ))}
        </div>
      )}

      {ozlari.length < MAX_CUSTOM ? (
        <button type="button" onClick={qosh}
          className="w-full h-9 rounded-xl border border-dashed border-neutral-300
            dark:border-white/15 text-[12.5px] font-semibold text-neutral-500
            dark:text-neutral-400 flex items-center justify-center gap-1.5
            hover:border-indigo-400 hover:text-indigo-600 transition-colors">
          <Plus className="w-3.5 h-3.5" />Savol qo&apos;shish
        </button>
      ) : (
        <p className="text-[11px] text-neutral-400">
          O&apos;z savollaringiz to&apos;ldi ({MAX_CUSTOM} ta).
        </p>
      )}

      {/* UZUN FORMA OGOHLANTIRISHI — taqiqlamaydi, lekin aytadi.
          Reklamadan kelgan odam ikki-uch maydondan keyin chiqib
          ketadi va lid BUTUNLAY yo'qoladi: ko'proq ma'lumot emas,
          kamroq lid bo'ladi. */}
      {value.length > 3 && (
        <p className="text-[11px] text-amber-600 dark:text-amber-400">
          {value.length}{" "}ta qo&apos;shimcha savol — bu uzun forma. Mijoz
          yarmida tashlab ketishi mumkin, o&apos;shanda ariza butunlay
          yo&apos;qoladi.
        </p>
      )}
    </div>
  );
}
