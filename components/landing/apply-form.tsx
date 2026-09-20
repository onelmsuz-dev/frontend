"use client";

import { useId } from "react";
import { AlertCircle, Building2, Check, Loader2, MessageCircle, MessageSquareText, Send, User } from "lucide-react";
import { CONTACT_PHONE, CONTACT_PHONE_DISPLAY } from "@/lib/seo/site";
import { useLeadForm, type ContactTopic } from "./use-lead-form";
import styles from "./apply-dialog.module.css";

/**
 * ARIZA FORMASI — modal (`apply-modal.tsx`) va footer tepasidagi "Ariza qoldiring" bloki uchun
 * BITTA umumiy dizayn (`ApplyPanel`). Mantiq (holat, tekshiruv, yuborish) `use-lead-form.ts` da.
 *
 * Hook va forma ataylab bitta komponentda: hook ichida ref'lar bor, ularni prop qilib
 * boshqa komponentga uzatib bo'lmaydi (React lint: "render paytida ref o'qish").
 *
 * O'LCHAMLAR CSS o'zgaruvchilari bilan (`--f-box`, `--f-gap`...): modal kartasida ularni
 * `apply-dialog.module.css` balandlikka qarab bosqichma-bosqich qisqartiradi (scroll kerak bo'lmasin).
 * Sahifa ichidagi blokda o'zgaruvchilar yo'q — `var(--f-box, 3rem)` dagi oddiy qiymat ishlaydi.
 */

const TOPICS: { value: ContactTopic; label: string }[] = [
  { value: "demo", label: "Demo" },
  { value: "narx", label: "Narxlar" },
  { value: "kochirish", label: "Ko'chirish" },
  { value: "boshqa", label: "Boshqa" },
];

/** Maydon qutisi: yumshoq to'ldirilgan fon + ingichka ichki ramka; fokusda oq fon va ko'k ramka. */
const BOX_BASE = "group relative flex h-[var(--f-box,3rem)] items-center rounded-xl bg-slate-50 ring-1 ring-inset transition-all duration-150 focus-within:bg-white focus-within:ring-2";
const BOX_OK = "ring-slate-200 hover:ring-slate-300 focus-within:ring-blue-600 focus-within:shadow-[0_0_0_4px_rgb(37_99_235/0.10)]";
const BOX_BAD = "bg-red-50/50 ring-2 ring-red-400 focus-within:ring-red-500 focus-within:shadow-[0_0_0_4px_rgb(239_68_68/0.10)]";
// 16px: iOS'da maydonga fokus berilganda sahifa kattalashib ketmasligi uchun.
const INPUT = "h-full min-w-0 flex-1 bg-transparent pr-10 text-base text-slate-900 outline-none placeholder:text-slate-500 disabled:text-slate-500";
const ICON = "flex w-11 shrink-0 items-center justify-center text-slate-400 transition-colors";

