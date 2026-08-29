"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft, ArrowRight, Check, Clock3, Loader2, AlertCircle,
  ShieldCheck, Headphones, Sparkles, User, Phone, Building2, MessageSquare,
} from "lucide-react";
import { ADS_QUESTIONS } from "@/lib/ads-questions";

/**
 * SO'ROVNOMA OQIMI: intro → savollar → kontakt → rahmat.
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
const LETTERS = ["A", "B", "C", "D", "E", "F", "G"];

export function AdsFunnel() {
  // Intro ATAYLAB alohida holat, `step = -1` emas: manfiy qiymat qadam
  // raqami va progress hisobini chalkashtirardi ("0-qadam / 6").
  const [started, setStarted] = useState(false);
  const [step,    setStep]    = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [name,    setName]    = useState("");
  const [center,  setCenter]  = useState("");
  const [message, setMessage] = useState("");
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

  function back() {
    setErr(null);
    if (step === 0) setStarted(false);
    else setStep(s => s - 1);
  }

  /**
   * Klaviatura: 1–4 raqamlari variantni tanlaydi.
   *
   * Faqat SAVOL qadamida ulanadi — kontakt qadamida raqam terilayotganda
   * forma o'zi sakrab ketardi.
   */
  useEffect(() => {
    if (!started || !question) return;
    function onKey(e: KeyboardEvent) {
      const i = Number(e.key) - 1;
      if (Number.isInteger(i) && i >= 0 && i < question!.options.length) {
        choose(question!.options[i].value);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started, question]); // eslint-disable-line react-hooks/exhaustive-deps

  /** "901234567" → "90 123 45 67" — kiritishda o'qish osonlashadi. */
  function formatPhone(raw: string) {
    const d = raw.replace(/\D/g, "").slice(0, 9);
    return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    // Brauzerda ham tekshiramiz: backendning rate-limiti validatsiyadan
    // OLDIN ishlaydi, ya'ni xato to'ldirilgan urinish ham chegaraga sanaladi.
    if (name.trim().length < 2)                return setErr("Ismingizni kiriting");
    if (phone.replace(/\D/g, "").length !== 9) return setErr("Telefon raqamni to'liq kiriting");

    setSending(true);
    try {
      const res = await fetch("/api/ads-lead", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:  name.trim(),
          ...(center.trim() ? { center: center.trim() } : {}),
          ...(message.trim() ? { message: message.trim() } : {}),
          phone: "+998" + phone.replace(/\D/g, ""),
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

  // ── Rahmat ──────────────────────────────────────────────────────────────
  if (done) {
    return (
      <Shell aside={<AsideIntro />}>
        <Card>
          <div className="py-4 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 ring-8 ring-green-50/60">
              <Check className="h-8 w-8 text-green-600" strokeWidth={2.5} />
            </div>
            <h1 className="text-[22px] leading-tight font-bold text-balance text-slate-900 sm:text-[26px]">
              Rahmat! Arizangiz qabul qilindi
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-pretty text-slate-500">
              Mutaxassisimiz ish kuni davomida siz bilan bog&apos;lanadi va
              markazingizga mos yechimni ko&apos;rsatib beradi.
            </p>
            <a
              href="https://t.me/oneroomuz"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-7 text-[14px] font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-blue-600/35 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              Telegram kanalimizga o&apos;tish <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </Card>
      </Shell>
    );
  }

  // ── Intro ───────────────────────────────────────────────────────────────
  //
  // Reklamadan kelgan odam "nega men bu savollarga javob berishim kerak?"
  // degan savolga javob olmasa, birinchi savoldayoq chiqib ketadi.
  if (!started) {
    return (
      <Shell aside={<AsideIntro />}>
        <Card>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold tracking-wide text-blue-700 uppercase">
            <Sparkles className="h-3 w-3" />{" "}O&apos;quv markazlari uchun
          </span>

          <h1 className="mt-4 text-[26px] leading-[1.15] font-bold tracking-tight text-balance text-slate-900 sm:text-[32px]">
            O&apos;quv markazingiz uchun CRM tizim
          </h1>

          <p className="mt-4 text-[15px] leading-relaxed text-pretty text-slate-600">
            Biz o&apos;quv markazlariga tizim o&apos;rnatib beramiz — davomat,
            to&apos;lovlar, qarzdorlik va hisobotlar bir joyda.
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-pretty text-slate-600">
            {/* Savollar soni katalogdan: 6-savol yoqilsa matn o'zi yangilanadi. */}
            Markazingizga mosini tanlash uchun {ADS_QUESTIONS.length} ta qisqa
            savol beramiz.
          </p>

          <button
            onClick={() => setStarted(true)}
            className="group mt-7 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-[15px] font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.99]"
          >
            Boshladik
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
          </button>

          <p className="mt-3.5 flex items-center justify-center gap-1.5 text-[12px] text-slate-400">
            <Clock3 className="h-3.5 w-3.5" /> ~1 daqiqa vaqtingizni oladi
          </p>

          {/* Mobilda yon ustun ko'rinmaydi — ishonch belgilarini shu yerga qo'yamiz */}
          <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 border-t border-slate-100 pt-5 lg:hidden">
            {TRUST.map(t => (
              <span key={t.label} className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-500">
                <t.icon className="h-3.5 w-3.5 text-blue-500" /> {t.label}
              </span>
            ))}
          </div>
        </Card>
      </Shell>
    );
  }

  // ── Savol va kontakt qadamlari ──────────────────────────────────────────
  return (
    <Shell aside={<AsideProgress step={step} />}>
      {/* Mobil progress — yon ustun ko'rinmaganda */}
      <div className="mb-4 lg:hidden">
        <div className="mb-2 flex items-center justify-between text-[12px] font-medium text-slate-500">
          <span>{step + 1}-qadam / {TOTAL_STEPS}</span>
          {/* Foiz faqat harakat boshlangach: birinchi ekrandagi "0%" odamga
              "hali hech narsa qilmadim" degan taassurot beradi. */}
          {progress > 0 && <span className="tabular-nums">{progress}%</span>}
        </div>
        <ProgressBar value={progress} />
      </div>

      <Card>
        <button
          onClick={back}
          className="-ml-1 mb-4 inline-flex items-center gap-1.5 rounded-lg px-1 py-0.5 text-[13px] font-medium text-slate-400 transition-colors hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Orqaga
        </button>

        {/*
          `key` qadam bilan almashadi — React elementni qaytadan yaratadi va
          kirish animatsiyasi har qadamda ishlaydi. Balandlik `min-h` bilan
          ushlab turiladi: aks holda 4 variantli savoldan kontakt formasiga
          o'tishda karta sakrab, tugma sichqoncha ostidan siljib ketardi.
        */}
        <div
          key={step}
          className="min-h-[336px] animate-in fade-in slide-in-from-right-3 duration-300 sm:min-h-[368px] motion-reduce:animate-none [@media(max-height:720px)]:min-h-0"
        >
          {/* ── Savol ── */}
          {question && (
            <>
              <p className="text-[11px] font-bold tracking-widest text-blue-600 uppercase tabular-nums">
                {String(step + 1).padStart(2, "0")} / {String(TOTAL_STEPS).padStart(2, "0")}
              </p>
              <h1 className="mt-2 text-[20px] leading-snug font-bold text-balance text-slate-900 sm:text-[23px]">
                {question.title}
              </h1>
              {question.hint && (
                <p className="mt-2 text-[13px] text-pretty text-slate-500">{question.hint}</p>
              )}

              <div className="mt-5 space-y-2.5">
                {question.options.map((o, i) => {
                  const selected = answers[question.id] === o.value;
                  return (
                    <button
                      key={o.value}
                      onClick={() => choose(o.value)}
                      className={`group flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3.5 text-left transition-all focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.99] ${
                        selected
                          ? "border-blue-600 bg-blue-50/70 shadow-sm shadow-blue-600/10"
                          : "border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/40 hover:shadow-sm"
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[12px] font-bold transition-colors ${
                          selected
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-700"
                        }`}
                      >
                        {selected ? <Check className="h-4 w-4" strokeWidth={3} /> : LETTERS[i]}
                      </span>

                      <span className={`flex-1 text-[14px] leading-snug font-medium text-pretty ${
                        selected ? "text-blue-900" : "text-slate-700"
                      }`}>
                        {o.label}
                      </span>

                      <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100 motion-reduce:transition-none" />
                    </button>
                  );
                })}
              </div>

              {/* Klaviatura maslahati — sensorli ekranda ma'nosiz, shuning uchun
                  faqat kattaroq ekranlarda ko'rsatiladi. */}
              <p className="mt-4 hidden text-center text-[11px] text-slate-400 sm:block">
                Klaviaturadagi{" "}
                <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-sans text-[10px] font-semibold text-slate-500">1</kbd>
                –
                <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-sans text-[10px] font-semibold text-slate-500">
                  {question.options.length}
                </kbd>{" "}
                bilan ham tanlash mumkin
              </p>
            </>
          )}

          {/* ── Kontakt ── */}
          {isContactStep && (
            <form onSubmit={submit} noValidate>
              <p className="text-[11px] font-bold tracking-widest text-blue-600 uppercase tabular-nums">
                {String(TOTAL_STEPS).padStart(2, "0")} / {String(TOTAL_STEPS).padStart(2, "0")} — oxirgi qadam
              </p>
              <h1 className="mt-2 text-[20px] leading-snug font-bold text-balance text-slate-900 sm:text-[23px]">
                Siz bilan qanday bog&apos;lanaylik?
              </h1>
              <p className="mt-2 text-[13px] leading-relaxed text-pretty text-slate-500 [@media(max-height:720px)]:hidden">
                Mutaxassisimiz qo&apos;ng&apos;iroq qilib, markazingizga mos
                yechimni ko&apos;rsatadi.
              </p>

              <div className="mt-5 space-y-3.5 [@media(max-height:720px)]:mt-3 [@media(max-height:720px)]:space-y-2.5">
                <Field label="Ismingiz" required>
                  <div className="relative">
                    <User className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-300" />
                    <input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      autoComplete="given-name"
                      placeholder="Aziz"
                      className={`${INPUT} pl-10`}
                    />
                  </div>
                </Field>

                {/* Markaz nomi majburiy EMAS: reklama formasida har bir
                    majburiy maydon konversiyani pasaytiradi. To'ldirilsa
                    sotuvchi qo'ng'iroqdan oldin markazni topib oladi. */}
                <Field label="Markaz nomi" optional>
                  <div className="relative">
                    <Building2 className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-300" />
                    <input
                      value={center}
                      onChange={e => setCenter(e.target.value)}
                      autoComplete="organization"
                      placeholder="Bilim Ziyo o'quv markazi"
                      className={`${INPUT} pl-10`}
                    />
                  </div>
                </Field>

                <Field label="Telefon raqamingiz" required>
                  <div className="flex items-stretch gap-2">
                    <span className="flex shrink-0 items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-[16px] font-semibold text-slate-600 sm:text-[14px]">
                      <Phone className="h-3.5 w-3.5 text-slate-400" /> +998
                    </span>
                    <input
                      value={phone}
                      onChange={e => setPhone(formatPhone(e.target.value))}
                      inputMode="numeric"
                      autoComplete="tel-national"
                      placeholder="90 123 45 67"
                      className={`${INPUT} tabular-nums`}
                    />
                  </div>
                </Field>

                {/* Izoh eng oxirida: majburiy maydonlar birinchi ko'rinsin,
                    ixtiyoriysi ularni pastga surib yubormasin. */}
                <Field label="Izoh" optional>
                  <div className="relative">
                    <MessageSquare className="pointer-events-none absolute top-3.5 left-3.5 h-4 w-4 text-slate-300" />
                    <textarea
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      maxLength={1000}
                      placeholder="Qo'shimcha savol yoki ma'lumot..."
                      className={`${TEXTAREA} pl-10`}
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
                <div
                  role="alert"
                  className="mt-4 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-3.5 py-3 animate-in fade-in slide-in-from-top-1 duration-200 motion-reduce:animate-none"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                  <p className="text-[13px] font-medium text-red-600">{err}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={sending}
                className="mt-5 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-[15px] font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
              >
                {sending && <Loader2 className="h-4 w-4 animate-spin" />}
                {sending ? "Yuborilmoqda..." : "Arizani yuborish"}
              </button>

              <p className="mt-3.5 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                Ma&apos;lumotlaringiz uchinchi shaxslarga berilmaydi
              </p>
            </form>
          )}
        </div>
      </Card>
    </Shell>
  );
}

// ── Qayta ishlatiladigan bo'laklar ────────────────────────────────────────

/**
 * DIQQAT: mobilda shrift 16px — 14px EMAS.
 *
 * iOS Safari fokusdagi maydon shrifti 16px dan kichik bo'lsa sahifani
 * avtomatik kattalashtiradi (zoom) va odam matn yozgach sahifa qiyshaygan
 * holda qoladi. `maximum-scale=1` bilan zoomni o'chirish — noto'g'ri
 * yechim: u ko'zi ojiz foydalanuvchiga sahifani kattalashtirish imkonini
 * ham yopadi. Shu sabab kichik ekranda 16px, `sm` dan boshlab dizayndagi
 * 14px.
 */
const FIELD_BASE =
  "w-full rounded-2xl border border-slate-200 bg-white px-3.5 text-[16px] text-slate-900 sm:text-[14px] " +
  "outline-none transition-colors placeholder:text-slate-300 " +
  "focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

const INPUT = `${FIELD_BASE} h-12 [@media(max-height:720px)]:h-11`;

/**
 * Izoh maydoni past ekranda bir qatorga qisqaradi.
 *
 * Sababi: u qo'shilgach 1280x620 va iPhone SE da "Arizani yuborish" tugmasi
 * ekrandan chiqib ketdi. Balandlik `rows` bilan emas, CSS bilan boshqariladi
 * — `rows` media so'rovga bo'ysunmaydi.
 */
const TEXTAREA = `${FIELD_BASE} h-[76px] resize-none py-3 [@media(max-height:720px)]:h-11 [@media(max-height:720px)]:py-2.5`;

const TRUST = [
  { icon: ShieldCheck, label: "Ma'lumotlar xavfsiz" },
  { icon: Headphones,  label: "O'zbek tilida yordam" },
  { icon: Sparkles,    label: "7 kun bepul sinov" },
];

function Field({ label, required, optional, children }: {
  label: string; required?: boolean; optional?: boolean; children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
        {label}
        {required && <span className="text-red-500">*</span>}
        {optional && <span className="font-medium normal-case text-slate-300">ixtiyoriy</span>}
      </span>
      {children}
    </label>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
      <div
        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out motion-reduce:transition-none"
        // Boshlanishida ham ko'rinib tursin — nol kenglikdagi chiziq
        // "progress ishlamayapti" degan taassurot beradi.
        style={{ width: `${Math.max(value, 4)}%` }}
      />
    </div>
  );
}

/** Yon ustun: intro va rahmat ekranlarida — qiymat taklifi. */
function AsideIntro() {
  return (
    <div className="max-w-sm">
      <h2 className="text-[28px] leading-[1.15] font-bold tracking-tight text-balance text-slate-900">
        Markazingizni bitta tizimdan boshqaring
      </h2>
      <p className="mt-4 text-[15px] leading-relaxed text-pretty text-slate-500">
        Davomat, to&apos;lovlar, qarzdorlik, oyliklar va hisobotlar — hammasi
        bir joyda, o&apos;zbek tilida.
      </p>
      <ul className="mt-7 space-y-3.5">
        {TRUST.map(t => (
          <li key={t.label} className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200/70">
              <t.icon className="h-4 w-4 text-blue-600" />
            </span>
            <span className="text-[14px] font-medium text-slate-600">{t.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Yon ustun: savol qadamlarida — qadamlar ro'yxati. */
function AsideProgress({ step }: { step: number }) {
  const items = [...ADS_QUESTIONS.map(q => q.title), "Bog'lanish uchun ma'lumot"];
  return (
    <div className="max-w-sm">
      <h2 className="text-[22px] leading-tight font-bold tracking-tight text-balance text-slate-900">
        Markazingizni tushunib olamiz
      </h2>
      <p className="mt-2.5 text-[14px] leading-relaxed text-pretty text-slate-500">
        Javoblaringizga qarab sizga mos yechimni tayyorlaymiz.
      </p>

      <ol className="mt-7 space-y-3">
        {items.map((title, i) => {
          const state = i < step ? "done" : i === step ? "active" : "next";
          return (
            <li key={title} className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold transition-colors ${
                  state === "done"   ? "bg-blue-600 text-white"
                  : state === "active" ? "bg-blue-100 text-blue-700 ring-2 ring-blue-600"
                  : "bg-white text-slate-400 ring-1 ring-slate-200"
                }`}
              >
                {state === "done" ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
              </span>
              <span
                className={`text-[13px] leading-snug text-pretty transition-colors ${
                  state === "active" ? "font-semibold text-slate-900"
                  : state === "done" ? "text-slate-400"
                  : "text-slate-400"
                }`}
              >
                {title}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xl shadow-slate-300/25 sm:p-7 [@media(max-height:720px)]:p-4">
      {children}
    </div>
  );
}

/**
 * Sahifa karkasi.
 *
 * Katta ekranda ikki ustun: chapda qiymat taklifi va qadamlar, o'ngda
 * karta. Bitta ustun qoldirilsa keng monitorda sahifa bo'm-bo'sh ko'rinardi.
 * `lg` dan pastda yon ustun butunlay olib tashlanadi — mobil ekranda u
 * kartani pastga surib, birinchi ekranda tugma ko'rinmay qolardi.
 *
 * `min-h-dvh` (`vh` emas): mobil brauzerlarda manzil paneli hisobga olinadi.
 */
function Shell({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-slate-50">
      {/* Fon urg'ulari — pastda, kontentga xalaqit bermaydi */}
      <div aria-hidden className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-blue-200/35 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-indigo-200/30 blur-3xl" />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-10 [@media(max-height:720px)]:py-4">
        {/* Brend */}
        <div className="mb-6 flex items-center justify-center gap-2.5 lg:mb-10 lg:justify-start [@media(max-height:720px)]:mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/25">
            <span className="text-[15px] font-black text-white">O</span>
          </div>
          <div className="leading-none">
            <p className="text-[16px] font-bold text-slate-900">OneRoom</p>
            <p className="mt-1 text-[11px] text-slate-400 [@media(max-height:720px)]:hidden">Smart O&apos;quv Markaz Tizimi</p>
          </div>
        </div>

        {/*
          Kontent markazdan yuqoriroqda turadi: bo'sh joy tepa va past
          orasida 1:2 nisbatda taqsimlanadi, ya'ni blok balandlikning
          uchdan bir qismida joylashadi.

          Nega sobit `pb-[26vh]` EMAS: past ekranda (masalan 1280×620 yoki
          iPhone SE) u kontakt formasini pastga surib, "Arizani yuborish"
          tugmasi ekrandan chiqib ketardi — eng muhim qadamda skroll talab
          qilinardi. Bo'sh ajratgichlar esa joy qolmasa O'ZI YIG'ILADI
          (`basis-0` + `grow`), ya'ni tor ekranda kontent hech narsa
          yo'qotmaydi.
        */}
        <div aria-hidden className="grow basis-0" />

        <div className="grid items-center gap-10 lg:grid-cols-[1fr_minmax(0,460px)] lg:gap-14">
          {aside && <div className="hidden lg:block">{aside}</div>}
          <div className="w-full">{children}</div>
        </div>

        <div aria-hidden className="grow-[2] basis-0" />
      </div>
    </div>
  );
}
