"use client";

import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { SWRConfig } from "swr";
import { SessionWatcher } from "@/components/auth/session-watcher";
import { FontScaleSync } from "@/components/font-scale-sync";
import type { ApiError } from "@/lib/fetcher";

/**
 * QAYTA URINISH QOIDASI — BUTUN ILOVA UCHUN BIR JOYDA.
 *
 * SWR standart holatda HAR QANDAY xatoni cheksiz qayta so'raydi (5 soniyadan
 * boshlab, o'sib boradigan oraliq bilan). Vaqtinchalik tarmoq uzilishi uchun
 * bu to'g'ri, lekin QAT'IY javoblar uchun zararli:
 *
 *   402 — tarif muddati tugagan
 *   401/403 — ruxsat yo'q
 *   404 — bunday yozuv yo'q
 *
 * Bularning hech biri qayta so'rasa o'zgarmaydi. Tarifi tugagan markazda
 * (Dream Zone, 2026-09-18) sozlamalar sahifasidagi o'nlab hook bir vaqtda
 * 402 olardi va HAR BIRI tinmay qayta urinardi — natijada ekran bir necha
 * soniyada bir "yangilanib" turardi va markaz "sahifa o'zi refresh bo'lyapti"
 * deb xabar berdi.
 *
 * Endi bunday javoblarda urinish TO'XTAYDI. Tarmoq xatosi (status yo'q)
 * avvalgidek qayta so'raladi, lekin chegara bilan.
 */
const QATIY = new Set([401, 402, 403, 404]);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionWatcher />
      <SWRConfig
        value={{
          errorRetryCount: 3,
          onErrorRetry: (err, _key, config, revalidate, { retryCount }) => {
            const status = (err as ApiError)?.status;
            if (status && QATIY.has(status)) return;
            if (retryCount >= (config.errorRetryCount ?? 3)) return;
            setTimeout(() => revalidate({ retryCount }),
                       (config.errorRetryInterval ?? 5000) * 2 ** retryCount);
          },
        }}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <FontScaleSync />
          {children}
        </ThemeProvider>
      </SWRConfig>
    </SessionProvider>
  );
}
