"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopHeader } from "@/components/layout/top-header";
import { Input } from "@/components/ui/input";
import { StudentDeleteModal } from "@/components/students/student-delete-modal";
import { StudentFormModal } from "@/components/students/student-form-modal";
import { StudentBulkBar } from "@/components/students/student-bulk-bar";
import { StudentImportModal } from "@/components/students/student-import-modal";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Search, Phone, Edit, GraduationCap, CheckCircle, DollarSign, Trash2,
  UserCheck, Clock, Upload, Download, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStudents } from "@/lib/hooks/useStudents";
import { useGroups } from "@/lib/hooks/useGroups";
import { useTeachers } from "@/lib/hooks/useTeachers";
import { useMe, hasPerm } from "@/lib/hooks/useMe";
import { payStatusFromBalance, PAY_STATUS_CFG } from "@/lib/payment-status";
import { toCsv, downloadFile, exportPhone } from "@/lib/csv";
import { mutate } from "swr";

function fmt(v: number) {
  return new Intl.NumberFormat("uz-UZ", { style: "currency", currency: "UZS", maximumFractionDigits: 0 }).format(v);
}
function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded-xl", className)} />;
}

const ENROLL_CFG: Record<string, { label: string; cls: string }> = {
  SINOV:          { label: "Sinov",  cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  FAOL:           { label: "Faol",   cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  CHIQIB_KETGAN:  { label: "Ketgan", cls: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500" },
};

const selectCls =
  "text-xs h-9 px-2.5 rounded-lg border border-white/60 dark:border-white/10 glass-soft " +
  "text-neutral-700 dark:text-neutral-300 outline-none focus:border-indigo-500 transition-colors";

function revalidate() {
  mutate((key: string) => typeof key === "string" && key.startsWith("/api/students"), undefined, { revalidate: true });
}

/**
 * O'quvchining chiqib ketmagan barcha a'zoliklari.
 *
 * Ilgari sahifa hamma joyda `s.groups?.[0]` deb olardi — ya'ni faqat ENG
 * SO'NGGI guruh. Bitta markazda bir o'quvchi 2-3 fanga qatnashishi odatiy
 * hol; qolgan guruhlari ro'yxatda umuman ko'rinmasdi va statistika ham
 * shu bitta a'zolik bo'yicha hisoblanardi.
 */
function activeGroupsOf(s: any): any[] {
  return (s.groups ?? []).filter((g: any) => g.enrollmentStatus !== "CHIQIB_KETGAN");
}

/** Ro'yxatda ko'rsatiladigan yagona a'zolik holati (eng "kuchlisi"). */
function enrollOf(s: any): string {
  const active = activeGroupsOf(s);
  if (active.length === 0) return "CHIQIB_KETGAN";
  return active.some((g: any) => g.enrollmentStatus === "FAOL") ? "FAOL" : "SINOV";
}

export default function StudentsPage() {
  const router = useRouter();
  // Ruxsat bo'yicha amallar. Ilgari tugmalar hammaga ko'rinardi va bosilganda
  // backend 403 qaytarardi — o'qituvchiga go'yo o'zgartira olganday tuyulardi.
  const { me } = useMe();
  const canCreate = hasPerm(me?.permissions, "students.create");
  const canUpdate = hasPerm(me?.permissions, "students.update");
  const canDelete = hasPerm(me?.permissions, "students.delete");
  const canSendSms = hasPerm(me?.permissions, "sms.send");

  const [search,       setSearch]       = useState("");
  const [filterEnroll, setFilterEnroll] = useState("barchasi");
  const [filterGroup,  setFilterGroup]  = useState("barchasi");
  const [filterTeacher,setFilterTeacher]= useState("barchasi");
  const [filterDebt,   setFilterDebt]   = useState("barchasi");

  const [modalMode,    setModalMode]    = useState<"create" | "edit" | null>(null);
  const [modalInitial, setModalInitial] = useState<any>(null);
  const [showImport,   setShowImport]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [activating,   setActivating]   = useState<string | null>(null);
  const [selectedIds,  setSelectedIds]  = useState<Set<string>>(new Set());

  // Filtrlar SERVERGA yuboriladi — javob 1000 ta bilan cheklangani uchun
  // brauzerda filtrlash katta markazda to'liq natija bermasdi.
  const { data: studentsRaw, isLoading } = useStudents({
    search,
    groupId:   filterGroup   !== "barchasi" ? filterGroup   : undefined,
    teacherId: filterTeacher !== "barchasi" ? filterTeacher : undefined,
    debt:      filterDebt    !== "barchasi" ? filterDebt    : undefined,
    enrollmentStatus: filterEnroll !== "barchasi" ? filterEnroll : undefined,
  });
  const { data: groupsRaw }   = useGroups({ status: "ACTIVE,UPCOMING" });
  const { data: teachersRaw } = useTeachers();

  // `useMemo` shart: bu massivlar `useEffect`/`useMemo` bog'liqliklarida
  // ishlatiladi. Har renderda yangi `[]` yaratilsa, tanlovni tozalaydigan
  // effekt HAR renderda ishga tushib, cheksiz aylanishga olib kelardi.
  const students: any[] = useMemo(
    () => (Array.isArray(studentsRaw) ? studentsRaw : []), [studentsRaw]);
  const groups: any[] = useMemo(
    () => (Array.isArray(groupsRaw) ? groupsRaw : []), [groupsRaw]);
  const teachers: any[] = useMemo(
    () => (Array.isArray(teachersRaw) ? teachersRaw : []), [teachersRaw]);

  const stats = useMemo(() => ({
    jami:  students.filter(s => enrollOf(s) !== "CHIQIB_KETGAN").length,
    sinov: students.filter(s => enrollOf(s) === "SINOV").length,
    faol:  students.filter(s => enrollOf(s) === "FAOL").length,
    qarz:  students.filter(s => s.balance < 0).reduce((sum, s) => sum + Math.abs(s.balance), 0),
  }), [students]);

  // Tanlov EKRANDAGI ro'yxatdan hosil qilinadi, `selectedIds` dan emas.
  // Shu sabab filtr o'zgarib, ba'zi o'quvchilar ko'rinmay qolsa, ommaviy
  // amal ularga TEGMAYDI — foydalanuvchi ko'rmayotgan qatorga hech qachon
  // ta'sir qilinmaydi. (Effekt bilan sinxronlash o'rniga — shunchaki
  // hisoblab olamiz.)
  const selected = useMemo(
    () => students.filter(s => selectedIds.has(s.id)).map(s => ({ id: s.id, name: s.name })),
    [students, selectedIds],
  );
  const allSelected = students.length > 0 && selected.length === students.length;

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(students.map(s => s.id)));
  }
  function toggleOne(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function openCreate() { setModalInitial(null); setModalMode("create"); }
  function openEdit(s: any) { setModalInitial(s); setModalMode("edit"); }

  /** Sinovdagi BARCHA a'zoliklarni faollashtiradi (bir nechta guruh bo'lishi mumkin). */
  async function activate(student: any) {
    const trials = activeGroupsOf(student).filter((g: any) => g.enrollmentStatus === "SINOV");
    if (trials.length === 0) return;
    setActivating(student.id);
    try {
      for (const sg of trials) {
        await fetch(`/api/student-groups/${sg.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enrollmentStatus: "FAOL" }),
        });
      }
      revalidate();
    } finally { setActivating(null); }
  }

  /** Ekrandagi (filtrlangan) ro'yxatni CSV qilib beradi. */
  function exportCsv() {
    const rows = students.map(s => {
      const gs = activeGroupsOf(s);
      return [
        s.name,
        exportPhone(s.phone),
        exportPhone(s.parentPhone),
        s.parentName ?? "",
        s.school ?? "",
        s.gender === "MALE" ? "Erkak" : s.gender === "FEMALE" ? "Ayol" : "",
        gs.map((g: any) => g.group?.name).filter(Boolean).join(" | "),
        gs.map((g: any) => g.group?.teacher?.user?.name).filter(Boolean).join(" | "),
        ENROLL_CFG[enrollOf(s)]?.label ?? "",
        Math.round(s.balance),
        s.createdAt ? new Date(s.createdAt).toLocaleDateString("uz-UZ") : "",
      ];
    });
    downloadFile(
      `oquvchilar-${new Date().toISOString().slice(0, 10)}.csv`,
      toCsv(
        ["Ism", "Telefon", "Ota-ona telefoni", "Ota-ona ismi", "Maktab", "Jinsi",
         "Guruh", "O'qituvchi", "Holat", "Balans", "Qo'shilgan"],
        rows,
      ),
    );
  }

  const filtersOn =
    filterEnroll !== "barchasi" || filterGroup !== "barchasi" ||
    filterTeacher !== "barchasi" || filterDebt !== "barchasi" || !!search;

  function clearFilters() {
    setSearch(""); setFilterEnroll("barchasi"); setFilterGroup("barchasi");
    setFilterTeacher("barchasi"); setFilterDebt("barchasi");
  }

  return (
    <div>
      <TopHeader
        title="O'quvchilar"
        subtitle={isLoading ? "Yuklanmoqda..." : `Jami ${stats.jami} ta o'quvchi`}
        action={canCreate ? { label: "Yangi o'quvchi", onClick: openCreate } : undefined}
      />

      <StudentFormModal
        open={modalMode !== null}
        mode={modalMode ?? "create"}
        initial={modalInitial}
        onClose={() => setModalMode(null)}
        onSaved={revalidate}
      />

      <StudentDeleteModal
        student={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDone={revalidate}
      />

      <StudentImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        onDone={revalidate}
        groups={groups}
      />

      <div className="p-5 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Jami",      value: stats.jami,       icon: GraduationCap, bg: "bg-blue-50 dark:bg-blue-950/40",   text: "text-blue-600 dark:text-blue-400" },
            { label: "Faol",      value: stats.faol,       icon: CheckCircle,   bg: "bg-green-50 dark:bg-green-950/40", text: "text-green-600 dark:text-green-400" },
            { label: "Sinov",     value: stats.sinov,      icon: Clock,         bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-600 dark:text-amber-400" },
            { label: "Jami qarz", value: fmt(stats.qarz),  icon: DollarSign,    bg: "bg-red-50 dark:bg-red-950/40",     text: "text-red-600 dark:text-red-400" },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-4">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", s.bg)}>
                  <Icon className={cn("w-4 h-4", s.text)} />
                </div>
                {isLoading ? <Skeleton className="h-6 w-12 mb-1" />
                  : <p className="text-[22px] font-black text-neutral-900 dark:text-neutral-100 leading-none">{s.value}</p>}
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Filtrlar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input placeholder="Ism, telefon..." className="pl-9 h-9 text-sm w-52"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div className="flex gap-1.5">
            {[
              { v: "barchasi", l: "Barchasi" },
              { v: "SINOV",    l: "Sinov" },
              { v: "FAOL",     l: "Faol" },
            ].map(f => (
              <button key={f.v} onClick={() => setFilterEnroll(f.v)}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                  filterEnroll === f.v
                    ? "bg-indigo-600 text-white dark:bg-indigo-500 border-indigo-600"
                    : "glass-panel text-neutral-600 dark:text-neutral-400 border-white/60 dark:border-white/10 hover:border-neutral-400")}>
                {f.l}
              </button>
            ))}
          </div>

          <select value={filterGroup} onChange={e => setFilterGroup(e.target.value)} className={selectCls}>
            <option value="barchasi">Barcha guruhlar</option>
            {groups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>

          <select value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)} className={selectCls}>
            <option value="barchasi">Barcha o&apos;qituvchilar</option>
            {teachers.map((t: any) => <option key={t.id} value={t.id}>{t.user?.name}</option>)}
          </select>

          <select value={filterDebt} onChange={e => setFilterDebt(e.target.value)} className={selectCls}>
            <option value="barchasi">To&apos;lov: barchasi</option>
            <option value="qarzdor">Faqat qarzdorlar</option>
            <option value="tolangan">Qarzi yo&apos;qlar</option>
          </select>

          {filtersOn && (
            <button onClick={clearFilters}
              className="flex items-center gap-1 h-9 px-2.5 rounded-lg text-xs font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-white/60 dark:hover:bg-white/10 transition-colors">
              <X className="w-3.5 h-3.5" /> Tozalash
            </button>
          )}

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-neutral-400">{students.length} ta</span>
            <button onClick={exportCsv} disabled={students.length === 0}
              title="Ekrandagi ro'yxatni CSV qilib yuklab olish"
              className="flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-xs font-semibold glass-soft text-neutral-600 dark:text-neutral-300 hover:bg-white/70 dark:hover:bg-white/10 transition-colors disabled:opacity-40">
              <Download className="w-3.5 h-3.5" /> Eksport
            </button>
            {canCreate && (
              <button onClick={() => setShowImport(true)}
                className="flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
                <Upload className="w-3.5 h-3.5" /> Import
              </button>
            )}
          </div>
        </div>

        {/* Jadval */}
        <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="glass-soft hover:bg-white/60 dark:hover:bg-white/10">
                {canUpdate && (
                  <TableHead className="w-10">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll}
                      disabled={students.length === 0}
                      aria-label="Hammasini tanlash"
                      className="accent-indigo-600 w-3.5 h-3.5 align-middle cursor-pointer disabled:opacity-40" />
                  </TableHead>
                )}
                {["O'quvchi", "Telefon", "Guruhlar", "O'qituvchi", "Holat", "To'lov", ""].map(h => (
                  <TableHead key={h} className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({length: 5}).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({length: canUpdate ? 8 : 7}).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-3 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : students.map((s: any) => {
                    const gs      = activeGroupsOf(s);
                    const enrollK = enrollOf(s);
                    const enroll  = ENROLL_CFG[enrollK];
                    const pay     = PAY_STATUS_CFG[payStatusFromBalance(s.balance, enrollK)];
                    const teacherNames = [...new Set(
                      gs.map((g: any) => g.group?.teacher?.user?.name).filter(Boolean),
                    )] as string[];
                    const isSel = selectedIds.has(s.id);
                    const hasTrial = gs.some((g: any) => g.enrollmentStatus === "SINOV");
                    return (
                      <TableRow key={s.id}
                        onClick={() => router.push(`/students/${s.id}`)}
                        className={cn("cursor-pointer transition-colors",
                          isSel ? "bg-indigo-50/70 dark:bg-indigo-900/20" : "hover:bg-white/60 dark:hover:bg-white/10")}>
                        {canUpdate && (
                          <TableCell onClick={e => e.stopPropagation()}>
                            <input type="checkbox" checked={isSel} onChange={() => toggleOne(s.id)}
                              aria-label={`${s.name} ni tanlash`}
                              className="accent-indigo-600 w-3.5 h-3.5 align-middle cursor-pointer" />
                          </TableCell>
                        )}
                        <TableCell>
                          {/* Ism — Link: qator bosilishi bilan bir xil manzil, lekin
                              klaviatura bilan ham yuriladi va hoverda URL ko'rinadi */}
                          <Link href={`/students/${s.id}`} onClick={e => e.stopPropagation()}
                            className="flex items-center gap-3 group/name">
                            <div className={cn(
                              "w-8 h-8 rounded-xl flex items-center justify-center text-white text-[12px] font-bold shrink-0",
                              s.isActive
                                ? "bg-gradient-to-br from-blue-400 to-indigo-500"
                                : "bg-gradient-to-br from-amber-400 to-orange-400"
                            )}>
                              {s.name[0]}
                            </div>
                            <div>
                              <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 group-hover/name:text-indigo-600 dark:group-hover/name:text-indigo-400 transition-colors">{s.name}</p>
                              <p className="text-[11px] text-neutral-400">{new Date(s.createdAt).toLocaleDateString("uz-UZ")}</p>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <p className="text-[13px] text-neutral-700 dark:text-neutral-300">{s.phone}</p>
                          {s.parentPhone && <p className="text-[11px] text-neutral-400">Ota: {s.parentPhone}</p>}
                        </TableCell>
                        <TableCell>
                          {/* BARCHA guruhlar. Bitta o'quvchi bir nechta fanga
                              qatnashishi mumkin — ilgari faqat bittasi ko'rinardi. */}
                          {gs.length === 0
                            ? <span className="text-[13px] text-neutral-400">—</span>
                            : (
                              <div className="flex flex-wrap gap-1 max-w-[220px]">
                                {gs.map((g: any) => (
                                  <span key={g.id}
                                    className={cn("text-[11px] px-2 py-0.5 rounded-lg font-medium whitespace-nowrap",
                                      g.enrollmentStatus === "SINOV"
                                        ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                        : "glass-soft text-neutral-600 dark:text-neutral-300")}>
                                    {g.group?.name ?? "—"}
                                  </span>
                                ))}
                              </div>
                            )}
                        </TableCell>
                        <TableCell>
                          <span className="text-[13px] text-neutral-500 dark:text-neutral-400">
                            {teacherNames.length === 0 ? "—"
                              : teacherNames.length === 1 ? teacherNames[0]
                              : `${teacherNames[0]} +${teacherNames.length - 1}`}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-semibold", enroll?.cls)}>
                            {enroll?.label ?? "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={cn("text-[11px] px-2.5 py-1 rounded-lg font-semibold", pay?.cls)}>
                            {pay?.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          {/* Amal tugmalari qator bosilishini ishga tushirmasligi kerak */}
                          <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                            {canUpdate && hasTrial && (
                              <button
                                onClick={() => activate(s)}
                                disabled={activating === s.id}
                                title="Sinovdagi a'zoliklarni faollashtirish"
                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors disabled:opacity-50">
                                <UserCheck className="w-3 h-3" />
                                {activating === s.id ? "..." : "Faollashtirish"}
                              </button>
                            )}
                            {canUpdate && (
                              <button onClick={() => openEdit(s)} title="Tahrirlash"
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors">
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <a href={`tel:${s.phone}`} title="Qo'ng'iroq"
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors">
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                            {canDelete && (
                              <button onClick={() => setDeleteTarget(s)} title="O'chirish"
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
              }
            </TableBody>
          </Table>
          </div>
          {!isLoading && students.length === 0 && (
            <div className="flex flex-col items-center py-16 text-neutral-400">
              <GraduationCap className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">Hech narsa topilmadi</p>
              {filtersOn && (
                <button onClick={clearFilters} className="mt-2 text-[12px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                  Filtrlarni tozalash
                </button>
              )}
            </div>
          )}
        </div>

        <StudentBulkBar
          selected={selected}
          groups={groups}
          onClear={() => setSelectedIds(new Set())}
          onDone={revalidate}
          canUpdate={canUpdate}
          canSendSms={canSendSms}
        />
      </div>
    </div>
  );
}
