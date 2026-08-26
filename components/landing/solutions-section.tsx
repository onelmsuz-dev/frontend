import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CLUSTER_PAGES } from "@/lib/seo/cluster-pages";

/**
 * Bosh sahifadan har bir keyword-cluster landingga ichki havola.
 * SEO uchun muhim: bosh sahifaning link-og'irligi shu orqali cluster
 * sahifalarga tarqaladi, foydalanuvchi esa o'zini qiziqtirgan modulni
 * chuqurroq o'rganishi mumkin.
 */
export function SolutionsSection() {
  return (
    <section className="bg-slate-50 py-16 sm:py-20 lg:py-24" aria-labelledby="solutions-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Yechimlar</p>
          <h2 id="solutions-heading" className="text-2xl font-extrabold text-slate-900 sm:text-3xl lg:text-4xl">
            Har bir jarayon uchun alohida yechim
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
            Har bir modul haqida batafsil o&apos;qing — qanday ishlashini, qaysi muammoni yechishini ko&apos;ring.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CLUSTER_PAGES.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
            >
              <span>
                <span className="block text-sm font-bold text-slate-900">{p.navLabel}</span>
                <span className="mt-1 block text-xs leading-relaxed text-slate-500">{p.blurb}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
