"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { UZ_MONTHS, UZ_WEEKDAYS_SHORT } from "@/lib/date-uz";

/**
 * SANA TANLAGICH.
 *
 * Native `<input type="date">` uch sababga ko'ra almashtirildi:
 *   1. Kalendar brauzer tilida ochilardi — o'zbek foydalanuvchi ruscha
 *      "авг. 2026 г. / Вс Пн Вт" ni ko'rardi.
 *   2. Tug'ilgan sana uchun yaroqsiz: joriy yildan boshlanadi va 2005-yilga
 *      yetish uchun strelkani 250 marta bosish kerak.
 *   3. Ko'rinishi tizim uslubiga umuman mos emas (oq quti, qora fon).
 *
 * Bu yerda: o'zbekcha oy/kun nomlari, oy va YIL uchun alohida tanlagich,
 * klaviaturadan yozish ham mumkin ("27.08.2005"), va "Bugun" tugmasi.
 */

export interface DatePickerProps {
  /** ISO `YYYY-MM-DD` yoki bo'sh satr. */
  value: string;
  onChange: (v: string) => void;
  /** Eng katta ruxsat etilgan sana (ISO). Masalan tug'ilgan sana uchun bugun. */
  max?: string;
  /** Eng kichik ruxsat etilgan sana (ISO). */
  min?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** Tozalash tugmasi ko'rsatilsinmi (ixtiyoriy maydonlar uchun). */
  clearable?: boolean;
}

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** "2026-08-27" → Date (lokal yarim tunda; UTC siljishi bo'lmasin). */
function fromIso(v: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? null : d;
}

/** Foydalanuvchi yozgan matnni tushunish: "27.08.2005", "27/8/05", "2005-08-27". */
function parseTyped(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = /^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})$/.exec(s);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  let year = Number(m[3]);
  if (year < 100) year += year > 50 ? 1900 : 2000;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(year, month - 1, day);
  // Oyning oxiridan oshib ketgan sana (31-fevral) qabul qilinmaydi.
  if (d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  return iso(d);
}

