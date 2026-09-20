import { Check } from "lucide-react";
import { ApplyButton } from "@/components/landing/apply-dialog";
import { links, plans, pricingCopy } from "./content";
import { DISPLAY } from "./style";

/** Narxlar: uchta tarif kartasi + maxsus tarif bloki. */
export function PricingPlans() {
  return (
    <section id="pricing" className="scroll-mt-16 bg-slate-50 px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-[1200px]">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-600">{pricingCopy.eyebrow}</p>
        <h2 className={`mt-4 max-w-3xl text-balance text-[2.5rem] sm:text-6xl ${DISPLAY} text-slate-900`}>{pricingCopy.title}</h2>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">{pricingCopy.lead}</p>

        <div className="mt-14 grid gap-5 lg:grid-cols-3 lg:items-stretch">
          {plans.map((p) => (
            <article key={p.name} className={`relative flex flex-col rounded-[2rem] border-2 p-8 ${p.highlight ? "border-blue-600 bg-blue-600 text-white shadow-2xl shadow-blue-700/25" : "border-slate-900/10 bg-white"}`}>
              {p.badge && (
                <span className="absolute -top-3.5 right-7 rounded-full rounded-tr-none bg-slate-900 px-3 py-1 text-[11px] font-bold text-white">{p.badge}</span>
              )}
              <h3 className="text-2xl font-bold tracking-[-0.03em]">{p.name}</h3>
              <p className={`mt-1 min-h-[2.75rem] text-[15px] leading-snug ${p.highlight ? "text-blue-50" : "text-slate-500"}`}>{p.description}</p>
              <p className="mt-6">
                <span className="text-[3.25rem] font-bold leading-none tracking-[-0.06em]">{p.price}</span>
                <span className={`mt-1 block text-sm font-semibold ${p.highlight ? "text-blue-50" : "text-slate-500"}`}>{p.period}</span>
              </p>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {p.limits.map((l) => <span key={l} className={`rounded-full px-2.5 py-1 text-xs font-bold ${p.highlight ? "bg-blue-900/30 text-white" : "bg-slate-100 text-slate-700"}`}>{l}</span>)}
              </div>
              <ul className="mt-6 flex-1 space-y-2.5">
                {p.features.map((x) => (
                  <li key={x} className={`flex items-start gap-2.5 text-[15px] ${p.highlight ? "text-blue-50" : "text-slate-600"}`}>
                    <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${p.highlight ? "bg-white text-blue-600" : "bg-blue-600 text-white"}`}><Check className="h-2.5 w-2.5" strokeWidth={3.5} aria-hidden /></span>
                    {x}
                  </li>
                ))}
              </ul>
              <ApplyButton
                where={`Narxlar — ${p.name} tarifi`}
                className={`mt-8 h-12 w-full rounded-full text-base font-bold transition-colors ${p.highlight ? "bg-white text-blue-600 hover:bg-blue-50" : "bg-slate-900 text-white hover:bg-slate-800"}`}
              >
                {p.cta}
              </ApplyButton>
            </article>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-4 rounded-[2rem] border-2 border-slate-900/10 bg-white p-7 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xl font-bold tracking-[-0.03em] text-slate-900">{pricingCopy.customTitle}</p>
            <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-slate-500">{pricingCopy.customBody}</p>
          </div>
          <a href={links.sales} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-full border-2 border-slate-900 px-5 py-2.5 text-sm font-bold text-slate-900 transition-colors hover:bg-slate-900 hover:text-white">{pricingCopy.customCta}</a>
        </div>
      </div>
    </section>
  );
}
