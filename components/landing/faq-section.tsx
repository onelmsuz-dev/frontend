import { faqItems } from "./faq-data";
import { FaqAccordion } from "./faq-accordion";

export function FaqSection() {
  return (
    <section
      id="faq"
      className="py-16 sm:py-20 lg:py-28 bg-white"
      aria-labelledby="faq-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-5 lg:gap-16">
          {/* Left: sticky header */}
          <div className="lg:col-span-2 lg:sticky lg:top-24 lg:self-start">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 mb-3">
              Ko'p so'raladigan savollar
            </p>
            <h2
              id="faq-heading"
              className="text-2xl font-extrabold text-slate-900 sm:text-3xl lg:text-4xl"
            >
              Savollaringiz bormi?
            </h2>
            <p className="mt-4 text-sm text-slate-600 sm:text-base leading-relaxed">
              Javob topa olmasangiz, bizga yozing — 24 soat ichida javob beramiz.
            </p>
            <a
              href="mailto:support@oneroom.uz"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
            >
              support@oneroom.uz
            </a>

            {/* Trust indicators */}
            <div className="mt-6 hidden lg:block space-y-2.5">
              {[
                "O'zbek tilida yordam",
                "Ish kunlari 09:00–22:00",
                "Telegram orqali ham murojaat",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Right: accordion */}
          <div className="lg:col-span-3">
            <FaqAccordion items={faqItems} />
          </div>
        </div>
      </div>
    </section>
  );
}
