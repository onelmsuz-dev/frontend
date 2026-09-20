"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { LeadForm } from "./lead-form";

/**
 * "Boshlash" tugmalari → ariza modali.
 *
 * Ilgari bu tugmalar to'g'ridan-to'g'ri `/login` ga olib borardi: hali hech
 * qanday hisobi yo'q tashrifchi kirish ekraniga tushib, ketib qolardi. Endi
 * hammasi bitta modalni ochadi (ism, telefon, o'quv markaz nomi, ixtiyoriy izoh)
 * va ariza `/api/contact` orqali Telegram botga tushadi.
 *
 * `ApplyProvider` sahifa bo'yicha BIR marta o'raladi; `ApplyButton` esa
 * server komponentlar (hero, narxlar...) ichida ham ishlatilaveradi.
 *
 * Modal — brauzerning native `<dialog>` elementi: fokus qopqoni, Escape va
 * orqa fonni bloklashni brauzerning o'zi bajaradi.
 */

interface ApplyContextValue {
  /** `where` — tugma qayerda turgani ("Hero", "Header"...), Telegram xabariga tushadi. */
  open: (where: string) => void;
}

const ApplyContext = createContext<ApplyContextValue | null>(null);

export function ApplyProvider({
  page,
  children,
}: {
  /** Sahifa yorlig'i: "Bosh sahifa", "Davomat sahifasi"... */
  page: string;
  children: React.ReactNode;
}) {
  // null — yopiq; satr — ochiq va qaysi tugmadan ochilgani.
  const [where, setWhere] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isOpen = where !== null;

  const open = useCallback((w: string) => setWhere(w), []);
  const close = useCallback(() => setWhere(null), []);
  const value = useMemo(() => ({ open }), [open]);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (isOpen && !d.open) d.showModal();
    if (!isOpen && d.open) d.close();
  }, [isOpen]);

  return (
    <ApplyContext.Provider value={value}>
      {children}

      <dialog
        ref={dialogRef}
        data-apply
        aria-label="Ariza qoldirish"
        // Escape yoki `close()` da brauzer `close` hodisasini yuboradi — holatni shunga moslaymiz.
        onClose={close}
        // `<dialog>` ning o'zi bosilsa (ya'ni orqa fon) — yopamiz. Ichki qobiq
        // butun maydonni egallagani uchun ichidagi bosishlar bu yerga yetmaydi.
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        className="m-auto max-h-[92dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl bg-white p-0 shadow-2xl backdrop:bg-slate-950/60 backdrop:backdrop-blur-sm"
      >
        {/* Forma faqat ochiq paytda o'rnatiladi — har ochilganda toza holatda boshlanadi. */}
        {isOpen && (
          <div className="relative p-5 sm:p-7">
            <LeadForm
              bare
              askCenter
              source={`${page} › ${where}`}
              heading="Ariza qoldiring"
              description="Ma'lumotlaringizni qoldiring — ish vaqtida 30 daqiqa ichida bog'lanib, 7 kunlik bepul sinovni ochib beramiz."
              ctaLabel="Ariza yuborish"
              notePlaceholder="Nechta o'quvchi bor, hozir nimadan foydalanasiz? (ixtiyoriy)"
            />
            {/* DOM tartibida OXIRIDA: `showModal()` birinchi fokuslanadigan elementga
                (ism maydoni) fokus beradi, "Yopish" tugmasiga emas. */}
            <button
              type="button"
              onClick={close}
              aria-label="Yopish"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </dialog>
    </ApplyContext.Provider>
  );
}

export function ApplyButton({
  where,
  className,
  onClick,
  children,
}: {
  where: string;
  className?: string;
  /** Qo'shimcha amal (masalan, mobil menyuni yopish). */
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const ctx = useContext(ApplyContext);

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        onClick?.();
        // Provayder yo'q bo'lsa (kutilmagan holat) — bosh sahifadagi ariza bo'limiga o'tkazamiz.
        if (ctx) ctx.open(where);
        else window.location.assign("/#contact");
      }}
    >
      {children}
    </button>
  );
}
