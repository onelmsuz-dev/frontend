import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, ChevronDown, Clock3, List } from "lucide-react";
import { getPost, getSections } from "@/lib/blog/posts";
import { getBlogUi } from "@/lib/i18n/blog-ui";
import { absoluteUrl, alternatesFor, localizePath, openGraphLocale, type Locale } from "@/lib/i18n/config";
import { SITE_URL } from "@/lib/seo/site";
import { ArticleBody } from "@/components/blog/article-body";
import { ApplyButton } from "@/components/landing/apply-dialog";

export function articleMetadata(slug: string, locale: Locale): Metadata {
  const ui = getBlogUi(locale);
  const post = getPost(slug, locale);
  if (!post) return { title: ui.notFoundMeta, robots: { index: false } };
  const url = absoluteUrl(`/blog/${post.slug}`, locale);
  return {
    title: `${post.title} | OneRoom`, description: post.description,
    alternates: alternatesFor(`/blog/${post.slug}`, locale),
    openGraph: { type: "article", ...(locale === "uz" ? {} : openGraphLocale(locale)), title: post.title, description: post.description, url, publishedTime: post.date, images: [{ url: post.image, width: 1600, height: 900, alt: post.imageAlt }] },
    twitter: { card: "summary_large_image", title: post.title, description: post.description, images: [post.image] },
    robots: { index: true, follow: true, googleBot: { "max-image-preview": "large" } },
  };
}

/** Maqola sahifasi — uch til uchun umumiy (`app/blog/[slug]`, `app/[locale]/blog/[slug]`). */
export function BlogArticle({ slug, locale }: { slug: string; locale: Locale }) {
  const post = getPost(slug, locale);
  if (!post) notFound();
  const ui = getBlogUi(locale);
  const sections = getSections(post.markdown);
  const url = absoluteUrl(`/blog/${post.slug}`, locale);
  const blogHref = localizePath("/blog", locale);
  const schema = [
    { "@context": "https://schema.org", "@type": "BlogPosting", headline: post.title, description: post.description, image: `${SITE_URL}${post.image}`, datePublished: post.date, dateModified: post.date, inLanguage: locale, mainEntityOfPage: url, author: { "@type": "Organization", name: post.author, url: SITE_URL }, publisher: { "@type": "Organization", name: "OneRoom", url: SITE_URL, logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` } } },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: ui.breadcrumbHome, item: absoluteUrl("/", locale) }, { "@type": "ListItem", position: 2, name: ui.breadcrumbBlog, item: absoluteUrl("/blog", locale) }, { "@type": "ListItem", position: 3, name: post.title, item: url }] },
  ];
  return <main id="main-content" className="blog-main blog-article-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    <Link href={blogHref} className="blog-back"><ArrowLeft size={17} aria-hidden /> {ui.back}</Link>
    <header className="blog-article-header">
      <span className="blog-category">{post.category}</span><h1>{post.title}</h1>
      <div className="blog-article-byline"><Link href={localizePath("/", locale)}>{post.author}</Link><span>·</span><time dateTime={post.date}>{post.dateLabel}</time><span>·</span><span><Clock3 size={15} aria-hidden /> {ui.readingTime(post.readingMinutes)}</span></div>
    </header>
    <Image className="blog-article-cover" src={post.image} alt={post.imageAlt} width={1600} height={900} priority sizes="(max-width: 1200px) 100vw, 1200px" />
    <div className="blog-reading">
      {/* Mundarija: yopiq turadigan yagona qator (sticky emas, matnni qoplamaydi); bosilganda ochiladi. */}
      <details className="blog-toc">
        <summary>
          <span className="blog-toc-title"><List size={18} aria-hidden /> {ui.toc}</span>
          <span className="blog-toc-count">{ui.sectionsCount(sections.length)}</span>
          <ChevronDown className="blog-toc-chevron" size={18} aria-hidden />
        </summary>
        <nav aria-label={ui.toc}><ol>{sections.map((section) => {
          // Sarlavhadagi "1. " raqami belgiga ajratiladi (ikki marta chiqmasin); maqoladagi sarlavha o'zgarmaydi.
          const numbered = section.title.match(/^(\d+)\.\s+(.+)$/);
          return <li key={section.id}><a href={`#${section.id}`}><span className="blog-toc-num">{numbered ? numbered[1] : <ArrowRight size={12} aria-hidden />}</span><span>{numbered ? numbered[2] : section.title}</span></a></li>;
        })}</ol></nav>
      </details>
      <article className="blog-prose" aria-label={post.title}><ArticleBody markdown={post.markdown} tableLabel={ui.tableLabel} />
        <div className="blog-article-cta"><span className="blog-eyebrow">{ui.ctaEyebrow}</span><h2>{ui.ctaTitle}</h2><p>{ui.ctaText}</p><ApplyButton where={`Blog › ${post.slug}`} className="blog-blue-button">{ui.ctaButton} <ArrowUpRight size={18} aria-hidden /></ApplyButton></div>
        <Link href={blogHref} className="blog-back"><ArrowLeft size={17} aria-hidden /> {ui.backBottom}</Link>
      </article>
    </div>
  </main>;
}
