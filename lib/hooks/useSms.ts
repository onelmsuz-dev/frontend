import useSWR from "swr";
import useSWRMutation from "swr/mutation";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

async function poster(url: string, { arg }: { arg: unknown }) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg),
  });
  if (!r.ok) throw await r.json();
  return r.json();
}

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

/** SMS matn (shablon) — moderatsiya holati: PENDING → IN_REVIEW → APPROVED/REJECTED. */
export interface SmsTemplate {
  id: string;
  title: string;
  text: string;
  status: "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED";
  note: string | null;
  reviewNote: string | null;
  createdAt: string;
}

/** Markaz SMS holati: balans, paketlar, tarix. */
export function useSms() {
  return useSWR<SmsStatus>("/api/sms", fetcher);
}

/** Markazning o'z shablonlari (moderatsiya holati bilan). */
export function useSmsTemplates() {
  return useSWR<SmsTemplate[]>("/api/sms/templates", fetcher);
}

export function useSubmitSmsTemplate() {
  return useSWRMutation("/api/sms/templates", poster);
}
