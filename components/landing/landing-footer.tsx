import Link from "next/link";
import Image from "next/image";
import { CLUSTER_PAGES } from "@/lib/seo/cluster-pages";
import { CONTACT_PHONE, CONTACT_PHONE_DISPLAY } from "@/lib/seo/site";

// Faqat mavjud sahifalarga havolalar (ilgari /blog, /privacy, /help... kabi mavjud bo'lmagan
// manzillar bor edi — ular 404 berardi). "Yechimlar" — barcha klaster sahifalarga ichki havolalar.
const footerLinks = {
  Mahsulot: [
    { label: "Imkoniyatlar", href: "/#features" },
    { label: "Narxlar", href: "/#pricing" },
    { label: "Qanday ishlaydi", href: "/#how-it-works" },
    { label: "Bog'lanish", href: "/#contact" },
  ],
  Yechimlar: CLUSTER_PAGES.map((p) => ({ label: p.navLabel, href: p.href })),
};

const socials = [
  {
    name: "Telegram",
    href: "https://t.me/oneroomuz",
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
  },
  {
    name: "Instagram",
    href: "https://instagram.com/oneroom.uz",
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
      </svg>
    ),
  },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 px-5 py-14 text-sm text-slate-600 sm:px-8" aria-label="Sayt altbilgisi">
      <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-[1.1fr_0.7fr_1.7fr_1fr]">
        <div className="col-span-2 lg:col-span-1">
          <Link href="/" className="inline-flex items-center gap-2.5" aria-label="OneRoom bosh sahifa">
            <Image src="/logo.png" alt="OneRoom logo" width={30} height={30} className="rounded-lg" />
            <span className="text-base font-bold tracking-[-0.03em] text-slate-900">
              One<span className="text-blue-600">Room</span>
            </span>
          </Link>
          <p className="mt-3 max-w-xs leading-relaxed">O&apos;quv markazlar uchun zamonaviy LMS va CRM tizimi. O&apos;zbekistonda ishlab chiqilgan.</p>
          <div className="mt-5 flex gap-2">
            {socials.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.name}
                className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:border-blue-200 hover:text-blue-600"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        <div>
          <p className="font-bold text-slate-900">Mahsulot</p>
          <ul className="mt-3 space-y-2">
            {footerLinks.Mahsulot.map((l) => (
              <li key={l.label}><Link href={l.href} className="transition-colors hover:text-slate-900">{l.label}</Link></li>
            ))}
          </ul>
        </div>

        <div className="order-last col-span-2 lg:order-none lg:col-span-1">
          <p className="font-bold text-slate-900">Yechimlar</p>
          <ul className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
            {footerLinks.Yechimlar.map((l) => (
              <li key={l.href}><Link href={l.href} className="transition-colors hover:text-slate-900">{l.label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-bold text-slate-900">Aloqa</p>
          <ul className="mt-3 space-y-2">
            <li><a href={`tel:${CONTACT_PHONE}`} className="transition-colors hover:text-slate-900">{CONTACT_PHONE_DISPLAY}</a></li>
            <li><a href="https://t.me/oneroomuz" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-slate-900">@oneroomuz</a></li>
            <li><a href="mailto:info@oneroom.uz" className="transition-colors hover:text-slate-900">info@oneroom.uz</a></li>
            <li><Link href="/login" className="transition-colors hover:text-slate-900">Kirish</Link></li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-[1200px] flex-col gap-2 border-t border-slate-200 pt-5 text-xs sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} OneRoom. Barcha huquqlar himoyalangan.</p>
        <address className="not-italic">Toshkent, O&apos;zbekiston</address>
      </div>
    </footer>
  );
}
