import Link from "next/link";
import { ArrowRight, MessageSquarePlus } from "lucide-react";

export function TestimonialsSection() {
  return (
    <section
      className="py-16 sm:py-20 lg:py-24 bg-slate-50"
      aria-labelledby="testimonials-heading"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-100 mb-6">
          <MessageSquarePlus className="h-7 w-7 text-blue-600" aria-hidden="true" />
        </div>

        <h2
          id="testimonials-heading"
          className="text-2xl font-extrabold text-slate-900 sm:text-3xl lg:text-4xl"
        >
          Birinchi bo'ling
        </h2>

        <p className="mt-4 text-base text-slate-600 sm:text-lg max-w-xl mx-auto leading-relaxed">
          OneRoom hali yangi — va siz dastlabki foydalanuvchilardan bo'lishingiz mumkin.
          14 kun bepul sinab ko'ring, fikr-mulohazangiz tizimni yaxshilashga yordam beradi.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/login"
            className="group inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:scale-[1.02]"
          >
            Bepul boshlash
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
          <a
            href="https://t.me/oneroomuz"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            Telegram orqali bog'lanish
          </a>
        </div>

        <p className="mt-5 text-xs text-slate-400">
          Karta ma'lumotlari kerak emas · Istalgan vaqt bekor qilish mumkin
        </p>
      </div>
    </section>
  );
}
