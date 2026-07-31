import { TorNav } from "@/components/navs/tor-nav";
import { BottomNav } from "@/components/navs/bottom-nav";
import { BranchProvider } from "@/lib/contexts/branch-context";
import { SubscriptionGate } from "@/components/subscription-gate";

export function LayoutSwitcher({ children }: { children: React.ReactNode }) {
  return (
    <BranchProvider>
      <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <TorNav />
        <main className="flex-1 min-h-screen min-w-0 pb-[65px] lg:pb-0">
          <SubscriptionGate>{children}</SubscriptionGate>
        </main>
        <BottomNav />
      </div>
    </BranchProvider>
  );
}
