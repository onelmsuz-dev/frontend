import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export interface SmsPackage { quantity: number; price: number }
export interface SmsMessageRow {
  id: string; phone: string; message: string; recipientType: string;
  recipientName: string | null; status: string; error: string | null; createdAt: string;
}
export interface SmsPackageRequestRow {
  id: string; quantity: number; amount: number; status: string; createdAt: string;
}
export interface SmsStatus {
  balance: number;
  configured: boolean;
  packages: SmsPackage[];
  messages: SmsMessageRow[];
  requests: SmsPackageRequestRow[];
}

/** Markaz SMS holati: balans, paketlar, tarix. */
export function useSms() {
  return useSWR<SmsStatus>("/api/sms", fetcher);
}
