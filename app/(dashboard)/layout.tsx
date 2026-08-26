import type { Metadata } from "next";
import { LayoutSwitcher } from "@/components/layout-switcher";

// SEO faqat landing sahifalar uchun — ilova ekranlari (avtorizatsiya talab
// qiladigan barcha `/dashboard`, `/students`, `/finance` va h.k.) qidiruvga
// chiqmasligi kerak. `app/robots.ts` ham shu yo'llarni Disallow qiladi.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <LayoutSwitcher>{children}</LayoutSwitcher>;
}
