"use client";

import { useId, useRef, useState } from "react";
import { Send, Check, AlertCircle, Loader2, MessageCircle } from "lucide-react";
import { extractNationalDigits, toDisplayPhone, caretForDigits } from "@/lib/phone-format";

/**
 * Cluster landing sahifalaridagi qisqa ariza formasi.
 *
 * `components/landing/contact-section.tsx` bilan bir xil `/api/contact`
 * endpointiga yuboradi (backend o'zgarmaydi). Farqi: bu yerda `topic` fixed
 * (sahifa propsidan) va qaysi sahifadan kelgani `message` maydoni ichiga
 * "Sahifa: ..." qatori sifatida qo'shiladi — backend sxemasida alohida
 * "source" maydoni yo'q, shu sabab mavjud ixtiyoriy `message`dan foydalaniladi.
 */

type ContactTopic = "demo" | "narx" | "kochirish" | "hamkorlik" | "boshqa";

interface LeadFormProps {
  /** Telegramga boradigan xabarda ko'rinadigan manba yorlig'i, masalan "Davomat sahifasi". */
  source: string;
  topic?: ContactTopic;
  heading?: string;
  description?: string;
  ctaLabel?: string;
  notePlaceholder?: string;
  className?: string;
}

const REQUEST_TIMEOUT_MS = 15_000;

const inputBase =
  "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 " +
  "placeholder:text-slate-500 outline-none transition-colors " +
  "focus:ring-4 disabled:bg-slate-50 disabled:text-slate-500";
const inputOk = `${inputBase} border-slate-300 focus:border-blue-600 focus:ring-blue-600/15`;
const inputBad = `${inputBase} border-red-400 focus:border-red-500 focus:ring-red-500/15`;

