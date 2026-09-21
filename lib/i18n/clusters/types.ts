/**
 * Yechim (klaster) sahifasining bitta tildagi matnlari. O'zbekcha manba — `app/<sahifa>/page.tsx`
 * (o'zgarmagan); ruscha/inglizcha shu tuzilmada `lib/i18n/clusters/<sahifa>.ts` da.
 * Ikonkalar va ichki (Telegram) manba yorlig'i `index.ts` da — tilga bog'liq emas.
 */
export interface ClusterDoc {
  /** <title> */
  title: string;
  /** <meta description> va JSON-LD Service tavsifi */
  description: string;
  keywords: string[];
  /** JSON-LD Service.serviceType */
  serviceType: string;
  eyebrow: string;
  h1: string;
  subtitle: string;
  heroBullets: string[];
  painHeading: string;
  painSubheading?: string;
  painPoints: { title: string; body: string }[];
  featuresHeading: string;
  featuresSubheading?: string;
  /** Ikonkalar `index.ts` da, shu tartibda */
  features: { title: string; body: string }[];
  steps?: { title: string; body: string }[];
  faqHeading: string;
  faq: { question: string; answer: string }[];
  leadHeading: string;
  leadDescription: string;
  leadCta: string;
}
