"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { LOCALES, LOCALE_META, localizePath, localeFromPathname, type Locale } from "@/lib/i18n/config";
import { getUi } from "@/lib/i18n/ui";
import { Flag } from "./flags";

/**
 * TIL TANLAGICH (navbar): joriy til bayrog'i — bosilsa, uch tilli ro'yxat ochiladi.
 *
 * Har bir variant — oddiy havola (`<a hreflang>`): JavaScript'siz ham ishlaydi va qidiruv botlari
 * tillararo havolalarni ko'radi. Sahifa boshqa tilda o'sha sahifaning tarjimasiga o'tadi
 * (`/davomat` → `/ru/davomat` → `/en/davomat`).
 */
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const pathname = usePathname() ?? "/";
  const current = localeFromPathname(pathname);
  const ui = getUi(current);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      btnRef.current?.focus();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={listId}
        aria-label={`${ui.header.language}: ${LOCALE_META[current].name}`}
        className="flex h-9 items-center gap-1.5 rounded-full pl-2 pr-1.5 outline-none transition-colors hover:bg-slate-900/[0.05] focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <Flag locale={current} />
        <ChevronDown aria-hidden className={`h-3.5 w-3.5 text-slate-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <ul
        id={listId}
        className={`absolute right-0 top-full z-50 mt-2 w-44 origin-top-right rounded-2xl bg-white p-1.5 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.35)] ring-1 ring-slate-900/[0.07] transition-[opacity,transform,visibility] duration-200 ${
          open ? "visible translate-y-0 scale-100 opacity-100" : "pointer-events-none invisible -translate-y-1 scale-95 opacity-0"
        }`}
      >
        {LOCALES.map((loc: Locale) => (
          <li key={loc}>
            <Link
              href={localizePath(pathname, loc)}
              hrefLang={loc}
              lang={loc}
              onClick={() => setOpen(false)}
              aria-current={loc === current ? "true" : undefined}
              tabIndex={open ? 0 : -1}
              className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 ${
                loc === current ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Flag locale={loc} />
              <span className="flex-1">{LOCALE_META[loc].name}</span>
              {loc === current && <Check aria-hidden className="h-4 w-4 text-blue-600" />}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
