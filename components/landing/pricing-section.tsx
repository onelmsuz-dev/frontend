import Link from "next/link";
import { Check, Zap, Phone } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "270,000",
    period: "so'm/oy",
    description: "Kichik o'quv markazlar uchun boshlash uchun ideal",
    limits: [
      "0–200 o'quvchi",
      "1 ta filial",
      "3 tagacha admin",
    ],
    features: [
      "Guruh va darslar boshqaruvi",
      "To'lov va qarzdorlik nazorati",
      "Davomat boshqaruvi",
      "Analytics",
      "Telegram Bot",
      "Server hosting",
      "Ma'lumotlarni zaxiralash",
      "Tizim yangilanishlari",
      "Ish vaqtida texnik yordam",
    ],
    cta: "Bepul sinab ko'ring",
    href: "/login",
    highlight: false,
  },
  {
    name: "Business",
    price: "570,000",
    period: "so'm/oy",
    description: "O'sib borayotgan o'quv markazlar uchun — eng ko'p tanlangan",
    limits: [
      "201–500 o'quvchi",
      "3 tagacha filial",
      "5 tagacha admin",
    ],
    features: [
      "Guruh va darslar boshqaruvi",
      "To'lov va qarzdorlik nazorati",
      "Davomat boshqaruvi",
      "Analytics",
      "Telegram Bot",
      "API integratsiyasi",
      "Server hosting",
      "Ma'lumotlarni zaxiralash",
      "Tizim yangilanishlari",
      "Ustuvor texnik yordam",
    ],
    cta: "7 kun bepul sinab ko'ring",
    href: "/login",
    highlight: true,
    badge: "Eng mashhur",
  },
  {
    name: "Premium",
    price: "870,000",
    period: "so'm/oy",
    description: "Yirik o'quv markaz tarmoqlari uchun to'liq yechim",
    limits: [
      "501–1000 o'quvchi",
      "8 tagacha filial",
      "12 tagacha admin",
    ],
    features: [
      "Guruh va darslar boshqaruvi",
      "To'lov va qarzdorlik nazorati",
      "Davomat boshqaruvi",
      "Analytics",
      "Telegram Bot",
      "API integratsiyasi",
      "Korporativ sayt",
      "Server hosting",
      "Ma'lumotlarni zaxiralash",
      "Tizim yangilanishlari",
      "24/7 texnik yordam",
    ],
    cta: "Bepul sinab ko'ring",
    href: "/login",
    highlight: false,
  },
];

