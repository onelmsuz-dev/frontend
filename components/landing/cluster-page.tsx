import Link from "next/link";
import Image from "next/image";
import { AlertTriangle, ArrowUpRight, Check, ChevronRight, MessageCircle, type LucideIcon } from "lucide-react";
import { HomeHeader } from "./home/home-header";
import { Reveal } from "./home/reveal";
import { DISPLAY, EYEBROW, EYEBROW_DARK, LEAD } from "./home/style";
import { CONTACT_PHONE, CONTACT_PHONE_DISPLAY, links } from "./home/content";
import { LandingFooter } from "./landing-footer";
import { FaqAccordion, type FaqEntry } from "./faq-accordion";
import { ApplyButton, ApplyProvider } from "./apply-dialog";
import { ApplyInline } from "./apply-form";
import { solutionArt } from "./solution-art";
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

/**
 * KLASTER SAHIFA SHABLONI (10 ta yechim sahifasi shu yerdan chiqadi).
 *
 * Dizayn bosh sahifa bilan bir xil: zich qalin sarlavhalar (oxirgi so'z ko'k), ko'k eyebrow,
 * och-ko'k yumaloq kartalar, 3D "shisha" rasm, qora "Bog'lanish" bloki va umumiy ariza formasi.
 * Matnlar, sarlavha ierarxiyasi (H1 → H2 → H3), breadcrumb, FAQ va ichki havolalar o'zgarmagan:
 * SEO ma'lumotlari (metadata, JSON-LD) sahifa fayllarida, bu yerda faqat ko'rinish.
 */

const H2 = `text-balance text-[2rem] sm:text-5xl lg:text-[3.25rem] ${DISPLAY} text-slate-900`;

/** H1 ning oxirgi so'zi (5+ so'zli sarlavhada — oxirgi ikkitasi) ko'k bilan ajratiladi. Matn o'zgarmaydi. */
function splitAccent(text: string): [string, string] {
  const words = text.trim().split(/\s+/);
  const n = words.length >= 5 ? 2 : 1;
  return [words.slice(0, -n).join(" "), words.slice(-n).join(" ")];
}

/** Kartalar qatorlari to'la chiqishi uchun (4 ta — 2x2, 5 ta — 3+2). */
function featureSpan(index: number, total: number): string {
  if (total === 4) return "lg:col-span-3";
  if (total === 5) return index < 3 ? "lg:col-span-2" : "lg:col-span-3";
  return "lg:col-span-2";
}

/** "Qanday ishlaydi" bloklari — bosh sahifadagi ranglar bilan bir xil. */
const STEP_STYLES = [
  { card: "bg-blue-600 text-white", num: "text-white/30", desc: "text-blue-50" },
  { card: "bg-slate-900 text-white", num: "text-white/20", desc: "text-slate-400" },
  { card: "bg-indigo-100 text-slate-900", num: "text-indigo-900/15", desc: "text-slate-600" },
  { card: "bg-blue-50 text-slate-900", num: "text-blue-900/15", desc: "text-slate-600" },
];

