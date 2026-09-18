import { TorNav } from "@/components/navs/tor-nav";
import { BottomNav } from "@/components/navs/bottom-nav";
import { BranchProvider } from "@/lib/contexts/branch-context";
import { SubscriptionGate } from "@/components/subscription-gate";
import { SubscriptionBanner } from "@/components/subscription-banner";
import { OnboardingMount } from "@/components/onboarding/onboarding-mount";
import { ScheduleDrawer } from "@/components/schedule/schedule-drawer";

export function LayoutSwitcher({ children }: { children: React.ReactNode }) {
  return (
    <BranchProvider>
      {/* Split diagonal backdrop — fixed so it stays put while content scrolls */}
      <div className="app-bg-base fixed inset-0 -z-20" />
      <div className="app-bg-split fixed inset-0 -z-10" />

      {/* Yo'l ko'rsatuvchi butun panel bo'ylab yashaydi: tur sahifadan
          sahifaga o'tganda ham uzilib qolmasligi kerak. Bayroq o'chiq bo'lsa
          `OnboardingMount` faqat harakatsiz kontekst beradi — qo'shimcha
          so'rov ham, kod bo'lagi ham yuklanmaydi. */}
      <OnboardingMount>
        <div className="relative flex min-h-screen gap-3 p-0 lg:gap-4 lg:p-4">
          <TorNav />
          <main className="min-h-screen min-w-0 flex-1 pb-[80px] lg:min-h-0 lg:pb-0">
            {/* Tarif tugashiga oz qolganda — HAR SAHIFANING tepasida.
                Sozlamalar ichida chizilmaydi: u yerda batafsil yozuv bor. */}
            <SubscriptionBanner />
            <SubscriptionGate>{children}</SubscriptionGate>
          </main>
          <BottomNav />
          {/* YON JADVAL — o'ng chekkadagi tugma bilan ochiladi va har
              sahifada bir xil turadi. Yopiq holatda hech qanday so'rov
              yubormaydi; `schedule.view` ruxsati yo'q bo'lsa umuman
              chizilmaydi. */}
          <ScheduleDrawer />
        </div>
      </OnboardingMount>
    </BranchProvider>
  );
}
