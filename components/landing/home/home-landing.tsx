import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { ApplyButton } from "@/components/landing/apply-dialog";
import { ApplyInline } from "@/components/landing/apply-form";
import { HomeHeader } from "./home-header";
import { Hero } from "./hero";
import { FeaturesTabs } from "./features-tabs";
import { HowSteps } from "./how-steps";
import { PricingPlans } from "./pricing-plans";
import { Reveal } from "./reveal";
import { HomeKeyframes } from "./ui";
import { HomeFaqAccordion } from "./home-faq-accordion";
import {
  CLUSTER_PAGES, CONTACT_PHONE, CONTACT_PHONE_DISPLAY, contactCopy, faqCopy, faqItems,
  firstCopy, links, pillars, solutionsCopy,
} from "./content";
import { CONTAINER, DISPLAY, EYEBROW, EYEBROW_DARK, H2, LEAD } from "./style";

/**
 * BOSH SAHIFA.
 *
 * Hero — "Perspective" (ko'k 3D portal, `./hero.tsx`); asos — Apple uslubi (markazlashgan
 * maket, katta yumaloq shakllar, ko'p bo'sh joy); Imkoniyatlar / Qanday ishlaydi / Narxlar
 * bo'limlari va matn uslubi (qalin, zich sarlavhalar, katta harfli eyebrow'lar) — Figma uslubidan.
 * Ranglar avvalgi landing bilan bir xil. Kontent: `./content.ts`, uslub: `./style.ts`.
 *
 * SEO: H1 tepasidagi kalit so'zli eyebrow, bo'lim id'lari (#features...),
 * barcha klaster sahifalarga havolalar (Yechimlar + footer) saqlangan.
 */

