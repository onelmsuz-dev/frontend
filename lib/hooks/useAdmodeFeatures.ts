import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export type Rollout = "OFF" | "DEMO" | "ALL";

export interface FeatureOrg {
  id: string;
  name: string;
  subdomain: string;
  isDemo: boolean;
  isActive: boolean;
}

export interface FeatureOverride {
  organizationId: string;
  name: string;
  subdomain: string;
  enabled: boolean;
  reason: string;
}

export interface FeaturePreview {
  userId: string;
  name: string;
  phone: string;
  orgName: string;
}

export interface FeatureEvent {
  id: string;
  action: string;
  detail: string;
  actorName: string;
  createdAt: string;
}

export interface FeatureRow {
  key: string;
  label: string;
  description: string;
  rollout: Rollout;
  note: string;
  updatedAt: string | null;
  enabledCount: number;
  orgTotal: number;
  demoCount: number;
  overrides: FeatureOverride[];
  previews: FeaturePreview[];
  events: FeatureEvent[];
}

export interface AdmodeFeaturesData {
  orgs: FeatureOrg[];
  features: FeatureRow[];
}

export function useAdmodeFeatures() {
  return useSWR<AdmodeFeaturesData>("/api/admode/features", fetcher, {
    revalidateOnFocus: false,
  });
}

/** Barcha yozuv amallari uchun yagona yordamchi — xatoni matn bilan qaytaradi. */
export async function admodeFeatureCall(
  path: string,
  method: "PATCH" | "POST" | "PUT" | "DELETE",
  body?: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const r = await fetch(`/api/admode/features${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, error: data?.error ?? `Xatolik (${r.status})` };
    return { ok: true };
  } catch {
    return { ok: false, error: "Serverga ulanib bo'lmadi" };
  }
}
