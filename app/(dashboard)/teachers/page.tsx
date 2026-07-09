"use client";

import { useState, useMemo } from "react";
import { TopHeader } from "@/components/layout/top-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { Search, Phone, Mail, Users, BookOpen, Wallet, LayoutGrid, List, Plus, Pencil, Trash2, AlertCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTeachers } from "@/lib/hooks/useTeachers";
import { mutate } from "swr";
import { Modal, ConfirmDeleteModal } from "@/components/ui/modal";
import { PhoneInput } from "@/components/ui/phone-input";
import { FormField } from "@/components/ui/form-field";

function fmt(v: number) {
  return new Intl.NumberFormat("uz-UZ", { style: "currency", currency: "UZS", maximumFractionDigits: 0 }).format(v);
}
function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded-xl", className)} />;
}

type ViewMode = "grid" | "list";
const EMPTY = { name: "", phone: "", email: "", password: "", subjects: [] as string[], salary: "", salaryType: "FIXED" as "FIXED" | "PERCENT" };

export default function TeachersPage() {
  const [search,      setSearch]      = useState("");
  const [viewMode,    setViewMode]    = useState<ViewMode>("grid");
  const [showModal,   setShowModal]   = useState(false);
  const [editTarget,  setEditTarget]  = useState<any>(null);
  const [deleteTarget,setDeleteTarget]= useState<any>(null);
  const [form,        setForm]        = useState(EMPTY);
  const [subInput,    setSubInput]    = useState("");
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");
  const [phoneErr,    setPhoneErr]    = useState("");

  const { data: raw, isLoading } = useTeachers();
  const teachers: any[] = Array.isArray(raw) ? raw : [];

  const filtered = useMemo(() =>
    teachers.filter(t =>
      t.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.phone?.includes(search) ||
      t.subjects?.some((s: string) => s.toLowerCase().includes(search.toLowerCase()))
    ), [teachers, search]);

  const stats = useMemo(() => ({
    jami:     teachers.length,
    faol:     teachers.filter(t => t.status === "ACTIVE").length,
    guruhlar: teachers.reduce((s, t) => s + (t._count?.groups ?? 0), 0),
  }), [teachers]);

  function openCreate() {
    setEditTarget(null); setForm(EMPTY); setSubInput(""); setError(""); setPhoneErr(""); setShowModal(true);
  }

  function openEdit(t: any) {
    setEditTarget(t);
    setForm({
      name: t.user?.name ?? "", phone: t.phone ?? "", email: t.email ?? "",
      password: "", subjects: t.subjects ?? [], salary: String(t.salary ?? ""),
      salaryType: t.salaryType ?? "FIXED",
    });
    setSubInput(""); setError(""); setPhoneErr(""); setShowModal(true);
  }

  function addSubject() {
    const s = subInput.trim();
    if (s && !form.subjects.includes(s)) setForm(p => ({...p, subjects: [...p.subjects, s]}));
    setSubInput("");
  }

  async function submit() {
    if (!editTarget) {
      const phoneDigits = form.phone.replace(/\D/g, "");
      if (!form.name.trim()) { setError("Ism majburiy"); return; }
      if (phoneDigits.length !== 12) { setPhoneErr("To'liq 9 ta raqam kiriting"); return; }
      if (!form.password.trim()) { setError("Parol majburiy"); return; }
    }
    if (form.subjects.length === 0) { setError("Kamida 1 ta fan kiriting"); return; }
    setSaving(true); setError(""); setPhoneErr("");
    try {
      const body: Record<string, unknown> = {
        subjects: form.subjects,
        salary: parseFloat(form.salary) || 0,
        salaryType: form.salaryType,
      };
      if (form.name.trim())  body.name  = form.name;
      if (form.phone.trim()) body.phone = form.phone;
      if (form.email.trim()) body.email = form.email;
      if (!editTarget) {
        body.password = form.password;
      } else if (form.password.trim()) {
        body.password = form.password;
      }

      const url    = editTarget ? `/api/teachers/${editTarget.id}` : "/api/teachers";
      const method = editTarget ? "PATCH" : "POST";
      const res    = await fetch(url, {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Xatolik"); return; }
      mutate("/api/teachers");
      setShowModal(false);
    } catch { setError("Serverga ulanib bo'lmadi"); }
    finally { setSaving(false); }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/teachers/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "O'chirib bo'lmadi"); setSaving(false); return; }
      mutate("/api/teachers");
      setDeleteTarget(null);
    } catch { setError("Xatolik"); }
    finally { setSaving(false); }
  }

  return (
    <div>
      <TopHeader
        title="O'qituvchilar"
        subtitle={isLoading ? "Yuklanmoqda..." : `Jami ${stats.jami} ta o'qituvchi`}
        action={{ label: "O'qituvchi qo'shish", onClick: openCreate }}
      />

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editTarget ? "O'qituvchini tahrirlash" : "Yangi o'qituvchi"}
        subtitle={editTarget ? undefined : "O'qituvchi ma'lumotlarini to'ldiring"}
        size="md"
        footer={
          <>
            <Button onClick={submit} disabled={saving}
              className="flex-1 h-9 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 text-white text-[13px]">
              {saving ? "Saqlanmoqda..." : editTarget ? "Saqlash" : "Qo'shish"}
            </Button>
            <Button variant="outline" className="h-9 px-4 text-[13px]" onClick={() => setShowModal(false)}>Bekor</Button>
          </>
        }
      >
        <FormField label="Ism familiya" required={!editTarget}>
          <Input
            placeholder="Jamshid Tursunov"
            value={form.name}
            onChange={e => setForm(p => ({...p, name: e.target.value}))}
            className="h-10"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Telefon" required={!editTarget} error={phoneErr}>
            <PhoneInput
              value={form.phone}
              onChange={v => { setForm(p => ({...p, phone: v})); setPhoneErr(""); }}
              error={!!phoneErr}
            />
          </FormField>
          <FormField label="Email" hint="Ixtiyoriy">
            <Input
              placeholder="email@mail.com"
              value={form.email}
              onChange={e => setForm(p => ({...p, email: e.target.value}))}
              className="h-10"
            />
          </FormField>
        </div>

        <FormField
          label={editTarget ? "Yangi parol" : "Parol"}
          required={!editTarget}
          hint={editTarget ? "Bo'sh qoldirsangiz o'zgarmaydi" : undefined}
        >
          <Input
            type="password"
            placeholder="Kamida 6 belgi"
            value={form.password}
            onChange={e => setForm(p => ({...p, password: e.target.value}))}
            className="h-10"
          />
        </FormField>

        <FormField label="Fanlar" required>
          {form.subjects.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mb-2">
              {form.subjects.map(s => (
                <span key={s} className="flex items-center gap-1 text-[11px] bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full font-medium">
                  {s}
                  <button onClick={() => setForm(p => ({...p, subjects: p.subjects.filter(x => x !== s)}))}
                    className="hover:text-red-500 transition-colors">
                    <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              placeholder="Fan nomi (Matematika)"
              value={subInput}
              onChange={e => setSubInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSubject())}
              className="h-10 flex-1"
            />
            <Button variant="outline" className="h-10 px-3 shrink-0" onClick={addSubject}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Oylik turi">
            <select
              value={form.salaryType}
              onChange={e => setForm(p => ({...p, salaryType: e.target.value as any}))}
              className="w-full h-10 px-3 text-[13px] rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:border-neutral-900 dark:focus:border-neutral-400 transition-colors"
            >
              <option value="FIXED">Belgilangan (so'm)</option>
              <option value="PERCENT">Foizli (%)</option>
            </select>
          </FormField>
          <FormField label={form.salaryType === "FIXED" ? "Oylik (so'm)" : "Foiz (%)"}>
            <Input
              type="number"
              placeholder={form.salaryType === "FIXED" ? "3 000 000" : "30"}
              value={form.salary}
              onChange={e => setForm(p => ({...p, salary: e.target.value}))}
              className="h-10"
            />
          </FormField>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-xl px-3 py-2.5">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <p className="text-[12px] font-medium text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
      </Modal>

      <ConfirmDeleteModal
        open={!!deleteTarget}
        onClose={() => { setDeleteTarget(null); setError(""); }}
        onConfirm={confirmDelete}
        loading={saving}
        title="O'qituvchini o'chirish"
        description={<>
          <span className="font-semibold text-neutral-700 dark:text-neutral-300">{deleteTarget?.user?.name}</span> o'chirilsinmi? Bu amalni qaytarib bo'lmaydi.
          {error && <span className="block mt-2 text-red-500">{error}</span>}
        </>}
      />

      <div className="p-5 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { l: "Jami", v: stats.jami, icon: Users, bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-600" },
            { l: "Faol", v: stats.faol, icon: BookOpen, bg: "bg-green-50 dark:bg-green-950/40", text: "text-green-600" },
            { l: "Jami guruhlar", v: stats.guruhlar, icon: Users, bg: "bg-purple-50 dark:bg-purple-950/40", text: "text-purple-600" },
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
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input placeholder="Ism, fan, telefon..." className="pl-9 h-9 text-sm w-64"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex p-1 gap-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl ml-auto">
            {([["grid", LayoutGrid], ["list", List]] as [ViewMode, any][]).map(([id, Icon]) => (
              <button key={id} onClick={() => setViewMode(id)}
                className={cn("w-8 h-7 flex items-center justify-center rounded-lg transition-all",
                  viewMode === id ? "bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-neutral-100"
                    : "text-neutral-400 hover:text-neutral-600")}>
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {isLoading
              ? Array.from({length:3}).map((_,i) => (
                  <div key={i} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-start gap-3"><Skeleton className="w-12 h-12 rounded-2xl shrink-0" /><div className="space-y-1.5 flex-1"><Skeleton className="h-4 w-28" /><Skeleton className="h-3 w-20" /></div></div>
                    <div className="grid grid-cols-2 gap-2"><Skeleton className="h-14 rounded-xl" /><Skeleton className="h-14 rounded-xl" /></div>
                  </div>
                ))
              : filtered.map((t: any) => (
                  <div key={t.id} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl flex items-center justify-center text-white font-black text-lg">
                          {t.user?.name?.[0] ?? "?"}
                        </div>
                        <div>
                          <p className="font-bold text-[14px] text-neutral-900 dark:text-neutral-100">{t.user?.name}</p>
                          <div className="flex gap-1 flex-wrap mt-1">
                            {(t.subjects ?? []).map((s: string) => (
                              <span key={s} className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">{s}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className={cn("text-[11px] px-2.5 py-1 rounded-lg font-semibold shrink-0",
                        t.status === "ACTIVE" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400")}>
                        {t.status === "ACTIVE" ? "Faol" : "Nofaol"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-neutral-50 dark:bg-neutral-800/60 rounded-xl p-2.5 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-green-500 shrink-0" />
                        <div><p className="text-[10px] text-neutral-500">Guruhlar</p><p className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">{t._count?.groups ?? 0}</p></div>
                      </div>
                      <div className="bg-neutral-50 dark:bg-neutral-800/60 rounded-xl p-2.5 flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-purple-500 shrink-0" />
                        <div><p className="text-[10px] text-neutral-500">Oylik</p><p className="text-[12px] font-bold text-purple-700 dark:text-purple-400">{t.salaryType === "FIXED" ? fmt(t.salary) : `${t.salary}%`}</p></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800 pt-3">
                      <p className="text-[11px] text-neutral-400">{t.phone}</p>
                      <div className="flex gap-0.5">
                        <a href={`tel:${t.phone}`} className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-green-600 hover:bg-green-50 transition-colors"><Phone className="w-3.5 h-3.5" /></a>
                        {t.email && <a href={`mailto:${t.email}`} className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Mail className="w-3.5 h-3.5" /></a>}
                        <button onClick={() => openEdit(t)} className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => { setError(""); setDeleteTarget(t); }} className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        <Link href={`/teachers/${t.id}`} className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"><ChevronRight className="w-3.5 h-3.5" /></Link>
                      </div>
                    </div>
                  </div>
                ))
            }
          </div>
        )}

        {/* List */}
        {viewMode === "list" && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-50 dark:hover:bg-neutral-800/60">
                  {["O'qituvchi","Fanlar","Guruhlar","Oylik","Status",""].map(h => (
                    <TableHead key={h} className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({length:4}).map((_,i) => (
                      <TableRow key={i}>{Array.from({length:6}).map((_,j) => <TableCell key={j}><Skeleton className="h-3 w-full" /></TableCell>)}</TableRow>
                    ))
                  : filtered.map((t: any) => (
                      <TableRow key={t.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-[13px] shrink-0">{t.user?.name?.[0] ?? "?"}</div>
                            <div><p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">{t.user?.name}</p><p className="text-[11px] text-neutral-400">{t.phone}</p></div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {(t.subjects ?? []).map((s: string) => (
                              <span key={s} className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">{s}</span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-center"><span className="text-[13px] font-semibold text-neutral-700 dark:text-neutral-300">{t._count?.groups ?? 0}</span></TableCell>
                        <TableCell><span className="text-[13px] font-bold text-purple-700 dark:text-purple-400">{t.salaryType === "FIXED" ? fmt(t.salary) : `${t.salary}%`}</span></TableCell>
                        <TableCell>
                          <span className={cn("text-[11px] px-2.5 py-1 rounded-lg font-semibold",
                            t.status === "ACTIVE" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400")}>
                            {t.status === "ACTIVE" ? "Faol" : "Nofaol"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-0.5">
                            <a href={`tel:${t.phone}`} className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-green-600 hover:bg-green-50 transition-colors"><Phone className="w-3.5 h-3.5" /></a>
                            <button onClick={() => openEdit(t)} className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => { setError(""); setDeleteTarget(t); }} className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                            <Link href={`/teachers/${t.id}`} className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"><ChevronRight className="w-3.5 h-3.5" /></Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                }
              </TableBody>
            </Table>
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center py-16 text-neutral-400">
            <Users className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm font-semibold">O'qituvchi topilmadi</p>
          </div>
        )}
      </div>
    </div>
  );
}
