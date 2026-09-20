"use client";

import { useId, useState } from "react";
import { Plus } from "lucide-react";

type FaqItem = {
  question: string;
  answer: string;
};

function HomeFaqItem({ item, index, open, onToggle }: { item: FaqItem; index: number; open: boolean; onToggle: () => void }) {
  const uid = useId();
  const buttonId = `${uid}-button-${index}`;
  const panelId = `${uid}-panel-${index}`;

  return (
    <div className="border-b border-slate-200">
      <button
        id={buttonId}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="group flex w-full items-center justify-between gap-5 py-5 text-left outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-4 sm:py-7"
      >
        <span className="text-[1.05rem] font-bold leading-snug tracking-[-0.02em] text-slate-900 sm:text-2xl">
          {item.question}
        </span>
        <span
          aria-hidden
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
        aria-labelledby={buttonId}
        className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <p
            className={`max-w-3xl pb-6 pr-12 text-[15px] leading-[1.7] text-slate-600 transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none sm:pb-7 sm:pr-16 sm:text-lg ${
              open ? "translate-y-0 opacity-100 delay-100" : "-translate-y-1 opacity-0"
            }`}
          >
            {item.answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export function HomeFaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="border-t border-slate-200">
      {items.map((item, index) => (
        <HomeFaqItem
          key={item.question}
          item={item}
          index={index}
          open={openIndex === index}
          onToggle={() => setOpenIndex((current) => current === index ? null : index)}
        />
      ))}
    </div>
  );
}
