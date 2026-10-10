"use client";

import { useFeature } from "@/lib/hooks/useFeatures";
import { useMe, hasPerm } from "@/lib/hooks/useMe";
import { useSalaryAdvances } from "@/lib/hooks/useSalaryAdvances";
import { formatCurrency } from "@/lib/money";

/**
 * XARAJAT OYNASIDA "MAOSH" TANLANGANDA — oylik avansi alohida xarajat
 * emas. Qo'lda "Maosh" yozadigan markaz avansni ham alohida yozsa, pul
 * ikki marta sanaladi; faqat qo'lga berilganini yozsa — kam.
 */
export function MaoshEslatma({ category }: { category: string }) {
  const yoqiq = useFeature("salary-advance") === true;
  const { me } = useMe();
  const koradi = hasPerm(me?.permissions, "salaries.view");
  const maosh = category.trim().toLowerCase() === "maosh";
  const { data } = useSalaryAdvances(undefined, yoqiq && koradi && maosh);
  if (!yoqiq || !maosh) return null;
  return (
    <p className="rounded-xl border border-amber-300/70 bg-amber-50 dark:bg-amber-950/30 p-3 text-[12px] leading-relaxed text-amber-800 dark:text-amber-300" data-maosh-eslatma>
      {"Oylik avansi Xarajatlarga alohida yozilmaydi. O'qituvchi oyligini qo'lda yozsangiz, oy oxirida TO'LIQ hisoblangan summani yozing (avans ham shu summa ichida). Xodim oyligi «To'landi» bosilganda o'zi yoziladi, qayta yozmang."}
      {data && data.jami.given > 0 && (
        <span className="block mt-1 font-semibold">
          {`Bu oy berilgan oylik avanslari: ${formatCurrency(data.jami.given)} (${data.jami.givenCount} kishi).`}
        </span>
      )}
    </p>
  );
}
