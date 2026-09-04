"use client";

import { useState, useMemo, useEffect } from "react";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { TopHeader } from "@/components/layout/top-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Modal, ConfirmDeleteModal } from "@/components/ui/modal";
import { PhoneInput } from "@/components/ui/phone-input";
import { FormField } from "@/components/ui/form-field";
import {
  Search, Plus, ChevronRight, AlertCircle, Upload, LayoutGrid, Radio, Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLeads, useLeadStages } from "@/lib/hooks/useLeads";
import { useCourses } from "@/lib/hooks/useCourses";
import { SourcePicker } from "@/components/leads/source-picker";
import { LeadImportModal } from "@/components/leads/lead-import-modal";
import { LeadFeedPanel } from "@/components/leads/lead-feed";
import { DueStrip } from "@/components/leads/due-strip";
import { ConvertModal } from "@/components/leads/convert-modal";
import { MetaIntegrationPanel } from "@/components/leads/meta-integration";
import { KanbanColumn } from "@/components/leads/kanban-column";
import { LeadCardPreview, type Lead } from "@/components/leads/lead-card";
import { StageManagerModal } from "@/components/leads/stage-manager-modal";
import { useFeature } from "@/lib/hooks/useFeatures";
import { stageHue, defaultStage } from "@/lib/lead-stages";
import { mutate } from "swr";

interface Course { id: string; name: string }

