"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { TopHeader } from "@/components/layout/top-header";
import { cn } from "@/lib/utils";
import { useActivityFeed, type ActivityItem } from "@/lib/hooks/useActivity";
import { ActivityList, ActivityEmpty, ActivitySkeleton } from "@/components/activity/activity-list";
import { useMe, hasPerm } from "@/lib/hooks/useMe";
import { useFeature } from "@/lib/hooks/useFeatures";
import { fmtRelative } from "@/lib/date-uz";
import { ArrowLeft, Loader2, Filter, X, ShieldOff, History } from "lucide-react";

/**
 * TO'LIQ HARAKATLAR TARIXI.
 *
 * Sozlamalar tabidagi "Hammasini ko'rsatish" shu sahifaga olib keladi.
 * Filtrlar ataylab kam: bo'lim va xodim. Jurnal qidiruv tizimi emas —
 * uning vazifasi "kim nima qildi" savoliga tez javob berish.
 */

/**
 * Bo'limlar va ularni ko'rish uchun kerak bo'lgan ruxsat.
 *
 * Backend ham AYNAN shu tekshiruvni bajaradi (`activity.service.ts`
 * `ENTITY_PERM`) — bu yerdagisi faqat qulaylik uchun: xodim ruxsati yo'q
 * bo'limni bosib, bo'sh ro'yxatga qarab turmasin.
 */
const SECTIONS: { value: string; label: string; perm?: string }[] = [
  { value: "",              label: "Hammasi" },
  { value: "Student",       label: "O'quvchilar",   perm: "students.view" },
  { value: "StudentGroup",  label: "A'zoliklar",    perm: "students.view" },
  { value: "Payment",       label: "To'lovlar",     perm: "payments.view" },
  { value: "Expense",       label: "Xarajatlar",    perm: "expenses.view" },
  { value: "Attendance",    label: "Davomat",       perm: "attendance.view" },
  { value: "Group",         label: "Guruhlar",      perm: "groups.view" },
  { value: "Course",        label: "Kurslar",       perm: "courses.view" },
  { value: "Teacher",       label: "O'qituvchilar", perm: "teachers.view" },
  { value: "TeacherSalary", label: "Oyliklar",      perm: "salaries.view" },
  { value: "User",          label: "Xodimlar",      perm: "staff.view" },
  { value: "StaffRole",     label: "Rollar",        perm: "roles.view" },
  { value: "Organization",  label: "Sozlamalar",    perm: "settings.view" },
  { value: "Lead",          label: "Lidlar",        perm: "leads.view" },
  { value: "Sms",           label: "SMS",           perm: "sms.view" },
];

