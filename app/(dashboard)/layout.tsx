import { LayoutSwitcher } from "@/components/layout-switcher";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <LayoutSwitcher>{children}</LayoutSwitcher>;
}
