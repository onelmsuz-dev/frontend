"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

export interface FaqEntry {
  question: string;
  answer: string;
}

function FaqItem({ item, index }: { item: FaqEntry; index: number }) {
  const [open, setOpen] = useState(false);
  const id = `faq-btn-${index}`;
  const panelId = `faq-panel-${index}`;

  return (
    <div
      className={`border-b border-slate-100 last:border-0 transition-colors ${open ? "bg-slate-50/60" : ""}`}
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
        <span className="text-sm font-semibold text-slate-900 leading-snug sm:text-base" itemProp="name">
          {item.question}
        </span>
        <span
          className={`mt-0.5 shrink-0 flex h-5 w-5 items-center justify-center rounded-full transition-colors ${
            open ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
          }`}
          aria-hidden="true"
        >
          {open ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
        </span>
      </button>

      <div
        id={panelId}
        role="region"
        aria-labelledby={id}
        className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? "max-h-96" : "max-h-0"}`}
        itemScope
        itemProp="acceptedAnswer"
        itemType="https://schema.org/Answer"
      >
        <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600 sm:px-6 sm:pb-6" itemProp="text">
          {item.answer}
        </p>
      </div>
    </div>
  );
}

/** Faqat akkordion — bosh sahifadagi FAQ bo'limi va cluster sahifalar bo'lishadi. */
export function FaqAccordion({ items }: { items: FaqEntry[] }) {
  return (
    <div
      className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden"
      itemScope
      itemType="https://schema.org/FAQPage"
    >
      {items.map((item, i) => (
        <FaqItem key={i} item={item} index={i} />
      ))}
    </div>
  );
}
