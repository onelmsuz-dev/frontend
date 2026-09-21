"use client";

import Link from "next/link";
import { getBlogUi } from "@/lib/i18n/blog-ui";
import { localizePath } from "@/lib/i18n/config";
import { useLocale } from "@/lib/i18n/use-locale";

/** "Maqola topilmadi" — til manzildan aniqlanadi (`not-found` sahifasi `params` olmaydi). */
export function BlogNotFound() {
  const locale = useLocale();
  const ui = getBlogUi(locale);
  return <main id="main-content" className="blog-main blog-intro"><span className="blog-eyebrow">404</span><h1>{ui.notFoundTitle}</h1><p>{ui.notFoundText}</p><Link href={localizePath("/blog", locale)} className="blog-blue-button">{ui.backBottom}</Link></main>;
}