/* ────────────────────────── Afzalliklar ────────────────────────── */
function Pillars() {
  return (
    <section className="bg-white px-5 pb-16 pt-10 sm:pb-20 sm:pt-16" aria-label="OneRoom afzalliklari">
      <div className={`${CONTAINER} grid gap-3 sm:grid-cols-2 lg:grid-cols-4`}>
        {pillars.map((p, i) => (
          <Reveal
            key={p.title}
            delay={i * 70}
            className="group relative isolate min-h-[21rem] overflow-hidden rounded-[1.75rem] border border-blue-100/80 bg-blue-50/60 p-6 transition-[background-color,border-color,box-shadow] duration-300 hover:border-blue-200 hover:bg-white hover:shadow-[0_20px_50px_-35px_rgba(37,99,235,0.38)]"
          >
            <span className="relative z-10 block h-7 max-w-[11rem] text-[9px] font-bold uppercase leading-[1.45] tracking-[0.16em] text-blue-600">
              {p.eyebrow}
            </span>
            <span className="pointer-events-none absolute -right-4 top-8 h-40 w-40 opacity-60 transition-opacity duration-300 group-hover:opacity-100 sm:h-44 sm:w-44 lg:-right-7 lg:top-9 lg:h-40 lg:w-40 xl:-right-3 xl:h-44 xl:w-44">
              <Image src={p.image} alt="" fill sizes="(max-width: 640px) 160px, 176px" className="object-contain" aria-hidden />
            </span>
            <span className="absolute inset-x-6 bottom-6 z-10 grid min-h-[7.65rem] grid-rows-[3.25rem_1fr] pt-4">
              <span className="block max-w-[15rem] text-[1.2rem] font-extrabold leading-[1.18] tracking-[-0.035em] text-slate-900">{p.title}</span>
              <span className="block max-w-[16rem] text-[13px] font-medium leading-[1.55] text-slate-600">{p.description}</span>
            </span>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ────────────────────────── Yechimlar (klaster sahifalarga havolalar) ────────────────────────── */
const SOLUTION_ART = [
  "/landing/solutions/crm-transparent.png",
  "/landing/solutions/attendance-transparent.png",
  "/landing/solutions/payments-transparent.png",
  "/landing/solutions/debt-transparent.png",
  "/landing/solutions/reports-transparent.png",
  "/landing/solutions/salary-transparent.png",
  "/landing/solutions/groups-transparent.png",
  "/landing/solutions/schedule-transparent.png",
  "/landing/solutions/telegram-transparent.png",
  "/landing/solutions/automation-transparent.png",
] as const;

function Solutions() {
  return (
    <section id="solutions" className="scroll-mt-20 bg-slate-50 px-5 py-24 sm:py-32" aria-labelledby="solutions-heading">
      <div className={CONTAINER}>
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className={EYEBROW}>{solutionsCopy.eyebrow}</p>
          <h2 id="solutions-heading" className={`mt-4 ${H2}`}>{solutionsCopy.title}.</h2>
          <p className={`mx-auto mt-5 max-w-2xl ${LEAD}`}>{solutionsCopy.lead}</p>
        </Reveal>
        <div className="mt-14 grid gap-3 sm:mt-16 sm:grid-cols-2">
          {CLUSTER_PAGES.map((p, index) => (
            <Link
              key={p.href}
              href={p.href}
              className="group relative isolate flex min-h-[19rem] flex-col overflow-hidden rounded-3xl border border-blue-100/80 bg-blue-50/70 p-6 shadow-[0_1px_0_rgba(15,23,42,0.03)] transition-[background-color,border-color,box-shadow] duration-300 hover:border-blue-200 hover:bg-white hover:shadow-[0_18px_45px_-32px_rgba(37,99,235,0.35)] sm:block sm:min-h-[15rem] sm:p-7"
            >
              <span className="relative z-10 block sm:max-w-[17rem]">
                <span className="mb-3 block text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-600">
                  Yechim {String(index + 1).padStart(2, "0")}
                </span>
                <span className="block text-[1.35rem] font-extrabold leading-[1.2] tracking-[-0.035em] text-slate-950 sm:text-[1.45rem]">{p.navLabel}</span>
                <span className="mt-2.5 block text-[14px] font-semibold leading-[1.55] tracking-[-0.01em] text-slate-600 sm:text-[15px]">{p.blurb}</span>
              </span>
              <span className="pointer-events-none relative -bottom-3 -right-2 ml-auto mt-3 block h-36 w-36 shrink-0 sm:absolute sm:-bottom-5 sm:right-0 sm:mt-0 sm:h-44 sm:w-44">
                <Image
                  src={SOLUTION_ART[index]}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 160px, 176px"
                  className="object-contain opacity-80 drop-shadow-[0_14px_16px_rgba(37,99,235,0.08)] transition-opacity duration-300 group-hover:opacity-100"
                  aria-hidden
                />
              </span>
              <span className="absolute bottom-6 left-6 z-10 grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white/90 text-slate-500 backdrop-blur-sm transition-colors group-hover:border-blue-200 group-hover:text-blue-600 sm:bottom-7 sm:left-7">
                <ChevronRight className="h-4 w-4" aria-hidden />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────── Birinchi bo'ling / FAQ / Ariza ────────────────────────── */
function First() {
  return (
    <section className="bg-white px-4 py-16 sm:px-5 sm:py-24" aria-labelledby="first-heading">
      <Reveal className={`${CONTAINER} relative overflow-hidden rounded-[2rem] bg-blue-600 px-6 py-8 text-white shadow-[0_30px_80px_-45px_rgba(37,99,235,0.75)] sm:rounded-[2.5rem] sm:px-10 sm:py-11 lg:flex lg:items-center lg:justify-between lg:gap-12 lg:px-14`}>
        <span aria-hidden className="pointer-events-none absolute -right-20 -top-28 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="relative max-w-2xl">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-blue-100 sm:text-xs">7 kun bepul</p>
          <h2 id="first-heading" className={`mt-3 text-[2rem] leading-[1.08] sm:text-5xl ${DISPLAY}`}>{firstCopy.title}</h2>
          <p className="mt-4 max-w-xl text-[15px] font-medium leading-relaxed text-blue-50/90 sm:text-lg">{firstCopy.body}</p>
        </div>
        <div className="relative mt-7 grid w-full gap-3 sm:w-auto sm:grid-cols-2 lg:mt-0 lg:shrink-0 lg:grid-cols-1 xl:grid-cols-2">
          <ApplyButton where="Bepul sinov CTA" className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-white px-6 py-3 text-[15px] font-bold text-blue-700 shadow-[0_10px_25px_-12px_rgba(15,23,42,0.45)] transition-colors hover:bg-blue-50 sm:w-auto">
            Ariza qoldirish
          </ApplyButton>
          <a href={links.telegram} target="_blank" rel="noopener noreferrer" className="group inline-flex min-h-12 w-full items-center justify-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-[15px] font-bold text-white transition-colors hover:bg-white/15 sm:w-auto">
            Telegramda yozish <ChevronRight className="h-4 w-4" aria-hidden />
          </a>
        </div>
      </Reveal>
    </section>
  );
}

function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 bg-white px-5 pb-24 pt-5 sm:pb-32 sm:pt-8" aria-labelledby="faq-heading">
      <div className="mx-auto max-w-[860px]">
        <Reveal className="text-center">
          <p className={EYEBROW}>{faqCopy.eyebrow}</p>
          <h2 id="faq-heading" className={`mt-4 ${H2}`}>{faqCopy.title}</h2>
          <p className={`mx-auto mt-5 max-w-xl ${LEAD}`}>{faqCopy.lead}</p>
        </Reveal>
        <div className="mt-10 sm:mt-14"><HomeFaqAccordion items={faqItems} /></div>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact" className="scroll-mt-20 bg-white px-4 pb-20 sm:px-5 sm:pb-28" aria-labelledby="contact-heading">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-7 overflow-hidden rounded-[1.75rem] bg-slate-950 p-5 text-white sm:gap-10 sm:rounded-[2.5rem] sm:p-10 lg:grid-cols-2 lg:gap-16 lg:p-14">
        <div className="min-w-0 pt-1 sm:pt-0">
          <p className={EYEBROW_DARK}>{contactCopy.eyebrow}</p>
          <h2 id="contact-heading" className={`mt-3 text-balance text-[2rem] leading-[1.08] sm:mt-4 sm:text-5xl ${DISPLAY}`}>{contactCopy.title}</h2>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-slate-300 sm:mt-5 sm:text-lg">{contactCopy.lead}</p>
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 sm:mt-8 sm:block sm:space-y-1">
            <a href={`tel:${CONTACT_PHONE}`} className="text-xl font-bold tracking-[-0.03em] text-white hover:text-blue-300 sm:block sm:text-2xl">{CONTACT_PHONE_DISPLAY}</a>
            <a href={links.telegram} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-300 hover:text-white sm:block sm:text-[15px]">{links.telegramHandle}</a>
          </div>
        </div>
        <div className="min-w-0 rounded-[1.4rem] bg-white p-4 text-slate-900 sm:rounded-3xl sm:p-7">
          <ApplyInline source="Bosh sahifa › Ariza bo'limi" heading="Ma'lumotlaringiz" compact />
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 px-5 py-14 text-sm text-slate-600" aria-label="Sayt altbilgisi">
      <div className={`${CONTAINER} grid gap-10 lg:grid-cols-[1.2fr_2fr_1fr]`}>
        <div>
          <p className="text-base font-bold tracking-[-0.03em] text-slate-900">OneRoom</p>
          <p className="mt-2 max-w-xs leading-relaxed">O&apos;quv markazlar uchun zamonaviy LMS va CRM tizimi. O&apos;zbekistonda ishlab chiqilgan.</p>
        </div>
        <div>
          <p className="font-bold text-slate-900">Yechimlar</p>
          <ul className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
            {CLUSTER_PAGES.map((p) => <li key={p.href}><Link href={p.href} className="hover:text-slate-900">{p.navLabel}</Link></li>)}
          </ul>
        </div>
        <div>
          <p className="font-bold text-slate-900">Aloqa</p>
          <ul className="mt-3 space-y-2">
            <li><a href={`tel:${CONTACT_PHONE}`} className="hover:text-slate-900">{CONTACT_PHONE_DISPLAY}</a></li>
            <li><a href={links.telegram} target="_blank" rel="noopener noreferrer" className="hover:text-slate-900">{links.telegramHandle}</a></li>
            <li><a href={`mailto:${links.email}`} className="hover:text-slate-900">{links.email}</a></li>
            <li><Link href="/login" className="hover:text-slate-900">Kirish</Link></li>
          </ul>
        </div>
      </div>
      <p className={`${CONTAINER} mt-10 border-t border-slate-200 pt-5 text-xs`}>© {new Date().getFullYear()} OneRoom. Barcha huquqlar himoyalangan.</p>
    </footer>
  );
}

export function HomeLanding() {
  return (
    <div data-landing-light="white" className="min-h-screen overflow-x-hidden bg-white text-slate-900 antialiased">
      <HomeKeyframes />
      <HomeHeader />
      <main id="main-content">
        <Hero />
        <Pillars />
        <FeaturesTabs />
        <Solutions />
        <HowSteps />
        <PricingPlans />
        <First />
        <Faq />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
