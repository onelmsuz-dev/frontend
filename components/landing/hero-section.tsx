import Link from "next/link";
import { ArrowRight, Play, CheckCircle2 } from "lucide-react";

const bullets = [
  "O'rnatish shart emas — to'liq veb-asosda",
  "14 kunlik bepul sinov, karta kerak emas",
  "O'zbek tilidagi interfeys va yordam",
];

const mockStats = [
  { label: "Jami o'quvchilar", value: "—", color: "bg-blue-50 text-blue-700 border-blue-100" },
  { label: "Bu oy to'lov", value: "—", color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  { label: "Faol kurslar", value: "—", color: "bg-violet-50 text-violet-700 border-violet-100" },
];

const mockPayments = [
  { name: "O'quvchi A", amount: "+••• so'm" },
  { name: "O'quvchi B", amount: "+••• so'm" },
  { name: "O'quvchi C", amount: "+••• so'm" },
];

const sidebarItems = ["Dashboard", "O'quvchilar", "To'lovlar", "Jadval", "Davomot", "Hisobotlar"];

export function HeroSection() {
  return (
    <section
      className="relative overflow-hidden bg-gradient-to-b from-blue-50/80 via-white to-white pt-24 pb-16 sm:pt-28 sm:pb-20 lg:pt-36 lg:pb-28"
      aria-labelledby="hero-heading"
    >
      {/* Ambient background glows */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden [clip-path:inset(0)]"
        aria-hidden="true"
      >
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[400px] w-[300px] rounded-full bg-blue-100/50 blur-3xl sm:h-[500px] sm:w-[800px]" />
        <div className="absolute top-1/2 -right-20 hidden h-[300px] w-[300px] rounded-full bg-indigo-100/40 blur-3xl sm:block" />
      </div>

      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-8">
        {/* Text block */}
        <div className="mx-auto w-full max-w-3xl text-left sm:text-center">
          {/* Badge */}
          <div className="mb-5 flex justify-start sm:justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-semibold text-blue-700 sm:px-3.5 sm:text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
              O'quv markazlar uchun zamonaviy LMS va CRM
            </span>
          </div>

          {/* H1 */}
          <h1
            id="hero-heading"
            className="text-[1.375rem] font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl md:text-5xl lg:text-6xl"
          >
            O'quv Markazingizni{" "}
            <span className="text-blue-600">Raqamli Kelajakka</span>{" "}
            Olib Chiqing
          </h1>

          <p className="mt-5 text-sm leading-relaxed text-slate-600 sm:text-base sm:mt-6 md:text-lg">
            <strong className="font-semibold text-slate-800">OneRoom</strong> — o'quvchilar,
            to'lovlar, jadval va davomatni bitta platformada boshqarish uchun zamonaviy LMS va
            CRM tizimi. Vaqtingizni tejang, daromadingizni oshiring.
          </p>

          {/* Bullet points */}
          <ul
            className="mt-5 flex flex-col items-start gap-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-center sm:gap-6"
            role="list"
          >
            {bullets.map((b) => (
              <li key={b} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
                {b}
              </li>
            ))}
          </ul>

          {/* CTA buttons */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-blue-600/30 sm:w-auto sm:px-7 sm:text-base"
            >
              Bepul boshlash
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 sm:w-auto sm:px-7 sm:text-base"
            >
              <Play className="h-4 w-4 fill-current text-blue-600" aria-hidden="true" />
              Qanday ishlashini ko'ring
            </a>
          </div>
        </div>

        {/* Dashboard mock */}
        <div className="mt-12 sm:mt-16 mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/10">
            {/* Browser chrome */}
            <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50/80 px-4 py-2.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <div className="ml-3 flex-1 max-w-[180px] sm:max-w-xs mx-auto h-5 rounded-md bg-white border border-slate-200 flex items-center justify-center">
                <span className="text-[9px] text-slate-400 truncate px-2">demo.oneroom.uz/dashboard</span>
              </div>
            </div>

            {/* Dashboard body */}
            <div className="flex bg-slate-50/40">
              {/* Sidebar — hidden on mobile */}
              <aside className="hidden sm:flex w-44 shrink-0 flex-col gap-0.5 border-r border-slate-100 bg-white p-3">
                {sidebarItems.map((item, i) => (
                  <div
                    key={item}
                    className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                      i === 0
                        ? "bg-blue-600 text-white"
                        : "text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {item}
                  </div>
                ))}
              </aside>

              {/* Main content */}
              <main className="flex-1 p-4 sm:p-5 space-y-4 min-w-0">
                {/* Stat cards */}
                <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                  {mockStats.map((card) => (
                    <div
                      key={card.label}
                      className={`rounded-xl border p-3 sm:p-3.5 ${card.color}`}
                    >
                      <p className="text-[9px] sm:text-[10px] font-medium opacity-70 leading-snug">
                        {card.label}
                      </p>
                      <p className="mt-1 text-base sm:text-lg font-bold leading-none">
                        {card.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Payments table */}
                <div className="rounded-xl border border-slate-100 bg-white p-3.5">
                  <p className="text-[10px] font-semibold text-slate-700 mb-2.5">
                    So'nggi to'lovlar
                  </p>
                  <div className="space-y-2">
                    {mockPayments.map((p) => (
                      <div key={p.name} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-5 w-5 shrink-0 rounded-full bg-slate-100 text-[8px] flex items-center justify-center font-bold text-slate-500">
                            {p.name[0]}
                          </div>
                          <span className="text-[10px] text-slate-600 truncate">{p.name}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-600 shrink-0">
                          {p.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </main>
            </div>
          </div>

          {/* Floating trust badge */}
          <p className="mt-4 text-center text-xs text-slate-400">
            Demo ko'rinish · Haqiqiy ma'lumotlar bilan ishlaydi
          </p>
        </div>
      </div>
    </section>
  );
}
