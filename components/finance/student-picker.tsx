"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, Loader2, AlertCircle } from "lucide-react";
import { useStudents } from "@/lib/hooks/useStudents";
import { cn } from "@/lib/utils";

/**
 * TO'LOV UCHUN O'QUVCHI TANLASH — QIDIRUV BILAN.
 *
 * Ilgari bu oddiy `<select>` edi va ichida markazning BARCHA o'quvchisi
 * turardi. 50 tada ham noqulay, 500 tada esa kassir ro'yxatni aylantirib
 * odam qidirardi — telefon raqami bo'yicha esa umuman topa olmasdi.
 *
 * Qidiruv SERVERDA: `useStudents({ search })` so'rovga `q` qo'shadi.
 * Brauzerda filtrlash noto'g'ri bo'lardi — javob 1000 qatorga cheklangan
 * va katta markazda qidiruv "birinchi 1000 ta ichidan" ishlab qolardi.
 *
 * QARZ DARHOL KO'RINADI. Kassirning birinchi savoli "qancha qarzi bor?" —
 * uni ro'yxatning o'zida ko'rsatmasak, odam avval tanlab, keyin balansga
 * qarab, keyin summani yozardi.
 */

const fmt = (v: number) =>
  new Intl.NumberFormat("uz-UZ").format(Math.round(Math.abs(v)));

export interface PickedStudent {
  id: string;
  name: string;
  phone?: string | null;
  balance: number;
  groups?: { groupId: string; enrollmentStatus?: string; group?: { name?: string } }[];
}

export function StudentPicker({
  value, onChange, autoFocus,
}: {
  value: PickedStudent | null;
  onChange: (s: PickedStudent | null) => void;
  autoFocus?: boolean;
}) {
  const [matn, setMatn] = useState("");
  const [kechikkan, setKechikkan] = useState("");
  const [ochiq, setOchiq] = useState(false);
  const [kursor, setKursor] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  // Har harfda so'rov ketmasin — 250 ms kutamiz.
  useEffect(() => {
    const t = setTimeout(() => setKechikkan(matn.trim()), 250);
    return () => clearTimeout(t);
  }, [matn]);

  const { data, isLoading } = useStudents(
    kechikkan.length > 0 ? { search: kechikkan } : undefined);

  const royxat: PickedStudent[] = useMemo(() => {
    const xom: PickedStudent[] = Array.isArray(data) ? data : [];
    // Qidiruvsiz holatda ham birinchi 50 tasi ko'rinadi — kassir
    // ko'pincha "oxirgi kelgan o'quvchi" ni tanlaydi.
    return xom.slice(0, 50);
  }, [data]);

  // Tashqariga bosilsa yopilsin
  useEffect(() => {
    if (!ochiq) return;
    const h = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOchiq(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [ochiq]);

  function tanla(s: PickedStudent) {
    onChange(s);
    setOchiq(false);
    setMatn("");
  }

  function klavish(e: React.KeyboardEvent) {
    if (!ochiq) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setKursor(k => Math.min(k + 1, royxat.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setKursor(k => Math.max(k - 1, 0)); }
    else if (e.key === "Enter" && royxat[kursor]) { e.preventDefault(); tanla(royxat[kursor]); }
    else if (e.key === "Escape") { setOchiq(false); }
  }

  if (value) {
    const guruh = value.groups?.find(g => g.enrollmentStatus !== "CHIQIB_KETGAN")?.group?.name;
    return (
      <div className={cn("flex items-center gap-2.5 rounded-xl px-3 py-2.5 border",
        value.balance < 0
          ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40"
          : "glass-soft border-white/60 dark:border-white/10")}>
        <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 shrink-0
          flex items-center justify-center text-[12px] font-bold text-indigo-700 dark:text-indigo-300">
          {value.name?.[0] ?? "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 truncate">
            {value.name}
          </p>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
            {guruh ?? "guruhsiz"}
            {value.balance < 0
              ? ` · qarz ${fmt(value.balance)} so'm`
              : value.balance > 0 ? ` · ortiqcha ${fmt(value.balance)} so'm` : ""}
          </p>
        </div>
        <button type="button" onClick={() => onChange(null)} aria-label="Boshqa o'quvchi"
          className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg
            text-neutral-400 hover:bg-white/70 dark:hover:bg-white/10">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={boxRef}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
      <input
        autoFocus={autoFocus}
        value={matn}
        onChange={e => { setMatn(e.target.value); setOchiq(true); setKursor(0); }}
        onFocus={() => setOchiq(true)}
        onKeyDown={klavish}
        placeholder="Ism yoki telefon bo'yicha qidiring..."
        className="w-full h-10 pl-9 pr-3 text-sm rounded-xl border border-white/60 dark:border-white/10
          bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none
          focus:border-indigo-400 transition-colors"
      />

      {ochiq && (
        <div className="absolute z-30 left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded-xl
          border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-xl py-1">

          {isLoading && (
            <div className="py-4 flex justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
            </div>
          )}

          {!isLoading && royxat.length === 0 && (
            <p className="px-3 py-4 text-[12px] text-neutral-400 text-center">
              {kechikkan ? "Topilmadi" : "Qidirish uchun yozing"}
            </p>
          )}

          {!isLoading && royxat.map((s, i) => {
            const guruh = s.groups?.find(g => g.enrollmentStatus !== "CHIQIB_KETGAN")?.group?.name;
            return (
              <button key={s.id} type="button"
                onMouseEnter={() => setKursor(i)}
                onClick={() => tanla(s)}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors",
                  i === kursor && "bg-indigo-50 dark:bg-indigo-950/30")}>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-medium text-neutral-900 dark:text-neutral-100 truncate">
                    {s.name}
                  </p>
                  <p className="text-[10.5px] text-neutral-400 truncate">
                    {guruh ?? "guruhsiz"}{s.phone ? ` · ${s.phone}` : ""}
                  </p>
                </div>
                {s.balance < 0 && (
                  <span className="shrink-0 flex items-center gap-1 text-[11px] font-semibold
                    text-red-600 dark:text-red-400">
                    <AlertCircle className="w-3 h-3" />
                    {fmt(s.balance)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
