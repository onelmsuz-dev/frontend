"use client";

import { useRef, useState } from "react";
import {
  Send, Check, AlertCircle, Loader2, MessageCircle, Mail, Clock3,
} from "lucide-react";
import { extractNationalDigits, toDisplayPhone, caretForDigits } from "@/lib/phone-format";

/**
 * BOG'LANISH — landingdagi ariza formasi.
 *
 * Ma'lumot `POST /api/contact` ga (BFF proksi orqali backendga) ketadi va
 * u yerdan Telegram bot orqali adminlarga yuboriladi.
 *
 * DIQQAT: bot tokeni bu yerda YO'Q va bo'lishi ham mumkin emas — brauzerga
 * tushgan har qanday kalit ochiq hisoblanadi (DevTools → Network). Token
 * faqat backendning `.env` faylida turadi.
 */

/** Yorliqlar backenddagi `CONTACT_TOPICS` bilan bir xil bo'lishi kerak —
 *  adminga boradigan xabarda aynan shu matn ko'rinadi. */
const TOPICS = [
  { value: "demo",      label: "Demo ko'rish" },
  { value: "narx",      label: "Narxlar bo'yicha savol" },
  { value: "kochirish", label: "Boshqa tizimdan ko'chirish" },
  { value: "hamkorlik", label: "Hamkorlik" },
  { value: "boshqa",    label: "Boshqa savol" },
] as const;

const CHANNELS = [
  { icon: MessageCircle, label: "Telegram", value: "@oneroomuz",        href: "https://t.me/oneroomuz" },
  { icon: Mail,          label: "Email",    value: "support@oneroom.uz", href: "mailto:support@oneroom.uz" },
];

/** So'rov cheksiz osilib qolmasin — tugma abadiy bloklanib turmasligi uchun. */
const REQUEST_TIMEOUT_MS = 15_000;

const inputBase =
  "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 " +
  "placeholder:text-slate-500 outline-none transition-colors " +
  "focus:ring-4 disabled:bg-slate-50 disabled:text-slate-500";
const inputOk  = `${inputBase} border-slate-300 focus:border-blue-600 focus:ring-blue-600/15`;
const inputBad = `${inputBase} border-red-400 focus:border-red-500 focus:ring-red-500/15`;

