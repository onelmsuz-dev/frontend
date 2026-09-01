"use client";

import { useState, useMemo, useEffect } from "react";
import { TopHeader } from "@/components/layout/top-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Modal, ConfirmDeleteModal } from "@/components/ui/modal";
import { PhoneInput } from "@/components/ui/phone-input";
import { FormField } from "@/components/ui/form-field";
import { Phone, Search, Plus, ChevronRight, Trash2, AlertCircle, Pencil, Upload, MessageSquare, UserPlus, LayoutGrid, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLeads } from "@/lib/hooks/useLeads";
import { useCourses } from "@/lib/hooks/useCourses";
import { SourcePicker, sourceColor } from "@/components/leads/source-picker";
import { LeadImportModal } from "@/components/leads/lead-import-modal";
import { LeadFeedPanel } from "@/components/leads/lead-feed";
import { CallOutcome, StepBack } from "@/components/leads/call-outcome";
import { DueStrip } from "@/components/leads/due-strip";
import { ConvertModal } from "@/components/leads/convert-modal";
import { MetaIntegrationPanel } from "@/components/leads/meta-integration";
import { useFeature } from "@/lib/hooks/useFeatures";
import { LOST_REASON_UZ } from "@/lib/hooks/useLeads";
import { fmtRelative } from "@/lib/date-uz";
import { mutate } from "swr";

type LeadStatus = "YANGI" | "ALOQA_QILINGAN" | "SINOV_DARSI" | "TO_LANDI" | "BEKOR";

interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string;
  status: LeadStatus;
  course?: string | null;
  courseId?: string | null;
  school?: string | null;
  grade?: string | null;
  note?: string | null;
  assignedTo?: { name?: string } | null;
  createdAt?: string;
  lastContactAt?: string | null;
  contactAttempts?: number;
  lostReason?: string | null;
  nextContactAt?: string | null;
  convertedStudentId?: string | null;
  _count?: { comments: number };
}

interface Course { id: string; name: string }

const STATUS_CFG: Record<LeadStatus, { label: string; color: string; headerBg: string; dot: string }> = {
  YANGI:          { label: "Yangi",         color: "text-blue-700 dark:text-blue-300",     headerBg: "bg-blue-50 dark:bg-blue-900/20",     dot: "bg-blue-500" },
  ALOQA_QILINGAN: { label: "Aloqa qilindi", color: "text-yellow-700 dark:text-yellow-300", headerBg: "bg-yellow-50 dark:bg-yellow-900/20", dot: "bg-yellow-500" },
  SINOV_DARSI:    { label: "Sinov darsi",   color: "text-purple-700 dark:text-purple-300", headerBg: "bg-purple-50 dark:bg-purple-900/20", dot: "bg-purple-500" },
  TO_LANDI:       { label: "To'ladi",       color: "text-green-700 dark:text-green-300",   headerBg: "bg-green-50 dark:bg-green-900/20",   dot: "bg-green-500" },
  BEKOR:          { label: "Bekor",         color: "text-red-700 dark:text-red-300",       headerBg: "bg-red-50 dark:bg-red-900/20",       dot: "bg-red-500" },
};

const COLUMNS: LeadStatus[] = ["YANGI", "ALOQA_QILINGAN", "SINOV_DARSI", "TO_LANDI", "BEKOR"];

const EMPTY = { name: "", phone: "", source: "Instagram", course: "", courseId: "",
                school: "", grade: "", note: "" };

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded-xl", className)} />;
}

