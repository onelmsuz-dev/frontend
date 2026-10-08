"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useGroup } from "@/lib/hooks/useGroups";
import { TopHeader } from "@/components/layout/top-header";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, AlertCircle, CalendarCheck, Star, PlayCircle,
  Percent, FileCheck2, History, MessageSquare,
} from "lucide-react";
import { mutate } from "swr";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { FormField } from "@/components/ui/form-field";
import { PhoneInput } from "@/components/ui/phone-input";
import { GroupInfoSidebar } from "@/components/groups/group-info-sidebar";
import { GroupAttendanceGrid } from "@/components/groups/group-attendance-grid";
import { EntityHistorySection } from "@/components/activity/entity-history-section";
import { GroupNotesSection } from "@/components/groups/group-notes-section";
import { GroupTabPlaceholder } from "@/components/groups/group-tab-placeholder";
import { useMe, hasPerm } from "@/lib/hooks/useMe";
import { TabGlide, TabPanel, tabCls } from "@/components/ui/tab-glide";

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded-xl", className)} />;
}

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  ACTIVE:    { label: "Faol",        cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  UPCOMING:  { label: "Yaqinda",     cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  COMPLETED: { label: "Yakunlangan", cls: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800" },
};

const TABS = [
  { id: "davomat",  label: "Davomat",                    icon: CalendarCheck },
  { id: "baho",     label: "Baholash",                   icon: Star },
  { id: "onlayn",   label: "Onlayn darslar va materiallar", icon: PlayCircle },
  { id: "chegirma", label: "Chegirmali narx",             icon: Percent },
  { id: "imtihon",  label: "Imtihonlar",                  icon: FileCheck2 },
  { id: "tarix",    label: "Tarix",                       icon: History },
  { id: "izoh",     label: "Izohlar",                     icon: MessageSquare },
] as const;

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: group, isLoading } = useGroup(id);
  const { me } = useMe();
  const canUpdate = hasPerm(me?.permissions, "students.update");
  const canDelete = hasPerm(me?.permissions, "students.delete");
  /**
   * DAVOMAT — ALOHIDA RUXSAT.
   *
   * Guruhni ko'rish (`groups.view`) davomatni ko'rish degani EMAS.
   * Sotuvchi/operator roli aynan shunday: guruhlarni ko'radi, lekin
   * `attendance.*` yo'q. Ilgari bu bo'lim shartsiz chizilardi va
   * backend uni 403 bilan to'sardi — ekranda esa ishlaydigan bo'lib
   * turardi (2026-09-17, egasining xabari).
   */
  const canSeeAttendance  = hasPerm(me?.permissions, "attendance.view");
  const canMarkAttendance = hasPerm(me?.permissions, "attendance.mark");
  // Tarix backendda `activity.view` bilan — ruxsatsiz xodimga tab bo'sh
  // chiqardi, shuning uchun umuman ko'rsatilmaydi.
  const canSeeHistory = hasPerm(me?.permissions, "activity.view");

  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("davomat");

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
        <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-5">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
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

  const status = STATUS_CFG[group.status] ?? STATUS_CFG.ACTIVE;
  const students = group.students ?? [];

  return (
    <div>
      <TopHeader
        title={`${group.name} · ${group.course?.name ?? "—"}${group.teacher?.user?.name ? ` · ${group.teacher.user.name}` : ""}`}
        subtitle={
          <Link href="/groups" className="flex items-center gap-1 text-neutral-400 hover:text-neutral-600 text-sm transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Guruhlar
          </Link>
        }
        // Sidebar'dagi + belgisi ko'zga tashlanmas edi — bu yerda aniq
        // yozuvli, doim ko'rinadigan tugma (boshqa sahifalardagi bilan
        // bir xil joy: sahifa yuqori o'ng burchagi).
        action={canUpdate ? { label: "O'quvchi qo'shish", onClick: () => { setAddErr(""); setShowAdd(true); } } : undefined}
      />

      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Yangi o'quvchi qo'shish"
        subtitle={`Guruh: ${group.name}`}
        footer={
          <>
            <Button onClick={submitAdd} disabled={addSaving}
 className="flex-1 h-9 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 text-white text-[13px]">
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

      {/* CHAP: ixcham guruh ma'lumoti + raqamlangan o'quvchilar ro'yxati.
          O'NG: tab qatori (Davomat, Baholash, ... Tarix, Izohlar) — har
          safar faqat bitta bo'lim ko'rinadi, ekran uzun ro'yxatlar bilan
          to'lib ketmaydi (egasining ko'rsatgan namunasi, 2026-09-28). */}
      <div className="p-5 grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-5 items-start">
        {/* ── CHAP USTUN ── */}
        <div className="xl:sticky xl:top-4">
          <GroupInfoSidebar
            group={group}
            students={students}
            groupId={id}
            canUpdate={canUpdate}
            canDelete={canDelete}
            status={status}
            onAddStudent={() => { setAddErr(""); setShowAdd(true); }}
            onChanged={() => mutate(`/api/groups/${id}`)}
          />
        </div>

        {/* ── O'NG USTUN ── */}
        <div className="min-w-0 space-y-4">
          <nav className="overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabGlide watch={tab} className="flex w-max items-center gap-1">
            {TABS.filter(t => t.id !== "tarix" || canSeeHistory).map(t => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  data-tab-active={active} aria-pressed={active}
                  className={tabCls(active)}>
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              );
            })}
          </TabGlide>
          </nav>

          <TabPanel k={tab} className="space-y-4">
          {tab === "davomat" && (
            canSeeAttendance ? (
              <GroupAttendanceGrid
                groupId={id}
                scheduleDays={group.scheduleDays ?? []}
                students={students}
                canMark={canMarkAttendance}
                startTime={group.startTime}
                startDate={group.startDate}
                endDate={group.endDate}
              />
            ) : (
              <p className="text-[12px] text-neutral-400 px-5 py-8 text-center glass-panel border border-white/60 dark:border-white/10 rounded-2xl">
                Davomatni ko&apos;rish uchun ruxsatingiz yo&apos;q
              </p>
            )
          )}
          {tab === "baho" && (
            <GroupTabPlaceholder icon={Star} title="Baholash"
              note="O'quvchilarga dars/topshiriq bo'yicha baho qo'yish bu yerda bo'ladi." />
          )}
          {tab === "onlayn" && (
            <GroupTabPlaceholder icon={PlayCircle} title="Onlayn darslar va materiallar"
              note="Video darslar, fayllar va uy vazifalari shu yerga joylanadi." />
          )}
          {tab === "chegirma" && (
            <GroupTabPlaceholder icon={Percent} title="Chegirmali narx"
              note="Guruh darajasidagi maxsus narx/chegirma sozlamalari shu yerda bo'ladi." />
          )}
          {tab === "imtihon" && (
            <GroupTabPlaceholder icon={FileCheck2} title="Imtihonlar"
              note="Guruh imtihonlari va natijalari shu yerda ko'rinadi." />
          )}
          {/* `entity` — jurnaldagi NOM ("Group"). Ilgari "groups" yuborilardi
              va tab har doim bo'sh chiqardi. */}
          {tab === "tarix" && canSeeHistory && (
            <EntityHistorySection entity="Group" entityId={id}
              emptyHint="Guruh bilan bog'liq harakatlar shu yerda ko'rinadi." />
          )}
          {tab === "izoh" && <GroupNotesSection groupId={id} canUpdate={canUpdate} />}
          </TabPanel>
        </div>
      </div>
    </div>
  );
}
