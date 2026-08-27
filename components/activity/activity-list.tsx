"use client";

import { cn } from "@/lib/utils";
import { fmtRelative, fmtDateTime } from "@/lib/date-uz";
import type { ActivityItem } from "@/lib/hooks/useActivity";
import {
  UserPlus, UserMinus, UserCog, Users, CalendarCheck, Wallet, Receipt,
  BookOpen, DoorOpen, MapPin, Phone, Shield, GraduationCap, Settings2,
  MessageSquare, Trophy, CreditCard, Building2, History, Pencil, Trash2,
} from "lucide-react";

/**
 * HARAKATLAR RO'YXATI — sozlamalar tabi va to'liq sahifa uchun bitta komponent.
 *
 * Bitta komponent ikki joyda ishlatiladi, chunki ular AYNI ma'lumotni
 * ko'rsatadi. Ikkita alohida ro'yxat yozilsa, biri tuzatilib ikkinchisi
 * qolib ketardi va foydalanuvchi bir xil hodisani ikki xil o'qirdi.
 */

/** Amal turi → belgi va rang. Tanilmagan amal ham chiroyli ko'rinadi. */
const LOOK: Record<string, { icon: typeof UserPlus; cls: string }> = {
  "students.create":   { icon: UserPlus,      cls: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400" },
  "students.update":   { icon: UserCog,       cls: "text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400" },
  "students.delete":   { icon: Trash2,        cls: "text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400" },
  "students.archive":  { icon: UserMinus,     cls: "text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400" },
  "students.unarchive":{ icon: UserPlus,      cls: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400" },
  "students.bulk":     { icon: Users,         cls: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400" },
  "students.import":   { icon: Users,         cls: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400" },
  "student-groups.create":   { icon: Users,   cls: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400" },
  "student-groups.transfer": { icon: Users,   cls: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400" },
  "attendance.create": { icon: CalendarCheck, cls: "text-sky-600 bg-sky-50 dark:bg-sky-900/30 dark:text-sky-400" },
  "payments.create":   { icon: Wallet,        cls: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400" },
  "expenses.create":   { icon: Receipt,       cls: "text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400" },
  "groups.create":     { icon: Users,         cls: "text-violet-600 bg-violet-50 dark:bg-violet-900/30 dark:text-violet-400" },
  "courses.create":    { icon: BookOpen,      cls: "text-violet-600 bg-violet-50 dark:bg-violet-900/30 dark:text-violet-400" },
  "rooms.create":      { icon: DoorOpen,      cls: "text-neutral-600 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300" },
  "branches.create":   { icon: MapPin,        cls: "text-neutral-600 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300" },
  "leads.create":      { icon: Phone,         cls: "text-cyan-600 bg-cyan-50 dark:bg-cyan-900/30 dark:text-cyan-400" },
  "users.create":      { icon: Shield,        cls: "text-rose-600 bg-rose-50 dark:bg-rose-900/30 dark:text-rose-400" },
  "staff-roles.update":{ icon: Shield,        cls: "text-rose-600 bg-rose-50 dark:bg-rose-900/30 dark:text-rose-400" },
  "teachers.create":   { icon: GraduationCap, cls: "text-teal-600 bg-teal-50 dark:bg-teal-900/30 dark:text-teal-400" },
  "teacher-salaries.update": { icon: Wallet,  cls: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400" },
  "organization.update": { icon: Settings2,   cls: "text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400" },
  "sms.create":        { icon: MessageSquare, cls: "text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400" },
  "gamification.create": { icon: Trophy,      cls: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-400" },
  "subscription.create": { icon: CreditCard,  cls: "text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400" },
};

/** Resurs bo'yicha zaxira belgi — yangi amal qo'shilsa ham bo'sh ko'rinmaydi. */
const FALLBACK: Record<string, { icon: typeof UserPlus; cls: string }> = {
  students: LOOK["students.update"], "student-groups": LOOK["student-groups.create"],
  groups: LOOK["groups.create"], courses: LOOK["courses.create"],
  rooms: LOOK["rooms.create"], branches: LOOK["branches.create"],
  leads: LOOK["leads.create"], users: LOOK["users.create"],
  "staff-roles": LOOK["staff-roles.update"], teachers: LOOK["teachers.create"],
  "teacher-salaries": LOOK["teacher-salaries.update"], payments: LOOK["payments.create"],
  expenses: LOOK["expenses.create"], attendance: LOOK["attendance.create"],
  organization: LOOK["organization.update"], sms: LOOK["sms.create"],
  gamification: LOOK["gamification.create"], subscription: LOOK["subscription.create"],
};

const GENERIC = { icon: History, cls: "text-neutral-600 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300" };

function look(action: string) {
  return LOOK[action] ?? FALLBACK[action.split(".")[0]] ?? GENERIC;
}

const ROLE_UZ: Record<string, string> = {
  SUPER_ADMIN: "Egasi", STAFF: "Xodim", TEACHER: "O'qituvchi",
  RECEPTIONIST: "Qabulxona", ACCOUNTANT: "Hisobchi", PLATFORM_ADMIN: "Platforma",
};

export function ActivityRow({ item, showMeta }: { item: ActivityItem; showMeta?: boolean }) {
  const { icon: Icon, cls } = look(item.action);
  return (
    <li className="flex gap-3 py-3 first:pt-0 last:pb-0">
      <div className={cn("h-9 w-9 shrink-0 rounded-xl grid place-items-center", cls)}>
        <Icon className="h-4.5 w-4.5" strokeWidth={2} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 leading-snug">
            {item.summary}
          </p>
          {/* Aniq vaqt — nisbiy vaqt ustiga olib borilganda ko'rinadi. */}
          <time
            title={fmtDateTime(item.createdAt)}
            className="shrink-0 text-[11px] tabular-nums text-neutral-400 dark:text-neutral-500 pt-0.5"
          >
            {fmtRelative(item.createdAt)}
          </time>
        </div>

        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-neutral-500 dark:text-neutral-400">
          <span className="font-medium text-neutral-600 dark:text-neutral-300">
            {item.actorName || "Noma'lum"}
          </span>
          {item.actorRole && (
            <span className="text-neutral-400 dark:text-neutral-500">
              · {ROLE_UZ[item.actorRole] ?? item.actorRole}
            </span>
          )}
          {/* Platforma admini markaz nomidan ish qilgan bo'lsa — bu ochiq
              aytiladi. Markaz egasi o'z tarixidagi harakat aslida kim
              tomonidan qilinganini bilishi shart. */}
          {item.viaPlatform && (
            <span className="rounded-md bg-purple-50 dark:bg-purple-900/40 px-1.5 py-px font-medium text-purple-700 dark:text-purple-300">
              Platforma
            </span>
          )}
          {showMeta && item.device && <span>· {item.device}</span>}
          {showMeta && item.ip && <span className="tabular-nums">· {item.ip}</span>}
        </div>

        {item.changes.length > 0 && (
          <ul className="mt-1.5 space-y-0.5">
            {item.changes.map((c, i) => (
              <li
                key={i}
                className="text-[11.5px] text-neutral-600 dark:text-neutral-300 leading-relaxed
                           border-l-2 border-neutral-200 dark:border-neutral-700 pl-2"
              >
                {c}
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

export function ActivityList({
  items, showMeta, className,
}: { items: ActivityItem[]; showMeta?: boolean; className?: string }) {
  return (
    <ul className={cn("divide-y divide-neutral-100 dark:divide-neutral-800", className)}>
      {items.map((it) => <ActivityRow key={it.id} item={it} showMeta={showMeta} />)}
    </ul>
  );
}

export function ActivityEmpty({ hint }: { hint?: string }) {
  return (
    <div className="py-10 text-center">
      <div className="mx-auto h-11 w-11 rounded-2xl bg-neutral-100 dark:bg-neutral-800 grid place-items-center">
        <History className="h-5 w-5 text-neutral-400" />
      </div>
      <p className="mt-3 text-sm font-medium text-neutral-700 dark:text-neutral-200">
        Hozircha harakat yo&apos;q
      </p>
      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
        {hint ?? "O'zgarish qilinishi bilan shu yerda ko'rinadi."}
      </p>
    </div>
  );
}

export function ActivitySkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex gap-3 py-3 animate-pulse">
          <div className="h-9 w-9 shrink-0 rounded-xl bg-neutral-200 dark:bg-neutral-700" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-3 rounded bg-neutral-200 dark:bg-neutral-700" style={{ width: `${55 + (i % 3) * 12}%` }} />
            <div className="h-2.5 w-24 rounded bg-neutral-100 dark:bg-neutral-800" />
          </div>
        </li>
      ))}
    </ul>
  );
}
