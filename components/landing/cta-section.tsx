import Link from "next/link";
import { ArrowRight, ShieldCheck, Clock3, Headphones } from "lucide-react";

const guarantees = [
  { icon: ShieldCheck, text: "Ma'lumotlar xavfsizligi kafolatlangan" },
  { icon: Clock3,      text: "14 kun bepul — karta kerak emas" },
  { icon: Headphones,  text: "O'zbek tilida texnik yordam" },
];

export function CtaSection() {
  return (
    <section
      id="cta"
      className="relative overflow-hidden bg-slate-950 py-24 sm:py-32"
      aria-labelledby="cta-heading"
    >
      {/* Glow effects */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-indigo-600/15 blur-[100px]" />
      </div>

      {/* Subtle grid */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <h2
          id="cta-heading"
          className="text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl leading-tight"
        >
          O'quv markazingizni{" "}
          <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            bugun raqamlashtiring
          </span>
        </h2>

        <p className="mt-5 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Hujjat, Excel, WhatsApp o'rniga — bitta tizim. O'quvchilar, to'lovlar,
          jadval va davomatni bir ekrandan boshqaring.
        </p>

        {/* Guarantees */}
        <ul className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
          {guarantees.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-2 text-sm text-slate-300">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 shrink-0">
                <Icon className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
              </div>
              {text}
            </li>
          ))}
        </ul>

        {/* Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/login"
            className="group inline-flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-2xl bg-blue-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-blue-700/30 transition-all hover:bg-blue-500 hover:shadow-blue-600/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            Bepul boshlash — hoziroq
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
          <a
            href="mailto:sales@oneroom.uz"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-sm font-semibold text-white transition-all hover:bg-white/10 hover:border-white/25"
          >
            Savol-javob — bepul konsultatsiya
          </a>
        </div>

        <p className="mt-6 text-xs text-slate-500">
          Kredit karta talab qilinmaydi · Istalgan vaqt bekor qilish mumkin · O'zbek tilida sozlash yordami
        </p>
      </div>
    </section>
  );
}
