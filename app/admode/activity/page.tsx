"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { fetcher } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import { ActivityList, ActivityEmpty, ActivitySkeleton } from "@/components/activity/activity-list";
import type { ActivityItem, ActivityPage } from "@/lib/hooks/useActivity";
import { Building2, Search, Loader2, History, ChevronLeft } from "lucide-react";

/**
 * /admode → HARAKATLAR — platforma egasi markaz ichiga kirib ko'radi.
 *
 * Markaz tanlanadi, so'ng o'sha markazning to'liq jurnali ochiladi. Bu
 * ko'rinish markazning o'z tabidan kengroq: IP va qurilma ham ko'rinadi,
 * chunki platforma egasi uchun asosiy savol ko'pincha "bu o'zgarishni
 * haqiqatan o'sha odam qildimi" bo'ladi.
 */

interface Org { id: string; name: string; subdomain: string; studentCount?: number }

export default function AdmodeActivityPage() {
  const [org, setOrg] = useState<Org | null>(null);
  return org
    ? <OrgFeed org={org} onBack={() => setOrg(null)} />
    : <OrgPicker onPick={setOrg} />;
}

function OrgPicker({ onPick }: { onPick: (o: Org) => void }) {
  const { data, error, isLoading, mutate } =
    useSWR<{ items?: Org[] } | Org[]>("/api/admode/organizations", fetcher);
  const [q, setQ] = useState("");

  const orgs = useMemo(() => {
    const list: Org[] = Array.isArray(data) ? data : (data?.items ?? []);
    const needle = q.trim().toLowerCase();
    if (!needle) return list;
    return list.filter(
      (o) => o.name?.toLowerCase().includes(needle) || o.subdomain?.toLowerCase().includes(needle),
    );
  }, [data, q]);

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto w-full space-y-4">
      <header>
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Harakatlar tarixi
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
          Markazni tanlang — uning ichida kim nima o&apos;zgartirgani ko&apos;rinadi
        </p>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Markaz nomi yoki subdomen…"
          className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700
                     bg-white dark:bg-neutral-900 pl-9 pr-3 py-2.5 text-sm
                     text-neutral-900 dark:text-neutral-100
                     placeholder:text-neutral-400 focus:outline-none
                     focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/10"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        // Xato bilan "topilmadi" ni ajratamiz: ilgari tarmoq uzilganda ham
        // "Markaz topilmadi" chiqib, platforma egasi markazlar haqiqatan
        // yo'q deb o'ylardi.
        <div className="py-10 text-center">
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
            Ro&apos;yxatni yuklab bo&apos;lmadi
          </p>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            {(error as Error)?.message ?? "Tarmoq xatosi"}
          </p>
          <button
            onClick={() => mutate()}
            className="mt-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 px-4 py-2
                       text-sm font-medium text-neutral-700 dark:text-neutral-200
                       hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            Qayta urinish
          </button>
        </div>
      ) : orgs.length === 0 ? (
        <p className="py-10 text-center text-sm text-neutral-500 dark:text-neutral-400">
          Markaz topilmadi
        </p>
      ) : (
        <ul className="space-y-1.5">
          {orgs.map((o) => (
            <li key={o.id}>
              <button
                onClick={() => onPick(o)}
                className="w-full flex items-center gap-3 rounded-xl border border-neutral-200
                           dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3.5 py-3
                           text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                <div className="h-9 w-9 shrink-0 rounded-lg bg-neutral-100 dark:bg-neutral-800 grid place-items-center">
                  <Building2 className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                    {o.name}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                    {o.subdomain}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OrgFeed({ org, onBack }: { org: Org; onBack: () => void }) {
  const swr = useSWRInfinite<ActivityPage>(
    (index, prev) => {
      const base = `/api/admode/activity/${org.id}?limit=25`;
      if (index === 0) return base;
      if (!prev?.nextCursor) return null;
      return `${base}&cursor=${encodeURIComponent(prev.nextCursor)}`;
    },
    fetcher,
    { revalidateFirstPage: false },
  );

  const pages = swr.data ?? [];
  const items = pages.flatMap((p) => p.items) as ActivityItem[];
  const hasMore = pages.length > 0 && Boolean(pages[pages.length - 1]?.nextCursor);
  const loadingMore = swr.size > 0 && swr.data && typeof swr.data[swr.size - 1] === "undefined";

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto w-full space-y-4">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400
                   hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" /> Markazlar
      </button>

      <header className="flex items-center gap-3">
        <div className="h-10 w-10 shrink-0 rounded-xl bg-neutral-100 dark:bg-neutral-800 grid place-items-center">
          <History className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
        </div>
        <div className="min-w-0">
          <h1 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 truncate">
            {org.name}
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
            {org.subdomain} · harakatlar tarixi
          </p>
        </div>
      </header>

      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 sm:px-5 py-3">
        {swr.isLoading && items.length === 0 ? (
          <ActivitySkeleton rows={8} />
        ) : swr.error ? (
          <p className="py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
            Tarixni yuklab bo&apos;lmadi
          </p>
        ) : items.length === 0 ? (
          <ActivityEmpty hint="Bu markazda hali yozuv yo'q." />
        ) : (
          <>
            <ActivityList items={items} showMeta />
            <div className="pt-3 mt-1 border-t border-neutral-100 dark:border-neutral-800">
              {hasMore ? (
                <button
                  onClick={() => swr.setSize(swr.size + 1)}
                  disabled={Boolean(loadingMore)}
                  className={cn(
                    "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5",
                    "bg-neutral-100 dark:bg-neutral-800 text-sm font-medium",
                    "text-neutral-700 dark:text-neutral-200 transition-colors",
                    "hover:bg-neutral-200 dark:hover:bg-neutral-700",
                    "disabled:opacity-60 disabled:cursor-not-allowed",
                  )}
                >
                  {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loadingMore ? "Yuklanmoqda…" : "Yana yuklash"}
                </button>
              ) : (
                <p className="py-1 text-center text-xs text-neutral-400 dark:text-neutral-500">
                  {items.length} ta yozuv
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
