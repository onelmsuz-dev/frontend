import { OG_SIZE, renderOgCard } from "@/lib/seo/og-card";

/** Ruscha (`/ru/...`) va inglizcha (`/en/...`) sahifalar uchun OG-rasm — shior mos tilda. */
export const alt = "OneRoom";
export const size = OG_SIZE;
export const contentType = "image/png";

const TAGLINE: Record<string, string> = {
  ru: "CRM и система управления для учебных центров",
  en: "CRM and management system for learning centers",
};

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return renderOgCard(TAGLINE[locale] ?? TAGLINE.en);
}
