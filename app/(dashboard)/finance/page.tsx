"use client";

import { Suspense } from "react";
import { FinanceV2 } from "@/components/finance/v2/finance-v2";

/**
 * Moliya sahifasi — bo'limlarga ajratilgan ko'rinish (Umumiy / Kirim / Chiqim).
 * Butun kontent `components/finance/v2/` da. `useSearchParams` (?tab=qarzdorlar)
 * Suspense chegarasini talab qiladi.
 */
export default function FinancePage() {
  return (
    <Suspense fallback={null}>
      <FinanceV2 />
    </Suspense>
  );
}
