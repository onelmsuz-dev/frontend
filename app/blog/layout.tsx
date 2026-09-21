import { ApplyProvider } from "@/components/landing/apply-dialog";
import { HomeHeader } from "@/components/landing/home/home-header";
import { LandingFooter } from "@/components/landing/landing-footer";
import "./blog.css";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <ApplyProvider page="Blog">
    <div data-landing-light="slate" className="blog-shell"><HomeHeader />{children}<LandingFooter /></div>
  </ApplyProvider>;
}
