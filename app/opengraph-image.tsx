import { OG_SIZE, renderOgCard } from "@/lib/seo/og-card";

/**
 * Butun sayt uchun umumiy OG-rasm — kod orqali generatsiya qilinadi
 * (`public/og-image.png` degan tayyor fayl talab qilinmaydi). Har bir
 * cluster sahifasi ham shu file-convention orqali avtomatik meros oladi,
 * chunki ular alohida `opengraph-image` belgilamagan. Ruscha/inglizcha
 * sahifalar uchun — `app/[locale]/opengraph-image.tsx` (shior tarjimasi).
 */
export const alt = "OneRoom — O'quv markazlar uchun CRM va boshqaruv tizimi";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderOgCard("O'quv markazlar uchun CRM va boshqaruv tizimi");
}
