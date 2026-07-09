"use client";

import { useState, useMemo } from "react";
import { TopHeader } from "@/components/layout/top-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Search, BookOpen, Users, Wallet, Clock, Edit, Trash2, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCourses } from "@/lib/hooks/useCourses";
import { mutate } from "swr";

function formatCurrency(v: number) {
  return new Intl.NumberFormat("uz-UZ", { style: "currency", currency: "UZS", maximumFractionDigits: 0 }).format(v);
}
function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded-xl", className)} />;
}

const COLORS = [
  { label: "Ko'k",      value: "bg-blue-500" },
  { label: "Yashil",    value: "bg-green-500" },
  { label: "To'q sariq",value: "bg-amber-500" },
  { label: "Binafsha",  value: "bg-purple-500" },
  { label: "Qizil",     value: "bg-red-500" },
  { label: "Zangori",   value: "bg-cyan-500" },
  { label: "Pushti",    value: "bg-pink-500" },
  { label: "Toshyashil",value: "bg-emerald-500" },
];

const EMPTY = { name: "", description: "", duration: "", price: "", color: "bg-blue-500" };

type ModalMode = "create" | "edit";

export default function CoursesPage() {
  const [search,    setSearch]    = useState("");
  const [showModal, setShowModal] = useState(false);
  const [mode,      setMode]      = useState<ModalMode>("create");
  const [editId,    setEditId]    = useState<string | null>(null);
  const [form,      setForm]      = useState(EMPTY);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");

  const { data: raw, isLoading } = useCourses();
  const courses: any[] = Array.isArray(raw) ? raw : [];

  const filtered = useMemo(() =>
    courses.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description ?? "").toLowerCase().includes(search.toLowerCase())
    ), [courses, search]);

  const stats = useMemo(() => ({
    jami:    courses.length,
    oquvchi: courses.reduce((s, c) => s + (c.studentCount ?? 0), 0),
    daromad: courses.reduce((s, c) => s + (c.price ?? 0) * (c.studentCount ?? 0), 0),
  }), [courses]);

  function openCreate() {
    setMode("create"); setEditId(null); setForm(EMPTY); setError(""); setShowModal(true);
  }
  function openEdit(c: any) {
    setMode("edit"); setEditId(c.id);
    setForm({ name: c.name, description: c.description ?? "", duration: c.duration, price: String(c.price), color: c.color ?? "bg-blue-500" });
    setError(""); setShowModal(true);
  }

  async function submit() {
    if (!form.name.trim() || !form.duration.trim() || !form.price) {
      setError("Nomi, davomiyligi va narxi majburiy"); return;
    }
    setSaving(true); setError("");
    try {
      const url    = mode === "create" ? "/api/courses" : `/api/courses/${editId}`;
      const method = mode === "create" ? "POST"         : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, description: form.description || undefined, duration: form.duration, price: parseFloat(form.price), color: form.color }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Xatolik"); return; }
      mutate("/api/courses");
      setShowModal(false);
    } catch { setError("Serverga ulanib bo'lmadi"); }
    finally { setSaving(false); }
  }

  async function deleteCourse(id: string, name: string) {
    if (!confirm(`"${name}" kursini o'chirmoqchimisiz? Bu amal qaytarilmaydi.`)) return;
    const res = await fetch(`/api/courses/${id}`, { method: "DELETE" });
    if (res.ok) mutate("/api/courses");
    else { const d = await res.json(); alert(d.error ?? "O'chirishda xatolik"); }
  }

  return (
    <div>
      <TopHeader
        title="Kurslar"
        subtitle={isLoading ? "Yuklanmoqda..." : `Jami ${courses.length} ta kurs`}
        action={{ label: "Yangi kurs", onClick: openCreate }}
      />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
              <h2 className="font-bold text-[15px] text-neutral-900 dark:text-neutral-100">
                {mode === "create" ? "Yangi kurs" : "Kursni tahrirlash"}
              </h2>
              <button onClick={() => setShowModal(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <Label className="text-xs text-neutral-500 mb-1.5 block">Kurs nomi *</Label>
                <Input placeholder="Matematika, Ingliz tili..." value={form.name}
                  onChange={e => setForm(p => ({...p, name: e.target.value}))} className="h-9" />
              </div>
              <div>
                <Label className="text-xs text-neutral-500 mb-1.5 block">Tavsif</Label>
                <Input placeholder="Qisqacha tavsif..." value={form.description}
                  onChange={e => setForm(p => ({...p, description: e.target.value}))} className="h-9" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-neutral-500 mb-1.5 block">Davomiyligi *</Label>
                  <Input placeholder="3 oy, 6 oy..." value={form.duration}
                    onChange={e => setForm(p => ({...p, duration: e.target.value}))} className="h-9" />
                </div>
                <div>
                  <Label className="text-xs text-neutral-500 mb-1.5 block">Narxi (so'm) *</Label>
                  <Input type="number" placeholder="500000" value={form.price}
                    onChange={e => setForm(p => ({...p, price: e.target.value}))} className="h-9" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-neutral-500 mb-1.5 block">Rang</Label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button key={c.value} onClick={() => setForm(p => ({...p, color: c.value}))}
                      title={c.label}
                      className={cn("w-7 h-7 rounded-lg transition-all", c.value,
                        form.color === c.value ? "ring-2 ring-offset-2 ring-neutral-400 scale-110" : "opacity-70 hover:opacity-100")}>
                    </button>
                  ))}
                </div>
              </div>
              {error && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>}
            </div>
            <div className="px-5 pb-5 flex gap-2">
              <Button onClick={submit} disabled={saving}
                className="flex-1 h-9 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 text-white">
                {saving ? "Saqlanmoqda..." : mode === "create" ? "Qo'shish" : "Saqlash"}
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
            { label: "Jami kurs",     value: stats.jami,                    icon: BookOpen, bg: "bg-blue-50 dark:bg-blue-950/40",    text: "text-blue-600 dark:text-blue-400" },
            { label: "Jami o'quvchi", value: stats.oquvchi,                 icon: Users,    bg: "bg-green-50 dark:bg-green-950/40",  text: "text-green-600 dark:text-green-400" },
            { label: "Oylik daromad", value: formatCurrency(stats.daromad), icon: Wallet,   bg: "bg-purple-50 dark:bg-purple-950/40", text: "text-purple-600 dark:text-purple-400" },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", s.bg)}>
                  <Icon className={cn("w-4.5 h-4.5", s.text)} />
                </div>
                {isLoading ? <Skeleton className="h-6 w-12 mb-1" />
                  : <p className="text-[22px] font-black text-neutral-900 dark:text-neutral-100 leading-none">{s.value}</p>}
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Search */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input placeholder="Kurs nomi yoki tavsif..." className="pl-9 h-9 text-sm w-64"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span className="text-xs text-neutral-400 dark:text-neutral-500 ml-auto">{filtered.length} ta kurs</span>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {isLoading
            ? Array.from({length:3}).map((_,i) => (
                <div key={i} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
                  <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
                  <div className="p-5 space-y-4">
                    <div className="flex justify-between"><div className="space-y-1.5 flex-1"><Skeleton className="h-4 w-28" /><Skeleton className="h-3 w-36" /></div></div>
                    <div className="grid grid-cols-2 gap-2">{Array.from({length:4}).map((_,j) => <Skeleton key={j} className="h-14 rounded-xl" />)}</div>
                  </div>
                </div>
              ))
            : filtered.map((course: any) => (
                <div key={course.id}
                  className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                  <div className={cn("h-1.5 w-full", course.color ?? "bg-blue-500")} />
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[14px] text-neutral-900 dark:text-neutral-100">{course.name}</h3>
                        <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5">{course.description ?? "—"}</p>
                      </div>
                      <div className="flex gap-0.5 ml-2 shrink-0">
                        <button onClick={() => openEdit(course)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteCourse(course.id, course.name)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <Link href={`/courses/${course.id}`}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-neutral-50 dark:bg-neutral-800/60 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 mb-1"><Clock className="w-3.5 h-3.5" /><span className="text-[11px]">Davomiyligi</span></div>
                        <p className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">{course.duration}</p>
                      </div>
                      <div className="bg-neutral-50 dark:bg-neutral-800/60 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 mb-1"><Wallet className="w-3.5 h-3.5" /><span className="text-[11px]">Narxi</span></div>
                        <p className="text-[13px] font-bold text-blue-700 dark:text-blue-400">{formatCurrency(course.price)}</p>
                      </div>
                      <div className="bg-neutral-50 dark:bg-neutral-800/60 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 mb-1"><BookOpen className="w-3.5 h-3.5" /><span className="text-[11px]">Guruhlar</span></div>
                        <p className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">{course._count?.groups ?? 0} ta</p>
                      </div>
                      <div className="bg-neutral-50 dark:bg-neutral-800/60 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 mb-1"><Users className="w-3.5 h-3.5" /><span className="text-[11px]">O'quvchilar</span></div>
                        <p className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">{course.studentCount ?? 0} ta</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                      <span className="text-[11px] text-neutral-500 dark:text-neutral-400">Oylik daromad</span>
                      <span className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency((course.price ?? 0) * (course.studentCount ?? 0))}
                      </span>
                    </div>
                  </div>
                </div>
              ))
          }
        </div>

        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center py-16 text-neutral-400 dark:text-neutral-600">
            <BookOpen className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm font-semibold">Kurs topilmadi</p>
          </div>
        )}
      </div>
    </div>
  );
}
