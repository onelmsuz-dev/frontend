"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { SESSION_EXPIRED, UNAUTHORIZED_EVENT } from "@/lib/session-expiry";

/**
 * OCHIQ TURGAN OYNANI KUZATADI.
 *
 * Sahifadan sahifaga o'tishni `proxy.ts` (middleware) ushlaydi, lekin
 * odam panelni ochiq qoldirib ketsa hech qanday o'tish bo'lmaydi: SWR
 * so'rovlari jimgina 401 olib turadi va ekran bo'sh ko'rinadi. Aynan shu
 * holat "nega chiqib qolganini tushunmadim" shikoyatiga sabab bo'lgan.
 *
 * Shuning uchun bu komponent ikki manbani tinglaydi:
 *   1. `useSession()` — NextAuth oynaga qaytilganda sessiyani qayta
 *      so'raydi, o'shanda refresh sinaladi;
 *   2. 401 hodisasi — API "ruxsat yo'q" degan zahoti sessiyani majburan
 *      qayta tekshiramiz, oyna fokusini kutib o'tirmasdan.
 *
 * Chiqarish qarori FAQAT {@link SESSION_EXPIRED} bo'yicha qabul qilinadi.
 */
export function SessionWatcher() {
  const { data: session, status, update } = useSession();
  const pathname = usePathname();
  const chiqarilmoqda = useRef(false);

  // 401 → sessiyani qayta so'rash
  useEffect(() => {
    const tingla = () => { void update(); };
    window.addEventListener(UNAUTHORIZED_EVENT, tingla);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, tingla);
  }, [update]);

  // Muddat tugagan — login sahifasiga
  useEffect(() => {
    if (status !== "authenticated") return;
    if ((session as unknown as { error?: string })?.error !== SESSION_EXPIRED) return;
    if (chiqarilmoqda.current) return;
    chiqarilmoqda.current = true;

    // Allaqachon login sahifasidamiz: yo'naltirish kerak emas, lekin o'lik
    // cookie'ni tozalash KERAK. Aks holda odam parolini yozguncha har bir
    // so'rov yana foydasiz refresh urinishini boshlaydi.
    if (pathname.endsWith("/login")) {
      void signOut({ redirect: false });
      return;
    }

    const kirish = pathname.startsWith("/admode") ? "/admode/login" : "/login";
    void signOut({ callbackUrl: `${kirish}?muddat=1` });
  }, [session, status, pathname]);

  return null;
}
