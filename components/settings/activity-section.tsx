"use client";

import Link from "next/link";
import { History, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { useRecentActivity } from "@/lib/hooks/useActivity";
import { ActivityList, ActivityEmpty, ActivitySkeleton } from "@/components/activity/activity-list";

/**
 * SOZLAMALAR → SO'NGGI HARAKATLAR.
 *
 * Oxirgi 10 ta harakat va to'liq sahifaga o'tish tugmasi. Tabning butun
 * vazifasi — markaz egasi bir qarashda "kecha nima bo'ldi" ni ko'rishi;
 * chuqurroq tekshiruv to'liq sahifada.
 */
export function ActivitySection() {
  const { data, error, isLoading } = useRecentActivity(10);
  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <header className="flex items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 shrink-0 rounded-xl bg-neutral-100 dark:bg-neutral-800 grid place-items-center">
              <History className="h-4.5 w-4.5 text-neutral-600 dark:text-neutral-300" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                So&apos;nggi harakatlar
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                Markazda kim nima o&apos;zgartirgani
              </p>
            </div>
          </div>
        </header>

        <div className="px-4 sm:px-5 py-3">
          {isLoading ? (
            <ActivitySkeleton rows={5} />
          ) : error ? (
            <div className="flex items-start gap-2.5 py-6 text-sm text-neutral-600 dark:text-neutral-300">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 text-amber-500 mt-px" />
              <div>
                <p className="font-medium">Tarixni yuklab bo&apos;lmadi</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {(error as Error)?.message ?? "Qayta urinib ko'ring"}
                </p>
              </div>
            </div>
          ) : items.length === 0 ? (
            <ActivityEmpty />
          ) : (
            <ActivityList items={items} />
          )}
        </div>

        {items.length > 0 && (
          <footer className="px-4 sm:px-5 py-3 border-t border-neutral-100 dark:border-neutral-800">
            <Link
              href="/activity"
              className="group flex w-full items-center justify-center gap-1.5 rounded-xl
                         bg-neutral-100 dark:bg-neutral-800 px-4 py-2.5 text-sm font-medium
                         text-neutral-700 dark:text-neutral-200 transition-colors
                         hover:bg-neutral-200 dark:hover:bg-neutral-700"
            >
              Hammasini ko&apos;rsatish
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </footer>
        )}
      </div>

      {/* Jurnalning qiymati uning o'zgarmasligida — foydalanuvchi buni
          bilishi kerak, aks holda ro'yxat shunchaki yana bir ro'yxat. */}
      <div className="flex items-start gap-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 px-4 py-3">
        <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-px" />
        <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
          Jurnal <span className="font-medium text-neutral-700 dark:text-neutral-300">o&apos;zgarmas</span> —
          yozilgan qatorni tahrirlab yoki o&apos;chirib bo&apos;lmaydi, buni ma&apos;lumotlar bazasining
          o&apos;zi ta&apos;minlaydi. Parol, token va SMS matni hech qachon yozilmaydi.
        </p>
      </div>
    </div>
  );
}
