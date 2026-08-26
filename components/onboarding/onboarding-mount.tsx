"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useFeature } from "@/lib/hooks/useFeatures";
import { useMe } from "@/lib/hooks/useMe";
import {
  OnboardingCtx, INERT_ONBOARDING, type OnboardingCtxValue,
} from "@/lib/contexts/onboarding-context";

/**
 * Bayroq darvozasi.
 *
 * `ssr: false` — bayroq o'chiq markazga onboarding kod BO'LAGI yuklanmaydi.
 */
const OnboardingRuntime = dynamic(
  () => import("./onboarding-runtime").then((m) => m.OnboardingRuntime),
  { ssr: false },
);

/**
 * MUHIM: `children` HAR DOIM bitta va o'sha `OnboardingCtx.Provider` ostida
 * qoladi — daraxtdagi o'rni hech qachon o'zgarmaydi.
 *
 * Ilgari bu komponent bayroq holatiga qarab `<Provider>{children}</Provider>`
 * bilan `<OnboardingRuntime>{children}</OnboardingRuntime>` orasida
 * almashardi. Ildiz element TIPI o'zgargani uchun React `/api/features`
 * javobi kelgan lahzada BUTUN dashboardni (sidebar, sahifa, ochiq modal,
 * SWR keshi) yo'q qilib qayta chizardi — foydalanuvchi bo'sh ekranni ko'rardi
 * va ochiq forma yo'qolardi.
 *
 * Endi runtime — bola emas, YONDOSH element. U holatni `onValue` orqali
 * yuqoriga uzatadi va faqat qoplamalarni chizadi.
 */
export function OnboardingMount({ children }: { children: React.ReactNode }) {
  const onboardingOn = useFeature("onboarding");
  const { me } = useMe();
  const [value, setValue] = useState<OnboardingCtxValue>(INERT_ONBOARDING);

  const enabled =
    onboardingOn === true &&
    !!me?.organizationId &&
    !me?.subscriptionBlocked && // tarifi tugagan markazda yo'l ko'rsatish o'rinsiz
    me.role !== "TEACHER" &&
    me.role !== "STUDENT" &&
    me.role !== "PLATFORM_ADMIN";

  return (
    <OnboardingCtx.Provider value={enabled ? value : INERT_ONBOARDING}>
      {children}
      {enabled && <OnboardingRuntime onValue={setValue} />}
    </OnboardingCtx.Provider>
  );
}
