import { notFound } from "next/navigation";
import { BlogShell } from "@/components/blog/blog-shell";
import "../../blog/blog.css";

export default async function LocaleBlogLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== "ru" && locale !== "en") notFound();
  return <BlogShell locale={locale}>{children}</BlogShell>;
}
