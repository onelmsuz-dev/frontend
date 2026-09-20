"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ApplyModalCard } from "./apply-modal";
import styles from "./apply-dialog.module.css";

/**
 * "Boshlash" tugmalari → ariza modali.
 *
 * Ilgari bu tugmalar to'g'ridan-to'g'ri `/login` ga olib borardi: hali hech
 * qanday hisobi yo'q tashrifchi kirish ekraniga tushib, ketib qolardi. Endi
 * hammasi bitta modalni ochadi (ism, telefon, o'quv markaz nomi, ixtiyoriy izoh)
 * va ariza `/api/contact` orqali Telegram botga tushadi. Modalning ko'rinishi va
 * mantiqi: `apply-modal.tsx` (dizayn), `use-lead-form.ts` (mantiq), `.module.css` (animatsiya).
 *
 * `ApplyProvider` sahifa bo'yicha BIR marta o'raladi; `ApplyButton` esa
 * server komponentlar (hero, narxlar...) ichida ham ishlatilaveradi.
 *
 * Modal — brauzerning native `<dialog>` elementi: fokus qopqoni va orqa fonni bloklashni
 * brauzerning o'zi bajaradi. Yopish esa FAQAT modaldagi `X` tugmasi orqali: Escape va orqa fonni
 * bosish e'tiborga olinmaydi.
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
    if (isOpen && !d.open) {
      d.showModal();
      // Telefonda ism maydoniga avtomatik fokus klaviaturani ochib, "sheet"ning yarmini yopib qo'yadi.
      if (window.matchMedia("(pointer: coarse)").matches) {
        (document.activeElement as HTMLElement | null)?.blur();
        d.focus();
      }
    }
    if (!isOpen && d.open) d.close();
  }, [isOpen]);

  return (
    <ApplyContext.Provider value={value}>
      {children}

      <dialog
        ref={dialogRef}
        data-apply
        aria-label="Ariza qoldirish"
        tabIndex={-1}
        // Escape: `cancel` hodisasini to'xtatamiz. Chrome faydalanuvchi harakatisiz ikkinchi marta
        // bosilgan Escape'da `cancel`ni to'xtatib bo'lmaydigan qilib qo'yadi — shuning uchun
        // `keydown` ham to'xtatiladi.
        onCancel={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if (e.key === "Escape") e.preventDefault();
        }}
        // Brauzer modalni o'zi yopib qo'ysa (masalan, Android "orqaga" imo-ishorasi) — X bosilmagan
        // bo'lsa, holat hamon "ochiq": modalni qayta ochamiz. X bosilganda holat allaqachon "yopiq".
        onClose={() => {
          const d = dialogRef.current;
          if (d && isOpen && !d.open) d.showModal();
        }}
        className={styles.dialog}
      >
        {/* Karta faqat ochiq paytda o'rnatiladi — har ochilganda toza holatda boshlanadi. */}
        {isOpen && <ApplyModalCard source={`${page} › ${where}`} onClose={close} />}
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
