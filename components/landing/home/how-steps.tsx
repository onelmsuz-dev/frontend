import type { HomeContent } from "./content-i18n";
import { DISPLAY } from "./style";

/** Qanday ishlaydi: 4 ta rangli blok. */
const STEP_STYLES = [
  { card: "bg-blue-600 text-white", num: "text-white/30", desc: "text-blue-50", badge: "bg-blue-900/30 text-white" },
  { card: "bg-slate-900 text-white", num: "text-white/20", desc: "text-slate-400", badge: "bg-white/10 text-blue-200" },
  { card: "bg-indigo-100 text-slate-900", num: "text-indigo-900/15", desc: "text-slate-600", badge: "bg-white text-indigo-700" },
  { card: "bg-blue-50 text-slate-900", num: "text-blue-900/15", desc: "text-slate-600", badge: "bg-white text-blue-700" },
];

export function HowSteps({ howCopy, steps }: { howCopy: HomeContent["howCopy"]; steps: HomeContent["steps"] }) {
  return (
    <section id="how-it-works" className="scroll-mt-16 px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-[1200px]">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-600">{howCopy.eyebrow}</p>
        <h2 className={`mt-4 max-w-3xl text-balance text-[2.5rem] sm:text-6xl ${DISPLAY} text-slate-900`}>{howCopy.title}</h2>
        <ol className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, idx) => {
            const st = STEP_STYLES[idx];
            return (
              <li key={s.number} className={`flex min-h-[340px] flex-col justify-between rounded-[2rem] p-7 ${st.card}`}>
                <div aria-hidden data-n={s.number} className={`text-7xl font-bold leading-none tracking-[-0.06em] before:content-[attr(data-n)] ${st.num}`} />
                <div className="grid grid-rows-[4rem_7rem_auto]">
                  <h3 className="text-2xl font-bold leading-[1.15] tracking-[-0.03em]">{s.title}</h3>
                  <p className={`text-[15px] leading-[1.45] ${st.desc}`}>{s.description}</p>
                  <span className={`w-fit self-end rounded-full px-3 py-1 text-xs font-bold ${st.badge}`}>{s.badge}</span>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
