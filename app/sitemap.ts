import type { MetadataRoute } from "next";
import { CLUSTER_PAGES } from "@/lib/seo/cluster-pages";
import { getPosts } from "@/lib/blog/posts";
import { LOCALES, absoluteUrl } from "@/lib/i18n/config";

type Entry = MetadataRoute.Sitemap[number];

/**
 * Har bir sahifa uch tilda (`/`, `/ru`, `/en`): har biri alohida yozuv, hammasida bir xil `hreflang`
 * ro'yxati (tillar bir-biriga ikki tomonlama ishora qiladi — Google talabi) va `x-default` = o'zbekcha.
 */
function localized(path: string, base: Omit<Entry, "url" | "alternates">): Entry[] {
  const languages = {
    uz: absoluteUrl(path, "uz"),
    ru: absoluteUrl(path, "ru"),
    en: absoluteUrl(path, "en"),
    "x-default": absoluteUrl(path, "uz"),
  };
  return LOCALES.map((locale) => ({ url: absoluteUrl(path, locale), ...base, alternates: { languages } }));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const posts = getPosts("uz");

  return [
    ...localized("/", { lastModified: now, changeFrequency: "weekly", priority: 1 }),
    ...localized("/blog", { lastModified: new Date(posts[0].date), changeFrequency: "weekly", priority: 0.8 }),
    ...posts.flatMap((post) =>
      localized(`/blog/${post.slug}`, { lastModified: new Date(post.date), changeFrequency: "monthly", priority: 0.7 }),
    ),
    ...CLUSTER_PAGES.flatMap((p) =>
      localized(p.href, {
        lastModified: now,
        changeFrequency: "monthly",
        priority: p.href === "/oquv-markaz-crm" ? 0.9 : 0.8,
      }),
    ),
  ];
}
