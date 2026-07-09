"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useGroup } from "@/lib/hooks/useGroups";
import { TopHeader } from "@/components/layout/top-header";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, Users, BookOpen, Clock, Calendar,
  GraduationCap, AlertCircle, CheckCircle, UserCheck, Plus,
} from "lucide-react";
import { mutate } from "swr";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { FormField } from "@/components/ui/form-field";
import { PhoneInput } from "@/components/ui/phone-input";

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded-xl", className)} />;
}

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  ACTIVE:    { label: "Faol",        cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  UPCOMING:  { label: "Yaqinda",     cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  COMPLETED: { label: "Yakunlangan", cls: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800" },
};

const ENROLL_CFG: Record<string, { label: string; cls: string }> = {
  SINOV:         { label: "Sinov", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  FAOL:          { label: "Faol",  cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  CHIQIB_KETGAN: { label: "Ketgan", cls: "bg-neutral-100 text-neutral-500" },
};

const DAY_LABELS: Record<string, string> = {
  du: "Du", se: "Se", ch: "Ch", pa: "Pa", ju: "Ju", sha: "Sha", ya: "Ya",
  mon: "Du", tue: "Se", wed: "Ch", thu: "Pa", fri: "Ju", sat: "Sha", sun: "Ya",
};

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: group, isLoading } = useGroup(id);

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", phone: "", parentPhone: "" });
  const [addErr,  setAddErr]  = useState("");
  const [addSaving, setAddSaving] = useState(false);

  async function submitAdd() {
    if (!addForm.name.trim()) { setAddErr("Ism majburiy"); return; }
    if (addForm.phone.replace(/\D/g, "").length !== 12) { setAddErr("To'liq raqam kiriting"); return; }
    setAddSaving(true); setAddErr("");
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: addForm.name, phone: addForm.phone, parentPhone: addForm.parentPhone || undefined, groupId: id }),
      });
      const data = await res.json();
      if (!res.ok) { setAddErr(data.error ?? "Xatolik"); return; }
      mutate(`/api/groups/${id}`);
      setShowAdd(false);
      setAddForm({ name: "", phone: "", parentPhone: "" });
    } catch { setAddErr("Serverga ulanib bo'lmadi"); }
    finally { setAddSaving(false); }
  }

  if (isLoading) {
    return (
      <div className="p-5 space-y-5">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-36" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (!group || group.error) {
    return (
      <div className="p-5 flex flex-col items-center py-20 text-neutral-400">
        <AlertCircle className="w-10 h-10 mb-2 opacity-40" />
        <p className="text-sm">Guruh topilmadi</p>
        <Link href="/groups" className="mt-3 text-sm text-blue-500 hover:underline">Orqaga</Link>
      </div>
    );
  }

  const status  = STATUS_CFG[group.status] ?? STATUS_CFG.ACTIVE;
  const teacher = group.teacher?.user;

  const activeStudents = group.students?.filter((s: any) => s.enrollmentStatus === "FAOL").length ?? 0;
  const sinovStudents  = group.students?.filter((s: any) => s.enrollmentStatus === "SINOV").length ?? 0;

  return (
    <div>
      <TopHeader
        title={group.name}
        subtitle={
          <Link href="/groups" className="flex items-center gap-1 text-neutral-400 hover:text-neutral-600 text-sm transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Guruhlar
          </Link>
        }
        action={{ label: "O'quvchi qo'shish", onClick: () => { setAddErr(""); setShowAdd(true); } }}
      />

      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Yangi o'quvchi qo'shish"
        subtitle={`Guruh: ${group.name}`}
        footer={
          <>
            <Button onClick={submitAdd} disabled={addSaving}
              className="flex-1 h-9 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 text-white text-[13px]">
              {addSaving ? "Qo'shilmoqda..." : "Qo'shish"}
            </Button>
            <Button variant="outline" className="h-9 px-4 text-[13px]" onClick={() => setShowAdd(false)}>Bekor</Button>
          </>
        }
      >
        <FormField label="Ism familiya" required error={addErr.includes("Ism") ? addErr : ""}>
          <Input placeholder="Alisher Navoiy" value={addForm.name}
            onChange={e => { setAddForm(p => ({...p, name: e.target.value})); setAddErr(""); }}
            className="h-10" />
        </FormField>
        <FormField label="Telefon raqam" required error={addErr.includes("raqam") ? addErr : ""}>
          <PhoneInput value={addForm.phone}
            onChange={v => { setAddForm(p => ({...p, phone: v})); setAddErr(""); }}
            error={addErr.includes("raqam")} />
        </FormField>
        <FormField label="Ota-ona telefoni" hint="Ixtiyoriy">
          <PhoneInput value={addForm.parentPhone} onChange={v => setAddForm(p => ({...p, parentPhone: v}))} />
        </FormField>
        {addErr && !addErr.includes("Ism") && !addErr.includes("raqam") && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-100 rounded-xl px-3 py-2.5">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <p className="text-[12px] font-medium text-red-600 dark:text-red-400">{addErr}</p>
          </div>
        )}
      </Modal>

      <div className="p-5 space-y-5">
        {/* Info cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Group info */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", group.color ?? "bg-blue-100 text-blue-700")}>
                <BookOpen className="w-5 h-5" />
              </div>
              <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-semibold", status.cls)}>{status.label}</span>
            </div>
            <h2 className="font-bold text-neutral-900 dark:text-neutral-100 mb-1">{group.name}</h2>
            <p className="text-[12px] text-neutral-500 dark:text-neutral-400">{group.course?.name}</p>
            <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-1.5">
              <div className="flex items-center gap-2 text-[12px] text-neutral-500">
                <Clock className="w-3 h-3" />
                {group.startTime} – {group.endTime}
              </div>
              <div className="flex items-center gap-2 text-[12px] text-neutral-500">
                <Calendar className="w-3 h-3" />
                {group.scheduleDays?.map((d: string) => DAY_LABELS[d.toLowerCase()] ?? d).join(", ")}
              </div>
              <div className="flex items-center gap-2 text-[12px] text-neutral-500">
                <GraduationCap className="w-3 h-3" />
                {new Date(group.startDate).toLocaleDateString("uz-UZ")} dan boshlanadi
              </div>
            </div>
          </div>

          {/* Teacher */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5">
            <h3 className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">O'qituvchi</h3>
            {teacher ? (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-lg font-black">
                  {teacher.name[0]}
                </div>
                <div>
                  <Link href={`/teachers/${group.teacher?.id}`}
                    className="font-bold text-neutral-900 dark:text-neutral-100 hover:text-blue-600 transition-colors">
                    {teacher.name}
                  </Link>
                  <p className="text-[12px] text-neutral-400">{teacher.phone}</p>
                </div>
              </div>
            ) : (
              <p className="text-[13px] text-neutral-400">O'qituvchi biriktirilmagan</p>
            )}
          </div>

          {/* Students stats */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5">
            <h3 className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">O'quvchilar</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-neutral-500">Jami</span>
                <span className="text-[14px] font-bold text-neutral-900 dark:text-neutral-100">{group.students?.length ?? 0}/{group.maxStudents}</span>
              </div>
              <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, ((group.students?.length ?? 0) / group.maxStudents) * 100)}%` }} />
              </div>
              <div className="flex gap-3">
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span className="text-[11px] text-neutral-500">{activeStudents} faol</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-500" />
                  <span className="text-[11px] text-neutral-500">{sinovStudents} sinov</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Students list */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-neutral-400" />
            <h3 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">O'quvchilar ro'yxati</h3>
          </div>
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {group.students?.length === 0 && (
              <p className="text-[12px] text-neutral-400 p-6 text-center">O'quvchilar yo'q</p>
            )}
            {group.students?.map((sg: any) => {
              const s       = sg.student;
              const enroll  = ENROLL_CFG[sg.enrollmentStatus];
              return (
                <div key={sg.id} className="flex items-center justify-between px-5 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center text-white text-[12px] font-bold",
                      s.isActive
                        ? "bg-gradient-to-br from-blue-400 to-indigo-500"
                        : "bg-gradient-to-br from-amber-400 to-orange-400"
                    )}>
                      {s.name[0]}
                    </div>
                    <div>
                      <Link href={`/students/${s.id}`}
                        className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 hover:text-blue-600 transition-colors">
                        {s.name}
                      </Link>
                      <p className="text-[11px] text-neutral-400">{s.phone}</p>
                    </div>
                  </div>
                  <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-semibold", enroll?.cls)}>
                    {enroll?.label ?? sg.enrollmentStatus}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