export default function ActivityPage() {
  const { me } = useMe();
  const enabled = useFeature("activity");
  const [entity, setEntity] = useState("");
  const [actorId, setActorId] = useState("");

  const filters = useMemo(() => ({
    entity: entity || undefined,
    actorId: actorId || undefined,
  }), [entity, actorId]);

  const feed = useActivityFeed(filters);
  const canView = hasPerm(me?.permissions, "activity.view");

  // Ro'yxatdagi xodimlar — filtr uchun. Alohida so'rov qilinmaydi: jurnalning
  // o'zida aktorlar bor va ular aynan tarixda uchraydiganlar.
  //
  // DIQQAT: ro'yxat FILTRLANMAGAN yuklamadan yig'iladi va eslab qolinadi.
  // Aks holda xodim tanlangan zahoti javob faqat o'sha xodimning yozuvlarini
  // qaytarardi, ro'yxat bitta elementga qisqarardi va boshqa xodimga o'tish
  // imkoni yo'qolardi — ya'ni filtr o'zini o'zi qulflab qo'yardi.
  const [knownActors, setKnownActors] = useState<[string, string][]>([]);
  useEffect(() => {
    if (actorId) return;                     // filtrlangan yuklamadan yig'maymiz
    const by = new Map<string, string>(knownActors);
    for (const it of feed.items as ActivityItem[]) {
      if (it.actorId && it.actorName) by.set(it.actorId, it.actorName);
    }
    const next = [...by.entries()].sort((a, b) => a[1].localeCompare(b[1], "uz"));
    if (next.length !== knownActors.length) setKnownActors(next);
  }, [feed.items, actorId, knownActors]);
  const actors = knownActors;

  const hasFilter = Boolean(entity || actorId);
  const visibleFilters = useMemo(
    () => SECTIONS.filter((s) => !s.perm || hasPerm(me?.permissions, s.perm)),
    [me?.permissions],
  );

  if (me && !canView) return <NoAccess />;
  if (enabled === false) return <NoAccess feature />;

  return (
    <>
      <TopHeader title="So'nggi harakatlar" />

      <div className="p-4 sm:p-6 space-y-4 max-w-4xl mx-auto w-full">
        <Link
          href="/settings?tab=harakatlar"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400
                     hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Sozlamalarga qaytish
        </Link>

        {/* ─── Filtrlar ─────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2.5">
            <Filter className="h-3.5 w-3.5 text-neutral-400" />
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
              Bo&apos;lim
            </span>
            {hasFilter && (
              <button
                onClick={() => { setEntity(""); setActorId(""); }}
                className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1
                           text-[11px] font-medium text-neutral-500 dark:text-neutral-400
                           hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="h-3 w-3" /> Tozalash
              </button>
            )}
          </div>

          {/* Mobil: gorizontal siljish — tugmalar qatorni buzmasin. */}
          <div className="-mx-3 sm:-mx-4 px-3 sm:px-4 overflow-x-auto">
            <div className="flex gap-1.5 pb-0.5 w-max">
              {visibleFilters.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setEntity(s.value)}
                  className={cn(
                    "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    entity === s.value
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {actors.length > 1 && (
            <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <span className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
                Xodim
              </span>
              <div className="-mx-3 sm:-mx-4 px-3 sm:px-4 overflow-x-auto">
                <div className="flex gap-1.5 pb-0.5 w-max">
                  <button
                    onClick={() => setActorId("")}
                    className={cn(
                      "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                      !actorId
                        ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700",
                    )}
                  >
                    Hammasi
                  </button>
                  {actors.map(([id, name]) => (
                    <button
                      key={id}
                      onClick={() => setActorId(id)}
                      className={cn(
                        "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                        actorId === id
                          ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700",
                      )}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
              {/* Filtr faqat YUKLANGAN sahifalardagi xodimlarni biladi —
                  buni yashirmaymiz, aks holda ro'yxatda yo'q xodim
                  "umuman hech narsa qilmagan" bo'lib ko'rinardi. */}
              <p className="mt-2 text-[11px] text-neutral-400 dark:text-neutral-500">
                Yuklangan yozuvlarda uchragan xodimlar
              </p>
            </div>
          )}
        </div>

        {/* ─── Ro'yxat ──────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 sm:px-5 py-3">
          {feed.isLoading && feed.items.length === 0 ? (
            <ActivitySkeleton rows={8} />
          ) : feed.error ? (
            <p className="py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
              Tarixni yuklab bo&apos;lmadi
            </p>
          ) : feed.items.length === 0 ? (
            <ActivityEmpty
              hint={hasFilter ? "Bu filtr bo'yicha yozuv topilmadi." : undefined}
            />
          ) : (
            <>
              <ActivityList items={feed.items as ActivityItem[]} showMeta />

              <div className="pt-3 mt-1 border-t border-neutral-100 dark:border-neutral-800">
                {feed.hasMore ? (
                  <button
                    onClick={() => feed.setSize(feed.size + 1)}
                    disabled={Boolean(feed.isLoadingMore)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl
                               bg-neutral-100 dark:bg-neutral-800 px-4 py-2.5 text-sm font-medium
                               text-neutral-700 dark:text-neutral-200 transition-colors
                               hover:bg-neutral-200 dark:hover:bg-neutral-700
                               disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {feed.isLoadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                    {feed.isLoadingMore ? "Yuklanmoqda…" : "Yana yuklash"}
                  </button>
                ) : (
                  <p className="py-1 text-center text-xs text-neutral-400 dark:text-neutral-500">
                    {feed.items.length} ta yozuv · eng eskisi{" "}
                    {fmtRelative((feed.items[feed.items.length - 1] as ActivityItem)?.createdAt)}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function NoAccess({ feature }: { feature?: boolean }) {
  return (
    <>
      <TopHeader title="So'nggi harakatlar" />
      <div className="p-6 max-w-md mx-auto text-center">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 grid place-items-center">
          {feature ? (
            <History className="h-5 w-5 text-neutral-400" />
          ) : (
            <ShieldOff className="h-5 w-5 text-neutral-400" />
          )}
        </div>
        <p className="mt-4 text-sm font-medium text-neutral-800 dark:text-neutral-100">
          {feature ? "Bu bo'lim hali yoqilmagan" : "Ruxsat yo'q"}
        </p>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          {feature
            ? "Harakatlar tarixi markazingiz uchun hali ochilmagan."
            : "Harakatlar tarixini ko'rish uchun markaz egasidan ruxsat so'rang."}
        </p>
        <Link
          href="/settings"
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-neutral-600 dark:text-neutral-300 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Sozlamalar
        </Link>
      </div>
    </>
  );
}
