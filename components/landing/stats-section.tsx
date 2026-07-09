import { ShieldCheck, Zap, Globe, HeadphonesIcon } from "lucide-react";

const pillars = [
  {
    icon: Zap,
    title: "Tezkor ishlash",
    description: "Har qanday qurilmadan bir xil tez — telefon, planshet, kompyuter",
  },
  {
    icon: ShieldCheck,
    title: "Xavfsiz ma'lumotlar",
    description: "Ma'lumotlaringiz shifrlangan va har kuni zaxiralanadi",
  },
  {
    icon: Globe,
    title: "O'rnatish kerak emas",
    description: "Brauzerdan kirasiz — hech qanday dastur yuklab olish shart emas",
  },
  {
    icon: HeadphonesIcon,
    title: "O'zbek tilidagi yordam",
    description: "Ish vaqtida o'zbek tilida texnik va metodologik yordam",
  },
];

export function StatsSection() {
  return (
    <section
      className="bg-slate-900 py-12 sm:py-16"
      aria-label="OneRoom afzalliklari"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <dl className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map(({ icon: Icon, title, description }, i) => (
            <div
              key={title}
              className={`flex items-start gap-4 ${
                i < 3 ? "lg:border-r lg:border-slate-700/50 lg:pr-8" : ""
              }`}
            >
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600/20">
                <Icon className="h-4.5 w-4.5 text-blue-400" aria-hidden="true" />
              </div>
              <div>
                <dt className="text-sm font-semibold text-white">{title}</dt>
                <dd className="mt-1 text-xs text-slate-400 leading-relaxed">{description}</dd>
              </div>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
