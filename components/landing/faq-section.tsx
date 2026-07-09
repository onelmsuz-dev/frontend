"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { faqItems } from "./faq-data";

function FaqItem({
  item,
  index,
}: {
  item: (typeof faqItems)[number];
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const id = `faq-btn-${index}`;
  const panelId = `faq-panel-${index}`;

  return (
    <div
      className={`border-b border-slate-100 last:border-0 transition-colors ${
        open ? "bg-slate-50/60" : ""
      }`}
      itemScope
      itemProp="mainEntity"
      itemType="https://schema.org/Question"
    >
      <button
        id={id}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
        className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
      >
        <span
          className="text-sm font-semibold text-slate-900 leading-snug sm:text-base"
          itemProp="name"
        >
          {item.question}
        </span>
        <span
          className={`mt-0.5 shrink-0 flex h-5 w-5 items-center justify-center rounded-full transition-colors ${
            open ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
          }`}
          aria-hidden="true"
        >
          {open ? (
            <Minus className="h-3 w-3" />
          ) : (
            <Plus className="h-3 w-3" />
          )}
        </span>
      </button>

      <div
        id={panelId}
        role="region"
        aria-labelledby={id}
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          open ? "max-h-96" : "max-h-0"
        }`}
        itemScope
        itemProp="acceptedAnswer"
        itemType="https://schema.org/Answer"
      >
        <p
          className="px-5 pb-5 text-sm leading-relaxed text-slate-600 sm:px-6 sm:pb-6"
          itemProp="text"
        >
          {item.answer}
        </p>
      </div>
    </div>
  );
}

export function FaqSection() {
  return (
    <section
      id="faq"
      className="py-16 sm:py-20 lg:py-28 bg-white"
      aria-labelledby="faq-heading"
      itemScope
      itemType="https://schema.org/FAQPage"
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
          <div className="lg:col-span-3 rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
            {faqItems.map((item, i) => (
              <FaqItem key={i} item={item} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