export function ContactSection() {
  const [name,     setName]     = useState("");
  const [digits,   setDigits]   = useState("");
  const [telegram, setTelegram] = useState("");
  const [topic,    setTopic]    = useState<string>("");
  const [message,  setMessage]  = useState("");
  // Honeypot. Nomi ATAYLAB "website"/"url" EMAS: brauzer avtoto'ldirishi
  // aynan shunday nomlarni taniydi va yashirin maydonni to'ldirib qo'yishi
  // mumkin — o'shanda haqiqiy mijozning arizasi spam deb jimgina
  // tashlab yuborilardi.
  const [trap,     setTrap]     = useState("");

  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error,  setError]  = useState("");
  const [touched, setTouched] = useState(false);

  const nameRef    = useRef<HTMLInputElement>(null);
  const phoneRef   = useRef<HTMLInputElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  const nameOk  = name.trim().length >= 2;
  const phoneOk = digits.length === 9;
  const valid   = nameOk && phoneOk;

  /** Telefon: raqamni yangilaydi VA kursorni joyida qoldiradi. */
  function onPhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const el = e.target;
    const caret = el.selectionStart ?? el.value.length;
    const digitsBefore = el.value.slice(0, caret).replace(/\D/g, "").length;
    const next = extractNationalDigits(el.value);
    setDigits(next);
    // React qiymatni qayta chizgandan KEYIN joylashtiramiz.
    requestAnimationFrame(() => {
      const pos = caretForDigits(toDisplayPhone(next), digitsBefore);
      el.setSelectionRange(pos, pos);
    });
  }

  /**
   * Ajratgich (bo'sh joy) ustida Backspace bosilganda hech nima o'chmasdi:
   * raqamlar o'zgarmagani uchun React qayta chizmasdi ham. Undan oldingi
   * RAQAMNI o'chiramiz — odam kutgan xatti-harakat shu.
   */
  function onPhoneKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Backspace") return;
    const el = e.currentTarget;
    const caret = el.selectionStart ?? 0;
    if (caret === 0 || el.selectionStart !== el.selectionEnd) return;
    if (/\d/.test(el.value[caret - 1])) return; // oddiy holat — brauzer o'zi uddalaydi

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

    // Xato bo'lsa — birinchi muammoli maydonga FOKUS. Ilgari qizil matn
    // chizilardi-yu, klaviatura va ekran o'quvchi foydalanuvchilar uchun
    // "tugma bosildi, hech nima bo'lmadi" degan holat edi.
    if (!valid) {
      (!nameOk ? nameRef : phoneRef).current?.focus();
      return;
    }
    if (status === "sending") return;

    setStatus("sending");
    setError("");

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
          ...(telegram.trim() ? { telegram: telegram.trim() } : {}),
          ...(topic ? { topic } : {}),
          ...(message.trim() ? { message: message.trim() } : {}),
          ...(trap ? { website: trap } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          res.status === 429
            ? "Juda ko'p urinish bo'ldi. Bir necha daqiqadan so'ng qayta urining yoki Telegram orqali yozing."
            : data.error ?? "Ariza yuborilmadi. Birozdan keyin urinib ko'ring.",
        );
        setStatus("idle");
        return;
      }
      setStatus("sent");
      // Forma o'rnini bosgan xabarga fokus — ekran o'quvchi uni o'qiydi,
      // klaviatura foydalanuvchisi esa <body> ga tushib qolmaydi.
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
    setName(""); setDigits(""); setTelegram(""); setTopic(""); setMessage("");
    // Honeypot ham tozalanadi: avtoto'ldirish uni bir marta to'ldirib qo'ysa,
    // tozalanmasa shu tashrif davomida HAR BIR ariza jimgina yo'qolardi.
    setTrap("");
    setTouched(false); setError(""); setStatus("idle");
    requestAnimationFrame(() => nameRef.current?.focus());
  }

  const showNameErr  = touched && !nameOk;
  const showPhoneErr = touched && !phoneOk;

  return (
    <section
      id="contact"
      // DIQQAT: bu yerda `overflow-hidden` YO'Q. U bo'lganda chap ustundagi
      // `lg:sticky` umuman ishlamasdi — CSS qoidasiga ko'ra `overflow`
      // qiymati `visible` dan boshqa bo'lgan ota element sticky'ni o'chiradi.
      // Yorug'lik dog'lari o'z konteynerida qirqiladi (pastda).
      className="relative bg-slate-950 py-20 sm:py-24 lg:py-28"
      aria-labelledby="contact-heading"
    >
      {/* Glow — CTA bo'limi bilan bir xil uslub, uzluksiz qorong'i blok */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 right-1/4 h-[520px] w-[520px] rounded-full bg-blue-600/15 blur-[120px]" />
        <div className="absolute -bottom-24 left-0 h-[380px] w-[380px] rounded-full bg-indigo-600/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-5 lg:gap-16">

          {/* Chap: matn va to'g'ridan-to'g'ri aloqa */}
          <div className="lg:col-span-2 lg:sticky lg:top-24 lg:self-start">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-blue-400">
              Bog&apos;lanish
            </p>
            <h2
              id="contact-heading"
              className="text-2xl font-extrabold leading-tight text-white sm:text-3xl lg:text-4xl"
            >
              Ariza qoldiring —{" "}
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                biz o&apos;zimiz bog&apos;lanamiz
              </span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-300 sm:text-base">
              Ism va telefon raqamingizni qoldiring — ish vaqtida{" "}
              <span className="font-semibold text-white">30 daqiqa ichida</span>{" "}
              qo&apos;ng&apos;iroq qilamiz va markazingizga mos yechimni ko&apos;rsatamiz.
            </p>

            {/* To'g'ridan-to'g'ri kanallar — forma to'ldirgisi kelmaganlar uchun */}
            <div className="mt-8 space-y-2.5">
              {CHANNELS.map(({ icon: Icon, label, value, href }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition-colors hover:border-white/25 hover:bg-white/10"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    {/* slate-500 emas: qorong'i fonda u 4.24:1 berardi (kerak 4.5) */}
                    <span className="block text-[11px] uppercase tracking-wider text-slate-400">{label}</span>
                    <span className="block truncate text-sm font-medium text-slate-200 group-hover:text-white">
                      {value}
                    </span>
                  </span>
                </a>
              ))}
            </div>

            <p className="mt-5 flex items-center gap-2 text-xs text-slate-400">
              <Clock3 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Ish kunlari 09:00–22:00 · O&apos;zbek tilida
            </p>
          </div>

          {/* O'ng: forma (oq kartochka — qorong'i fonda diqqatni tortadi) */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-white/10 bg-white p-5 shadow-2xl shadow-slate-950/40 sm:p-7">
              {status === "sent" ? (
                <SuccessPanel panelRef={successRef} onReset={reset} />
              ) : (
                <form onSubmit={submit} noValidate className="space-y-4">
                  {/* Honeypot — botlar to'ldiradi, odam ko'rmaydi */}
                  <div aria-hidden="true" className="hidden">
                    <label htmlFor="contact-ref">Ma&apos;lumotnoma</label>
                    <input
                      id="contact-ref" name="contact_ref" type="text" tabIndex={-1}
                      autoComplete="off"
                      value={trap} onChange={(e) => setTrap(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Ism */}
                    <Field label="Ism va familiya" htmlFor="contact-name" required
                      error={showNameErr ? "Ism va familiyangizni kiriting" : ""}>
                      <input
                        ref={nameRef}
                        id="contact-name" name="name" type="text" autoComplete="name"
                        maxLength={100}
                        required aria-required="true"
                        value={name} onChange={(e) => setName(e.target.value)}
                        placeholder="Alisher Karimov"
                        disabled={status === "sending"}
                        aria-invalid={showNameErr}
                        aria-describedby={showNameErr ? "contact-name-err" : undefined}
                        className={showNameErr ? inputBad : inputOk}
                      />
                    </Field>

                    {/* Telefon */}
                    <Field label="Telefon raqam" htmlFor="contact-phone" required
                      error={showPhoneErr ? "To'liq 9 ta raqam kiriting" : ""}>
                      <div className={`flex items-center overflow-hidden rounded-xl border bg-white transition-colors focus-within:ring-4 ${
                        showPhoneErr
                          ? "border-red-400 focus-within:border-red-500 focus-within:ring-red-500/15"
                          : "border-slate-300 focus-within:border-blue-600 focus-within:ring-blue-600/15"
                      }`}>
                        <span className="flex shrink-0 items-center gap-1.5 border-r border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-600">
                          <span aria-hidden="true">🇺🇿</span>+998
                        </span>
                        <input
                          ref={phoneRef}
                          id="contact-phone" name="phone" type="tel" inputMode="numeric"
                          autoComplete="tel-national"
                          required aria-required="true"
                          value={toDisplayPhone(digits)}
                          onChange={onPhoneChange}
                          onKeyDown={onPhoneKeyDown}
                          placeholder="90 123 45 67"
                          disabled={status === "sending"}
                          aria-invalid={showPhoneErr}
                          aria-describedby={showPhoneErr ? "contact-phone-err" : undefined}
                          className="w-full bg-transparent px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-500 disabled:text-slate-500"
                        />
                      </div>
                    </Field>
                  </div>

                  {/* Telegram — ixtiyoriy */}
                  <Field label="Telegram username" htmlFor="contact-tg" hint="ixtiyoriy">
                    <div className="flex items-center overflow-hidden rounded-xl border border-slate-300 bg-white transition-colors focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-600/15">
                      <span className="shrink-0 border-r border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-600">@</span>
                      <input
                        id="contact-tg" name="telegram" type="text" autoComplete="off"
                        maxLength={64}
                        value={telegram}
                        onChange={(e) => setTelegram(e.target.value.replace(/^@+/, ""))}
                        placeholder="username"
                        disabled={status === "sending"}
                        className="w-full bg-transparent px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-500 disabled:text-slate-500"
                      />
                    </div>
                  </Field>

                  {/* Maqsad — ixtiyoriy. `radiogroup` semantikasi: bu bittasini
                      tanlash, mustaqil kalitlar to'plami emas. */}
                  <fieldset disabled={status === "sending"}>
                    <legend className="mb-1.5 block text-sm font-medium text-slate-700">
                      Ariza maqsadi{" "}
                      <span className="font-normal text-slate-500">— ixtiyoriy</span>
                    </legend>
                    <div role="radiogroup" aria-label="Ariza maqsadi" className="flex flex-wrap gap-2">
                      {TOPICS.map((t) => {
                        const active = topic === t.value;
                        return (
                          <button
                            key={t.value}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => setTopic(active ? "" : t.value)}
                            className={`rounded-xl border px-3 py-1.5 text-[13px] font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                              active
                                ? "border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                                : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                            }`}
                          >
                            {t.label}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  {/* Izoh — ixtiyoriy */}
                  <Field label="Qo'shimcha izoh" htmlFor="contact-message" hint="ixtiyoriy">
                    <textarea
                      id="contact-message" name="message" rows={3} maxLength={1000}
                      value={message} onChange={(e) => setMessage(e.target.value)}
                      placeholder="Markazingiz haqida qisqacha: nechta o'quvchi, qaysi yo'nalishlar, hozir nimadan foydalanasiz..."
                      disabled={status === "sending"}
                      className={`${inputOk} min-h-[76px] resize-y`}
                    />
                  </Field>

                  {/* Xatolar — `aria-live` bilan: ekran o'quvchi ularni
                      forma qayta chizilgan zahoti o'qiydi. */}
                  <div aria-live="assertive">
                    {error && (
                      <div
                        role="alert"
                        className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3"
                      >
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
                        <p className="text-[13px] font-medium text-red-700">{error}</p>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={status === "sending"}
                    // Yuborilayotganda ham KO'K qoladi: `bg-slate-300` da oq
                    // matn 1.48:1 kontrast berardi, ya'ni o'qib bo'lmasdi.
                    className="group inline-flex w-full items-center justify-center gap-2.5 rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-700/25 transition-all hover:bg-blue-500 hover:shadow-blue-600/35 active:scale-[0.99] disabled:cursor-wait disabled:opacity-80"
                  >
                    {status === "sending" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        Yuborilmoqda...
                      </>
                    ) : (
                      <>
                        Arizani yuborish
                        <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                      </>
                    )}
                  </button>

                  <p className="text-center text-xs leading-relaxed text-slate-500">
                    Yuborish orqali siz bilan bog&apos;lanishimizga rozilik bildirasiz.
                    Ma&apos;lumotlaringiz uchinchi shaxslarga berilmaydi.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  label, htmlFor, required, hint, error, children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {/* Yulduzcha `aria-hidden` emas: "majburiy" ma'nosi faqat ko'z bilan
            ko'radiganlarga qolmasin. Inputda `aria-required` ham bor. */}
        {required && <span className="ml-0.5 text-red-600"> *</span>}
        {hint && <span className="ml-1 font-normal text-slate-500">— {hint}</span>}
      </label>
      {children}
      {error && (
        <p id={`${htmlFor}-err`} className="mt-1.5 text-xs font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

function SuccessPanel({
  panelRef, onReset,
}: {
  panelRef: React.RefObject<HTMLDivElement | null>;
  onReset: () => void;
}) {
  return (
    <div
      ref={panelRef}
      // `tabIndex={-1}` — dasturiy fokus uchun (Tab tartibiga kirmaydi).
      // `role="status"` + `aria-live` xabarni ekran o'quvchiga o'qitadi.
      tabIndex={-1}
      role="status"
      aria-live="polite"
      className="py-8 text-center outline-none"
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
        <Check className="h-7 w-7 text-emerald-700" aria-hidden="true" />
      </div>
      <h3 className="mt-5 text-lg font-bold text-slate-900">Arizangiz qabul qilindi</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-600">
        Rahmat! Menejerimiz ish vaqtida siz bilan bog&apos;lanadi. Shoshilinch
        savol bo&apos;lsa — Telegram orqali darhol yozishingiz mumkin.
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
          onClick={onReset}
          className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 sm:w-auto"
        >
          Yana ariza yuborish
        </button>
      </div>
    </div>
  );
}
