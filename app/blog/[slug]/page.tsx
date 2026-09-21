import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, ChevronDown, Clock3, List } from "lucide-react";
import { getPost, getSections, posts } from "@/lib/blog/posts";
import { SITE_URL } from "@/lib/seo/site";
import { ArticleBody } from "@/components/blog/article-body";
import { ApplyButton } from "@/components/landing/apply-dialog";

export function generateStaticParams() { return posts.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) return { title: "Maqola topilmadi | OneRoom", robots: { index: false } };
  return {
    title: `${post.title} | OneRoom`, description: post.description,
    alternates: { canonical: `${SITE_URL}/blog/${post.slug}` },
    openGraph: { type: "article", title: post.title, description: post.description, url: `${SITE_URL}/blog/${post.slug}`, publishedTime: post.date, images: [{ url: post.image, width: 1600, height: 900, alt: post.imageAlt }] },
    twitter: { card: "summary_large_image", title: post.title, description: post.description, images: [post.image] },
    robots: { index: true, follow: true, googleBot: { "max-image-preview": "large" } },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const post = getPost((await params).slug);
  if (!post) notFound();
  const sections = getSections(post.markdown);
  const url = `${SITE_URL}/blog/${post.slug}`;
  const schema = [
    { "@context": "https://schema.org", "@type": "BlogPosting", headline: post.title, description: post.description, image: `${SITE_URL}${post.image}`, datePublished: post.date, dateModified: post.date, inLanguage: "uz", mainEntityOfPage: url, author: { "@type": "Organization", name: post.author, url: SITE_URL }, publisher: { "@type": "Organization", name: "OneRoom", url: SITE_URL, logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` } } },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Bosh sahifa", item: SITE_URL }, { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` }, { "@type": "ListItem", position: 3, name: post.title, item: url }] },
  ];
  return <main id="main-content" className="blog-main blog-article-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    <Link href="/blog" className="blog-back"><ArrowLeft size={17} aria-hidden /> Barcha maqolalar</Link>
    <header className="blog-article-header">
      <span className="blog-category">{post.category}</span><h1>{post.title}</h1>
      <div className="blog-article-byline"><Link href="/">{post.author}</Link><span>·</span><time dateTime={post.date}>{post.dateLabel}</time><span>·</span><span><Clock3 size={15} aria-hidden /> {post.readingMinutes} daqiqa o‘qish</span></div>
    </header>
    <Image className="blog-article-cover" src={post.image} alt={post.imageAlt} width={1600} height={900} priority sizes="(max-width: 1200px) 100vw, 1200px" />
    <div className="blog-reading">
      {/* Mundarija: yopiq turadigan yagona qator (sticky emas, matnni qoplamaydi); bosilganda ochiladi. */}
      <details className="blog-toc">
        <summary>
          <span className="blog-toc-title"><List size={18} aria-hidden /> Maqola mundarijasi</span>
          <span className="blog-toc-count">{sections.length} bo‘lim</span>
          <ChevronDown className="blog-toc-chevron" size={18} aria-hidden />
        </summary>
        <nav aria-label="Maqola mundarijasi"><ol>{sections.map((section) => {
          // Sarlavhadagi "1. " raqami belgiga ajratiladi (ikki marta chiqmasin); maqoladagi sarlavha o'zgarmaydi.
          const numbered = section.title.match(/^(\d+)\.\s+(.+)$/);
          return <li key={section.id}><a href={`#${section.id}`}><span className="blog-toc-num">{numbered ? numbered[1] : <ArrowRight size={12} aria-hidden />}</span><span>{numbered ? numbered[2] : section.title}</span></a></li>;
        })}</ol></nav>
      </details>
      <article className="blog-prose" aria-label={post.title}><ArticleBody markdown={post.markdown} />
        <div className="blog-article-cta"><span className="blog-eyebrow">KEYINGI QADAM</span><h2>Markazingiz misolida ko‘rib chiqamiz.</h2><p>Qaysi jarayonni tartibga solmoqchisiz? Demo uchun ariza qoldiring.</p><ApplyButton where={`Blog › ${post.slug}`} className="blog-blue-button">Demo ko‘rish <ArrowUpRight size={18} aria-hidden /></ApplyButton></div>
        <Link href="/blog" className="blog-back"><ArrowLeft size={17} aria-hidden /> Blogga qaytish</Link>
      </article>
    </div>
  </main>;
}