export function ClusterPage(c: ClusterPageContent) {
  const related = CLUSTER_PAGES.filter((p) => p.href !== c.href).slice(0, 6);
  const art = solutionArt(c.href);
  const [h1Head, h1Accent] = splitAccent(c.h1);

  return (
    <ApplyProvider page={c.leadSource}>
      <div className="min-h-screen overflow-x-hidden bg-white text-slate-900 antialiased">
        <HomeHeader />

        <main id="main-content">
          {/* Hero */}
          <section className="relative isolate overflow-hidden px-5 pb-16 pt-6 sm:px-8 sm:pb-24 sm:pt-10" aria-labelledby="hero-heading">
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[linear-gradient(to_bottom,white,transparent_6rem),radial-gradient(60rem_28rem_at_75%_22%,rgba(59,130,246,0.12),transparent_70%)]" />

            <div className="mx-auto max-w-[1200px]">
              {/* Breadcrumb */}
              <nav aria-label="Yo'lni ko'rsatish" className="flex min-w-0 items-center gap-1.5 text-[13px] text-slate-500">
                <Link href="/" className="shrink-0 font-medium transition-colors hover:text-blue-600">Bosh sahifa</Link>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" aria-hidden />
                <span className="truncate font-semibold text-slate-700">{c.h1}</span>
              </nav>

              <div className="mt-8 grid items-center gap-10 sm:mt-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14">
                <div>
                  <p className={EYEBROW}>{c.eyebrow}</p>
                  <h1 id="hero-heading" className={`mt-4 text-balance text-[2.5rem] sm:text-6xl lg:text-[4rem] ${DISPLAY} text-slate-900`}>
                    {h1Head}{" "}
                    <span className="text-blue-600">{h1Accent}</span>
                  </h1>
                  <p className={`mt-6 max-w-xl ${LEAD}`}>{c.subtitle}</p>

                  <ul className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-x-3 sm:gap-y-2.5">
                    {c.heroBullets.map((b) => (
                      <li key={b} className="flex items-start gap-2.5 text-[15px] font-medium leading-snug text-slate-700 sm:items-center sm:rounded-full sm:bg-blue-50/80 sm:py-1.5 sm:pl-2 sm:pr-4 sm:ring-1 sm:ring-blue-100">
                        <span className="mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full bg-blue-600 text-white sm:mt-0">
                          <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                        </span>
                        {b}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                    <ApplyButton
                      where="Hero"
                      className="group inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-7 text-base font-semibold text-white shadow-[0_14px_30px_-12px_rgba(37,99,235,0.7)] transition-colors hover:bg-blue-700"
                    >
                      {c.leadCta ?? "Bepul konsultatsiya olish"}
                      <ArrowUpRight className="h-[18px] w-[18px] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                    </ApplyButton>
                    <a
                      href={links.telegram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-7 text-base font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                    >
                      <MessageCircle className="h-[18px] w-[18px]" aria-hidden />
                      Telegramda so&apos;rash
                    </a>
                  </div>
                </div>

                {art && (
                  <figure className="relative mx-auto w-full max-w-[22rem] sm:max-w-[28rem] lg:max-w-none">
                    <div aria-hidden className="absolute inset-0 rounded-[2.5rem] border border-blue-100/80 bg-gradient-to-br from-blue-50 via-white to-indigo-50" />
                    <div aria-hidden className="absolute -right-6 -top-6 h-40 w-40 rounded-full bg-blue-200/40 blur-3xl" />
                    <div className="relative aspect-square">
                      <Image
                        src={art}
                        alt=""
                        fill
                        priority
                        sizes="(max-width: 640px) 90vw, (max-width: 1024px) 448px, 520px"
                        className="object-contain p-7 drop-shadow-[0_24px_28px_rgba(37,99,235,0.14)] sm:p-9"
                        aria-hidden
                      />
                    </div>
                  </figure>
                )}
              </div>
            </div>
          </section>

          {/* Muammolar */}
          <section className="bg-white px-5 py-20 sm:px-8 sm:py-28" aria-labelledby="pain-heading">
            <div className="mx-auto max-w-[1200px]">
              <Reveal className="max-w-3xl">
                <h2 id="pain-heading" className={H2}>{c.painHeading}</h2>
                {c.painSubheading && <p className={`mt-5 max-w-2xl ${LEAD}`}>{c.painSubheading}</p>}
              </Reveal>

              <div className="mt-12 grid gap-3 sm:mt-16 sm:grid-cols-2 sm:gap-4">
                {c.painPoints.map((p, i) => (
                  <Reveal
                    key={p.title}
                    delay={i * 70}
                    className="group relative overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-slate-50 p-6 transition-[background-color,box-shadow,border-color] duration-300 hover:border-slate-200 hover:bg-white hover:shadow-[0_20px_50px_-35px_rgba(15,23,42,0.35)] sm:p-8"
                  >
                    <span aria-hidden className="pointer-events-none absolute right-6 top-4 text-6xl font-bold leading-none tracking-[-0.06em] text-slate-900/[0.06] sm:right-8 sm:top-5 sm:text-7xl">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-100 text-amber-700">
                      <AlertTriangle className="h-5 w-5" aria-hidden />
                    </span>
                    <h3 className="mt-5 max-w-[19rem] text-xl font-bold leading-[1.2] tracking-[-0.025em] text-slate-900 sm:text-[1.35rem]">{p.title}</h3>
                    <p className="mt-2.5 text-[15px] leading-relaxed text-slate-600">{p.body}</p>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* Imkoniyatlar */}
          <section className="bg-slate-50 px-5 py-20 sm:px-8 sm:py-28" aria-labelledby="features-heading">
            <div className="mx-auto max-w-[1200px]">
              <Reveal className="mx-auto max-w-3xl text-center">
                <h2 id="features-heading" className={H2}>{c.featuresHeading}</h2>
                {c.featuresSubheading && <p className={`mx-auto mt-5 max-w-2xl ${LEAD}`}>{c.featuresSubheading}</p>}
              </Reveal>

              <div className="mt-12 grid gap-3 sm:mt-16 sm:grid-cols-2 lg:grid-cols-6">
                {c.features.map((f, i) => (
                  <Reveal
                    key={f.title}
                    delay={i * 70}
                    className={`group relative overflow-hidden rounded-3xl border border-blue-100/80 bg-blue-50/70 p-6 shadow-[0_1px_0_rgba(15,23,42,0.03)] transition-[background-color,border-color,box-shadow] duration-300 hover:border-blue-200 hover:bg-white hover:shadow-[0_18px_45px_-32px_rgba(37,99,235,0.35)] sm:p-7 ${featureSpan(i, c.features.length)}`}
                  >
                    <f.icon aria-hidden className="pointer-events-none absolute -bottom-6 -right-5 h-36 w-36 text-blue-600/[0.06] transition-colors duration-300 group-hover:text-blue-600/10" strokeWidth={1.25} />
                    <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-white text-blue-600 shadow-[0_1px_3px_rgba(15,23,42,0.08)] ring-1 ring-blue-100">
                      <f.icon className="h-[22px] w-[22px]" aria-hidden />
                    </span>
                    <h3 className="relative mt-5 text-xl font-bold leading-[1.2] tracking-[-0.025em] text-slate-900 sm:text-[1.35rem]">{f.title}</h3>
                    <p className="relative mt-2.5 text-[15px] leading-relaxed text-slate-600">{f.body}</p>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* Qanday ishlaydi (ixtiyoriy) */}
          {c.steps && c.steps.length > 0 && (
            <section className="bg-white px-5 py-20 sm:px-8 sm:py-28" aria-labelledby="steps-heading">
              <div className="mx-auto max-w-[1200px]">
                <Reveal>
                  <h2 id="steps-heading" className={H2}>Qanday ishlaydi?</h2>
                </Reveal>
                <ol className={`mt-12 grid gap-3 sm:mt-16 sm:gap-4 ${c.steps.length >= 4 ? "sm:grid-cols-2 lg:grid-cols-4" : c.steps.length === 3 ? "md:grid-cols-3" : "sm:grid-cols-2"}`}>
                  {c.steps.map((s, i) => {
                    const st = STEP_STYLES[i % STEP_STYLES.length];
                    return (
                      <li key={s.title} className={`flex min-h-[15rem] flex-col justify-between rounded-[2rem] p-7 sm:min-h-[19rem] ${st.card}`}>
                        <div aria-hidden data-n={String(i + 1).padStart(2, "0")} className={`text-6xl font-bold leading-none tracking-[-0.06em] before:content-[attr(data-n)] sm:text-7xl ${st.num}`} />
                        <div className="mt-10">
                          <h3 className="text-2xl font-bold leading-[1.15] tracking-[-0.03em]">{s.title}</h3>
                          <p className={`mt-3 text-[15px] leading-[1.5] ${st.desc}`}>{s.body}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </section>
          )}

          {/* FAQ */}
          <section className="bg-white px-5 pb-20 pt-4 sm:px-8 sm:pb-28 sm:pt-8" aria-labelledby="cluster-faq-heading">
            <div className="mx-auto max-w-[860px]">
              <Reveal className="text-center">
                <p className={EYEBROW}>Savol-javob</p>
                <h2 id="cluster-faq-heading" className={`mt-4 ${H2}`}>{c.faqHeading ?? "Savollaringiz bormi?"}</h2>
                <p className={`mx-auto mt-5 max-w-xl ${LEAD}`}>
                  Boshqa savol bo&apos;lsa — shu yerdan ariza qoldiring, o&apos;zimiz bog&apos;lanamiz.
                </p>
              </Reveal>
              <div className="mt-12 sm:mt-16">
                <FaqAccordion items={c.faq} />
              </div>
            </div>
          </section>

          {/* Ariza */}
          <section id="ariza" className="scroll-mt-20 bg-white px-4 pb-20 sm:px-5 sm:pb-28" aria-labelledby="ariza-heading">
            <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-7 overflow-hidden rounded-[1.75rem] bg-slate-950 p-5 text-white sm:gap-10 sm:rounded-[2.5rem] sm:p-10 lg:grid-cols-2 lg:gap-16 lg:p-14">
              <div className="min-w-0 pt-1 sm:pt-0">
                <p className={EYEBROW_DARK}>Bog&apos;lanish</p>
                <h2 id="ariza-heading" className={`mt-3 text-balance text-[2rem] leading-[1.08] sm:mt-4 sm:text-5xl ${DISPLAY}`}>
                  {c.leadHeading ?? "Bepul konsultatsiya oling"}
                </h2>
                <p className="mt-3 max-w-md text-[15px] leading-relaxed text-slate-300 sm:mt-5 sm:text-lg">
                  {c.leadDescription ?? "Ism va telefon raqamingizni qoldiring — siz bilan bog'lanamiz."}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 sm:mt-8 sm:block sm:space-y-1">
                  <a href={`tel:${CONTACT_PHONE}`} className="text-xl font-bold tracking-[-0.03em] text-white hover:text-blue-300 sm:block sm:text-2xl">{CONTACT_PHONE_DISPLAY}</a>
                  <a href={links.telegram} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-300 hover:text-white sm:block sm:text-[15px]">{links.telegramHandle}</a>
                </div>
              </div>
              <div className="min-w-0 rounded-[1.4rem] bg-white p-4 text-slate-900 sm:rounded-3xl sm:p-7">
                <ApplyInline source={c.leadSource} heading="Ma'lumotlaringiz" compact ctaLabel={c.leadCta} />
              </div>
            </div>
          </section>

          {/* Boshqa yechimlar */}
          <section className="bg-slate-50 px-5 py-20 sm:px-8 sm:py-28" aria-labelledby="related-heading">
            <div className="mx-auto max-w-[1200px]">
              <Reveal>
                <h2 id="related-heading" className={H2}>Boshqa yechimlar</h2>
              </Reveal>
              <div className="mt-12 grid gap-3 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((p) => {
                  const img = solutionArt(p.href);
                  return (
                    <Link
                      key={p.href}
                      href={p.href}
                      className="group relative isolate min-h-[12.5rem] overflow-hidden rounded-3xl border border-blue-100/80 bg-blue-50/70 p-6 pb-[4.75rem] shadow-[0_1px_0_rgba(15,23,42,0.03)] transition-[background-color,border-color,box-shadow] duration-300 hover:border-blue-200 hover:bg-white hover:shadow-[0_18px_45px_-32px_rgba(37,99,235,0.35)]"
                    >
                      <span className="relative z-10 block max-w-[62%]">
                        <span className="block text-xl font-bold leading-[1.2] tracking-[-0.03em] text-slate-900">{p.navLabel}</span>
                        <span className="mt-2 block text-[14px] font-medium leading-relaxed text-slate-600">{p.blurb}</span>
                      </span>
                      {img && (
                        <span className="pointer-events-none absolute -bottom-3 -right-2 h-36 w-36">
                          <Image src={img} alt="" fill sizes="144px" className="object-contain opacity-85 transition-opacity duration-300 group-hover:opacity-100" aria-hidden />
                        </span>
                      )}
                      <span className="absolute bottom-6 left-6 z-10 grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white/90 text-slate-500 transition-colors group-hover:border-blue-200 group-hover:text-blue-600">
                        <ChevronRight className="h-4 w-4" aria-hidden />
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        </main>

        <LandingFooter />
      </div>
    </ApplyProvider>
  );
}
