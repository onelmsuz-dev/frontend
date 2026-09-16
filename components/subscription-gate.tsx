"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, CreditCard } from "lucide-react";
import { useMe } from "@/lib/hooks/useMe";

/**
 * Tarif muddati TUGAGAN bo'lsa (imtiyozli davr yo'q), markazni tarif
 * bo'limiga yo'naltiradi va qolgan sahifalarni qoplaydi.
 *
 * Backend allaqachon shu holatda API so'rovlarini 402 bilan rad etadi —
 * bu qatlam faqat sababni tushunarli qilib ko'rsatadi va to'lovga olib
 * boradi. Ya'ni bloklash INTERFEYSDA emas, serverda.
 */
export function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const { me } = useMe();
  const pathname = usePathname();
  const router = useRouter();

  const onSettings = pathname?.startsWith("/settings");
  const blocked = me?.subscriptionBlocked === true;

  /**
   * TUGAGACH — O'ZI TARIF BO'LIMIGA YO'NALTIRADI.
   *
   * Ilgari faqat qoplama va "To'lov qilish" tugmasi chiqardi: markaz
   * kirardi, ekranni ko'rardi va tugmani bosishi kerak edi. Egasining
   * talabi (2026-09-16): muddat tugagach markaz KIRSIN, lekin
   * TO'G'RIDAN-TO'G'RI tarif bo'limiga tushsin va boshqa bo'limlar
   * ishlamasin. Boshqa bo'limga o'tishga urinish shu yerdan qaytariladi.
   */
  useEffect(() => {
    if (blocked && !onSettings) router.replace("/settings");
  }, [blocked, onSettings, router]);

  if (blocked && !onSettings) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h2 className="text-[16px] font-bold text-neutral-900 dark:text-neutral-100">Tarif muddati tugagan</h2>
            <p className="text-[13px] text-neutral-500 dark:text-neutral-400 mt-1.5">
              Markazingiz obunasi tugagan. Tarif bo&apos;limiga o&apos;tkazilyapti —
              xizmatdan davom etish uchun to&apos;lovni amalga oshiring.
            </p>
          </div>
          <Link href="/settings"
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-indigo-600 text-white dark:bg-indigo-500 text-[13px] font-semibold hover:opacity-90 transition-opacity">
            <CreditCard className="w-4 h-4" />
            To&apos;lov qilish
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
