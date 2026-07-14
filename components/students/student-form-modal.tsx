"use client";

import { useState, useEffect, useMemo } from "react";
import { mutate } from "swr";
import { Plus, AlertCircle, Users, UserPlus, ChevronDown } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { PhoneInput } from "@/components/ui/phone-input";
import { GenderPicker } from "@/components/ui/segmented";
import { useGroups } from "@/lib/hooks/useGroups";
import { useCourses } from "@/lib/hooks/useCourses";
import { useTeachers } from "@/lib/hooks/useTeachers";
import { useBranches } from "@/lib/hooks/useBranches";
import { useBranch } from "@/lib/contexts/branch-context";
import { SOURCE_OPTIONS, WEEKDAYS, SCHEDULE_PRESETS, todayStr, type Gender } from "@/lib/form-constants";
import { cn } from "@/lib/utils";

const selectCls =
  "w-full h-10 px-3 text-[13px] rounded-xl border border-neutral-200 dark:border-neutral-700 " +
  "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none " +
  "focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors";

interface Props {
  open: boolean;
  mode: "create" | "edit";
  initial?: any;
  onClose: () => void;
  onSaved: () => void;
}

function emptyForm() {
  return {
    name: "", phone: "", birthDate: "", password: "",
    source: "", gender: "MALE" as Gender,
    parentPhone: "", parentName: "",
    groupId: "", joinDate: todayStr(),
  };
}

function revalidateGroups() {
  mutate((k: string) => typeof k === "string" && k.startsWith("/api/groups"), undefined, { revalidate: true });
}