export function DatePicker({
  value, onChange, max, min, placeholder = "kun.oy.yil",
  className, disabled, clearable,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [view, setView] = useState(() => fromIso(value) ?? new Date());
  const [rect, setRect] = useState<DOMRect | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Tashqi qiymat o'zgarsa maydon matni ham yangilanadi.
  useEffect(() => {
    const d = fromIso(value);
    setText(d ? `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}` : "");
    if (d) setView(d);
  }, [value]);

  // Tashqariga bosilganda yopiladi.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (wrapRef.current?.contains(t)) return;
      if (t.closest("[data-datepicker-pop]")) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const reposition = () => {
      if (wrapRef.current) setRect(wrapRef.current.getBoundingClientRect());
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open]);

  const minD = min ? fromIso(min) : null;
  const maxD = max ? fromIso(max) : null;
  const selected = fromIso(value);
  const today = new Date();

  const disabledDay = (d: Date) =>
    (!!minD && d < minD) || (!!maxD && d > maxD);

  /** Ko'rinayotgan oyning kataklari (dushanbadan boshlab, 6 qator). */
  const cells = useMemo(() => {
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    // JS: 0=yakshanba. Bizda hafta dushanbadan boshlanadi.
    const shift = (first.getDay() + 6) % 7;
    const start = new Date(first);
    start.setDate(first.getDate() - shift);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [view]);

  /** Yillar ro'yxati — tug'ilgan sana uchun ham yetarli. */
  const years = useMemo(() => {
    const hi = maxD ? maxD.getFullYear() : today.getFullYear() + 5;
    const lo = minD ? minD.getFullYear() : hi - 90;
    return Array.from({ length: hi - lo + 1 }, (_, i) => hi - i);
  }, [minD, maxD, today]);

  function commitText(raw: string) {
    const parsed = parseTyped(raw);
    if (parsed === null) {
      // Bo'sh qoldirilsa — tozalash; noto'g'ri bo'lsa eski qiymatga qaytamiz.
      if (!raw.trim()) onChange("");
      else {
        const d = fromIso(value);
        setText(d ? `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}` : "");
      }
      return;
    }
    const d = fromIso(parsed)!;
    if (disabledDay(d)) return;
    onChange(parsed);
  }

  function pick(d: Date) {
    if (disabledDay(d)) return;
    onChange(iso(d));
    setOpen(false);
  }

  const pop = open && rect && mounted ? createPortal(
    <div
      data-datepicker-pop=""
      // Modal USTIDA ochiladi, shuning uchun shaffof emas: `glass-strong`
      // bilan orqadagi forma matni kalendar raqamlari orasidan ko'rinib,
      // o'qishni qiyinlashtirardi.
      className="fixed z-[120] w-[300px] rounded-2xl border border-neutral-200
        dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-2xl p-3"
      style={{
        // Ekrandan chiqib ketmasin: pastda joy bo'lmasa tepaga ochiladi.
        top: rect.bottom + 340 > window.innerHeight ? Math.max(8, rect.top - 340) : rect.bottom + 6,
        left: Math.min(Math.max(8, rect.left), window.innerWidth - 308),
      }}
    >
      {/* Oy va yil — alohida tanlagich. Strelka bilan 250 marta bosish shart emas. */}
      <div className="flex items-center gap-1.5 mb-2">
        <button type="button" aria-label="Oldingi oy"
          onClick={() => setView(v => new Date(v.getFullYear(), v.getMonth() - 1, 1))}
          className="w-8 h-8 grid place-items-center rounded-xl text-neutral-500
            hover:bg-neutral-100 dark:hover:bg-neutral-800">
          <ChevronLeft className="w-4 h-4" />
        </button>

        <select
          value={view.getMonth()}
          onChange={e => setView(v => new Date(v.getFullYear(), Number(e.target.value), 1))}
          className="flex-1 h-8 px-2 text-[13px] font-semibold rounded-xl bg-neutral-100 dark:bg-neutral-800
            text-neutral-800 dark:text-neutral-100 outline-none cursor-pointer">
          {UZ_MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
        </select>

        <select
          value={view.getFullYear()}
          onChange={e => setView(v => new Date(Number(e.target.value), v.getMonth(), 1))}
          className="w-[84px] h-8 px-2 text-[13px] font-semibold rounded-xl bg-neutral-100 dark:bg-neutral-800
            text-neutral-800 dark:text-neutral-100 outline-none cursor-pointer">
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        <button type="button" aria-label="Keyingi oy"
          onClick={() => setView(v => new Date(v.getFullYear(), v.getMonth() + 1, 1))}
          className="w-8 h-8 grid place-items-center rounded-xl text-neutral-500
            hover:bg-neutral-100 dark:hover:bg-neutral-800">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {UZ_WEEKDAYS_SHORT.slice(1).concat(UZ_WEEKDAYS_SHORT[0]).map(d => (
          <div key={d} className="h-6 grid place-items-center text-[10px] font-bold
            uppercase text-neutral-400">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          const other = d.getMonth() !== view.getMonth();
          const isSel = !!selected && iso(d) === iso(selected);
          const isToday = iso(d) === iso(today);
          const off = disabledDay(d);
          return (
            <button key={i} type="button" disabled={off} onClick={() => pick(d)}
              className={cn(
                "h-8 rounded-xl text-[12px] font-semibold transition-colors",
                off && "opacity-30 cursor-not-allowed",
                isSel
                  ? "bg-indigo-600 text-white dark:bg-indigo-500"
                  : other
                    ? "text-neutral-300 dark:text-neutral-600 hover:bg-white/60 dark:hover:bg-white/10"
                    : "text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800",
                !isSel && isToday && "ring-1 ring-indigo-400/70",
              )}>
              {d.getDate()}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
        <button type="button"
          onClick={() => { if (!disabledDay(today)) { onChange(iso(today)); setOpen(false); } }}
          className="h-8 px-3 rounded-xl text-[12px] font-semibold text-indigo-600
            dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
          Bugun
        </button>
        {clearable && value && (
          <button type="button" onClick={() => { onChange(""); setOpen(false); }}
            className="h-8 px-3 rounded-xl text-[12px] font-semibold text-neutral-500
              hover:bg-neutral-100 dark:hover:bg-neutral-800">
            Tozalash
          </button>
        )}
      </div>
    </div>,
    document.body,
  ) : null;

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <input
        type="text"
        inputMode="numeric"
        disabled={disabled}
        value={text}
        placeholder={placeholder}
        onChange={e => setText(e.target.value)}
        onBlur={e => commitText(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); commitText(text); setOpen(false); } }}
        onFocus={() => {
          if (wrapRef.current) setRect(wrapRef.current.getBoundingClientRect());
          setOpen(true);
        }}
        className={cn(
          "w-full h-10 pl-3 pr-9 text-[13px] rounded-xl border border-white/60 dark:border-white/10",
          "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100",
          "outline-none focus:border-indigo-500 transition-colors disabled:opacity-50",
        )}
      />
      <button
        type="button" disabled={disabled} aria-label="Kalendarni ochish"
        onClick={() => {
          if (wrapRef.current) setRect(wrapRef.current.getBoundingClientRect());
          setOpen(v => !v);
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 grid place-items-center
          rounded-lg text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400">
        {clearable && value
          ? <X className="w-3.5 h-3.5" onClick={e => { e.stopPropagation(); onChange(""); }} />
          : <CalendarDays className="w-4 h-4" />}
      </button>
      {pop}
    </div>
  );
}