const EMPTY = { name: "", phone: "", source: "Instagram", course: "", courseId: "",
                // Bitta odam bir nechta fanga (masalan Matematika +
                // Ingliz tili) BIR VAQTDA yozilishi mumkin (Bahtiyor,
                // 2026-09-01) — shuning uchun massiv. `courseId` faqat
                // BIRINCHISI bilan to'ldiriladi (submit paytida).
                courseIds: [] as string[],
                school: "", grade: "", note: "" };

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded-xl", className)} />;
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
  const [initStageId,  setInitStageId]  = useState("");
  const [showStages,   setShowStages]   = useState(false);

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

  /** Sudrab tashlash — "g'olib" turidagi ustunga kursisiz tashlansa shu yerda so'raladi. */
  const [pendingDrop,    setPendingDrop]    = useState<{ lead: Lead; stageId: string } | null>(null);
  const [pendingCourses, setPendingCourses] = useState<string[]>([]);
  const [dropSaving,     setDropSaving]     = useState(false);
  const [dropError,      setDropError]      = useState("");
  const [activeLead,     setActiveLead]     = useState<Lead | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  /**
   * Taxta VA «bugun qo'ng'iroq» chizig'ini birga yangilaydi.
   * Ikkalasi bir xil ma'lumotdan oziqlanadi — biri yangilanib
   * ikkinchisi eskirib qolsa, ekranda ziddiyat ko'rinardi.
   */
  const refreshAll = () => {
    mutate("/api/leads");
    mutate("/api/leads/due");
  };

  const { data: raw, isLoading } = useLeads();
  const leads: Lead[] = useMemo(() => (Array.isArray(raw) ? raw : []), [raw]);
  const { data: stagesRaw, isLoading: stagesLoading } = useLeadStages();
  const stages = useMemo(() => stagesRaw ?? [], [stagesRaw]);
  const stagesById = useMemo(() =>
    Object.fromEntries(stages.map((s) => [s.id, s])), [stages]);
  const { data: courseData } = useCourses();
  const courses: Course[] = Array.isArray(courseData) ? courseData : (courseData?.data ?? []);

  function openEdit(lead: Lead) {
    setEditTarget(lead);
    // `lead.courses` — TO'LIQ ro'yxat. Bo'lmasa (masalan eski, hali
    // yangilanmagan lid) `courseId`ning o'ziga tushamiz — bitta kurs
    // ham bo'lsa "ro'yxat"ning bir elementi.
    const courseIds = lead.courses?.length
      ? lead.courses.map((c) => c.courseId)
      : lead.courseId ? [lead.courseId] : [];
    setEditForm({ name: lead.name, phone: lead.phone, source: lead.source,
                  course: lead.course ?? "", courseId: lead.courseId ?? "",
                  courseIds,
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
          // HAR DOIM to'liq ro'yxat sifatida yuboriladi (bo'sh bo'lsa
          // ham) — backend buni "ro'yxatni SHU bilan almashtir" deb
          // o'qiydi. Hech narsa o'zgartirilmagan bo'lsa ham natija bir
          // xil qoladi.
          courseIds: editForm.courseIds,
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

  function openCreate(stageId?: string) {
    setInitStageId(stageId ?? defaultStage(stages)?.id ?? "");
    setForm(EMPTY); setError(""); setShowModal(true);
  }

  const initStage = stagesById[initStageId];

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
    if (initStage?.kind === "WON" && form.courseIds.length === 0) {
      setError(`«${initStage.name}» bosqichi uchun kursni tanlang`); return;
    }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, source: form.source, stageId: initStageId || undefined,
          phone:  phoneDigits.length === 12 ? form.phone : "",
          // Bir nechta kurs tanlangan bo'lsa `courseIds` USTUN turadi
          // (backend birinchisini `courseId`/`course`ga yozadi).
          courseIds: form.courseIds.length > 0 ? form.courseIds : undefined,
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

  /** Bosqich o'zgarishi — kartani qo'lda tahrirlashdan HAM, sudrab tashlashdan HAM shu orqali. */
  async function moveLead(lead: Lead, stageId: string, courseIds?: string[]) {
    setDropError("");
    if (courseIds) setDropSaving(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId, ...(courseIds ? { courseIds } : {}) }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Server AYNAN shu sababdan rad etsa — kurs tanlash oynasini
        // ochamiz (xuddi CallOutcome server rad etganda o'zi
        // so'raganidek).
        if (String(d?.error ?? "").includes("kursni tanlang")) {
          setPendingDrop({ lead, stageId }); setPendingCourses([]);
          return;
        }
        setDropError(d?.error ?? "Ko'chirib bo'lmadi");
        return;
      }
      refreshAll();
      setPendingDrop(null); setPendingCourses([]);
    } catch { setDropError("Serverga ulanib bo'lmadi"); }
    finally { setDropSaving(false); }
  }

  function handleDragStart(e: DragStartEvent) {
    setActiveLead(leads.find((l) => l.id === e.active.id) ?? null);
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveLead(null);
    const { active, over } = e;
    if (!over) return;
    const lead = leads.find((l) => l.id === active.id);
    const targetStageId = String(over.id);
    if (!lead || lead.stageId === targetStageId) return;
    moveLead(lead, targetStageId);
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

  const getCol = (stageId: string) => filteredLeads.filter((l) => l.stageId === stageId);
  const totalByStage = useMemo(() =>
    Object.fromEntries(stages.map((s) => [s.id, leads.filter((l) => l.stageId === s.id).length])),
    [leads, stages]);

  return (
    <div>
      <TopHeader
        title="Lidlar (CRM)"
        subtitle={isLoading ? "Yuklanmoqda..." : `Jami ${leads.length} ta lid`}
        action={tab === "board" ? { label: "Yangi lid", onClick: () => openCreate() } : undefined}
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

      <StageManagerModal open={showStages} onClose={() => setShowStages(false)} />

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
          hint={initStage?.kind === "WON" ? `«${initStage.name}» uchun majburiy — bir nechtasini tanlash mumkin` : "Ixtiyoriy, bir nechtasini tanlash mumkin"}>
          {/* TANLASH, ERKIN MATN EMAS — `courseId` saqlanishi kerak,
              aks holda «g'olib» turidagi bosqich qoidasi UI orqali hech
              qachon qondirilmasdi (yozilgan "Matematika" so'zi bazadagi
              kursga bog'lanmaydi).
              KO'P TANLASH: bitta odam bir nechta fanga (masalan
              Matematika + Ingliz tili) BIR VAQTDA yozilishi mumkin —
              ilgari faqat bittasi tanlanardi va ikkinchi fanga to'lov
              olib bo'lmasdi (Bahtiyor, 2026-09-01). */}
          {courses.length === 0 ? (
            <p className="text-[12px] text-neutral-400">Hali kurs yaratilmagan</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {courses.map((c) => (
                <button key={c.id} type="button"
                  onClick={() => setForm(p => ({...p,
                    courseIds: p.courseIds.includes(c.id)
                      ? p.courseIds.filter(id => id !== c.id)
                      : [...p.courseIds, c.id]}))}
                  className={cn("px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all",
                    form.courseIds.includes(c.id)
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
          hint={stagesById[editTarget?.stageId ?? ""]?.kind === "WON" ? "Majburiy — bir nechtasini tanlash mumkin" : "Ixtiyoriy, bir nechtasini tanlash mumkin"}>
          {/* KO'P TANLASH — bitta odam bir nechta fanga (masalan
              Matematika + Ingliz tili) BIR VAQTDA yozilishi mumkin. */}
          {courses.length === 0 ? (
            <p className="text-[12px] text-neutral-400">Hali kurs yaratilmagan</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {courses.map((c) => (
                <button key={c.id} type="button"
                  onClick={() => setEditForm(p => ({...p,
                    courseIds: p.courseIds.includes(c.id)
                      ? p.courseIds.filter(id => id !== c.id)
                      : [...p.courseIds, c.id]}))}
                  className={cn("px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all",
                    editForm.courseIds.includes(c.id)
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

      {/* Sudrab, kursisiz "g'olib" turidagi ustunga tashlanganda — xuddi
          CallOutcome ichidagi kurs so'rash oynasi kabi. */}
      <Modal
        open={!!pendingDrop}
        onClose={() => { setPendingDrop(null); setPendingCourses([]); setDropError(""); }}
        title="Kursni tanlang"
        subtitle={pendingDrop ? `«${stagesById[pendingDrop.stageId]?.name}» bosqichiga o'tish uchun` : ""}
        footer={
          <>
            <Button disabled={dropSaving || pendingCourses.length === 0}
              onClick={() => pendingDrop && moveLead(pendingDrop.lead, pendingDrop.stageId, pendingCourses)}
              className="flex-1 h-9 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 text-white text-[13px]">
              {dropSaving ? "Saqlanmoqda..." : "Tasdiqlash"}
            </Button>
            <Button variant="outline" className="h-9 px-4 text-[13px]"
              onClick={() => { setPendingDrop(null); setPendingCourses([]); setDropError(""); }}>Bekor</Button>
          </>
        }
      >
        {courses.length === 0 ? (
          <p className="text-[12px] text-neutral-400">Hali kurs yaratilmagan</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {courses.map((c) => (
              <button key={c.id} type="button"
                onClick={() => setPendingCourses(p => p.includes(c.id) ? p.filter(id => id !== c.id) : [...p, c.id])}
                className={cn("px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all",
                  pendingCourses.includes(c.id)
                    ? "bg-indigo-600 text-white dark:bg-indigo-500 border-neutral-900 dark:border-neutral-100"
                    : "border-white/60 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400")}>
                {c.name}
              </button>
            ))}
          </div>
        )}
        {dropError && <p className="text-[12px] text-red-600 dark:text-red-400 mt-2">{dropError}</p>}
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
          {stages.map((s, i) => {
            const hue = stageHue(s.color);
            return (
              <div key={s.id} className="flex items-center gap-1.5">
                <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[12px] font-semibold", hue.headerBg, hue.text, "border-current/20")}>
                  <span className={cn("w-2 h-2 rounded-full", hue.dot)} />
                  {s.name}
                  <span className="font-black">{isLoading ? "…" : totalByStage[s.id] ?? 0}</span>
                </div>
                {i < stages.length - 1 && <ChevronRight className="w-3 h-3 text-neutral-300 dark:text-neutral-700" />}
              </div>
            );
          })}
          <button onClick={() => setShowStages(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold
                       glass-soft text-neutral-500 dark:text-neutral-400 hover:text-indigo-600
                       border border-dashed border-neutral-300 dark:border-neutral-600 transition-colors">
            <Settings2 className="w-3.5 h-3.5" /> Bosqichlarni sozlash
          </button>
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

        {dropError && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-xl px-3 py-2.5 mb-3">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <p className="text-[12px] font-medium text-red-600 dark:text-red-400 flex-1">{dropError}</p>
            <button onClick={() => setDropError("")} className="text-[11px] font-semibold text-red-600 hover:underline shrink-0">Yopish</button>
          </div>
        )}

        {/* Kanban */}
        {stagesLoading && stages.length === 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[260px] space-y-2">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : stages.length === 0 ? (
          <div className="border-2 border-dashed border-white/60 dark:border-white/10 rounded-xl p-10 text-center">
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">Hali bosqich yaratilmagan</p>
            <button onClick={() => setShowStages(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
              <Plus className="w-3.5 h-3.5" />{" "}Birinchi bosqichni qo&apos;shish
            </button>
          </div>
        ) : (
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveLead(null)}>
            <div className="flex gap-3 overflow-x-auto pb-4">
              {stages.map((stage) => (
                <KanbanColumn key={stage.id} stage={stage} stages={stages}
                  leads={isLoading ? [] : getCol(stage.id)} isLoading={isLoading}
                  onAdd={() => openCreate(stage.id)}
                  onDelete={l => { setError(""); setDeleteTarget(l); }}
                  onEdit={openEdit} onOpen={setFeedTarget}
                  onConvert={setConvertTarget} onRefresh={refreshAll} />
              ))}
            </div>
            <DragOverlay>
              {activeLead && <LeadCardPreview lead={activeLead} />}
            </DragOverlay>
          </DndContext>
        )}
      </div>
      )}
    </div>
  );
}
