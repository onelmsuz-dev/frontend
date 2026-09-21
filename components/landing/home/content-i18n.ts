/**
 * BOSH SAHIFA MATNLARI — til bo'yicha.
 *
 * O'zbekcha manba `content.ts` (o'zgarmagan). Ruscha/inglizcha tarjimalar (`content-ru.ts`,
 * `content-en.ts`) faqat MATNNI beradi; rasm, ikonka, rang, `highlight` kabi maydonlar o'zbekcha
 * manbadan olinadi (tartib bir xil). Server komponentlar shu yerdan o'qib, kerakli qismini
 * brauzer komponentlariga prop qilib beradi (brauzer to'plamiga barcha tillar tushmasin).
 */
import type { Locale } from "@/lib/i18n/config";
import * as uz from "./content";
import { homeRu } from "./content-ru";
import { homeEn } from "./content-en";

export interface HomeCopy {
  pillars: { eyebrow: string; title: string; description: string }[];
  features: { title: string; description: string }[];
  steps: { title: string; description: string; badge: string }[];
  plans: {
    price: string;
    period: string;
    description: string;
    limits: string[];
    features: string[];
    cta: string;
    badge?: string;
  }[];
  hero: typeof uz.hero;
  featuresCopy: typeof uz.featuresCopy;
  solutionsCopy: typeof uz.solutionsCopy;
  howCopy: typeof uz.howCopy;
  pricingCopy: typeof uz.pricingCopy;
  firstCopy: typeof uz.firstCopy;
  faqCopy: typeof uz.faqCopy;
  contactCopy: typeof uz.contactCopy;
  faqItems: { question: string; answer: string }[];
}

export interface HomeContent {
  pillars: typeof uz.pillars;
  features: typeof uz.features;
  steps: typeof uz.steps;
  plans: typeof uz.plans;
  hero: typeof uz.hero;
  featuresCopy: typeof uz.featuresCopy;
  solutionsCopy: typeof uz.solutionsCopy;
  howCopy: typeof uz.howCopy;
  pricingCopy: typeof uz.pricingCopy;
  firstCopy: typeof uz.firstCopy;
  faqCopy: typeof uz.faqCopy;
  contactCopy: typeof uz.contactCopy;
  faqItems: HomeCopy["faqItems"];
}

const UZ: HomeContent = {
  pillars: uz.pillars,
  features: uz.features,
  steps: uz.steps,
  plans: uz.plans,
  hero: uz.hero,
  featuresCopy: uz.featuresCopy,
  solutionsCopy: uz.solutionsCopy,
  howCopy: uz.howCopy,
  pricingCopy: uz.pricingCopy,
  firstCopy: uz.firstCopy,
  faqCopy: uz.faqCopy,
  contactCopy: uz.contactCopy,
  faqItems: uz.faqItems,
};

function merge(t: HomeCopy): HomeContent {
  return {
    pillars: uz.pillars.map((p, i) => ({ ...p, ...t.pillars[i] })),
    features: uz.features.map((f, i) => ({ ...f, ...t.features[i] })),
    steps: uz.steps.map((s, i) => ({ ...s, ...t.steps[i] })),
    plans: uz.plans.map((p, i) => ({ ...p, ...t.plans[i] })) as typeof uz.plans,
    hero: t.hero,
    featuresCopy: t.featuresCopy,
    solutionsCopy: t.solutionsCopy,
    howCopy: t.howCopy,
    pricingCopy: t.pricingCopy,
    firstCopy: t.firstCopy,
    faqCopy: t.faqCopy,
    contactCopy: t.contactCopy,
    faqItems: t.faqItems,
  };
}

const RU = merge(homeRu);
const EN = merge(homeEn);

export function getHomeContent(locale: Locale): HomeContent {
  return locale === "ru" ? RU : locale === "en" ? EN : UZ;
}