export function StudentFormModal({ open, mode, initial, onClose, onSaved }: Props) {
  const isEdit = mode === "edit";
  const { activeBranchId } = useBranch();

  const [form, setForm] = useState(emptyForm());
  const [fErr, setFErr] = useState<{ name?: string; phone?: string }>({});
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  // Collapsible sections
  const [openGroup, setOpenGroup] = useState(true);
  const [openParent, setOpenParent] = useState(false);

  // Group filters
  const [fBranch, setFBranch] = useState("");
  const [fTeacher, setFTeacher] = useState("");
  const [fCourse, setFCourse] = useState("");

  const { data: groupsRaw } = useGroups({ status: "ACTIVE" });
  const { data: coursesRaw } = useCourses();
  const { data: teachersRaw } = useTeachers();
  const { data: branchesRaw } = useBranches();
  const groups: any[] = Array.isArray(groupsRaw) ? groupsRaw : [];
  const courses: any[] = Array.isArray(coursesRaw) ? coursesRaw : [];
  const teachers: any[] = Array.isArray(teachersRaw) ? teachersRaw : [];
  const branches: any[] = Array.isArray(branchesRaw) ? branchesRaw : [];

  // Reset when opened
  useEffect(() => {
    if (!open) return;
    if (isEdit && initial) {
      setForm({
        name: initial.name ?? "", phone: initial.phone ?? "",
        birthDate: initial.birthDate ? String(initial.birthDate).slice(0, 10) : "",
        password: "", source: initial.source ?? "",
        gender: initial.gender ?? "MALE",
        parentPhone: initial.parentPhone ?? "", parentName: initial.parentName ?? "",
        groupId: "", joinDate: todayStr(),
      });
      setOpenParent(!!(initial.parentPhone || initial.parentName));
      setOpenGroup(false);
    } else {
      setForm(emptyForm());
      setOpenGroup(true); setOpenParent(false);
    }
    setFErr({}); setErr("");
    setFBranch(""); setFTeacher(""); setFCourse(""); setShowNewGroup(false);
  }, [open, isEdit, initial]);

  const filteredGroups = useMemo(() =>
    groups.filter(g =>
      (!fBranch || g.branchId === fBranch) &&
      (!fTeacher || g.teacherId === fTeacher) &&
      (!fCourse || g.courseId === fCourse)
    ), [groups, fBranch, fTeacher, fCourse]);

  // ── Inline "yangi guruh" ───────────────────────────────────────────────────
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [ng, setNg] = useState({
    name: "", courseId: "", teacherId: "",
    scheduleDays: [] as string[], startTime: "18:00", endTime: "19:30",
    startDate: todayStr(),
  });
  const [ngSaving, setNgSaving] = useState(false);
  const [ngErr, setNgErr] = useState("");

  function toggleNgDay(d: string) {
    setNg(p => ({ ...p, scheduleDays: p.scheduleDays.includes(d) ? p.scheduleDays.filter(x => x !== d) : [...p.scheduleDays, d] }));
  }

  async function createGroup() {
    if (!ng.name.trim() || !ng.courseId || !ng.teacherId) { setNgErr("Nom, kurs va o'qituvchi majburiy"); return; }
    if (ng.scheduleDays.length === 0) { setNgErr("Kamida 1 ta kun tanlang"); return; }
    setNgSaving(true); setNgErr("");
    try {
      const res = await fetch("/api/groups", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: ng.name, courseId: ng.courseId, teacherId: ng.teacherId,
          scheduleDays: ng.scheduleDays, startTime: ng.startTime, endTime: ng.endTime,
          startDate: ng.startDate, status: "ACTIVE",
          ...(activeBranchId ? { branchId: activeBranchId } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setNgErr(data.error ?? "Guruh yaratilmadi"); return; }
      revalidateGroups();
      setForm(p => ({ ...p, groupId: data.id }));
      setShowNewGroup(false);
      setNg({ name: "", courseId: "", teacherId: "", scheduleDays: [], startTime: "18:00", endTime: "19:30", startDate: todayStr() });
    } catch { setNgErr("Serverga ulanib bo'lmadi"); }
    finally { setNgSaving(false); }
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function submit() {
    const e: typeof fErr = {};
    if (!form.name.trim()) e.name = "Ism majburiy";
    if (form.phone.replace(/\D/g, "").length !== 12) e.phone = "To'liq 9 ta raqam kiriting";
    if (e.name || e.phone) { setFErr(e); return; }

    setSaving(true); setErr("");
    try {
      const body: Record<string, unknown> = {
        name: form.name.trim(), phone: form.phone, gender: form.gender,
      };
      if (form.birthDate) body.birthDate = form.birthDate;
      if (form.password.trim()) body.password = form.password;
      if (form.source) body.source = form.source;
      if (form.parentPhone.replace(/\D/g, "").length === 12) body.parentPhone = form.parentPhone;
      if (form.parentName.trim()) body.parentName = form.parentName.trim();

      if (!isEdit) {
        if (form.groupId) { body.groupId = form.groupId; body.joinDate = form.joinDate; }
        if (activeBranchId) body.branchId = activeBranchId;
      }

      const url = isEdit ? `/api/students/${initial.id}` : "/api/students";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "Xatolik"); return; }
      onSaved();
      onClose();
    } catch { setErr("Serverga ulanib bo'lmadi"); }
    finally { setSaving(false); }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "O'quvchini tahrirlash" : "O'quvchi qo'shish"}
      subtitle={isEdit ? initial?.name : "Yangi o'quvchi ma'lumotlarini to'ldiring"}
      size="lg"
      footer={
        <>
          <Button onClick={submit} disabled={saving}
            className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-semibold">
            {saving ? "Saqlanmoqda..." : isEdit ? "Saqlash" : "Saqlash"}
          </Button>
          <Button variant="outline" className="h-10 px-4 text-[13px]" onClick={onClose}>Bekor</Button>
        </>
      }
    >
      {/* Avatar (harf) */}
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-black text-3xl">
          {form.name.trim()?.[0]?.toUpperCase() ?? "?"}
        </div>
      </div>

      <FormField label="Ism familiya" required error={fErr.name}>
        <Input placeholder="Alisher Navoiy" value={form.name}
          onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setFErr(p => ({ ...p, name: undefined })); }}
          className="h-10" />
      </FormField>

      <FormField label="Telefon raqam" required error={fErr.phone}>
        <PhoneInput value={form.phone}
          onChange={v => { setForm(p => ({ ...p, phone: v })); setFErr(p => ({ ...p, phone: undefined })); }}
          error={!!fErr.phone} />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Tug'ilgan sana">
          <Input type="date" value={form.birthDate} max={todayStr()}
            onChange={e => setForm(p => ({ ...p, birthDate: e.target.value }))} className="h-10" />
        </FormField>
        <FormField label="Manba" hint="Qayerdan bildi">
          <select value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))} className={selectCls}>
            <option value="">Tanlang...</option>
            {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </FormField>
      </div>

      <FormField label={isEdit ? "Yangi parol" : "Parol"} hint={isEdit ? "Bo'sh qoldirsangiz o'zgarmaydi" : "Ixtiyoriy — o'quvchi paneli uchun"}>
        <Input type="password" placeholder="Kamida 6 belgi" value={form.password}
          onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className="h-10" />
      </FormField>

      <FormField label="Jinsini tanlang">
        <GenderPicker value={form.gender} onChange={v => setForm(p => ({ ...p, gender: v }))} />
      </FormField>

      {/* ── Guruhga qo'shish (faqat yaratishda) ── */}
      {!isEdit && (
        <Section icon={Users} title="Guruhga qo'shish" open={openGroup} onToggle={() => setOpenGroup(o => !o)}>
          <p className="text-[11px] text-neutral-400 mb-2">
            * Guruhni tezroq topish uchun quyidagi filtrlardan foydalaning
          </p>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <select value={fBranch} onChange={e => { setFBranch(e.target.value); setForm(p => ({ ...p, groupId: "" })); }} className={cn(selectCls, "h-9 text-[12px] px-2")}>
              <option value="">Filial</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select value={fTeacher} onChange={e => { setFTeacher(e.target.value); setForm(p => ({ ...p, groupId: "" })); }} className={cn(selectCls, "h-9 text-[12px] px-2")}>
              <option value="">Ustoz</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.user?.name}</option>)}
            </select>
            <select value={fCourse} onChange={e => { setFCourse(e.target.value); setForm(p => ({ ...p, groupId: "" })); }} className={cn(selectCls, "h-9 text-[12px] px-2")}>
              <option value="">Kurslar</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <select value={form.groupId} onChange={e => setForm(p => ({ ...p, groupId: e.target.value }))} className={selectCls}>
            <option value="">Guruh tanlang...</option>
            {filteredGroups.map(g => (
              <option key={g.id} value={g.id}>
                {g.name} · {g.course?.name ?? "—"} · {g.startTime}-{g.endTime}
              </option>
            ))}
          </select>
          {filteredGroups.length === 0 && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5">Bu filtrlarga mos guruh yo'q</p>
          )}

          {/* Yangi guruh */}
          {!showNewGroup ? (
            <button type="button" onClick={() => setShowNewGroup(true)}
              className="flex items-center gap-1.5 text-[13px] font-semibold text-indigo-600 dark:text-indigo-400 mt-2.5 hover:underline">
              <Plus className="w-3.5 h-3.5" /> Yangi yaratish
            </button>
          ) : (
            <div className="mt-3 p-3 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-bold text-indigo-700 dark:text-indigo-300">Yangi guruh</p>
                <button type="button" onClick={() => setShowNewGroup(false)} className="text-neutral-400 hover:text-neutral-600 text-[11px]">Yopish</button>
              </div>
              <Input placeholder="Guruh nomi" value={ng.name}
                onChange={e => setNg(p => ({ ...p, name: e.target.value }))} className="h-9" />
              <div className="grid grid-cols-2 gap-2">
                <select value={ng.courseId} onChange={e => setNg(p => ({ ...p, courseId: e.target.value }))} className={cn(selectCls, "h-9 text-[12px] px-2")}>
                  <option value="">Kurs...</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select value={ng.teacherId} onChange={e => setNg(p => ({ ...p, teacherId: e.target.value }))} className={cn(selectCls, "h-9 text-[12px] px-2")}>
                  <option value="">O'qituvchi...</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.user?.name}</option>)}
                </select>
              </div>
              <div className="flex flex-wrap gap-1">
                {WEEKDAYS.map(d => (
                  <button key={d.value} type="button" onClick={() => toggleNgDay(d.value)}
                    className={cn("px-2 py-1 rounded-lg text-[11px] font-semibold border transition-all",
                      ng.scheduleDays.includes(d.value)
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:border-neutral-400")}>
                    {d.short}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Input type="time" value={ng.startTime} onChange={e => setNg(p => ({ ...p, startTime: e.target.value }))} className="h-9" />
                <Input type="time" value={ng.endTime} onChange={e => setNg(p => ({ ...p, endTime: e.target.value }))} className="h-9" />
                <Input type="date" value={ng.startDate} onChange={e => setNg(p => ({ ...p, startDate: e.target.value }))} className="h-9" />
              </div>
              {ngErr && <p className="text-[11px] text-red-500">{ngErr}</p>}
              <Button onClick={createGroup} disabled={ngSaving}
                className="w-full h-9 bg-indigo-600 hover:bg-indigo-700 text-white text-[12px]">
                {ngSaving ? "Yaratilmoqda..." : "Guruh yaratish"}
              </Button>
            </div>
          )}

          {form.groupId && (
            <div className="mt-3">
              <FormField label="Guruhga qo'shilish sanasi">
                <Input type="date" value={form.joinDate}
                  onChange={e => setForm(p => ({ ...p, joinDate: e.target.value }))} className="h-10" />
              </FormField>
              <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-xl px-3 py-2 mt-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  O'quvchi <strong>sinov</strong> holatida qo'shiladi. Sinov darsidan so'ng ro'yxatda "Faollashtirish" tugmasini bosing.
                </p>
              </div>
            </div>
          )}
        </Section>
      )}

      {/* ── Ota-ona ── */}
      <Section icon={UserPlus} title="Ota-ona ma'lumoti" open={openParent} onToggle={() => setOpenParent(o => !o)}>
        <div className="space-y-3">
          <FormField label="Ota-ona telefon raqami">
            <PhoneInput value={form.parentPhone} onChange={v => setForm(p => ({ ...p, parentPhone: v }))} />
          </FormField>
          <FormField label="Ota-ona ismi">
            <Input placeholder="Ismi" value={form.parentName}
              onChange={e => setForm(p => ({ ...p, parentName: e.target.value }))} className="h-10" />
          </FormField>
        </div>
      </Section>

      {err && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-xl px-3 py-2.5">
          <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
          <p className="text-[12px] font-medium text-red-600 dark:text-red-400">{err}</p>
        </div>
      )}
    </Modal>
  );
}

function Section({ icon: Icon, title, open, onToggle, children }: {
  icon: any; title: string; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
      <button type="button" onClick={onToggle}
        className="w-full flex items-center justify-between px-3.5 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
        <span className="flex items-center gap-2 text-[13px] font-semibold text-neutral-700 dark:text-neutral-300">
          <Icon className="w-4 h-4 text-neutral-400" /> {title}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-neutral-400 transition-transform duration-300 ease-out", open && "rotate-180")} />
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="px-3.5 pb-3.5 pt-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
