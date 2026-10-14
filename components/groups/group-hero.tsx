"use client";

/**
 * GURUH SAHIFASI — YANGI KO'RINISHNING TEPA KARTASI (2026-10-14).
 *
 * Eski chap ustundagi "Kurs: … / Narx: … / Xona: …" ro'yxati o'rniga:
 * chapda nom va holat, o'ngda amallar, ostida oltita ko'rsatkich
 * kartochkasi — eng ko'p so'raladigan narsalar (kim o'qitadi, qachon,
 * qayerda, nechta o'quvchi) bir qarashda ko'rinadi.
 *
 * Tahrirlash / yakunlash / o'chirish oynalari eski ko'rinish bilan
 * BITTA (`group-info-sidebar` dan) — mantiq ikki joyda takrorlanmaydi.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import {
  CalendarRange, Clock, DoorOpen, Flag, GraduationCap, MoreHorizontal,
  Pencil, Trash2, UserRound, Users, Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatUzDate } from "@/lib/date-uz";
import { formatCurrency } from "@/lib/money";
import { WEEKDAY_SHORT } from "@/lib/form-constants";
import { ConfirmDeleteModal } from "@/components/ui/modal";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditGroupModal, FinishGroupModal, GroupEndSection } from "@/components/groups/group-info-sidebar";

/* eslint-disable @typescript-eslint/no-explicit-any -- guruh obyekti sahifadagi kabi `any` */
interface Props {
  group: any;
  students: any[];
  groupId: string;
  canUpdate: boolean;
  canDelete: boolean;
  status: { label: string; cls: string };
  onChanged: () => void;
}

function Korsatkich({ icon: Icon, label, children, sub }: {
  icon: React.ComponentType<{ className?: string }>; label: string; children: React.ReactNode; sub?: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-2xl bg-white/60 px-3.5 py-3 ring-1 ring-black/[0.04] dark:bg-white/[0.04] dark:ring-white/5">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
        <Icon className="h-3.5 w-3.5" />{label}
      </p>
      <div className="mt-1 truncate text-[14px] font-semibold text-neutral-900 dark:text-neutral-100">{children}</div>
      {sub && <div className="mt-0.5 truncate text-[11.5px] text-neutral-500 dark:text-neutral-400">{sub}</div>}
    </div>
  );
}

