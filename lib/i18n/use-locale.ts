"use client";

import { usePathname } from "next/navigation";
import { localeFromPathname, type Locale } from "./config";

/**
 * Brauzer komponentlari uchun joriy til — manzildan (`/ru/...`, `/en/...`; aks holda o'zbekcha).
 * Kontekst yoki prop kerak emas: server ham, brauzer ham bir xil natija beradi (gidratsiya mos).
 */
export function useLocale(): Locale {
  return localeFromPathname(usePathname());
}