function LeadCard({ lead, onDelete, onEdit, onOpen, onConvert, onRefresh }: {
  lead: Lead;
  onDelete: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  onOpen: (lead: Lead) => void;
  onConvert: (lead: Lead) => void;
  onRefresh: () => void;
}) {
  const st = lead.status as LeadStatus;
  /** Oxirgi bosqichlarda oldinga siljish yo'q. */
  const canAdvance = st === "YANGI" || st === "ALOQA_QILINGAN" || st === "SINOV_DARSI";
  const canBack = st !== "YANGI";
  const yopiq = st === "TO_LANDI" || st === "BEKOR";
  return (
    <div className="glass-panel rounded-xl border border-white/60 dark:border-white/10 p-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-2.5 mb-2.5">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-[12px] shrink-0">
          {lead.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <button onClick={() => onOpen(lead)} title="Tarix va izohlar"
            className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100
                       leading-tight truncate hover:text-indigo-600 transition-colors text-left w-full">
            {lead.name}
          </button>
          <p className="text-[11px] text-neutral-400 dark:text-neutral-500 truncate">
            {lead.phone || [lead.school, lead.grade].filter(Boolean).join(" · ") || "—"}
          </p>
          {/* YOSHI VA SOVUQLIGI. Ilgari o'nta kartochka bir xil ko'rinardi —
              bugun kelgani ham, besh hafta turgani ham. Endi bir qarashda
              ko'rinadi va ro'yxatni saralab o'tirish shart emas. */}
          <p className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate">
            {lead.lastContactAt
              ? `oxirgi aloqa ${fmtRelative(lead.lastContactAt)}`
              : lead.createdAt ? `${fmtRelative(lead.createdAt)} qo'shilgan` : ""}
            {lead.contactAttempts ? ` · ${lead.contactAttempts}-urinish` : ""}
            {lead._count?.comments ? ` · 💬 ${lead._count.comments}` : ""}
          </p>
        </div>
        <button onClick={() => onDelete(lead)}
          className="w-5 h-5 flex items-center justify-center rounded-md text-neutral-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0">
          <Trash2 className="w-3 h-3" />
        </button>
        <button onClick={() => onEdit(lead)}
          className="w-5 h-5 flex items-center justify-center rounded-md text-neutral-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors shrink-0">
          <Pencil className="w-3 h-3" />
        </button>
      </div>

      {lead.course && (
        <p className="text-[11px] text-neutral-600 dark:text-neutral-400 glass-soft rounded-lg px-2.5 py-1.5 mb-2">
          📚 {lead.course}
        </p>
      )}

      {lead.note && (
        <p className="text-[11px] text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 rounded-lg px-2.5 py-1.5 mb-2">
          💬 {lead.note}
        </p>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-white/50 dark:border-white/10">
        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full",
          sourceColor(lead.source))}>
          {lead.source}
        </span>
        <div className="flex items-center gap-0.5">
          {/* Maktab tashrifidan kelgan lidda telefon bo'lmasligi mumkin —
              unda tugma bosilmaydigan holatda turadi, bosh sahifaga
              olib ketmasligi uchun. */}
          {lead.phone ? (
            <a href={`tel:${lead.phone}`} title={lead.phone}
              className="w-6 h-6 flex items-center justify-center rounded-lg text-neutral-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors">
              <Phone className="w-3 h-3" />
            </a>
          ) : (
            <span title="Telefon kiritilmagan"
              className="w-6 h-6 flex items-center justify-center rounded-lg text-neutral-200 dark:text-neutral-700">
              <Phone className="w-3 h-3" />
            </span>
          )}
          <button onClick={() => onOpen(lead)} title="Tarix va izohlar"
            className="w-6 h-6 flex items-center justify-center rounded-lg text-neutral-400
                       hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">
            <MessageSquare className="w-3 h-3" />
          </button>
          {/* Orqaga qaytish — noto'g'ri bosilgan tugmani tuzatish uchun.
              Ilgari bir mis-klik lidni abadiy noto'g'ri ustunda
              qoldirardi. */}
          {canBack && <StepBack leadId={lead.id} onDone={onRefresh} />}

          {/* «To'ladi» bosqichida asosiy amal — o'quvchiga aylantirish. */}
          {st === "TO_LANDI" && !lead.convertedStudentId && (
            <button onClick={() => onConvert(lead)}
              className="flex items-center gap-0.5 ml-1 px-2 py-0.5 text-[10px] font-semibold
                         bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
              <UserPlus className="w-2.5 h-2.5" />{" "}O&apos;quvchiga
            </button>
          )}
          {lead.convertedStudentId && (
            <span title="O'quvchiga aylantirilgan"
              className="ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold
                         bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
              ✓ o&apos;quvchi
            </span>
          )}
        </div>
      </div>

      {/* QO'NG'IROQ NATIJASI — yopilmagan lidlarda. Uch tugma, chunki
          qo'ng'iroqning natijasi ham uch xil bo'ladi. */}
      {!yopiq && (
        <CallOutcome leadId={lead.id} canAdvance={canAdvance}
          hasCourse={!!lead.courseId} onDone={onRefresh} />
      )}

      {/* Nega yo'qotdik — «Bekor» ustunida ko'rinib tursin. */}
      {st === "BEKOR" && lead.lostReason && (
        <p className="mt-1.5 text-[10px] text-neutral-500 dark:text-neutral-400">
          Sabab: {LOST_REASON_UZ[lead.lostReason] ?? lead.lostReason}
        </p>
      )}

      {/* Keyingi aloqa sanasi. */}
      {!yopiq && lead.nextContactAt && (
        <p className="mt-1.5 text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
          Keyingi aloqa: {fmtRelative(lead.nextContactAt)}
        </p>
      )}

      {lead.assignedTo?.name && (
        <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-2 truncate">
          👤 {lead.assignedTo.name}
        </p>
      )}
    </div>
  );
}

export default function LeadsPage() {
  /**
   * ALOHIDA TAB — "Facebook/Instagram" integratsiyasi taxtadan ajratilgan.
   * Bir sahifada ikkalasi aralashsa, kanban holatini yo'qotmasdan
   * integratsiya sozlamalariga kirib-chiqish qulay bo'lmasdi.
   */
  const [tab, setTab] = useState<"board" | "meta">("board");
  // Bosqichma-bosqich chiqarish (/admode/features): standart OFF, avval
  // demo markazda, App Review yakunlangach hammaga. `undefined` = hali
  // yuklanmoqda — shu payt HAM tab yashirin turadi, keyin miltillamasin.
  const metaEnabled = useFeature("meta-lead-ads");
  // Bayroq ochiq tabda turgan paytda o'chirilsa — sahifa bo'sh qolmasin,
  // taxtaga qaytaramiz.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (metaEnabled === false) setTab("board");
  }, [metaEnabled]);
  const [search,    setSearch]    = useState("");
  const [showModal,    setShowModal]    = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);
  const [form,         setForm]         = useState(EMPTY);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState("");
  const [initStatus,   setInitStatus]   = useState<LeadStatus>("YANGI");

  const [editTarget,   setEditTarget]   = useState<Lead | null>(null);
  const [editForm,     setEditForm]     = useState(EMPTY);
  const [editSaving,   setEditSaving]   = useState(false);
  const [editError,    setEditError]    = useState("");
  const [showImport,   setShowImport]   = useState(false);
  /** Tasma oynasi — qaysi lidning tarixi ochilgan. */
  const [feedTarget,   setFeedTarget]   = useState<Lead | null>(null);
  /** O'quvchiga aylantirish oynasi. */
  const [convertTarget, setConvertTarget] = useState<Lead | null>(null);
  // ESLATMA: kurs so'raladigan alohida oyna (`courseTarget`) endi YO'Q.
  // Kurs talabi ikki joyda hal qilinadi: yaratish/tahrirlash formasida
  // (haqiqiy kurs tanlagich) va `CallOutcome` ichida (server rad
  // etganda o'zi so'raydi). Ilgari uchinchi, alohida mexanizm ham bor
  // edi — u faqat o'z-o'zidan chaqirilardi va CallOutcome joriy
  // qilinganda hech kim uni ishga tushirmay qoldi (jim regressiya).

  /**
   * Taxta VA «bugun qo'ng'iroq» chizig'ini birga yangilaydi.
   * Ikkalasi bir xil ma'lumotdan oziqlanadi — biri yangilanib
   * ikkinchisi eskirib qolsa, ekranda ziddiyat ko'rinardi.
   */
  const refreshAll = () => {
    mutate("/api/leads");
    mutate("/api/leads/due");
  };
  // «To'ladi» ga o'tkazishdan oldin kurs so'raladigan oyna

  const { data: raw, isLoading } = useLeads();
  const leads: Lead[] = Array.isArray(raw) ? raw : [];
  const { data: courseData } = useCourses();
  const courses: Course[] = Array.isArray(courseData) ? courseData : (courseData?.data ?? []);

  function openEdit(lead: Lead) {
    setEditTarget(lead);
    setEditForm({ name: lead.name, phone: lead.phone, source: lead.source,
                  course: lead.course ?? "", courseId: lead.courseId ?? "",
                  school: lead.school ?? "",
                  grade: lead.grade ?? "", note: lead.note ?? "" });
    setEditError("");
  }

  async function submitEdit() {
    if (!editTarget) return;
    if (!editForm.name.trim()) { setEditError("Ism majburiy"); return; }
    const phoneDigits = editForm.phone.replace(/\D/g, "");
    if (phoneDigits.length > 3 && phoneDigits.length !== 12) {
      setEditError("Telefonni to'liq kiriting yoki bo'sh qoldiring"); return;
    }
    setEditSaving(true); setEditError("");
    try {
      const res = await fetch(`/api/leads/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:   editForm.name.trim(),
          // Yarim kiritilgan raqam yuborilmaydi — bo'sh qoldirilgani
          // ma'qul, chunki unga qo'ng'iroq qilib bo'lmaydi.
          phone:  phoneDigits.length === 12 ? editForm.phone : "",
          note:   editForm.note   || undefined,
          source: editForm.source || undefined,
          course: editForm.course || undefined,
          courseId: editForm.courseId || undefined,
          school: editForm.school || undefined,
          grade:  editForm.grade  || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data.error ?? "Xatolik"); return; }
      mutate("/api/leads");
      setEditTarget(null);
    } catch { setEditError("Serverga ulanib bo'lmadi"); }
    finally { setEditSaving(false); }
  }

  function openCreate(status: LeadStatus = "YANGI") {
    setInitStatus(status); setForm(EMPTY); setError(""); setShowModal(true);
  }

  async function submit() {
    if (!form.name.trim()) { setError("Ism majburiy"); return; }
    // TELEFON IXTIYORIY: maktab tashrifidan kelgan lidda u ko'pincha
    // bo'lmaydi. Lekin YARIM kiritilgan raqam — bu xato, chunki keyin
    // qo'ng'iroq qilib bo'lmaydi va buni faqat qo'ng'iroq paytida
    // bilib qolinardi.
    const phoneDigits = form.phone.replace(/\D/g, "");
    if (phoneDigits.length > 3 && phoneDigits.length !== 12) {
      setError("Telefonni to'liq kiriting yoki bo'sh qoldiring"); return;
    }
    if (!form.source) { setError("Manba tanlang"); return; }
    if (initStatus === "TO_LANDI" && !form.courseId) {
      setError("«To'ladi» bosqichi uchun kursni tanlang"); return;
    }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, source: form.source, status: initStatus,
          phone:  phoneDigits.length === 12 ? form.phone : "",
          course: form.course || undefined,
          courseId: form.courseId || undefined,
          school: form.school || undefined,
          grade:  form.grade  || undefined,
          note:   form.note   || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Xatolik"); return; }
      mutate("/api/leads");
      setShowModal(false);
    } catch { setError("Serverga ulanib bo'lmadi"); }
    finally { setSaving(false); }
  }

  async function deleteLead() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Xatolik"); setSaving(false); return; }
      mutate("/api/leads");
      setDeleteTarget(null);
    } catch { setError("Xatolik"); }
    finally { setSaving(false); }
  }

  const filteredLeads = useMemo(() =>
    leads.filter(l => {
      const q = search.toLowerCase();
      return l.name.toLowerCase().includes(q)
          || (l.phone ?? "").includes(search)
          || (l.school ?? "").toLowerCase().includes(q)
          || (l.grade  ?? "").toLowerCase().includes(q)
          || (l.course ?? "").toLowerCase().includes(q);
    }), [leads, search]);

  const getCol = (s: LeadStatus) => filteredLeads.filter((l) => l.status === s);
  const totalByStatus = useMemo(() =>
    COLUMNS.reduce((acc, s) => { acc[s] = leads.filter((l) => l.status === s).length; return acc; },
    {} as Record<LeadStatus, number>), [leads]);

  return (
    <div>
      <TopHeader
        title="Lidlar (CRM)"
        subtitle={isLoading ? "Yuklanmoqda..." : `Jami ${leads.length} ta lid`}
        action={tab === "board" ? { label: "Yangi lid", onClick: () => openCreate("YANGI") } : undefined}
      />

      {/* Bayroq o'chiq bo'lsa tab qatori umuman ko'rsatilmaydi — hozircha
          ILGARIGIDEK bitta taxta sahifasi, boshqa markazlarga TEGMAYDI. */}
      {metaEnabled && (
        <div className="px-5 pt-4 flex gap-1 border-b border-white/60 dark:border-white/10">
          <button onClick={() => setTab("board")}
            className={cn("flex items-center gap-1.5 px-3 py-2 text-[13px] font-semibold rounded-t-lg transition-colors",
              tab === "board"
                ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200")}>
            <LayoutGrid className="w-3.5 h-3.5" /> Taxta
          </button>
          <button onClick={() => setTab("meta")}
            className={cn("flex items-center gap-1.5 px-3 py-2 text-[13px] font-semibold rounded-t-lg transition-colors",
              tab === "meta"
                ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200")}>
            <Radio className="w-3.5 h-3.5" /> Facebook/Instagram
          </button>
        </div>
      )}

      <ConvertModal lead={convertTarget}
        onClose={() => setConvertTarget(null)}
        onDone={refreshAll} />

      <LeadImportModal open={showImport}
        onClose={() => setShowImport(false)}
        onDone={() => mutate("/api/leads")} />

      {/* Lid tarixi va izohlari. Kanban holatini yo'qotmaslik uchun
          alohida sahifa emas, oyna — xodim taxtaga qaytganda o'sha
          joyida turadi. */}
      <Modal
        open={!!feedTarget}
        onClose={() => { setFeedTarget(null); mutate("/api/leads"); }}
        size="lg"
        title={feedTarget?.name ?? ""}
        subtitle="Tarix va izohlar"
        footer={
          <Button variant="outline" className="h-9 px-4 text-[13px]"
            onClick={() => { setFeedTarget(null); mutate("/api/leads"); }}>
            Yopish
          </Button>
        }
      >
        {feedTarget && <LeadFeedPanel leadId={feedTarget.id} />}
      </Modal>


      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Yangi lid"
        subtitle="Potensial o'quvchi ma'lumotlarini kiriting"
        footer={
          <>
            <Button onClick={submit} disabled={saving}
 className="flex-1 h-9 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 text-white text-[13px]">
              {saving ? "Qo'shilmoqda..." : "Qo'shish"}
            </Button>
            <Button variant="outline" className="h-9 px-4 text-[13px]" onClick={() => setShowModal(false)}>Bekor</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Ism" required>
            <Input
              placeholder="Jamshid Karimov"
              value={form.name}
              onChange={e => { setForm(p => ({...p, name: e.target.value})); setError(""); }}
              className="h-10"
            />
          </FormField>
          <FormField label="Telefon" hint="Ixtiyoriy">
            <PhoneInput
              value={form.phone}
              onChange={v => { setForm(p => ({...p, phone: v})); setError(""); }}
              error={error.includes("Telefon")}
            />
          </FormField>
        </div>

        <FormField label="Manba" required>
          <SourcePicker value={form.source}
            onChange={v => { setForm(p => ({...p, source: v})); setError(""); }} />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Maktab" hint="Ixtiyoriy">
            <Input placeholder="12-maktab" value={form.school}
              onChange={e => setForm(p => ({...p, school: e.target.value}))}
              className="h-10" />
          </FormField>
          <FormField label="Sinf" hint="Ixtiyoriy">
            <Input placeholder="9-A" value={form.grade}
              onChange={e => setForm(p => ({...p, grade: e.target.value}))}
              className="h-10" />
          </FormField>
        </div>

        <FormField label="Kurs"
          hint={initStatus === "TO_LANDI" ? "«To'ladi» uchun majburiy" : "Ixtiyoriy"}>
          {/* TANLASH, ERKIN MATN EMAS — `courseId` saqlanishi kerak,
              aks holda «To'ladi» qoidasi UI orqali hech qachon
              qondirilmasdi (yozilgan "Matematika" so'zi bazadagi
              kursga bog'lanmaydi). */}
          {courses.length === 0 ? (
            <p className="text-[12px] text-neutral-400">Hali kurs yaratilmagan</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {courses.map((c) => (
                <button key={c.id} type="button"
                  onClick={() => setForm(p => ({...p,
                    courseId: p.courseId === c.id ? "" : c.id,
                    course: p.courseId === c.id ? "" : c.name}))}
                  className={cn("px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all",
                    form.courseId === c.id
                      ? "bg-indigo-600 text-white dark:bg-indigo-500 border-neutral-900 dark:border-neutral-100"
                      : "border-white/60 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400")}>
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </FormField>

        <FormField label="Izoh" hint="Ixtiyoriy">
          <Input
            placeholder="Qo'shimcha ma'lumot..."
            value={form.note}
            onChange={e => setForm(p => ({...p, note: e.target.value}))}
            className="h-10"
          />
        </FormField>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-xl px-3 py-2.5">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <p className="text-[12px] font-medium text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
      </Modal>

      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Lidni tahrirlash"
        subtitle={editTarget?.name}
        footer={
          <>
            <Button onClick={submitEdit} disabled={editSaving}
 className="flex-1 h-9 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 text-white text-[13px]">
              {editSaving ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
            <Button variant="outline" className="h-9 px-4 text-[13px]" onClick={() => setEditTarget(null)}>Bekor</Button>
          </>
        }
      >
        {/* ISM VA TELEFON — ilgari bu yerda YO'Q edi.
            Noto'g'ri yozilgan telefon raqamli lid har kuni chetlab
            o'tiladigan o'lik kartochka bo'lardi va uni tuzatishning
            yagona yo'li o'chirib, qaytadan yozish edi. Import
            telefonsiz qatorlarni ataylab qabul qiladi (maktab
            tashrifi), ya'ni raqamni KEYIN qo'shish imkoni bo'lishi
            shart. */}
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Ism" required>
            <Input value={editForm.name}
              onChange={e => { setEditForm(p => ({...p, name: e.target.value})); setEditError(""); }}
              className="h-10" />
          </FormField>
          <FormField label="Telefon" hint="Ixtiyoriy">
            <PhoneInput value={editForm.phone}
              onChange={v => { setEditForm(p => ({...p, phone: v})); setEditError(""); }}
              error={editError.includes("Telefon")} />
          </FormField>
        </div>

        <FormField label="Manba">
          <SourcePicker value={editForm.source}
            onChange={v => setEditForm(p => ({...p, source: v}))} />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Maktab" hint="Ixtiyoriy">
            <Input placeholder="12-maktab" value={editForm.school}
              onChange={e => setEditForm(p => ({...p, school: e.target.value}))}
              className="h-10" />
          </FormField>
          <FormField label="Sinf" hint="Ixtiyoriy">
            <Input placeholder="9-A" value={editForm.grade}
              onChange={e => setEditForm(p => ({...p, grade: e.target.value}))}
              className="h-10" />
          </FormField>
        </div>
        <FormField label="Kurs"
          hint={editTarget?.status === "TO_LANDI" ? "«To'ladi» uchun majburiy" : "Ixtiyoriy"}>
          {courses.length === 0 ? (
            <p className="text-[12px] text-neutral-400">Hali kurs yaratilmagan</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {courses.map((c) => (
                <button key={c.id} type="button"
                  onClick={() => setEditForm(p => ({...p,
                    courseId: p.courseId === c.id ? "" : c.id,
                    course: p.courseId === c.id ? "" : c.name}))}
                  className={cn("px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all",
                    editForm.courseId === c.id
                      ? "bg-indigo-600 text-white dark:bg-indigo-500 border-neutral-900"
                      : "border-white/60 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400")}>
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </FormField>
        <FormField label="Izoh" hint="Ixtiyoriy">
          <Input
            placeholder="Qo'shimcha ma'lumot..."
            value={editForm.note}
            onChange={e => setEditForm(p => ({...p, note: e.target.value}))}
            className="h-10"
          />
        </FormField>
        {editError && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-100 rounded-xl px-3 py-2.5">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <p className="text-[12px] font-medium text-red-600 dark:text-red-400">{editError}</p>
          </div>
        )}
      </Modal>

      <ConfirmDeleteModal
        open={!!deleteTarget}
        onClose={() => { setDeleteTarget(null); setError(""); }}
        onConfirm={deleteLead}
        loading={saving}
        title="Lidni o'chirish"
        description={<>
          <span className="font-semibold text-neutral-700 dark:text-neutral-300">{deleteTarget?.name}</span>{" "}o&apos;chirilsinmi?
        </>}
      />

      {metaEnabled && tab === "meta" && (
        <div className="p-5">
          <MetaIntegrationPanel />
        </div>
      )}

      {tab === "board" && (
      <div className="p-5">
        {/* Pipeline summary */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {COLUMNS.map((s, i) => {
            const cfg = STATUS_CFG[s];
            return (
              <div key={s} className="flex items-center gap-1.5">
                <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[12px] font-semibold", cfg.headerBg, cfg.color, "border-current/20")}>
                  <span className={cn("w-2 h-2 rounded-full", cfg.dot)} />
                  {cfg.label}
                  <span className="font-black">{isLoading ? "…" : totalByStatus[s] ?? 0}</span>
                </div>
                {i < COLUMNS.length - 1 && <ChevronRight className="w-3 h-3 text-neutral-300 dark:text-neutral-700" />}
              </div>
            );
          })}
        </div>

        {/* Bugun qo'ng'iroq qilinadiganlar — taxtadan YUQORIDA. */}
        <DueStrip onOpen={(id) => {
          const l = leads.find((x) => x.id === id);
          if (l) setFeedTarget(l);
        }} />

        {/* Search + import */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <div className="relative max-w-xs flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input placeholder="Ism, telefon, maktab, kurs..." className="pl-9 h-9 text-sm"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-[12px] font-semibold
                       glass-soft text-neutral-600 dark:text-neutral-300
                       hover:bg-white/70 dark:hover:bg-white/10 transition-colors shrink-0">
            <Upload className="w-3.5 h-3.5" />{" "}Excel&apos;dan import
          </button>
        </div>

        {/* Kanban */}
        <div className="flex gap-3 overflow-x-auto pb-4">
          {COLUMNS.map(status => {
            const cfg      = STATUS_CFG[status];
            const colLeads = isLoading ? [] : getCol(status);
            return (
              <div key={status} className="flex-shrink-0 w-[260px] flex flex-col">
                <div className={cn("flex items-center justify-between px-3 py-2.5 rounded-xl mb-2", cfg.headerBg)}>
                  <div className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full shrink-0", cfg.dot)} />
                    <span className={cn("text-[12px] font-bold", cfg.color)}>{cfg.label}</span>
                    <span className="bg-white/60 dark:bg-black/20 text-[11px] font-black px-1.5 py-0.5 rounded-full text-neutral-700 dark:text-neutral-300">
                      {colLeads.length}
                    </span>
                  </div>
                  <button onClick={() => openCreate(status)}
                    className={cn("w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/40 dark:hover:bg-black/20 transition-colors", cfg.color)}>
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-col gap-2 min-h-24 flex-1">
                  {isLoading
                    ? Array.from({length:2}).map((_,i) => (
                        <div key={i} className="glass-panel rounded-xl border border-white/60 dark:border-white/10 p-3 space-y-2">
                          <div className="flex gap-2"><Skeleton className="w-8 h-8 shrink-0" /><div className="space-y-1 flex-1"><Skeleton className="h-3 w-24" /><Skeleton className="h-2.5 w-16" /></div></div>
                          <Skeleton className="h-7 w-full rounded-lg" />
                        </div>
                      ))
                    : colLeads.map((lead) => (
                        <LeadCard key={lead.id} lead={lead}
                          onDelete={l => { setError(""); setDeleteTarget(l); }}
                          onEdit={openEdit} onOpen={setFeedTarget}
                          onConvert={setConvertTarget} onRefresh={refreshAll} />
                      ))
                  }
                  {!isLoading && colLeads.length === 0 && (
                    <div className="border-2 border-dashed border-white/60 dark:border-white/10 rounded-xl p-6 text-center text-neutral-400 dark:text-neutral-600 text-xs cursor-pointer hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors"
                      onClick={() => openCreate(status)}>
                      + Lid qo&apos;shish
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}
    </div>
  );
}