export function GroupHero({ group, students, groupId, canUpdate, canDelete, status, onChanged }: Props) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [showFinish, setShowFinish] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [xato, setXato] = useState("");

  const faollar = students.filter((x) => x.enrollmentStatus !== "CHIQIB_KETGAN");
  const sinovda = faollar.filter((x) => x.enrollmentStatus === "SINOV").length;
  const sigim = group.maxStudents ?? group.room?.capacity ?? null;
  const toldi = sigim ? Math.min(100, Math.round((faollar.length / sigim) * 100)) : 0;
  const kunlar = (group.scheduleDays ?? []).map((d: string) => WEEKDAY_SHORT[d] ?? d).join(", ");
  const yakunlangan = group.status === "COMPLETED";
  const muddatBor = yakunlangan || !!group.endDate;

  async function deleteGroup() {
    setDeleting(true); setXato("");
    try {
      const res = await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setXato((d as { error?: string })?.error ?? "Guruhni o'chirib bo'lmadi");
        setShowDelete(false);
        return;
      }
      mutate((k: string) => typeof k === "string" && k.startsWith("/api/groups"), undefined, { revalidate: true });
      router.push("/groups");
    } finally { setDeleting(false); }
  }

  return (
    <div className="glass-panel rounded-2xl border border-white/60 p-5 dark:border-white/10">
      {/* ── nom, holat, amallar ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-[18px] font-black text-white shadow-sm">
            {(group.name?.[0] ?? "G").toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-[20px] font-bold tracking-tight text-neutral-900 dark:text-neutral-100">{group.name}</h2>
              <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", status.cls)}>{status.label}</span>
            </div>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[12.5px] text-neutral-500 dark:text-neutral-400">
              <GraduationCap className="h-3.5 w-3.5" />{group.course?.name ?? "Kurs biriktirilmagan"}
              <span className="text-neutral-300 dark:text-neutral-600">·</span>
              <span className="tabular-nums">id {group.groupNumber ?? group.id}</span>
            </p>
          </div>
        </div>

        {(canUpdate || canDelete) && (
          <div className="flex items-center gap-2">
            {canUpdate && (
              <button type="button" onClick={() => setShowEdit(true)}
                className="flex h-9 items-center gap-1.5 rounded-xl border border-neutral-200 bg-white/70 px-3 text-[13px] font-semibold text-neutral-700 transition-colors hover:border-indigo-200 hover:text-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-neutral-200 dark:hover:text-indigo-300">
                <Pencil className="h-3.5 w-3.5" />Tahrirlash
              </button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger aria-label="Boshqa amallar"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white/70 text-neutral-500 outline-none transition-colors hover:text-neutral-800 dark:border-white/10 dark:bg-white/5 dark:text-neutral-400 dark:hover:text-neutral-100">
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[200px]">
                {canUpdate && !muddatBor && (
                  <DropdownMenuItem onClick={() => setShowFinish(true)}>
                    <Flag className="h-3.5 w-3.5" />{" "}Guruhni yakunlash
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem onClick={() => setShowDelete(true)} className="text-red-600 dark:text-red-400">
                    <Trash2 className="h-3.5 w-3.5" />{" "}Guruhni o&apos;chirish
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* ── ko'rsatkichlar ── */}
      <div className="mt-4 grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-6">
        <Korsatkich icon={UserRound} label="O'qituvchi">
          {group.teacher?.user?.name ?? <span className="text-neutral-400">Biriktirilmagan</span>}
        </Korsatkich>
        <Korsatkich icon={Clock} label="Dars vaqti" sub={kunlar || "Kunlar belgilanmagan"}>
          <span className="tabular-nums">{group.startTime}{group.endTime ? `–${group.endTime}` : ""}</span>
        </Korsatkich>
        <Korsatkich icon={DoorOpen} label="Xona" sub={group.room?.capacity != null ? `${group.room.capacity} o'rinli` : undefined}>
          {group.room?.name ?? <span className="text-neutral-400">Biriktirilmagan</span>}
        </Korsatkich>
        <Korsatkich icon={Wallet} label="Narx">
          <span className="tabular-nums">{group.course?.price != null ? formatCurrency(group.course.price) : "—"}</span>
        </Korsatkich>
        <Korsatkich icon={Users} label="O'quvchilar"
          sub={sigim ? (
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-neutral-200/80 dark:bg-white/10">
              <div className={cn("h-full rounded-full", toldi >= 100 ? "bg-red-500" : "bg-indigo-500")} style={{ width: `${toldi}%` }} />
            </div>
          ) : undefined}>
          <span className="tabular-nums">{faollar.length}{sigim ? <span className="text-neutral-400"> / {sigim}</span> : null}</span>
          {sinovda > 0 && <span className="ml-1.5 text-[11.5px] font-medium text-amber-600 dark:text-amber-400">{sinovda} sinovda</span>}
        </Korsatkich>
        <Korsatkich icon={CalendarRange} label="Muddat"
          sub={group.endDate ? `${formatUzDate(group.endDate)} gacha` : "Tugash sanasi yo'q"}>
          <span className="tabular-nums">{formatUzDate(group.startDate)} dan</span>
        </Korsatkich>
      </div>

      {/* Yakunlanadi / yakunlangan — sana bo'lsa ko'rinadi. Muddatsiz
          guruhda "Guruhni yakunlash" yuqoridagi ⋯ menyuda. */}
      {muddatBor && (
        <GroupEndSection group={group} groupId={groupId} canUpdate={canUpdate}
          onFinish={() => setShowFinish(true)} onChanged={onChanged} />
      )}

      {xato && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-[12px] text-red-600 dark:bg-red-900/20 dark:text-red-400">{xato}</p>}

      {showEdit && (
        <EditGroupModal group={group} groupId={groupId} onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); onChanged(); }} />
      )}
      {showFinish && (
        <FinishGroupModal group={group} groupId={groupId} activeCount={faollar.length}
          onClose={() => setShowFinish(false)} onSaved={() => { setShowFinish(false); onChanged(); }} />
      )}
      <ConfirmDeleteModal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={deleteGroup}
        loading={deleting}
        title="Guruhni o'chirish"
        description={<>
          <span className="font-semibold text-neutral-700 dark:text-neutral-300">{group.name}</span>
          {" guruhi butunlay o'chiriladi. Bu amalni ortga qaytarib bo'lmaydi."}
        </>}
      />
    </div>
  );
}
