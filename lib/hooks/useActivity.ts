import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { fetcher } from "@/lib/fetcher";

export interface ActivityItem {
  id:          string;
  action:      string;
  entity:      string;
  entityId:    string | null;
  entityName:  string;
  summary:     string;
  changes:     string[];
  actorId:     string | null;
  actorName:   string;
  actorRole:   string;
  viaPlatform: boolean;
  ip:          string | null;
  device:      string | null;
  createdAt:   string;
}

export interface ActivityPage {
  items:      ActivityItem[];
  nextCursor: string | null;
}

/** Sozlamalar tabidagi qisqa ro'yxat — oxirgi N ta. */
export function useRecentActivity(limit = 10, enabled = true) {
  return useSWR<ActivityPage>(
    enabled ? `/api/activity?limit=${limit}` : null,
    fetcher,
    { revalidateOnFocus: true, dedupingInterval: 15_000 },
  );
}

/**
 * To'liq sahifa — "yana yuklash" bilan.
 *
 * Kursorli sahifalash ishlatiladi, ofsetli emas: jurnalga doimiy yangi qator
 * qo'shilib turadi va ofset bilan foydalanuvchi keyingi sahifaga o'tganda
 * ba'zi qatorlarni IKKI MARTA, ba'zilarini esa umuman ko'rmasdi.
 */
export function useActivityFeed(filters: { entity?: string; actorId?: string } = {}) {
  const qs = (cursor: string | null) => {
    const p = new URLSearchParams({ limit: "25" });
    if (cursor) p.set("cursor", cursor);
    if (filters.entity)  p.set("entity", filters.entity);
    if (filters.actorId) p.set("actorId", filters.actorId);
    return `/api/activity?${p}`;
  };

  const swr = useSWRInfinite<ActivityPage>(
    (index, prev) => {
      if (index === 0) return qs(null);
      if (!prev?.nextCursor) return null;   // oxiri
      return qs(prev.nextCursor);
    },
    fetcher,
    { revalidateFirstPage: false },
  );

  const pages = swr.data ?? [];
  return {
    ...swr,
    items:   pages.flatMap((p) => p.items),
    hasMore: pages.length > 0 && Boolean(pages[pages.length - 1]?.nextCursor),
    isLoadingMore: swr.isLoading
      || (swr.size > 0 && swr.data && typeof swr.data[swr.size - 1] === "undefined"),
  };
}
