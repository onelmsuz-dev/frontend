import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";

/**
 * SEO faqat landing sahifalar uchun — ilova (dashboard/panel/admode) va
 * autentifikatsiya sahifalari qidiruvdan chetlashtiriladi. `(dashboard)`
 * guruhi `robots: { index: false }` bilan qoplangan (app/(dashboard)/layout.tsx),
 * bu yerdagi Disallow — ikkinchi qatlam himoya: barcha ilova segmentlari
 * "use client" bo'lgani uchun metadata eksport qila olmaydi.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/dashboard",
        "/students",
        "/teachers",
        "/groups",
        "/courses",
        "/leads",
        "/finance",
        "/salary",
        "/reports",
        "/settings",
        "/sms",
        "/schedule",
        "/attendance",
        "/gamification",
        "/login",
        "/panel",
        "/admode",
        "/ads",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
