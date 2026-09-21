"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { UserPlus, Check, Loader2 } from "lucide-react";
import { useLeadAssignees } from "@/lib/hooks/useLeads";
import { createPortal } from "react-dom";
import { useMe, hasPerm } from "@/lib/hooks/useMe";
import { cn } from "@/lib/utils";

/**
 * LID MAS'ULI — kartochkadan biriktirish.
 *
 * FAQAT `leads.assign` bor xodim (ROP, administrator) o'zgartiradi:
 * xohlagan xodimga beradi, qaytarib oladi, biriktirishni bekor
 * qiladi.
 *
 * ILGARI SOTUVCHI HAM biriktirilmagan lidni O'ZIGA ola olardi —
 * "umumiy savat" qoidasining ko'rinadigan qismi edi. Savat
 * 2026-09-21 da bekor qilindi (egasining qarori): sotuvchi endi
 * biriktirilmagan lidni KO'RMAYDI ham, demak "o'zimga olish"
 * tugmasi hech qachon ishlamas edi.
 *
 * Ruxsat baribir serverda tekshiriladi (`canAssign`); bu yerdagi
 * tekshiruv faqat ishlamaydigan tugmani ko'rsatmaslik uchun.
 */
export function AssigneePicker({
  leadId, current, onDone,
}: {
  leadId: string;
  current: { id?: string | null; name?: string | null } | null;
  onDone: () => void;
}) {
  const { me } = useMe();
  const { data: xodimlar } = useLeadAssignees();
  const [ochiq, setOchiq] = useState(false);
  const [saqlanmoqda, setSaqlanmoqda] = useState(false);

  const taqsimlay = hasPerm(me?.permissions, "leads.assign");
  /** Hali hech kimga biriktirilmagan. */
  const biriktirilmagan = !current?.id;

  /**
   * RO'YXAT `body` GA CHIQARILADI, kartochka ichida emas.
   *
   * Kartochka aylanadigan ustunning ichida va `overflow` bilan
   * kesiladi — ochilgan ro'yxat KO'RINMAY qolardi. Mobilda bu ayniqsa
   * yomon: ustun tor va ro'yxat deyarli butunlay kesilardi (egasi
   * suratda ko'rsatdi, 2026-09-21).
   *
   * Portal bilan ro'yxat hech qanday `overflow` ga bog'liq bo'lmaydi,
   * lekin o'rnini o'zi hisoblashi kerak — quyidagi `joy`.
   */
  const tugmaRef = useRef<HTMLButtonElement>(null);
  const [joy, setJoy] = useState<{ top: number; left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    /* Yopilganda holat TOZALANMAYDI: chizish `ochiq` ga bog'liq, ya'ni
       eski qiymat ko'rinmaydi. Effekt ichida holat o'zgartirish esa
       ortiqcha qayta chizish beradi. Qayta ochilganda `useLayoutEffect`
       o'rnini chizishdan OLDIN qayta hisoblaydi. */
    if (!ochiq) return;
    const olch = () => {
      const r = tugmaRef.current?.getBoundingClientRect();
      if (!r) return;
      /* Pastda joy yetmasa ro'yxat TEPADA ochiladi — aks holda u
         ekran ostida qolib, foydalanuvchi uni umuman ko'rmasdi. */
      const past = window.innerHeight - r.bottom;
      const balandlik = 220;
      const tepada = past < balandlik && r.top > past;
      setJoy({
        top: tepada ? Math.max(8, r.top - balandlik - 4) : r.bottom + 4,
        left: r.left,
        width: r.width,
      });
    };
    olch();
    /* Aylanish va o'lcham o'zgarishi — ro'yxat tugmadan ajralib
       qolmasin. `capture`: ichki aylanadigan idishlar ham sanaladi. */
    window.addEventListener("scroll", olch, true);
    window.addEventListener("resize", olch);
    return () => {
      window.removeEventListener("scroll", olch, true);
      window.removeEventListener("resize", olch);
    };
  }, [ochiq]);

  // Boshqa joy bosilganda yopiladi (portal ichi bundan mustasno).
  useEffect(() => {
    if (!ochiq) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOchiq(false); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [ochiq]);

  // Biriktira olmaydigan xodimga tanlov ko'rsatilmaydi — faqat
  // mas'ul nomi (agar bor bo'lsa) o'qiladigan matn sifatida qoladi.
  if (!taqsimlay && !current?.name) return null;

  async function biriktir(userId: string | null) {
    setSaqlanmoqda(true);
    try {
      const r = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedToId: userId }),
      });
      if (r.ok) { setOchiq(false); onDone(); }
    } finally {
      setSaqlanmoqda(false);
    }
  }

  if (!taqsimlay) {
    return (
      <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-2 truncate">
        👤 {current?.name}
      </p>
    );
  }

  return (
    <div className="mt-2 relative">
      <button type="button" ref={tugmaRef}
        onClick={(e) => { e.stopPropagation(); setOchiq(v => !v); }}
        className={cn(
          "w-full flex items-center gap-1 text-[10px] rounded-md px-1.5 py-1 transition-colors",
          biriktirilmagan
            ? "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50"
            : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/10",
        )}>
        {biriktirilmagan
          ? <><UserPlus className="w-3 h-3 shrink-0" /> Biriktirilmagan</>
          : <><span className="shrink-0">👤</span> <span className="truncate">{current?.name}</span></>}
      </button>

      {ochiq && joy && typeof document !== "undefined" && createPortal(
        <>
          <div className="fixed inset-0 z-[200]"
            onClick={(e) => { e.stopPropagation(); setOchiq(false); }} />
          {/* MOBILDA ENG KAM ENI — kartochka tor bo'lsa ro'yxat ham
              tor bo'lib, ismlar qirqilardi. */}
          <div className="fixed z-[201] max-h-52 overflow-y-auto rounded-lg
            border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-xl py-1"
            style={{ top: joy.top, left: joy.left, minWidth: Math.max(joy.width, 180) }}
            onClick={(e) => e.stopPropagation()}>

            {saqlanmoqda && (
              <div className="py-2 flex justify-center">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-400" />
              </div>
            )}

            {!saqlanmoqda && taqsimlay && (
              <>
                <button type="button" onClick={() => biriktir(null)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px]
                    text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/10">
                  Biriktirilmagan
                  {biriktirilmagan && <Check className="w-3 h-3 text-indigo-600" />}
                </button>
                {(xodimlar ?? []).map(x => (
                  <button key={x.id} type="button" onClick={() => biriktir(x.id)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px]
                      text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/10">
                    <span className="truncate">{x.name}</span>
                    {current?.id === x.id && <Check className="w-3 h-3 text-indigo-600 shrink-0" />}
                  </button>
                ))}
              </>
            )}
          </div>
        </>,
        document.body,
      )}
    </div>
  );
}
