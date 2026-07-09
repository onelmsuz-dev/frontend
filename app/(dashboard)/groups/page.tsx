"use client";

import { useState, useMemo } from "react";
import { TopHeader } from "@/components/layout/top-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Search, Users, Clock, MapPin, CalendarDays, Eye, BookOpen, TrendingUp, X, Edit, Trash2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGroups } from "@/lib/hooks/useGroups";
import { useCourses } from "@/lib/hooks/useCourses";
import { useTeachers } from "@/lib/hooks/useTeachers";
import { mutate } from "swr";

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
const DAYS_OPTS = [
  { v: "DUSHANBA",   l: "Dushanba"   }, { v: "SESHANBA",  l: "Seshanba"  },
  { v: "CHORSHANBA", l: "Chorshanba" }, { v: "PAYSHANBA", l: "Payshanba" },
  { v: "JUMA",       l: "Juma"       }, { v: "SHANBA",    l: "Shanba"    },
  { v: "YAKSHANBA",  l: "Yakshanba"  },
];
const DAYS_SHORT: Record<string,string> = {
  DUSHANBA:"Du", SESHANBA:"Se", CHORSHANBA:"Ch", PAYSHANBA:"Pa", JUMA:"Ju", SHANBA:"Sh", YAKSHANBA:"Yak",
};

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded-xl", className)} />;
}

const EMPTY_FORM = {
  name: "", courseId: "", teacherId: "", maxStudents: "15",
  scheduleDays: [] as string[], startTime: "09:00", endTime: "11:00",
  startDate: new Date().toISOString().slice(0, 10), status: "ACTIVE",
};

