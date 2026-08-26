import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";
import { CLUSTER_PAGES } from "@/lib/seo/cluster-pages";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...CLUSTER_PAGES.map((p) => ({
      url: `${SITE_URL}${p.href}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: p.href === "/oquv-markaz-crm" ? 0.9 : 0.8,
    })),
  ];
}
