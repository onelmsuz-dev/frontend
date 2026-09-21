import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";
import { CLUSTER_PAGES } from "@/lib/seo/cluster-pages";
import { posts } from "@/lib/blog/posts";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    { url: `${SITE_URL}/blog`, lastModified: new Date(posts[0].date), changeFrequency: "weekly", priority: 0.8 },
    ...posts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...CLUSTER_PAGES.map((p) => ({
      url: `${SITE_URL}${p.href}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: p.href === "/oquv-markaz-crm" ? 0.9 : 0.8,
    })),
  ];
}
