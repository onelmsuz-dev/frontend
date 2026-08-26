import Link from "next/link";
import { ArrowRight, CheckCircle2, AlertTriangle, MessageCircle, type LucideIcon } from "lucide-react";
import { LandingHeader } from "./landing-header";
import { LandingFooter } from "./landing-footer";
import { FaqAccordion, type FaqEntry } from "./faq-accordion";
import { LeadForm } from "./lead-form";
import { CLUSTER_PAGES } from "@/lib/seo/cluster-pages";

export interface PainPoint {
  title: string;
  body: string;
}

export interface FeatureItem {
  icon: LucideIcon;
  title: string;
  body: string;
}

export interface ClusterStep {
  title: string;
  body: string;
}

export interface ClusterPageContent {
  /** O'ziga related-link ro'yxatida ko'rinmasligi uchun. */
  href: string;
  eyebrow: string;
  h1: string;
  subtitle: string;
  heroBullets: string[];
  painHeading: string;
  painSubheading?: string;
  painPoints: PainPoint[];
  featuresHeading: string;
  featuresSubheading?: string;
  features: FeatureItem[];
  steps?: ClusterStep[];
  faqHeading?: string;
  faq: FaqEntry[];
  leadSource: string;
  leadHeading?: string;
  leadDescription?: string;
  leadCta?: string;
  leadNotePlaceholder?: string;
}

export function ClusterPage(c: ClusterPageContent) {
  const related = CLUSTER_PAGES.filter((p) => p.href !== c.href).slice(0, 6);

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <LandingHeader />

      <main id="main-content">
        {/* Breadcrumb */}
        <div className="border-b border-slate-100 bg-white pt-16">
          <nav aria-label="Yo'lni ko'rsatish" className="mx-auto max-w-7xl px-4 py-3 text-xs text-slate-500 sm:px-6 lg:px-8">
            <Link href="/" className="hover:text-blue-600">Bosh sahifa</Link>
            <span className="mx-1.5" aria-hidden="true">/</span>
            <span className="font-medium text-slate-700">{c.h1}</span>
          </nav>
        </div>

        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/80 via-white to-white pt-10 pb-14 sm:pt-14 sm:pb-16 lg:pt-16 lg:pb-20" aria-labelledby="hero-heading">
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[360px] w-[280px] rounded-full bg-blue-100/50 blur-3xl sm:h-[420px] sm:w-[700px]" />
          </div>

          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <p className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-blue-700">
              {c.eyebrow}
            </p>
            <h1 id="hero-heading" className="text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl lg:text-5xl">
              {c.h1}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              {c.subtitle}
            </p>

            <ul className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {c.heroBullets.map((b) => (
                <li key={b} className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
                  {b}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="#ariza"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-700/25 transition-all hover:bg-blue-500 sm:w-auto"
              >
                {c.leadCta ?? "Bepul konsultatsiya olish"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </a>
              <a
                href="https://t.me/oneroomuz"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 sm:w-auto"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Telegramda so&apos;rash
              </a>
            </div>
          </div>
        </section>

        {/* Pain points */}
        <section className="bg-white py-14 sm:py-16 lg:py-20" aria-labelledby="pain-heading">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 id="pain-heading" className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
                {c.painHeading}
              </h2>
              {c.painSubheading && (
                <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">{c.painSubheading}</p>
              )}
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {c.painPoints.map((p) => (
                <div key={p.title} className="flex gap-3.5 rounded-2xl border border-amber-100 bg-amber-50/50 p-5">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 sm:text-base">{p.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{p.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="bg-slate-50 py-14 sm:py-16 lg:py-20" aria-labelledby="features-heading">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 id="features-heading" className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
                {c.featuresHeading}
              </h2>
              {c.featuresSubheading && (
                <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">{c.featuresSubheading}</p>
              )}
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {c.features.map((f) => (
                <div key={f.title} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <f.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-sm font-bold text-slate-900 sm:text-base">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Steps (optional) */}
        {c.steps && c.steps.length > 0 && (
          <section className="bg-white py-14 sm:py-16 lg:py-20" aria-labelledby="steps-heading">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
              <h2 id="steps-heading" className="text-center text-2xl font-extrabold text-slate-900 sm:text-3xl">
                Qanday ishlaydi?
              </h2>
              <ol className="mt-10 space-y-6">
                {c.steps.map((s, i) => (
                  <li key={s.title} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 sm:text-base">{s.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        )}

        {/* FAQ + Lead form */}
        <section id="ariza" className="relative bg-slate-950 py-16 sm:py-20 lg:py-24" aria-labelledby="cluster-faq-heading">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-32 right-1/4 h-[420px] w-[420px] rounded-full bg-blue-600/15 blur-[120px]" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-5 lg:gap-14">
              <div className="lg:col-span-2">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-blue-400">Savol-javob</p>
                <h2 id="cluster-faq-heading" className="text-2xl font-extrabold leading-tight text-white sm:text-3xl">
                  {c.faqHeading ?? "Savollaringiz bormi?"}
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-slate-300 sm:text-base">
                  Boshqa savol bo&apos;lsa — shu yerdan ariza qoldiring, o&apos;zimiz bog&apos;lanamiz.
                </p>

                <div className="mt-8 hidden lg:block rounded-2xl border border-white/10 bg-white/5 p-5">
                  <FaqAccordion items={c.faq.slice(0, 3)} />
                </div>
              </div>

              <div className="lg:col-span-3 space-y-5">
                <div className="rounded-2xl border border-white/10 bg-white shadow-2xl shadow-slate-950/40 lg:hidden">
                  <FaqAccordion items={c.faq} />
                </div>
                <div className="hidden lg:block">
                  <FaqAccordion items={c.faq.slice(3)} />
                </div>
                <LeadForm
                  source={c.leadSource}
                  heading={c.leadHeading}
                  description={c.leadDescription}
                  ctaLabel={c.leadCta}
                  notePlaceholder={c.leadNotePlaceholder}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Related pages */}
        <section className="bg-white py-14 sm:py-16" aria-labelledby="related-heading">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 id="related-heading" className="text-lg font-bold text-slate-900 sm:text-xl">
              Boshqa yechimlar
            </h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3.5 transition-colors hover:border-blue-200 hover:bg-blue-50/40"
                >
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">{p.navLabel}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">{p.blurb}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