export function LeadForm({
  source,
  topic = "demo",
  heading = "Bepul konsultatsiya oling",
  description = "Ism va telefon raqamingizni qoldiring — ish vaqtida 30 daqiqa ichida qo'ng'iroq qilamiz.",
  ctaLabel = "Ariza yuborish",
  notePlaceholder = "Markazingiz haqida qisqacha (ixtiyoriy)",
  className = "",
}: LeadFormProps) {
  const uid = useId();
  const [name, setName] = useState("");
  const [digits, setDigits] = useState("");
  const [note, setNote] = useState("");
  // Honeypot — nomi ataylab "website"/"url" emas, ko'ring `contact-section.tsx`dagi izohni.
  const [trap, setTrap] = useState("");

  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  const nameOk = name.trim().length >= 2;
  const phoneOk = digits.length === 9;
  const valid = nameOk && phoneOk;

  function onPhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const el = e.target;
    const caret = el.selectionStart ?? el.value.length;
    const digitsBefore = el.value.slice(0, caret).replace(/\D/g, "").length;
    const next = extractNationalDigits(el.value);
    setDigits(next);
    requestAnimationFrame(() => {
      const pos = caretForDigits(toDisplayPhone(next), digitsBefore);
      el.setSelectionRange(pos, pos);
    });
  }

  function onPhoneKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Backspace") return;
    const el = e.currentTarget;
    const caret = el.selectionStart ?? 0;
    if (caret === 0 || el.selectionStart !== el.selectionEnd) return;
    if (/\d/.test(el.value[caret - 1])) return;

    e.preventDefault();
    const before = el.value.slice(0, caret).replace(/\D/g, "");
    const kept = before.slice(0, -1) + el.value.slice(caret).replace(/\D/g, "");
    const next = kept.slice(0, 9);
    setDigits(next);
    requestAnimationFrame(() => {
      const pos = caretForDigits(toDisplayPhone(next), Math.max(0, before.length - 1));
      el.setSelectionRange(pos, pos);
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);

    if (!valid) {
      (!nameOk ? nameRef : phoneRef).current?.focus();
      return;
    }
    if (status === "sending") return;

    setStatus("sending");
    setError("");

    const message = `Sahifa: ${source}` + (note.trim() ? `\n\n${note.trim()}` : "");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          name: name.trim(),
          phone: `+998${digits}`,
          topic,
          message,
          ...(trap ? { contact_ref: trap } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          res.status === 429
            ? "Juda ko'p urinish bo'ldi. Bir necha daqiqadan so'ng qayta urining yoki Telegram orqali yozing."
            : (data.error ?? "Ariza yuborilmadi. Birozdan keyin urinib ko'ring."),
        );
        setStatus("idle");
        return;
      }
      setStatus("sent");
      requestAnimationFrame(() => successRef.current?.focus());
    } catch (err) {
      setError(
        err instanceof Error && err.name === "AbortError"
          ? "So'rov juda uzoq davom etdi. Aloqani tekshirib, qayta urining."
          : "Internetga ulanib bo'lmadi. Aloqani tekshirib, qayta urining.",
      );
      setStatus("idle");
    } finally {
      clearTimeout(timer);
    }
  }

  function reset() {
    setName("");
    setDigits("");
    setNote("");
    setTrap("");
    setTouched(false);
    setError("");
    setStatus("idle");
    requestAnimationFrame(() => nameRef.current?.focus());
  }

  const showNameErr = touched && !nameOk;
  const showPhoneErr = touched && !phoneOk;

  return (
    <div
      className={`rounded-2xl border border-slate-100 bg-white p-5 shadow-xl shadow-slate-900/5 sm:p-7 ${className}`}
    >
      {status === "sent" ? (
        <div ref={successRef} tabIndex={-1} role="status" aria-live="polite" className="py-6 text-center outline-none">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
            <Check className="h-7 w-7 text-emerald-700" aria-hidden="true" />
          </div>
          <h3 className="mt-5 text-lg font-bold text-slate-900">Arizangiz qabul qilindi</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-600">
            Rahmat! Menejerimiz ish vaqtida siz bilan bog&apos;lanadi.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
            <a
              href="https://t.me/oneroomuz"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 sm:w-auto"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Telegramda yozish
            </a>
            <button
              type="button"
              onClick={reset}
              className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 sm:w-auto"
            >
              Yana ariza yuborish
            </button>
          </div>
        </div>
      ) : (
        <>
          <h3 className="text-lg font-bold text-slate-900 sm:text-xl">{heading}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{description}</p>

          <form onSubmit={submit} noValidate className="mt-5 space-y-3.5">
            <div aria-hidden="true" className="hidden">
              <label htmlFor={`lf-ref-${uid}`}>Ma&apos;lumotnoma</label>
              <input
                id={`lf-ref-${uid}`}
                name="contact_ref"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={trap}
                onChange={(e) => setTrap(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor={`lf-name-${uid}`} className="mb-1.5 block text-sm font-medium text-slate-700">
                Ism va familiya <span className="text-red-600">*</span>
              </label>
              <input
                ref={nameRef}
                id={`lf-name-${uid}`}
                name="name"
                type="text"
                autoComplete="name"
                maxLength={100}
                required
                aria-required="true"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alisher Karimov"
                disabled={status === "sending"}
                aria-invalid={showNameErr}
                className={showNameErr ? inputBad : inputOk}
              />
              {showNameErr && <p className="mt-1.5 text-xs font-medium text-red-700">Ism va familiyangizni kiriting</p>}
            </div>

            <div>
              <label htmlFor={`lf-phone-${uid}`} className="mb-1.5 block text-sm font-medium text-slate-700">
                Telefon raqam <span className="text-red-600">*</span>
              </label>
              <div
                className={`flex items-center overflow-hidden rounded-xl border bg-white transition-colors focus-within:ring-4 ${
                  showPhoneErr
                    ? "border-red-400 focus-within:border-red-500 focus-within:ring-red-500/15"
                    : "border-slate-300 focus-within:border-blue-600 focus-within:ring-blue-600/15"
                }`}
              >
                <span className="flex shrink-0 items-center gap-1.5 border-r border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-600">
                  <span aria-hidden="true">🇺🇿</span>+998
                </span>
                <input
                  ref={phoneRef}
                  id={`lf-phone-${uid}`}
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  required
                  aria-required="true"
                  value={toDisplayPhone(digits)}
                  onChange={onPhoneChange}
                  onKeyDown={onPhoneKeyDown}
                  placeholder="90 123 45 67"
                  disabled={status === "sending"}
                  aria-invalid={showPhoneErr}
                  className="w-full bg-transparent px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-500 disabled:text-slate-500"
                />
              </div>
              {showPhoneErr && <p className="mt-1.5 text-xs font-medium text-red-700">To&apos;liq 9 ta raqam kiriting</p>}
            </div>

            <div>
              <label htmlFor={`lf-note-${uid}`} className="mb-1.5 block text-sm font-medium text-slate-700">
                Izoh <span className="font-normal text-slate-500">— ixtiyoriy</span>
              </label>
              <textarea
                id={`lf-note-${uid}`}
                name="message"
                rows={2}
                maxLength={500}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={notePlaceholder}
                disabled={status === "sending"}
                className={`${inputOk} min-h-[56px] resize-y`}
              />
            </div>

            <div aria-live="assertive">
              {error && (
                <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
                  <p className="text-[13px] font-medium text-red-700">{error}</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={status === "sending"}
              className="group inline-flex w-full items-center justify-center gap-2.5 rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-700/25 transition-all hover:bg-blue-500 hover:shadow-blue-600/35 active:scale-[0.99] disabled:cursor-wait disabled:opacity-80"
            >
              {status === "sending" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Yuborilmoqda...
                </>
              ) : (
                <>
                  {ctaLabel}
                  <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </>
              )}
            </button>

            <p className="text-center text-xs leading-relaxed text-slate-500">
              Yuborish orqali siz bilan bog&apos;lanishimizga rozilik bildirasiz.
            </p>
          </form>
        </>
      )}
    </div>
  );
}
