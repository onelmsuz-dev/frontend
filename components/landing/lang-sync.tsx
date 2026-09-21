"use client";

import { useEffect } from "react";

/**
 * `<html lang>` — ruscha/inglizcha sahifalarda mos til.
 *
 * Ildiz maket (`app/layout.tsx`) barcha sahifalar uchun umumiy va `lang="uz"` beradi
 * (dashboard va boshqalar ham shu maketda). Ruscha/inglizcha sahifada til brauzerda o'rnatiladi;
 * sahifadan chiqilganda (masalan, o'zbekcha sahifaga o'tilganda) `uz` ga qaytariladi.
 * Birinchi yuklashda esa `[locale]/layout.tsx` ichidagi kichik inline skript buni bo'yashdan oldin bajaradi.
 */
export function LangSync({ locale }: { locale: string }) {
  useEffect(() => {
    const html = document.documentElement;
    html.lang = locale;
    return () => {
      html.lang = "uz";
    };
  }, [locale]);
  return null;
}