/** Maydon: yorliq + ikonkali quti + xato matni. To'g'ri to'ldirilsa o'ngda kichik yashil belgi chiqadi. */
function Field({
  id, label, icon, ok, showOk, error, children,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  ok: boolean;
  showOk: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-semibold text-slate-700">{label}</label>
      <div className={`${BOX_BASE} ${error ? BOX_BAD : BOX_OK}`}>
        <span className={`${ICON} group-focus-within:text-blue-600`} aria-hidden>
          {icon}
        </span>
        {children}
        {ok && showOk && (
          <span className="pointer-events-none absolute right-3.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700" aria-hidden>
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-red-700">{error}</p>}
    </div>
  );
}

/**
 * `variant="modal"` — modal kartasi ichida (h2, "Yoki qo'ng'iroq qiling" havolasi, kartadagi o'lchamlar);
 * `variant="inline"` — sahifa ichida (h3, "Yana ariza yuborish" tugmasi). Bosh sahifa server komponent,
 * shuning uchun holat shu yerda (client) yashaydi.
 * `compact` — "Nima qiziqtiradi?" va izohni yashiradi (ular sukut bo'yicha yuboriladi).
 */
export function ApplyPanel({
  source, variant, heading = "Ariza qoldiring", compact = false,
}: {
  source: string;
  variant: "modal" | "inline";
  heading?: string;
  compact?: boolean;
}) {
  const {
    name, setName, digits, center, setCenter, note, setNote, topic, setTopic, trap, setTrap, phoneDisplay,
    status, error, nameOk, phoneOk, centerOk, showNameErr, showPhoneErr, showCenterErr,
    nameRef, phoneRef, centerRef, successRef, onPhoneChange, onPhoneKeyDown, submit, reset,
  } = useLeadForm({ source, askCenter: true });
  const uid = useId();
  const modal = variant === "modal";
  const sending = status === "sending";

  const steps = [
    { t: "Ariza yuborildi", state: "done" },
    { t: "Biz sizga qo'ng'iroq qilamiz", state: "now" },
    { t: "Bepul sinov boshlanadi", state: "next" },
  ];

  if (status === "sent") {
    return (
      <div ref={successRef} tabIndex={-1} role="status" aria-live="polite" className="flex h-full flex-col justify-center py-4 text-center outline-none md:py-6">
        <svg viewBox="0 0 64 64" className="mx-auto h-20 w-20" fill="none" aria-hidden>
          <circle cx="32" cy="32" r="28" className={`${styles.checkRing} stroke-emerald-500`} strokeWidth="3.5" strokeLinecap="round" transform="rotate(-90 32 32)" />
          <path d="M21 33l8 8 15-17" className={`${styles.checkMark} stroke-emerald-600`} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h2 className="mt-5 text-2xl font-bold tracking-[-0.03em] text-slate-900">Rahmat! Arizangiz qabul qilindi</h2>

        <ol className="mx-auto mt-7 w-full max-w-xs space-y-3 text-left">
          {steps.map((step) => (
            <li key={step.t} className="flex items-center gap-3 text-[15px]">
              {step.state === "done" ? (
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white"><Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden /></span>
              ) : step.state === "now" ? (
                <span className={`${styles.pulseDot} flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600`}><span className="h-2 w-2 rounded-full bg-white" /></span>
              ) : (
                <span className="h-6 w-6 shrink-0 rounded-full border-2 border-slate-300" />
              )}
              <span className={step.state === "next" ? "text-slate-500" : "font-semibold text-slate-800"}>{step.t}</span>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
          <a
            href="https://t.me/oneroomuz"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-[15px] font-bold text-white transition-colors hover:bg-blue-700"
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            Telegramda yozish
          </a>
          {!modal && (
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-12 items-center justify-center rounded-xl px-5 text-[15px] font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              Yana ariza yuborish
            </button>
          )}
        </div>
      </div>
    );
  }

  const titleClass = "text-[1.75rem] font-bold leading-tight tracking-[-0.04em] text-slate-900 md:text-3xl";

  return (
    <>
      {modal ? (
        <h2 className={`pr-12 ${titleClass}`}>{heading}</h2>
      ) : (
        <h3 className={titleClass}>{heading}</h3>
      )}
      <form onSubmit={submit} noValidate className="mt-[var(--m-head-gap,1.25rem)] flex flex-col gap-[var(--f-gap,1rem)]">
        {/* Honeypot: odamga ko'rinmaydi, botlar to'ldiradi */}
        <div aria-hidden className="hidden">
          <label htmlFor={`${uid}-ref`}>Ma&apos;lumotnoma</label>
          <input id={`${uid}-ref`} name="contact_ref" type="text" tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
        </div>

        {/* Nima qiziqtiradi? — ixtiyoriy; Telegramda "Maqsad" qatori bo'lib boradi */}
        <fieldset className={compact ? "hidden" : undefined}>
          <legend className="mb-1.5 text-[13px] font-semibold text-slate-700">Nima qiziqtiradi?</legend>
          <div role="radiogroup" aria-label="Nima qiziqtiradi?" className="flex flex-wrap gap-1.5">
            {TOPICS.map((t) => {
              const active = topic === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setTopic(t.value)}
                  className={`h-[var(--f-chip,2.25rem)] rounded-full px-3.5 text-[13px] font-semibold transition-all duration-150 ${
                    active
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                      : "bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-200 hover:ring-slate-300"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <Field id={`${uid}-name`} label="Ismingiz" icon={<User className="h-[18px] w-[18px]" />} ok={nameOk} showOk={name.length > 0} error={showNameErr ? "Ismingizni kiriting" : undefined}>
          <input
            ref={nameRef}
            id={`${uid}-name`}
            name="name"
            type="text"
            autoComplete="name"
            maxLength={100}
            required
            aria-required="true"
            aria-invalid={showNameErr}
            disabled={sending}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alisher Karimov"
            className={INPUT}
          />
        </Field>

        <Field id={`${uid}-phone`} label="Telefon raqamingiz" icon={<span className="text-base">🇺🇿</span>} ok={phoneOk} showOk={digits.length > 0} error={showPhoneErr ? "9 ta raqam kiriting" : undefined}>
          <span className="-ml-1 shrink-0 text-base font-semibold text-slate-700">+998</span>
          <span className="mx-2.5 h-5 w-px shrink-0 bg-slate-300" aria-hidden />
          <input
            ref={phoneRef}
            id={`${uid}-phone`}
            name="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            required
            aria-required="true"
            aria-invalid={showPhoneErr}
            disabled={sending}
            value={phoneDisplay}
            onChange={onPhoneChange}
            onKeyDown={onPhoneKeyDown}
            placeholder="90 123 45 67"
            className={INPUT}
          />
        </Field>

        <Field id={`${uid}-center`} label="O'quv markaz nomi" icon={<Building2 className="h-[18px] w-[18px]" />} ok={centerOk} showOk={center.length > 0} error={showCenterErr ? "Markaz nomini kiriting" : undefined}>
          <input
            ref={centerRef}
            id={`${uid}-center`}
            name="center"
            type="text"
            autoComplete="organization"
            maxLength={120}
            required
            aria-required="true"
            aria-invalid={showCenterErr}
            disabled={sending}
            value={center}
            onChange={(e) => setCenter(e.target.value)}
            placeholder="Masalan: Bilim Plus"
            className={INPUT}
          />
        </Field>

        {/* Izoh — doim ochiq (ixtiyoriy). Ikonka boshqa maydonlar bilan bir xil ustunda, matn ham shu chiziqdan boshlanadi. */}
        <div className={compact ? "hidden" : undefined}>
          <label htmlFor={`${uid}-note`} className="mb-1.5 block text-[13px] font-semibold text-slate-700">
            Izoh <span className="font-normal text-slate-500">— ixtiyoriy</span>
          </label>
          <div className="relative">
            <textarea
              id={`${uid}-note`}
              name="message"
              maxLength={500}
              disabled={sending}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Savolingiz yoki qo'shimcha ma'lumot"
              className={`peer block w-full resize-none rounded-xl bg-slate-50 py-3 pl-11 pr-3.5 text-base leading-snug text-slate-900 outline-none ring-1 ring-inset ring-slate-200 transition-all duration-150 placeholder:text-slate-500 hover:ring-slate-300 focus:bg-white focus:shadow-[0_0_0_4px_rgb(37_99_235/0.10)] focus:ring-2 focus:ring-blue-600 h-[var(--f-note,4.25rem)]`}
            />
            <span className={`${ICON} pointer-events-none absolute left-0 top-0 h-12 peer-focus:text-blue-600`} aria-hidden>
              <MessageSquareText className="h-[18px] w-[18px]" />
            </span>
          </div>
        </div>

        <div aria-live="assertive" className="empty:hidden">
          {error && (
            <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden />
              <p className="text-[13px] font-medium text-red-700">{error}</p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={sending}
          className="group inline-flex h-[var(--f-cta,3.25rem)] w-full items-center justify-center gap-2.5 rounded-xl bg-blue-600 text-base font-bold text-white shadow-lg shadow-blue-600/25 transition-colors hover:bg-blue-700 disabled:cursor-wait disabled:opacity-80"
        >
          {sending ? (
            <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Yuborilmoqda…</>
          ) : (
            <>Ariza yuborish <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden /></>
          )}
        </button>

        <p className="text-center text-xs leading-relaxed text-slate-500">
          Yuborish orqali bog&apos;lanishimizga rozilik bildirasiz.
          {modal && (
            <span className="md:hidden"> Yoki qo&apos;ng&apos;iroq qiling: <a href={`tel:${CONTACT_PHONE}`} className="font-semibold text-slate-700 underline">{CONTACT_PHONE_DISPLAY}</a></span>
          )}
        </p>
      </form>
    </>
  );
}

/** Sahifa ichidagi (footer tepasidagi) ariza bloki: modal bilan bir xil forma, faqat sahifada. */
export function ApplyInline({ source, heading, compact }: { source: string; heading?: string; compact?: boolean }) {
  return <ApplyPanel variant="inline" source={source} heading={heading} compact={compact} />;
}
