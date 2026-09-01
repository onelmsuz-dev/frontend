import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export interface MetaStatus {
  connected: boolean;
  pageName?: string;
  connectedByName?: string;
  connectedAt?: string;
  isActive?: boolean;
  lastWebhookAt?: string | null;
  lastError?: string | null;
}

/** Markazning Facebook/Instagram ulanish holati. */
export function useMetaStatus() {
  return useSWR<MetaStatus>("/api/meta/status", fetcher);
}
