import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export interface OnboardingData {
  status: "ACTIVE" | "DISMISSED" | "DONE";
  skipped: string[];
  celebratedAt: string | null;
  /** Qadam kaliti → bajarildimi. Server haqiqiy jadvallardan hisoblaydi. */
  steps: Record<string, boolean>;
}

/**
 * Markazning sozlash holati.
 *
 * `dedupingInterval` qisqa (2 s): foydalanuvchi qadamni bajargan zahoti
 * checklist yangilanishi kerak. Polling YO'Q — yangilash marshrut o'zgarganda
 * va tabga qaytganda bo'ladi.
 */
export function useOnboarding(enabled: boolean) {
  return useSWR<OnboardingData>(enabled ? "/api/onboarding" : null, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 2_000,
  });
}

/** Panel holatini o'zgartirish. Xato bo'lsa `false` qaytadi (jim yutilmaydi). */
export async function onboardingAction(
  action: "hide" | "resume" | "restart" | "skip" | "unskip" | "celebrated",
  body?: { key: string },
): Promise<boolean> {
  try {
    const r = await fetch(`/api/onboarding/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });
    return r.ok;
  } catch {
    return false;
  }
}
