import type { Metadata } from "next";
import { BlogArticle, articleMetadata } from "@/components/blog/blog-article";
import { getPosts } from "@/lib/blog/posts";

export function generateStaticParams() { return getPosts("uz").map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  return articleMetadata((await params).slug, "uz");
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  return <BlogArticle slug={(await params).slug} locale="uz" />;
}
