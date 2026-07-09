import Link from "next/link";
import { ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Ro'yxatdan o'ting",
    description:
      "Bepul hisobingizni 2 daqiqada yarating. Karta kerak emas. O'quv markaz nomi va subdomeningizni tanlang.",
    badge: "2 daqiqada tayyor",
  },
  {
    number: "02",
    title: "Markazingizni sozlang",
    description:
      "Kurslar, xonalar va to'lov shartlarini kiriting. O'qituvchilar uchun akkaunt yarating. Tayyor shablonlar mavjud.",
    badge: "Tayyor shablonlar",
  },
  {
    number: "03",
    title: "O'quvchilarni qo'shing",
    description:
      "O'quvchilarni qo'lda yoki Excel fayldan import qiling. Guruhga biriktiring. Ota-onalarga Telegram bot ulang.",
    badge: "Excel import",
  },
  {
    number: "04",
    title: "Boshqarishni boshlang",
    description:
      "Davomot belgilang, to'lovlarni kuzating, hisobotlar oling. Dashboard da hamma narsa real vaqtda.",
    badge: "Real vaqt",
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="py-16 sm:py-20 lg:py-28 bg-slate-50"
      aria-labelledby="how-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center mb-10 sm:mb-12 lg:mb-16">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 mb-3">
            Qanday ishlaydi
          </p>
          <h2
            id="how-heading"
            className="text-2xl font-extrabold text-slate-900 sm:text-3xl lg:text-4xl"
          >
            4 qadamda boshlang
          </h2>
          <p className="mt-4 text-base text-slate-600 sm:text-lg">
            Texnik bilim kerak emas. O'rnatish yo'q. Birinchi darsga qadar tayyor bo'ladi.
          </p>
        </div>

        {/* Steps — mobile: vertical list with connector, desktop: horizontal grid */}
        <div className="relative">
          {/* Desktop connector line */}
          <div
            className="absolute top-7 hidden h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent lg:block"
            style={{ left: "calc(12.5% + 28px)", right: "calc(12.5% + 28px)" }}
            aria-hidden="true"
          />

          <ol className="relative grid gap-0 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4 lg:gap-8" role="list">
            {/* Mobile vertical connector */}
            <div
              className="absolute left-7 top-14 bottom-14 w-px bg-gradient-to-b from-blue-300 via-blue-200 to-transparent sm:hidden"
              aria-hidden="true"
            />

            {steps.map((step, index) => (
              <li
                key={step.number}
                className="relative flex gap-5 pb-10 last:pb-0 sm:flex-col sm:gap-0 sm:pb-0 lg:items-start"
              >
                {/* Step circle */}
                <div
                  className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-md shadow-blue-600/25 sm:mb-5"
                  aria-hidden="true"
                >
                  <span className="text-sm font-bold tabular-nums">{step.number}</span>
                </div>

                {/* Content */}
                <div className="flex-1 sm:mt-0">
                  <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-semibold text-blue-600 mb-2">
                    {step.badge}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 sm:text-[0.9375rem]">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* CTA */}
        <div className="mt-12 sm:mt-14 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 sm:text-base"
          >
            Hoziroq boshlang — bepul
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <p className="mt-3 text-xs text-slate-400 sm:text-sm">
            14 kunlik bepul sinov · Karta kerak emas · Istalgan vaqt bekor qilish mumkin
          </p>
        </div>
      </div>
    </section>
  );
}
