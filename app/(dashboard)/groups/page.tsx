"use client";

import { useState, useMemo } from "react";
import { TopHeader } from "@/components/layout/top-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Modal, ConfirmDeleteModal } from "@/components/ui/modal";
import { FormField } from "@/components/ui/form-field";
import Link from "next/link";
import { Search, Users, Clock, CalendarDays, BookOpen, TrendingUp, Edit, Trash2, ChevronRight, MapPin, Plus, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { TOUR_TARGETS } from "@/lib/onboarding/steps";
import { useGroups } from "@/lib/hooks/useGroups";
import { useCourses } from "@/lib/hooks/useCourses";
import { useTeachers } from "@/lib/hooks/useTeachers";
import { useRooms } from "@/lib/hooks/useRooms";
import { useBranch } from "@/lib/contexts/branch-context";
import { WEEKDAYS, WEEKDAY_SHORT, SCHEDULE_PRESETS, todayStr } from "@/lib/form-constants";
import { mutate } from "swr";
import { useMe, hasPerm } from "@/lib/hooks/useMe";

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  ACTIVE:    { label: "Faol",    cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  UPCOMING:  { label: "Keladi",  cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  COMPLETED: { label: "Tugagan", cls: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400" },
};
const STATUS_TABS = [
  { v: "barchasi", l: "Barchasi" },
  { v: "ACTIVE",   l: "Faol" },
  { v: "UPCOMING", l: "Keladi" },
  { v: "COMPLETED",l: "Tugagan" },
];

const selectCls =
  "w-full h-10 px-3 text-[13px] rounded-xl border border-white/60 dark:border-white/10 " +
  "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:border-indigo-500 transition-colors";

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded-xl", className)} />;
}

const EMPTY_FORM = {
  name: "", courseId: "", teacherId: "", roomId: "", maxStudents: "15",
  scheduleDays: [] as string[], startTime: "18:00", endTime: "19:30",
  startDate: todayStr(), endDate: "", status: "ACTIVE",
};

function revalidate() {
  mutate((k: string) => typeof k === "string" && k.startsWith("/api/groups"), undefined, { revalidate: true });
}

export default function GroupsPage() {
  // Amal tugmalari ruxsatga bog'landi — ilgari hammaga ko'rinardi va
  // bosilganda backend 403 qaytarardi (o'qituvchida bu ruxsatlar yo'q).
  const { me } = useMe();
  const canCreate = hasPerm(me?.permissions, "groups.create");
  const canUpdate = hasPerm(me?.permissions, "groups.update");
  const canDelete = hasPerm(me?.permissions, "groups.delete");
  // Xona qo'shish Sozlamalar bo'limida — huquqi yo'qni u yerga yubormaymiz.
  const canManageRooms = hasPerm(me?.permissions, "rooms.create");
  const { activeBranchId } = useBranch();
  const [search,    setSearch]    = useState("");
  const [statusTab, setStatusTab] = useState("barchasi");
  const [showModal, setShowModal] = useState(false);
  const [editId,    setEditId]    = useState<string | null>(null);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  // Inline xona qo'shish (guruh yaratish formasidan chiqmasdan)
  const [showNewRoom,    setShowNewRoom]    = useState(false);
  const [newRoomName,    setNewRoomName]    = useState("");
  const [newRoomCapacity,setNewRoomCapacity]= useState("");
  const [newRoomSaving,  setNewRoomSaving]  = useState(false);
  const [newRoomErr,     setNewRoomErr]     = useState("");

  const { data: raw, isLoading } = useGroups();
  const { data: coursesRaw }     = useCourses();
  const { data: teachersRaw }    = useTeachers();
  const { data: roomsRaw }       = useRooms();

  const groups:    any[] = Array.isArray(raw)         ? raw         : [];
  const courses:   any[] = Array.isArray(coursesRaw)  ? coursesRaw  : [];
  const teachers:  any[] = Array.isArray(teachersRaw) ? teachersRaw : [];
  const allRooms:  any[] = Array.isArray(roomsRaw)    ? roomsRaw    : [];
  // "Yaratish" formasida faqat aktiv filial xonalari — boshqa filial xonasini
  // tasodifan tanlab qo'yish (va backendda rad etilishi) oldini olamiz.
  const rooms = activeBranchId ? allRooms.filter(r => r.branchId === activeBranchId) : allRooms;
  // Guruh o'quvchi soniga sig'maydigan xonani ko'rsatmaymiz — joriy tanlangan
  // xona (tahrirlashda) va sig'imi belgilanmagan xonalar har doim ko'rinadi.
  const parsedMaxStudents = parseInt(form.maxStudents) || 15;
  const eligibleRooms = rooms.filter(r =>
    r.id === form.roomId || r.capacity == null || r.capacity >= parsedMaxStudents,
  );

  async function createRoomInline() {
    if (!newRoomName.trim()) { setNewRoomErr("Xona nomi kerak"); return; }
    if (!activeBranchId) { setNewRoomErr("Avval filialni tanlang"); return; }
    setNewRoomSaving(true); setNewRoomErr("");
    try {
      const res = await fetch("/api/rooms", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRoomName.trim(), branchId: activeBranchId,
          ...(newRoomCapacity ? { capacity: Number(newRoomCapacity) } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setNewRoomErr(data.error ?? "Xatolik"); return; }
      mutate("/api/rooms");
      setForm(p => ({ ...p, roomId: data.id }));
      setShowNewRoom(false); setNewRoomName(""); setNewRoomCapacity("");
    } catch { setNewRoomErr("Serverga ulanib bo'lmadi"); }
    finally { setNewRoomSaving(false); }
  }

  const filtered = useMemo(() => groups.filter(g => {
    const q = search.toLowerCase();
    const matchS = g.name.toLowerCase().includes(q) || g.teacher?.user?.name?.toLowerCase().includes(q) || g.course?.name?.toLowerCase().includes(q);
    const matchT = statusTab === "barchasi" || g.status === statusTab;
    return matchS && matchT;
  }), [groups, search, statusTab]);

  const stats = useMemo(() => ({
    faol: groups.filter(g => g.status === "ACTIVE").length,
    jami: groups.reduce((s, g) => s + (g._count?.students ?? 0), 0),
    bosh: groups.reduce((s, g) => s + Math.max((g.maxStudents ?? 15) - (g._count?.students ?? 0), 0), 0),
  }), [groups]);

  function openCreate() {
    setEditId(null); setForm(EMPTY_FORM); setError("");
    setShowNewRoom(false); setNewRoomName(""); setNewRoomCapacity(""); setNewRoomErr("");
    setShowModal(true);
  }
  function openEdit(g: any) {
    setEditId(g.id);
    setForm({
      name: g.name, courseId: g.courseId ?? "", teacherId: g.teacherId ?? "", roomId: g.roomId ?? "",
      maxStudents: String(g.maxStudents ?? 15),
      scheduleDays: g.scheduleDays ?? [],
      startTime: g.startTime, endTime: g.endTime,
      startDate: g.startDate?.slice(0,10) ?? todayStr(),
      endDate: g.endDate?.slice(0,10) ?? "",
      status: g.status,
    });
    setError("");
    setShowNewRoom(false); setNewRoomName(""); setNewRoomCapacity(""); setNewRoomErr("");
    setShowModal(true);
  }

  function toggleDay(d: string) {
    setForm(p => ({
      ...p,
      scheduleDays: p.scheduleDays.includes(d)
        ? p.scheduleDays.filter(x => x !== d)
        : [...p.scheduleDays, d],
    }));
  }
  function applyPreset(days: readonly string[]) {
    setForm(p => ({ ...p, scheduleDays: [...days] }));
  }

  // Course tanlanganda narx asosida maxStudents taxminini o'zgartirmaymiz, faqat nomni taklif
  function onCourseChange(courseId: string) {
    const c = courses.find(x => x.id === courseId);
    setForm(p => ({
      ...p,
      courseId,
      name: p.name || (c ? `${c.name} guruhi` : ""),
    }));
  }

  // Status va boshlanish sanasi bir-biriga bog'liq (server ham shu qoidani
  // qo'llaydi) — foydalanuvchi natijani oldindan bilib tursin.
  const statusHint = (() => {
    const startsLater = form.startDate > todayStr();
    if (form.status === "COMPLETED") return undefined;
    if (form.status === "ACTIVE" && startsLater) {
      return editId
        ? `Guruh bugundan (${todayStr()}) ochilgan hisoblanadi`
        : "Boshlanish sanasi kelguncha 'Keladi' bo'lib turadi";
    }
    if (form.status === "UPCOMING" && !startsLater) return "Boshlanish sanasi kelgan — guruh 'Faol' bo'ladi";
    return undefined;
  })();

  async function submit() {
    if (!form.name.trim() || !form.courseId || !form.teacherId) { setError("Nom, kurs va o'qituvchi majburiy"); return; }
    // Xona majburiy: bitta xonada bir vaqtda ikkita dars qo'yilib qolmasligi
    // uchun jadval xonaga bog'langan bo'lishi kerak. Server ham tekshiradi.
    if (!form.roomId) {
      setError(rooms.length === 0
        ? "Avval xona qo'shing — Sozlamalar → Xonalar"
        : "Xonani tanlang — bir xonada ikkita dars bo'lib qolmasligi uchun");
      return;
    }
    if (form.scheduleDays.length === 0) { setError("Kamida 1 ta dars kuni tanlang"); return; }
    if (form.endTime <= form.startTime) { setError("Tugash vaqti boshlanish vaqtidan keyin bo'lsin"); return; }
    setSaving(true); setError("");
    try {
      const body: any = {
        name: form.name, courseId: form.courseId, teacherId: form.teacherId,
        maxStudents: parseInt(form.maxStudents) || 15,
        scheduleDays: form.scheduleDays, startTime: form.startTime, endTime: form.endTime,
        startDate: form.startDate, status: form.status,
      };
      body.roomId = form.roomId;
      // Tahrirda bo'sh qiymat ham yuboriladi — aks holda tugash sanasini
      // olib tashlab bo'lmasdi (server "yuborilmadi" ni "o'zgarmadi" deb
      // tushunardi va guruh o'z-o'zidan "Tugagan" bo'lib qolaverardi).
      if (editId || form.endDate) body.endDate = form.endDate;
      if (!editId && activeBranchId) body.branchId = activeBranchId;

      const res = await fetch(editId ? `/api/groups/${editId}` : "/api/groups", {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Xatolik"); return; }
      revalidate();
      setShowModal(false);
    } catch { setError("Serverga ulanib bo'lmadi"); }
    finally { setSaving(false); }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/groups/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "O'chirib bo'lmadi"); return; }
      revalidate();
      setDeleteTarget(null);
    } finally { setSaving(false); }
  }

  return (
    <div>
      <TopHeader
        title="Guruhlar"
        subtitle={isLoading ? "Yuklanmoqda..." : `Jami ${groups.length} ta guruh`}
        action={canCreate ? { label: "Yangi guruh", onClick: openCreate } : undefined}
      />

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editId ? "Guruhni tahrirlash" : "Yangi guruh"}
        subtitle={editId ? undefined : "Guruh ma'lumotlarini to'ldiring"}
        size="lg"
        footer={
          <>
            <Button onClick={submit} disabled={saving} data-tour={TOUR_TARGETS.groupSubmit}
              className="flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-semibold">
              {saving ? "Saqlanmoqda..." : editId ? "Saqlash" : "Yaratish"}
            </Button>
            <Button variant="outline" className="h-10 px-4 text-[13px]" onClick={() => setShowModal(false)}>Bekor</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Kurs" required>
            <select value={form.courseId} onChange={e => onCourseChange(e.target.value)} className={selectCls}
              data-tour={TOUR_TARGETS.groupCourseSelect}>
              <option value="">Tanlang...</option>
              {courses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FormField>
          <FormField label="O'qituvchi" required>
            <select value={form.teacherId} onChange={e => setForm(p => ({...p, teacherId: e.target.value}))} className={selectCls}
              data-tour={TOUR_TARGETS.groupTeacherSelect}>
              <option value="">Tanlang...</option>
              {teachers.map((t: any) => <option key={t.id} value={t.id}>{t.user?.name}</option>)}
            </select>
          </FormField>
        </div>

        <FormField label="Guruh nomi" required>
          <Input placeholder="Ingliz tili A1 guruh" value={form.name}
            onChange={e => setForm(p => ({...p, name: e.target.value}))} className="h-10" />
        </FormField>

        <FormField label="Dars kunlari" required>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {SCHEDULE_PRESETS.map(p => (
              <button key={p.label} type="button" onClick={() => applyPreset(p.days)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-indigo-200 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors">
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {WEEKDAYS.map(d => (
              <button key={d.value} type="button" onClick={() => toggleDay(d.value)}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                  form.scheduleDays.includes(d.value)
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "border-white/60 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400")}>
                {d.label}
              </button>
            ))}
          </div>
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Boshlanish vaqti" required>
            <Input type="time" value={form.startTime}
              onChange={e => setForm(p => ({...p, startTime: e.target.value}))} className="h-10" />
          </FormField>
          <FormField label="Tugash vaqti" required>
            <Input type="time" value={form.endTime}
              onChange={e => setForm(p => ({...p, endTime: e.target.value}))} className="h-10" />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Boshlanish sanasi" required>
            <Input type="date" value={form.startDate}
              onChange={e => setForm(p => ({...p, startDate: e.target.value}))} className="h-10" />
          </FormField>
          <FormField label="Tugash sanasi" hint="Ixtiyoriy">
            <Input type="date" value={form.endDate} min={form.startDate}
              onChange={e => setForm(p => ({...p, endDate: e.target.value}))} className="h-10" />
          </FormField>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <FormField label="Xona" required hint="Sig'imiga qarab filtrlangan">
            <select value={form.roomId} onChange={e => setForm(p => ({...p, roomId: e.target.value}))} className={selectCls}
              data-tour={TOUR_TARGETS.groupRoomSelect}>
              <option value="">Tanlang...</option>
              {eligibleRooms.map((r: any) => (
                <option key={r.id} value={r.id}>{r.name}{r.capacity ? ` (${r.capacity} joy)` : ""}</option>
              ))}
            </select>
            {rooms.length > eligibleRooms.length && (
              <p className="text-[10px] text-neutral-400 mt-1">
                {rooms.length - eligibleRooms.length} ta xona {parsedMaxStudents} kishiga sig'maydi — ko'rsatilmadi
              </p>
            )}
            <button type="button" onClick={() => { setShowNewRoom(v => !v); setNewRoomErr(""); }}
              className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              <Plus className="w-3 h-3" /> Yangi xona qo'shish
            </button>
            {showNewRoom && (
              <div className="mt-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-900/40 space-y-2">
                <Input placeholder="Xona nomi" value={newRoomName}
                  onChange={e => setNewRoomName(e.target.value)} className="h-8 text-[12px]" />
                <Input type="number" placeholder="Sig'imi (ixtiyoriy)" value={newRoomCapacity} min="1"
                  onChange={e => setNewRoomCapacity(e.target.value)} className="h-8 text-[12px]" />
                {newRoomErr && <p className="text-[11px] text-red-500">{newRoomErr}</p>}
                <Button type="button" onClick={createRoomInline} disabled={newRoomSaving}
                  className="w-full h-8 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px]">
                  {newRoomSaving ? "Qo'shilmoqda..." : "Qo'shish"}
                </Button>
              </div>
            )}
          </FormField>
          <FormField label="Max o'quvchi">
            <Input type="number" value={form.maxStudents} min="1" max="50"
              onChange={e => setForm(p => ({...p, maxStudents: e.target.value}))} className="h-10" />
          </FormField>
          <FormField label="Status" hint={statusHint}>
            <select value={form.status} onChange={e => setForm(p => ({...p, status: e.target.value}))} className={selectCls}>
              <option value="ACTIVE">Faol</option>
              <option value="UPCOMING">Keladi</option>
              <option value="COMPLETED">Tugagan</option>
            </select>
          </FormField>
        </div>

        {error && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>}
      </Modal>

      <ConfirmDeleteModal
        open={!!deleteTarget} onClose={() => { setDeleteTarget(null); setError(""); }}
        onConfirm={confirmDelete} loading={saving}
        title="Guruhni o'chirish"
        description={<><span className="font-semibold">{deleteTarget?.name}</span> o'chirilsinmi? Bu amalni qaytarib bo'lmaydi.
          {error && <span className="block mt-2 text-red-500">{error}</span>}</>}
      />

      <div className="p-5 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { l: "Faol guruhlar", v: stats.faol, icon: TrendingUp, bg: "bg-green-50 dark:bg-green-950/40",   text: "text-green-600" },
            { l: "Jami o'quvchi", v: stats.jami, icon: Users,      bg: "bg-blue-50 dark:bg-blue-950/40",     text: "text-blue-600" },
            { l: "Bo'sh joylar",  v: stats.bosh, icon: BookOpen,   bg: "bg-orange-50 dark:bg-orange-950/40", text: "text-orange-600" },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.l} className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-4">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", s.bg)}>
                  <Icon className={cn("w-4.5 h-4.5", s.text)} />
                </div>
                {isLoading ? <Skeleton className="h-6 w-10 mb-1" />
                  : <p className="text-[22px] font-black text-neutral-900 dark:text-neutral-100 leading-none">{s.v}</p>}
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">{s.l}</p>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex p-1 gap-0.5 glass-soft rounded-xl">
            {STATUS_TABS.map(t => (
              <button key={t.v} onClick={() => setStatusTab(t.v)}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  statusTab === t.v
                    ? "bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-neutral-100"
                    : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700")}>
                {t.l} <span className="ml-1 text-neutral-400">{t.v === "barchasi" ? groups.length : groups.filter(g => g.status === t.v).length}</span>
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input placeholder="Guruh, o'qituvchi..." className="pl-9 h-9 text-sm w-60"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span className="ml-auto text-xs text-neutral-400">{filtered.length} ta guruh</span>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {isLoading
            ? Array.from({length:3}).map((_,i) => (
                <div key={i} className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-4 space-y-3">
                  {Array.from({length:4}).map((_,j) => <Skeleton key={j} className="h-4 w-full" />)}
                </div>
              ))
            : filtered.map((g: any) => {
                const cnt       = g._count?.students ?? 0;
                const max       = g.maxStudents ?? 15;
                const occ       = Math.round((cnt/max)*100);
                const cfg       = STATUS_CFG[g.status] ?? STATUS_CFG.ACTIVE;
                const barColor  = occ >= 100 ? "bg-red-500" : occ >= 80 ? "bg-amber-500" : "bg-green-500";
                const days      = (g.scheduleDays ?? []).map((d: string) => WEEKDAY_SHORT[d] ?? d).join(", ");
                return (
                  <div key={g.id} className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[14px] text-neutral-900 dark:text-neutral-100 truncate">{g.name}</h3>
                        <p className="text-[12px] text-blue-600 dark:text-blue-400 mt-0.5">{g.course?.name}</p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <span className={cn("text-[11px] px-2.5 py-1 rounded-lg font-semibold shrink-0", cfg.cls)}>{cfg.label}</span>
                        {canUpdate && (
                          <button onClick={() => openEdit(g)} className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-orange-600 hover:bg-orange-50 transition-colors">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => { setError(""); setDeleteTarget(g); }} className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <Link href={`/groups/${g.id}`} className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-[12px] text-neutral-600 dark:text-neutral-400">
                        <Users className="w-3.5 h-3.5 shrink-0 text-neutral-400" />{g.teacher?.user?.name ?? "—"}
                      </div>
                      <div className="flex items-center gap-2 text-[12px] text-neutral-600 dark:text-neutral-400">
                        <CalendarDays className="w-3.5 h-3.5 shrink-0 text-neutral-400" />{days || "—"}
                      </div>
                      <div className="flex items-center gap-2 text-[12px] text-neutral-600 dark:text-neutral-400">
                        <Clock className="w-3.5 h-3.5 shrink-0 text-neutral-400" />{g.startTime} – {g.endTime}
                        {g.room?.name
                          ? <><MapPin className="w-3.5 h-3.5 shrink-0 text-neutral-400 ml-2" />{g.room.name}</>
                          : null}
                      </div>
                      {/* Xonasiz guruh — jadvalda to'qnashuvni tekshirib
                          bo'lmaydi. Bosilganda xonalar sozlamasiga o'tadi. */}
                      {!g.roomId && (canManageRooms ? (
                        <Link href="/settings?tab=xonalar"
                          onClick={e => e.stopPropagation()}
                          className="flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-lg w-fit
                            bg-amber-50 text-amber-700 hover:bg-amber-100
                            dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50 transition-colors">
                          <AlertTriangle className="w-3 h-3" />
                          Xona biriktirilmagan — xona qo&apos;shish
                        </Link>
                      ) : (
                        // Sozlamalarga kira olmaydigan xodimga havola
                        // berilmaydi — u yerda baribir 403 oladi.
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-lg w-fit
                          bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          <AlertTriangle className="w-3 h-3" />
                          Xona biriktirilmagan
                        </span>
                      ))}
                    </div>
                    <div className="border-t border-white/50 dark:border-white/10 pt-3">
                      <div className="flex items-center justify-between text-[11px] mb-1.5">
                        <span className="text-neutral-500">To'lganlik</span>
                        <span className="font-bold text-neutral-700 dark:text-neutral-300">{cnt}/{max} ({occ}%)</span>
                      </div>
                      <div className="h-1.5 glass-soft rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${Math.min(occ, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })
          }
        </div>
        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center py-16 text-neutral-400">
            <BookOpen className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm font-semibold">Guruh topilmadi</p>
          </div>
        )}
      </div>
    </div>
  );
}
