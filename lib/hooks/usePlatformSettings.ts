import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { fetcher } from "@/lib/fetcher";

export interface PlatformSettings {
  paymentCardNumber: string;
  paymentCardOwner: string | null;
  /** Gamifikatsiyaning GLOBAL kaliti — o'chirilsa hech bir markazda ishlamaydi. */
  gamificationEnabled: boolean;
}

/** Tarif/SMS-paket to'lovi uchun qaysi kartaga o'tkazish kerakligi. */
export function usePlatformSettings() {
  return useSWR<PlatformSettings>("/api/platform-settings", fetcher);
}

export function useUpdatePlatformSettings() {
  return useSWRMutation("/api/platform-settings", async (url: string, { arg }: { arg: unknown }) => {
    const r = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(arg),
    });
    if (!r.ok) throw await r.json();
    return r.json();
  });
}

/** "9860350142898617" → "9860 3501 4289 8617" — o'qishga qulay. */
export function formatCardNumber(v: string): string {
  return (v ?? "").replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim();
}
