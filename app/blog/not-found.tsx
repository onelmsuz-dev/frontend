import Link from "next/link";

export default function BlogNotFound() {
  return <main id="main-content" className="blog-main blog-intro"><span className="blog-eyebrow">404</span><h1>Maqola topilmadi.</h1><p>Havola o‘zgargan bo‘lishi mumkin. Boshqa maqolalarni blogdan topasiz.</p><Link href="/blog" className="blog-blue-button">Blogga qaytish</Link></main>;
}