export default function GroupsPage() {
  const [search,    setSearch]    = useState("");
  const [statusTab, setStatusTab] = useState("barchasi");
  const [showModal, setShowModal] = useState(false);
  const [editId,    setEditId]    = useState<string | null>(null);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");

  const { data: raw, isLoading } = useGroups();
  const { data: coursesRaw }     = useCourses();
  const { data: teachersRaw }    = useTeachers();

  const groups:   any[] = Array.isArray(raw)         ? raw         : [];
  const courses:  any[] = Array.isArray(coursesRaw)  ? coursesRaw  : [];
  const teachers: any[] = Array.isArray(teachersRaw) ? teachersRaw : [];

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
    setEditId(null); setForm(EMPTY_FORM); setError(""); setShowModal(true);
  }
  function openEdit(g: any) {
    setEditId(g.id);
    setForm({
      name: g.name, courseId: g.courseId, teacherId: g.teacherId,
      maxStudents: String(g.maxStudents ?? 15),
      scheduleDays: g.scheduleDays ?? [],
      startTime: g.startTime, endTime: g.endTime,
      startDate: g.startDate?.slice(0,10) ?? "",
      status: g.status,
    });
    setError(""); setShowModal(true);
  }

  function toggleDay(d: string) {
    setForm(p => ({
      ...p,
      scheduleDays: p.scheduleDays.includes(d)
        ? p.scheduleDays.filter(x => x !== d)
        : [...p.scheduleDays, d],
    }));
  }

  async function submit() {
    if (!form.name.trim() || !form.courseId || !form.teacherId) { setError("Ism, kurs va o'qituvchi majburiy"); return; }
    if (form.scheduleDays.length === 0) { setError("Kamida 1 ta kun tanlang"); return; }
    setSaving(true); setError("");
    try {
      const body: any = {
        name: form.name, courseId: form.courseId, teacherId: form.teacherId,
        maxStudents: parseInt(form.maxStudents) || 15,
        scheduleDays: form.scheduleDays, startTime: form.startTime, endTime: form.endTime,
        startDate: form.startDate, status: form.status,
      };
      const res = await fetch(editId ? `/api/groups/${editId}` : "/api/groups", {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Xatolik"); return; }
      mutate((k: string) => typeof k === "string" && k.startsWith("/api/groups"), undefined, { revalidate: true });
      setShowModal(false);
    } catch { setError("Serverga ulanib bo'lmadi"); }
    finally { setSaving(false); }
  }

  async function deleteGroup(id: string, name: string) {
    if (!confirm(`"${name}" guruhini o'chirishni tasdiqlaysizmi?`)) return;
    await fetch(`/api/groups/${id}`, { method: "DELETE" });
    mutate((k: string) => typeof k === "string" && k.startsWith("/api/groups"), undefined, { revalidate: true });
  }

  return (
    <div>
      <TopHeader
        title="Guruhlar"
        subtitle={isLoading ? "Yuklanmoqda..." : `Jami ${groups.length} ta guruh`}
        action={{ label: "Yangi guruh", onClick: openCreate }}
      />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-6"
          onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
              <h2 className="font-bold text-[15px] text-neutral-900 dark:text-neutral-100">
                {editId ? "Guruhni tahrirlash" : "Yangi guruh"}
              </h2>
              <button onClick={() => setShowModal(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              <div>
                <Label className="text-xs text-neutral-500 mb-1.5 block">Guruh nomi *</Label>
                <Input placeholder="Ingliz tili A1 guruh" value={form.name}
                  onChange={e => setForm(p => ({...p, name: e.target.value}))} className="h-9" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-neutral-500 mb-1.5 block">Kurs *</Label>
                  <select value={form.courseId} onChange={e => setForm(p => ({...p, courseId: e.target.value}))}
                    className="w-full h-9 px-3 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700
                      bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none">
                    <option value="">Tanlang...</option>
                    {courses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-neutral-500 mb-1.5 block">O'qituvchi *</Label>
                  <select value={form.teacherId} onChange={e => setForm(p => ({...p, teacherId: e.target.value}))}
                    className="w-full h-9 px-3 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700
                      bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none">
                    <option value="">Tanlang...</option>
                    {teachers.map((t: any) => <option key={t.id} value={t.id}>{t.user?.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <Label className="text-xs text-neutral-500 mb-2 block">Dars kunlari *</Label>
                <div className="flex gap-2 flex-wrap">
                  {DAYS_OPTS.map(d => (
                    <button key={d.v} type="button" onClick={() => toggleDay(d.v)}
                      className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                        form.scheduleDays.includes(d.v)
                          ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900"
                          : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400")}>
                      {d.l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-neutral-500 mb-1.5 block">Boshlanish vaqti</Label>
                  <Input type="time" value={form.startTime}
                    onChange={e => setForm(p => ({...p, startTime: e.target.value}))} className="h-9" />
                </div>
                <div>
                  <Label className="text-xs text-neutral-500 mb-1.5 block">Tugash vaqti</Label>
                  <Input type="time" value={form.endTime}
                    onChange={e => setForm(p => ({...p, endTime: e.target.value}))} className="h-9" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-neutral-500 mb-1.5 block">Boshlanish sanasi</Label>
                  <Input type="date" value={form.startDate}
                    onChange={e => setForm(p => ({...p, startDate: e.target.value}))} className="h-9" />
                </div>
                <div>
                  <Label className="text-xs text-neutral-500 mb-1.5 block">Max o'quvchi</Label>
                  <Input type="number" value={form.maxStudents} min="1" max="50"
                    onChange={e => setForm(p => ({...p, maxStudents: e.target.value}))} className="h-9" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-neutral-500 mb-1.5 block">Status</Label>
                <select value={form.status} onChange={e => setForm(p => ({...p, status: e.target.value}))}
                  className="w-full h-9 px-3 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700
                    bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none">
                  <option value="ACTIVE">Faol</option>
                  <option value="UPCOMING">Keladi</option>
                  <option value="COMPLETED">Tugagan</option>
                </select>
              </div>
              {error && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>}
            </div>
            <div className="px-5 pb-5 flex gap-2">
              <Button onClick={submit} disabled={saving}
                className="flex-1 h-9 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 text-white">
                {saving ? "Saqlanmoqda..." : editId ? "Saqlash" : "Yaratish"}
              </Button>
              <Button variant="outline" className="h-9 px-4" onClick={() => setShowModal(false)}>Bekor</Button>
            </div>
          </div>
        </div>
      )}

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
              <div key={s.l} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4">
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
          <div className="flex p-1 gap-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
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
                <div key={i} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 space-y-3">
                  {Array.from({length:4}).map((_,j) => <Skeleton key={j} className="h-4 w-full" />)}
                </div>
              ))
            : filtered.map((g: any) => {
                const cnt       = g._count?.students ?? 0;
                const max       = g.maxStudents ?? 15;
                const occ       = Math.round((cnt/max)*100);
                const cfg       = STATUS_CFG[g.status] ?? STATUS_CFG.ACTIVE;
                const barColor  = occ >= 100 ? "bg-red-500" : occ >= 80 ? "bg-amber-500" : "bg-green-500";
                const days      = (g.scheduleDays ?? []).map((d: string) => DAYS_SHORT[d] ?? d).join(", ");
                return (
                  <div key={g.id} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[14px] text-neutral-900 dark:text-neutral-100 truncate">{g.name}</h3>
                        <p className="text-[12px] text-blue-600 dark:text-blue-400 mt-0.5">{g.course?.name}</p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <span className={cn("text-[11px] px-2.5 py-1 rounded-lg font-semibold shrink-0", cfg.cls)}>{cfg.label}</span>
                        <button onClick={() => openEdit(g)} className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-orange-600 hover:bg-orange-50 transition-colors">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteGroup(g.id, g.name)} className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
                      </div>
                    </div>
                    <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3">
                      <div className="flex items-center justify-between text-[11px] mb-1.5">
                        <span className="text-neutral-500">To'lganlik</span>
                        <span className="font-bold text-neutral-700 dark:text-neutral-300">{cnt}/{max} ({occ}%)</span>
                      </div>
                      <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
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