export function PricingSection() {
  return (
    <section
      id="pricing"
      className="py-16 sm:py-20 lg:py-28 bg-slate-50"
      aria-labelledby="pricing-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center mb-10 sm:mb-12 lg:mb-16">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 mb-3">
            Narxlar
          </p>
          <h2
            id="pricing-heading"
            className="text-2xl font-extrabold text-slate-900 sm:text-3xl lg:text-4xl"
          >
            Sizning o'quv markazingizga mos narx
          </h2>
          <p className="mt-4 text-base text-slate-600 sm:text-lg">
            Hamma tarifda 14 kunlik bepul sinov. Karta kerak emas.
            Istalgan vaqt o'zgartirish yoki bekor qilish mumkin.
          </p>
        </div>

        {/* Plans grid */}
        <div className="grid gap-5 lg:grid-cols-3 lg:items-start lg:gap-6">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`relative flex flex-col rounded-2xl transition-shadow ${
                plan.highlight
                  ? "bg-blue-600 shadow-2xl shadow-blue-700/30 ring-1 ring-blue-500 lg:scale-[1.03] lg:-my-2"
                  : "border border-slate-200 bg-white shadow-sm hover:shadow-md"
              }`}
            >
              {/* Popular badge */}
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-[11px] font-bold text-amber-900 shadow-sm whitespace-nowrap">
                    <Zap className="h-3 w-3 fill-current" aria-hidden="true" />
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="flex-1 p-6 sm:p-7">
                {/* Plan name */}
                <h3
                  className={`text-sm font-bold uppercase tracking-wider ${
                    plan.highlight ? "text-blue-200" : "text-slate-500"
                  }`}
                >
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="mt-3 flex items-end gap-1.5">
                  <span
                    className={`text-3xl font-extrabold tabular-nums sm:text-4xl ${
                      plan.highlight ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {plan.price}
                  </span>
                  <span
                    className={`mb-1 text-sm ${
                      plan.highlight ? "text-blue-200" : "text-slate-400"
                    }`}
                  >
                    {plan.period}
                  </span>
                </div>

                <p
                  className={`mt-2 text-sm leading-relaxed ${
                    plan.highlight ? "text-blue-100" : "text-slate-500"
                  }`}
                >
                  {plan.description}
                </p>

                {/* Limits */}
                <div
                  className={`mt-5 rounded-xl p-3.5 ${
                    plan.highlight ? "bg-blue-500/40" : "bg-slate-50"
                  }`}
                >
                  <p
                    className={`mb-2 text-[11px] font-semibold uppercase tracking-wider ${
                      plan.highlight ? "text-blue-200" : "text-slate-400"
                    }`}
                  >
                    Limitlar
                  </p>
                  <ul className="space-y-1" role="list">
                    {plan.limits.map((limit) => (
                      <li
                        key={limit}
                        className={`text-sm font-medium ${
                          plan.highlight ? "text-blue-50" : "text-slate-700"
                        }`}
                      >
                        {limit}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Divider */}
                <div
                  className={`my-5 h-px ${
                    plan.highlight ? "bg-blue-500" : "bg-slate-100"
                  }`}
                />

                {/* Features */}
                <p
                  className={`mb-3 text-[11px] font-semibold uppercase tracking-wider ${
                    plan.highlight ? "text-blue-200" : "text-slate-400"
                  }`}
                >
                  Imkoniyatlar
                </p>
                <ul className="space-y-2" role="list">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5">
                      <Check
                        className={`h-3.5 w-3.5 shrink-0 ${
                          plan.highlight ? "text-blue-200" : "text-emerald-500"
                        }`}
                        aria-hidden="true"
                      />
                      <span
                        className={`text-sm ${
                          plan.highlight ? "text-blue-50" : "text-slate-600"
                        }`}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <div className="p-6 sm:p-7 pt-0">
                <Link
                  href={plan.href}
                  className={`block w-full rounded-xl py-3 text-center text-sm font-semibold transition-colors ${
                    plan.highlight
                      ? "bg-white text-blue-600 hover:bg-blue-50"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* Enterprise / Custom plan */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2.5 mb-2">
                <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white uppercase tracking-wider">
                  Maxsus tarif
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 sm:text-xl">
                1000+ o'quvchi yoki maxsus ehtiyojlar?
              </h3>
              <p className="mt-1.5 text-sm text-slate-500 sm:text-base max-w-xl">
                Cheksiz filiallar, cheksiz admin, API integratsiya, maxsus subdomen dizayni,
                ma'lumotlarni ko'chirish yordami va SLA kafolat. Narx kelishuv asosida belgilanadi.
              </p>
              <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
                {[
                  "Cheksiz o'quvchi",
                  "Cheksiz filial",
                  "Menejer tomonidan onboarding",
                  "24/7 telefon yordam",
                  "99.9% uptime SLA",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-1.5 text-sm text-slate-600">
                    <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="shrink-0">
              <a
                href="mailto:sales@oneroom.uz"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 sm:px-7 sm:py-3.5"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                Sales bilan bog'lanish
              </a>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400 sm:text-sm">
          Barcha narxlarga QQS kiritilmagan · To'lov Payme, Click, Uzum yoki bank o'tkazmasi orqali
        </p>
      </div>
    </section>
  );
}
