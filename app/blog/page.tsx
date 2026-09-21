import { BlogIndex, blogIndexMetadata } from "@/components/blog/blog-index";

export const metadata = blogIndexMetadata("uz");

export default function BlogPage() {
  return <BlogIndex locale="uz" />;
}
