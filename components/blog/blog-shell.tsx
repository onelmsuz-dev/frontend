import { ApplyProvider } from "@/components/landing/apply-dialog";
import { HomeHeader } from "@/components/landing/home/home-header";
import { LandingFooter } from "@/components/landing/landing-footer";
import type { Locale } from "@/lib/i18n/config";

/** Blog sahifalari qobig'i (navbar, ariza modali, footer) — uch til uchun umumiy. `blog.css` — marshrut maketlarida import qilinadi. */
export function BlogShell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    <ApplyProvider page={locale === "uz" ? "Blog" : `Blog [${locale.toUpperCase()}]`}>
      <div data-landing-light="slate" data-lang={locale} className="blog-shell"><HomeHeader />{children}<LandingFooter locale={locale} /></div>
    </ApplyProvider>
  );
}
