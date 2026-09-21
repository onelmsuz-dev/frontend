"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

export interface FaqEntry {
  question: string;
  answer: string;
}

/**
 * Klaster sahifalar FAQ'i — bosh sahifadagi FAQ bilan bir xil ko'rinish (`home-faq-accordion.tsx`).
 * SEO: schema.org mikrodata (FAQPage/Question/Answer) saqlangan; javob matni yopiq holatda ham
 * DOM'da turadi (faqat balandligi 0), shuning uchun qidiruv botlari uni o'qiydi.
 */
function FaqItem({ item, index }: { item: FaqEntry; index: number }) {
  const [open, setOpen] = useState(false);
  const id = `faq-btn-${index}`;
  const panelId = `faq-panel-${index}`;

  return (
    <div
      className="border-b border-slate-200"
      itemScope
      itemProp="mainEntity"
      itemType="https://schema.org/Question"
    >
      <button
        id={id}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
        className="group flex w-full items-center justify-between gap-5 py-5 text-left outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-4 sm:py-7"
      >
        <span className="text-[1.05rem] font-bold leading-snug tracking-[-0.02em] text-slate-900 sm:text-2xl" itemProp="name">
          {item.question}
        </span>
        <span
          aria-hidden="true"
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-[color,background-color,border-color] duration-300 ${
            open
              ? "border-blue-600 bg-blue-600 text-white"
              : "border-slate-200 bg-white text-slate-500 group-hover:border-blue-200 group-hover:text-blue-600"
          }`}
        >
          <Plus className={`h-4 w-4 transition-transform duration-300 ease-out motion-reduce:transition-none ${open ? "rotate-45" : "rotate-0"}`} />
        </span>
      </button>

      <div
        id={panelId}
        role="region"
        aria-labelledby={id}
        className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
        itemScope
        itemProp="acceptedAnswer"
        itemType="https://schema.org/Answer"
      >
        <div className="min-h-0 overflow-hidden">
          <p
            className={`max-w-3xl pb-6 pr-12 text-[15px] leading-[1.7] text-slate-600 transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none sm:pb-7 sm:pr-16 sm:text-lg ${
              open ? "translate-y-0 opacity-100 delay-100" : "-translate-y-1 opacity-0"
            }`}
            itemProp="text"
          >
            {item.answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export function FaqAccordion({ items }: { items: FaqEntry[] }) {
  return (
    <div className="border-t border-slate-200" itemScope itemType="https://schema.org/FAQPage">
      {items.map((item, i) => (
        <FaqItem key={i} item={item} index={i} />
      ))}
    </div>
  );
}
