import { BlogShell } from "@/components/blog/blog-shell";
import "./blog.css";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <BlogShell locale="uz">{children}</BlogShell>;
}
