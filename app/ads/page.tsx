import type { Metadata } from "next";
import { AdsFunnel } from "./ads-funnel";

/**
 * REKLAMA SAHIFASI (`/ads`).
 *
 * Reklamadan kelgan odam uchun. ATAYLAB navigatsiyasiz: landing header/footer
 * bu yerda yo'q, chunki har bir chiquvchi havola so'rovnomani tashlab ketish
 * ehtimolini oshiradi.
 *
 * `noindex` — bu sahifa qidiruvda emas, faqat reklama trafigi uchun. Aks
 * holda u landing bilan bir xil so'rovlar bo'yicha raqobatlashib qolardi.
 */
export const metadata: Metadata = {
  title: "OneRoom — markazingiz uchun yechim tanlang",
  description:
    "5 ta savolga javob bering — markazingizga mos yechimni ko'rsatamiz va " +
    "mutaxassisimiz siz bilan bog'lanadi.",
  robots: { index: false, follow: false },
};

export default function AdsPage() {
  return <AdsFunnel />;
}
