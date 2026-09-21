import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ArrowRight, BookOpen, Clock3, Wallet, ClipboardCheck, Users } from "lucide-react";
import { posts } from "@/lib/blog/posts";
import { SITE_URL } from "@/lib/seo/site";
import { ApplyButton } from "@/components/landing/apply-dialog";

export const metadata: Metadata = {
  title: "Blog — o‘quv markazini boshqarish bo‘yicha qo‘llanmalar | OneRoom",
  description: "CRM tanlash, to‘lov, davomat va o‘quv markazini boshqarish bo‘yicha o‘zbekcha amaliy maqolalar. OneRoom blogi.",
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: { title: "OneRoom Blog — markazingiz uchun foydali bilimlar", url: `${SITE_URL}/blog`, type: "website", images: [{ url: posts[0].image, width: 1600, height: 900 }] },
  robots: { index: true, follow: true, googleBot: { "max-image-preview": "large" } },
};

const topics = [
  { title: "CRM va o‘quvchilar", description: "Murojaatdan guruhga yozilishgacha bo‘lgan jarayon.", href: "/oquv-markaz-crm", icon: Users },
  { title: "To‘lov va moliya", description: "To‘lovlar, qarzdorlik va hisob-kitobni tartibga solish.", href: "/tolovlar", icon: Wallet },
  { title: "Davomat nazorati", description: "Darslar va o‘quvchilar qatnashuvini bir joyda kuzatish.", href: "/davomat", icon: ClipboardCheck },
];

export default function BlogPage() {
  return <main id="main-content" className="blog-main">
    <section className="blog-intro" aria-labelledby="blog-title">
      <span className="blog-eyebrow"><span /> ONEROOM BLOG</span>
      <h1 id="blog-title">Markazingiz uchun{" "}<br className="lg:hidden" /><span>foydali bilimlar.</span></h1>
    </section>

    <section className="blog-section" aria-labelledby="articles-title">
      <div className="blog-section-heading"><h2 id="articles-title">So‘nggi maqolalar</h2><span>{posts.length} ta maqola</span></div>
      <div className="blog-articles-grid">
        {posts.map((post, index) => <article key={post.slug} className={`blog-post-card ${index === 0 ? "blog-post-featured" : ""}`}>
          <Link href={`/blog/${post.slug}`} className="blog-post-link">
            <div className="blog-cover"><Image src={post.image} alt={post.imageAlt} width={1600} height={900} priority={index === 0} sizes="(max-width: 760px) 100vw, 70vw" /><span className="blog-cover-label">AMALIY QO‘LLANMA</span></div>
            <div className="blog-card-copy">
              <div className="blog-meta"><span className="blog-category">{post.category}</span><span><Clock3 size={14} aria-hidden /> {post.readingMinutes} daqiqa</span></div>
              <h3>{post.title}</h3><p>{post.description}</p>
              <div className="blog-card-bottom"><time dateTime={post.date}>{post.dateLabel}</time><span>Maqolani o‘qish <ArrowUpRight size={19} aria-hidden /></span></div>
            </div>
          </Link>
        </article>)}
        <aside className="blog-help-card">
          <span className="blog-help-icon"><BookOpen size={26} aria-hidden /></span>
          <span className="blog-eyebrow">O‘QING. SINAB KO‘RING.</span>
          <h2>Bilimdan{" "}<br />amaliyotga.</h2>
          <p>Markazingizdagi jarayonlarni OneRoom’da qanday yuritishni demo davomida ko‘rib chiqing.</p>
          <ApplyButton where="Blog › Demo kartochkasi" className="blog-white-button">Demo ko‘rish <ArrowUpRight size={18} aria-hidden /></ApplyButton>
          <Link href="/" className="blog-help-link">OneRoom haqida <ArrowRight size={16} aria-hidden /></Link>
        </aside>
      </div>
    </section>

    <section className="blog-section blog-topics" aria-labelledby="topics-title">
      <div className="blog-section-heading"><div><span className="blog-eyebrow">YECHIMLAR BILAN TANISHING</span><h2 id="topics-title">Qaysi ishni yengillashtiramiz?</h2></div></div>
      <div className="blog-topic-grid">{topics.map(({ icon: Icon, ...topic }, i) => <Link href={topic.href} key={topic.href} className="blog-topic-card"><div className="blog-topic-top"><span><Icon size={23} aria-hidden /></span><small>0{i + 1}</small></div><h3>{topic.title}</h3><p>{topic.description}</p><span className="blog-topic-link">Imkoniyatlarni ko‘rish <ArrowUpRight size={18} aria-hidden /></span></Link>)}</div>
    </section>
  </main>;
}
