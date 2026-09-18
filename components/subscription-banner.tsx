"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { useMe } from "@/lib/hooks/useMe";
import { formatUzDate } from "@/lib/date-uz";

/**
 * PANEL TEPASIDAGI OGOHLANTIRISH — tarif tugashiga oz qolganda.
 *
 * Ilgari bu ogohlantirish FAQAT Sozlamalar → "Tarif va muddat"
 * ichida edi. Markaz u yerga kunlab kirmasligi mumkin va muddat
 * tugagach hech qanday tayyorgarliksiz bloklanib qolardi — ya'ni
 * ogohlantirish bor edi, lekin ko'rmaydigan joyda (egasining talabi,
 * 2026-09-18).
 *
 * UCH QOIDA:
 *
 *  1. FAQAT 3 KUN VA UNDAN KAM qolganda. Chegara backendda
 *     (`EXPIRY_WARNING_DAYS`) — ekran uni o'zi qayta hisoblamaydi,
 *     aks holda ikki joyda ikki xil qoida paydo bo'lardi.
 *
 *  2. TUGAGANDAN KEYIN CHIQMAYDI. U holat boshqacha ishlanadi:
 *     `SubscriptionGate` markazni tarif bo'limiga yo'naltiradi va
 *     o'sha yerda qizil yozuv turadi. Ikkalasi birga chiqsa ekran
 *     ikki xil gap aytardi.
 *
 *  3. TARIF BO'LIMIDA TAKRORLANMAYDI. U yerda allaqachon batafsil
 *     yozuv bor.
 */
export function SubscriptionBanner() {
  const { me } = useMe();
  const pathname = usePathname();

  const sub = me?.subscription;
  if (!sub?.warning) return null;
  if (pathname?.startsWith("/settings")) return null;

  return (
    <div className="mx-4 mt-3 lg:mx-5 flex items-start sm:items-center gap-2.5 px-3 py-2.5
      rounded-xl bg-amber-50 dark:bg-amber-900/20
      border border-amber-200 dark:border-amber-900/40">
      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
      <p className="text-[12.5px] text-amber-800 dark:text-amber-300 flex-1 min-w-0">
        Tarif muddati tugayapti — <span className="font-bold">{sub.daysLeft} kun</span> qoldi
        {sub.expiresAt ? ` (${formatUzDate(sub.expiresAt)})` : ""}.
        {" "}To&apos;lovni amalga oshiring, aks holda muddat tugagach panel bloklanadi.
      </p>
      <Link href="/settings?tab=tarif"
        className="shrink-0 flex items-center gap-1 h-8 px-3 rounded-lg text-[12px] font-semibold
          bg-amber-600 hover:bg-amber-700 text-white transition-colors">
        Tarif
        <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
