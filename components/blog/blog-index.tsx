import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ArrowRight, BookOpen, Clock3, Wallet, ClipboardCheck, Users } from "lucide-react";
import { getPosts } from "@/lib/blog/posts";
import { getBlogUi } from "@/lib/i18n/blog-ui";
import { alternatesFor, localizePath, openGraphLocale, absoluteUrl, type Locale } from "@/lib/i18n/config";
import { ApplyButton } from "@/components/landing/apply-dialog";

const TOPIC_META = [
  { href: "/oquv-markaz-crm", icon: Users },
  { href: "/tolovlar", icon: Wallet },
  { href: "/davomat", icon: ClipboardCheck },
];

export function blogIndexMetadata(locale: Locale): Metadata {
  const ui = getBlogUi(locale);
  const posts = getPosts(locale);
  return {
    title: ui.metaTitle,
    description: ui.metaDescription,
    alternates: alternatesFor("/blog", locale),
    openGraph: {
      title: ui.ogTitle,
      url: absoluteUrl("/blog", locale),
      type: "website",
      ...(locale === "uz" ? {} : openGraphLocale(locale)),
      images: [{ url: posts[0].image, width: 1600, height: 900 }],
    },
    robots: { index: true, follow: true, googleBot: { "max-image-preview": "large" } },
  };
}

/** Blog bosh sahifasi — uch til uchun umumiy (`app/blog/page.tsx`, `app/[locale]/blog/page.tsx`). */
export function BlogIndex({ locale }: { locale: Locale }) {
  const posts = getPosts(locale);
  const ui = getBlogUi(locale);
  return <main id="main-content" className="blog-main">
    <section className="blog-intro" aria-labelledby="blog-title">
      <span className="blog-eyebrow"><span /> {ui.eyebrow}</span>
      <h1 id="blog-title">{ui.titleLine1}{" "}<br className="lg:hidden" /><span>{ui.titleLine2}</span></h1>
    </section>

    <section className="blog-section" aria-labelledby="articles-title">
      <div className="blog-section-heading"><h2 id="articles-title">{ui.latest}</h2><span>{ui.articlesCount(posts.length)}</span></div>
      <div className="blog-articles-grid">
        {posts.map((post, index) => <article key={post.slug} className={`blog-post-card ${index === 0 ? "blog-post-featured" : ""}`}>
          <Link href={localizePath(`/blog/${post.slug}`, locale)} className="blog-post-link">
            <div className="blog-cover"><Image src={post.image} alt={post.imageAlt} width={1600} height={900} priority={index === 0} sizes="(max-width: 760px) 100vw, 70vw" /><span className="blog-cover-label">{ui.coverLabel}</span></div>
            <div className="blog-card-copy">
              <div className="blog-meta"><span className="blog-category">{post.category}</span><span><Clock3 size={14} aria-hidden /> {post.readingMinutes} {ui.minutes}</span></div>
              <h3>{post.title}</h3><p>{post.description}</p>
              <div className="blog-card-bottom"><time dateTime={post.date}>{post.dateLabel}</time><span>{ui.readArticle} <ArrowUpRight size={19} aria-hidden /></span></div>
            </div>
          </Link>
        </article>)}
        <aside className="blog-help-card">
          <span className="blog-help-icon"><BookOpen size={26} aria-hidden /></span>
          <span className="blog-eyebrow">{ui.helpEyebrow}</span>
          <h2>{ui.helpTitle1}{" "}<br />{ui.helpTitle2}</h2>
          <p>{ui.helpText}</p>
          <ApplyButton where="Blog › Demo kartochkasi" className="blog-white-button">{ui.helpButton} <ArrowUpRight size={18} aria-hidden /></ApplyButton>
          <Link href={localizePath("/", locale)} className="blog-help-link">{ui.helpLink} <ArrowRight size={16} aria-hidden /></Link>
        </aside>
      </div>
    </section>

    <section className="blog-section blog-topics" aria-labelledby="topics-title">
      <div className="blog-section-heading"><div><span className="blog-eyebrow">{ui.topicsEyebrow}</span><h2 id="topics-title">{ui.topicsTitle}</h2></div></div>
      <div className="blog-topic-grid">{TOPIC_META.map(({ icon: Icon, href }, i) => <Link href={localizePath(href, locale)} key={href} className="blog-topic-card"><div className="blog-topic-top"><span><Icon size={23} aria-hidden /></span><small>0{i + 1}</small></div><h3>{ui.topics[i].title}</h3><p>{ui.topics[i].description}</p><span className="blog-topic-link">{ui.topicLink} <ArrowUpRight size={18} aria-hidden /></span></Link>)}</div>
    </section>
  </main>;
}
