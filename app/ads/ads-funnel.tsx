"use client";

import { useState } from "react";
import { ArrowLeft, Check, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { ADS_QUESTIONS } from "@/lib/ads-questions";

/**
 * SO'ROVNOMA OQIMI.
 *
 * Har ekranda BITTA savol: ro'yxatning uzunligi ko'rinmaydi va odam
 * "hali ko'p ekan" deb tashlab ketmaydi. Variant bosilishi bilan keyingi
 * savolga o'tiladi — alohida "Keyingi" tugmasi bosish sonini ikki barobar
 * oshirardi.
 *
 * Ma'lumot `POST /api/ads-lead` ga (BFF proksi orqali backendga) ketadi va
 * u yerdan Telegram bot orqali adminlarga yuboriladi. Bot tokeni bu yerda
 * YO'Q va bo'lishi ham mumkin emas — brauzerga tushgan kalit ochiq
 * hisoblanadi (DevTools → Network).
 */

type Answers = Record<string, string>;

const TOTAL_STEPS = ADS_QUESTIONS.length + 1; // savollar + kontakt qadami

export function AdsFunnel() {
  const [step,    setStep]    = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [name,    setName]    = useState("");
  const [surname, setSurname] = useState("");
  const [phone,   setPhone]   = useState("");
  const [honey,   setHoney]   = useState("");
  const [sending, setSending] = useState(false);
  const [err,     setErr]     = useState<string | null>(null);
  const [done,    setDone]    = useState(false);

  const isContactStep = step === ADS_QUESTIONS.length;
  const question      = isContactStep ? null : ADS_QUESTIONS[step];
  const progress      = Math.round((step / TOTAL_STEPS) * 100);

  function choose(value: string) {
    if (!question) return;
    setAnswers(a => ({ ...a, [question.id]: value }));
    setStep(s => s + 1);
  }

  /** "901234567" → "90 123 45 67" — kiritishda o'qish osonlashadi. */
  function formatPhone(raw: string) {
    const d = raw.replace(/\D/g, "").slice(0, 9);
    const p = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean);
    return p.join(" ");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    // Brauzerda ham tekshiramiz: backendning rate-limiti validatsiyadan
    // OLDIN ishlaydi, ya'ni xato to'ldirilgan urinish ham chegaraga sanaladi.
    if (name.trim().length < 2)               return setErr("Ismingizni kiriting");
    if (phone.replace(/\D/g, "").length !== 9) return setErr("Telefon raqamni to'liq kiriting");

    setSending(true);
    try {
      const res = await fetch("/api/ads-lead", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:    name.trim(),
          ...(surname.trim() ? { surname: surname.trim() } : {}),
          phone:   "+998" + phone.replace(/\D/g, ""),
          ...answers,
          ...(honey ? { contact_ref: honey } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Yuborishda xatolik. Qayta urinib ko'ring.");
      setDone(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Yuborishda xatolik. Qayta urinib ko'ring.");
    } finally {
      setSending(false);
    }
  }

  // ── Muvaffaqiyat ────────────────────────────────────────────────────────
  if (done) {
    return (
      <Shell>
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/50">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100">
            <Check className="h-7 w-7 text-green-600" />
          </div>
          <h1 className="text-[22px] font-bold text-slate-900">Rahmat! Arizangiz qabul qilindi</h1>
          <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-slate-500">
            Mutaxassisimiz ish kuni davomida siz bilan bog'lanadi va markazingizga
            mos yechimni ko'rsatib beradi.
          </p>
          <a
            href="https://t.me/oneroomuz"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-6 text-[14px] font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Telegram kanalimizga o'tish
          </a>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      {/* Progress */}
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between text-[12px] font-medium text-slate-500">
          <span>{step + 1}-qadam / {TOTAL_STEPS}</span>
          {/* Foiz faqat harakat boshlangach ko'rsatiladi — birinchi ekrandagi
              "0%" odamga "hali hech narsa qilmadim" degan taassurot beradi. */}
          {progress > 0 && <span>{progress}%</span>}
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-300 ease-out"
            style={{ width: `${Math.max(progress, 4)}%` }}
          />
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
        {step > 0 && (
          <button
            onClick={() => { setStep(s => s - 1); setErr(null); }}
            className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-400 transition-colors hover:text-slate-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Orqaga
          </button>
        )}

        {/* ── Savol qadami ── */}
        {question && (
          <>
            <h1 className="text-[19px] leading-snug font-bold text-slate-900 sm:text-[22px]">
              {question.title}
            </h1>
            {question.hint && <p className="mt-1.5 text-[13px] text-slate-500">{question.hint}</p>}

            <div className="mt-5 space-y-2">
              {question.options.map(o => {
                const selected = answers[question.id] === o.value;
                return (
                  <button
                    key={o.value}
                    onClick={() => choose(o.value)}
                    className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left text-[14px] font-medium transition-all ${
                      selected
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-slate-50"
                    }`}
                  >
                    {o.label}
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        selected ? "border-blue-600 bg-blue-600" : "border-slate-300"
                      }`}
                    >
                      {selected && <Check className="h-3 w-3 text-white" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* ── Kontakt qadami ── */}
        {isContactStep && (
          <form onSubmit={submit} noValidate>
            <h1 className="text-[19px] leading-snug font-bold text-slate-900 sm:text-[22px]">
              Siz bilan qanday bog'lanaylik?
            </h1>
            <p className="mt-1.5 text-[13px] text-slate-500">
              Mutaxassisimiz qo'ng'iroq qilib, markazingizga mos yechimni ko'rsatadi.
            </p>

            <div className="mt-5 space-y-3">
              <Field label="Ismingiz" required>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoComplete="given-name"
                  placeholder="Aziz"
                  className={INPUT}
                />
              </Field>

              <Field label="Familiyangiz">
                <input
                  value={surname}
                  onChange={e => setSurname(e.target.value)}
                  autoComplete="family-name"
                  placeholder="Karimov"
                  className={INPUT}
                />
              </Field>

              <Field label="Telefon raqamingiz" required>
                <div className="flex items-center gap-2">
                  <span className="flex h-11 shrink-0 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-[14px] font-semibold text-slate-600">
                    +998
                  </span>
                  <input
                    value={phone}
                    onChange={e => setPhone(formatPhone(e.target.value))}
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder="90 123 45 67"
                    className={INPUT}
                  />
                </div>
              </Field>

              {/*
                HONEYPOT — odamga ko'rinmaydi, botlar esa hamma inputni
                to'ldiradi. Maydon nomi ATAYLAB `contact_ref`: brauzer
                avtoto'ldirishi `website` ni taniydi va to'ldirib qo'ysa,
                HAQIQIY ariza spam deb tashlanardi.
              */}
              <div className="hidden" aria-hidden="true">
                <input
                  tabIndex={-1}
                  autoComplete="off"
                  name="contact_ref"
                  value={honey}
                  onChange={e => setHoney(e.target.value)}
                />
              </div>
            </div>

            {err && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <p className="text-[13px] font-medium text-red-600">{err}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-[15px] font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending && <Loader2 className="h-4 w-4 animate-spin" />}
              {sending ? "Yuborilmoqda..." : "Arizani yuborish"}
            </button>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              Ma'lumotlaringiz uchinchi shaxslarga berilmaydi
            </p>
          </form>
        )}
      </div>
    </Shell>
  );
}

const INPUT =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[14px] text-slate-900 " +
  "outline-none transition-colors placeholder:text-slate-300 focus:border-blue-500";

function Field({ label, required, children }: {
  label: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold tracking-wider text-slate-500 uppercase">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:py-14">
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
              <span className="text-[15px] font-black text-white">O</span>
            </div>
            <span className="text-[17px] font-bold text-slate-900">OneRoom</span>
          </div>
          <p className="mt-1.5 text-[13px] text-slate-500">Smart O&apos;quv Markaz Tizimi</p>
        </div>
        {children}
      </div>
    </div>
  );
}
