"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, CreditCard } from "lucide-react";
import { useMe } from "@/lib/hooks/useMe";

/**
 * Tarif muddati + grace-period tugagan bo'lsa, /settings dan boshqa barcha
 * sahifalarni to'liq ekranli ogohlantirish bilan qoplaydi. Backend allaqachon
 * shu holatda API so'rovlarini rad etadi (402) — bu faqat sababni tushunarli
 * qilib ko'rsatadi va to'lov sahifasiga yo'l ko'rsatadi.
 */
export function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const { me } = useMe();
  const pathname = usePathname();

  const onSettings = pathname?.startsWith("/settings");
  const blocked = me?.subscriptionBlocked === true;

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
              Markazingiz obunasi tugagan va imtiyozli muddat ham o'tgan. Xizmatdan davom etish uchun to'lovni amalga oshiring.
            </p>
          </div>
          <Link href="/settings"
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-[13px] font-semibold hover:opacity-90 transition-opacity">
            <CreditCard className="w-4 h-4" />
            To'lov qilish
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
