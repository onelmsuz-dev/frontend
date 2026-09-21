"use client";

import { GripVertical, Plus, Trash2, X } from "lucide-react";
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

export const MAX_FIELDS = 3;

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

  function qosh() {
    if (value.length >= MAX_FIELDS) return;
    onChange([...value, {
      // `id` BIR MARTA yaratiladi va o'zgarmaydi: javoblar shunga
      // bog'lanadi, yorliq esa keyin tahrirlanishi mumkin.
      id: `f${Date.now().toString(36)}`,
      label: "", type: "MATN", required: false,
    }]);
  }

  return (
    <div className="space-y-2.5">
      {value.length === 0 && (
        <p className="text-[11.5px] text-neutral-400">
          Hozircha qo&apos;shimcha savol yo&apos;q — faqat ism va telefon so&apos;raladi.
        </p>
      )}

      {value.map((f, i) => (
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
      ))}

      {value.length < MAX_FIELDS ? (
        <button type="button" onClick={qosh}
          className="w-full h-9 rounded-xl border border-dashed border-neutral-300
            dark:border-white/15 text-[12.5px] font-semibold text-neutral-500
            dark:text-neutral-400 flex items-center justify-center gap-1.5
            hover:border-indigo-400 hover:text-indigo-600 transition-colors">
          <Plus className="w-3.5 h-3.5" />Savol qo&apos;shish
        </button>
      ) : (
        <p className="text-[11px] text-amber-600 dark:text-amber-400">
          Uchtadan ko&apos;p bo&apos;lmasin — uzun forma to&apos;ldirilmaydi va ariza
          butunlay yo&apos;qoladi.
        </p>
      )}
    </div>
  );
}
