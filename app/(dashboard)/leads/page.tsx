"use client";

import { useState, useMemo } from "react";
import { TopHeader } from "@/components/layout/top-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Modal, ConfirmDeleteModal } from "@/components/ui/modal";
import { PhoneInput } from "@/components/ui/phone-input";
import { FormField } from "@/components/ui/form-field";
import { Phone, Search, Plus, ChevronRight, Trash2, AlertCircle, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLeads } from "@/lib/hooks/useLeads";
import { mutate } from "swr";

type LeadStatus = "YANGI" | "ALOQA_QILINGAN" | "SINOV_DARSI" | "TO_LANDI" | "BEKOR";

const STATUS_CFG: Record<LeadStatus, { label: string; color: string; headerBg: string; dot: string }> = {
  YANGI:          { label: "Yangi",         color: "text-blue-700 dark:text-blue-300",     headerBg: "bg-blue-50 dark:bg-blue-900/20",     dot: "bg-blue-500" },
  ALOQA_QILINGAN: { label: "Aloqa qilindi", color: "text-yellow-700 dark:text-yellow-300", headerBg: "bg-yellow-50 dark:bg-yellow-900/20", dot: "bg-yellow-500" },
  SINOV_DARSI:    { label: "Sinov darsi",   color: "text-purple-700 dark:text-purple-300", headerBg: "bg-purple-50 dark:bg-purple-900/20", dot: "bg-purple-500" },
  TO_LANDI:       { label: "To'ladi",       color: "text-green-700 dark:text-green-300",   headerBg: "bg-green-50 dark:bg-green-900/20",   dot: "bg-green-500" },
  BEKOR:          { label: "Bekor",         color: "text-red-700 dark:text-red-300",       headerBg: "bg-red-50 dark:bg-red-900/20",       dot: "bg-red-500" },
};

const SOURCE_COLORS: Record<string, string> = {
  "Instagram":    "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  "Telegram":     "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "Do'st orqali": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  "Website":      "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400",
};

const SOURCES = ["Instagram", "Telegram", "Do'st orqali", "Website", "Boshqa"];
const COLUMNS: LeadStatus[] = ["YANGI", "ALOQA_QILINGAN", "SINOV_DARSI", "TO_LANDI", "BEKOR"];

const NEXT_STATUS: Partial<Record<LeadStatus, LeadStatus>> = {
  YANGI:          "ALOQA_QILINGAN",
  ALOQA_QILINGAN: "SINOV_DARSI",
  SINOV_DARSI:    "TO_LANDI",
};

const EMPTY = { name: "", phone: "", source: "Instagram", course: "", note: "" };

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded-xl", className)} />;
}

function LeadCard({ lead, onMove, onDelete, onEdit }: { lead: any; onMove: (id: string, status: LeadStatus) => void; onDelete: (lead: any) => void; onEdit: (lead: any) => void }) {
  const next = NEXT_STATUS[lead.status as LeadStatus];
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-2.5 mb-2.5">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-[12px] shrink-0">
          {lead.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 leading-tight truncate">{lead.name}</p>
          <p className="text-[11px] text-neutral-400 dark:text-neutral-500">{lead.phone}</p>
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
        <p className="text-[11px] text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800 rounded-lg px-2.5 py-1.5 mb-2">
          📚 {lead.course}
        </p>
      )}

      {lead.note && (
        <p className="text-[11px] text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 rounded-lg px-2.5 py-1.5 mb-2">
          💬 {lead.note}
        </p>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full",
          SOURCE_COLORS[lead.source] ?? "bg-neutral-100 dark:bg-neutral-800 text-neutral-600")}>
          {lead.source}
        </span>
        <div className="flex items-center gap-0.5">
          <a href={`tel:${lead.phone}`}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-neutral-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors">
            <Phone className="w-3 h-3" />
          </a>
          {next && (
            <button onClick={() => onMove(lead.id, next)}
              className="flex items-center gap-0.5 ml-1 px-2 py-0.5 text-[10px] font-semibold
                bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900
                rounded-lg hover:opacity-80 transition-opacity">
              {STATUS_CFG[next].label}
              <ChevronRight className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      </div>

      {lead.assignedTo?.name && (
        <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-2 truncate">
          👤 {lead.assignedTo.name}
        </p>
      )}
    </div>
  );
}

export default function LeadsPage() {
  const [search,    setSearch]    = useState("");
  const [showModal,    setShowModal]    = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [form,         setForm]         = useState(EMPTY);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState("");
  const [initStatus,   setInitStatus]   = useState<LeadStatus>("YANGI");

  const [editTarget,   setEditTarget]   = useState<any>(null);
  const [editForm,     setEditForm]     = useState(EMPTY);
  const [editSaving,   setEditSaving]   = useState(false);
  const [editError,    setEditError]    = useState("");

  const { data: raw, isLoading } = useLeads();
  const leads: any[] = Array.isArray(raw) ? raw : [];

  async function moveLead(id: string, status: LeadStatus) {
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    mutate("/api/leads");
  }

  function openEdit(lead: any) {
    setEditTarget(lead);
    setEditForm({ name: lead.name, phone: lead.phone, source: lead.source, course: lead.course ?? "", note: lead.note ?? "" });
    setEditError("");
  }

  async function submitEdit() {
    if (!editTarget) return;
    if (!editForm.name.trim()) { setEditError("Ism majburiy"); return; }
    setEditSaving(true); setEditError("");
    try {
      const res = await fetch(`/api/leads/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note:   editForm.note   || undefined,
          source: editForm.source || undefined,
          course: editForm.course || undefined,
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
    const phoneDigits = form.phone.replace(/\D/g, "");
    if (phoneDigits.length !== 12) { setError("To'liq 9 ta raqam kiriting"); return; }
    if (!form.source) { setError("Manba tanlang"); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, phone: form.phone, source: form.source,
          course: form.course || undefined, note: form.note || undefined,
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
    leads.filter(l =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search) ||
      l.course?.toLowerCase().includes(search.toLowerCase())
    ), [leads, search]);

  const getCol = (s: LeadStatus) => filteredLeads.filter((l: any) => l.status === s);
  const totalByStatus = useMemo(() =>
    COLUMNS.reduce((acc, s) => { acc[s] = leads.filter((l: any) => l.status === s).length; return acc; },
    {} as Record<LeadStatus, number>), [leads]);

  return (
    <div>
      <TopHeader
        title="Lidlar (CRM)"
        subtitle={isLoading ? "Yuklanmoqda..." : `Jami ${leads.length} ta lid`}
        action={{ label: "Yangi lid", onClick: () => openCreate("YANGI") }}
      />

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Yangi lid"
        subtitle="Potensial o'quvchi ma'lumotlarini kiriting"
        footer={
          <>
            <Button onClick={submit} disabled={saving}
              className="flex-1 h-9 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 text-white text-[13px]">
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
          <FormField label="Telefon" required>
            <PhoneInput
              value={form.phone}
              onChange={v => { setForm(p => ({...p, phone: v})); setError(""); }}
              error={error.includes("raqam")}
            />
          </FormField>
        </div>

        <FormField label="Manba" required>
          <div className="flex gap-1.5 flex-wrap">
            {SOURCES.map(s => (
              <button key={s} onClick={() => setForm(p => ({...p, source: s}))}
                className={cn("px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all",
                  form.source === s
                    ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900 dark:border-neutral-100"
                    : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400")}>
                {s}
              </button>
            ))}
          </div>
        </FormField>

        <FormField label="Kurs" hint="Ixtiyoriy">
          <Input
            placeholder="Matematika, Ingliz tili..."
            value={form.course}
            onChange={e => setForm(p => ({...p, course: e.target.value}))}
            className="h-10"
          />
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
              className="flex-1 h-9 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 text-white text-[13px]">
              {editSaving ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
            <Button variant="outline" className="h-9 px-4 text-[13px]" onClick={() => setEditTarget(null)}>Bekor</Button>
          </>
        }
      >
        <FormField label="Manba">
          <div className="flex gap-1.5 flex-wrap">
            {SOURCES.map(s => (
              <button key={s} onClick={() => setEditForm(p => ({...p, source: s}))}
                className={cn("px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all",
                  editForm.source === s
                    ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900"
                    : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400")}>
                {s}
              </button>
            ))}
          </div>
        </FormField>
        <FormField label="Kurs" hint="Ixtiyoriy">
          <Input
            placeholder="Matematika, Ingliz tili..."
            value={editForm.course}
            onChange={e => setEditForm(p => ({...p, course: e.target.value}))}
            className="h-10"
          />
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
          <span className="font-semibold text-neutral-700 dark:text-neutral-300">{deleteTarget?.name}</span> o'chirilsinmi?
        </>}
      />

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

        {/* Search */}
        <div className="relative max-w-xs mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input placeholder="Ism, telefon, kurs..." className="pl-9 h-9 text-sm"
            value={search} onChange={e => setSearch(e.target.value)} />
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
                        <div key={i} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-3 space-y-2">
                          <div className="flex gap-2"><Skeleton className="w-8 h-8 shrink-0" /><div className="space-y-1 flex-1"><Skeleton className="h-3 w-24" /><Skeleton className="h-2.5 w-16" /></div></div>
                          <Skeleton className="h-7 w-full rounded-lg" />
                        </div>
                      ))
                    : colLeads.map((lead: any) => (
                        <LeadCard key={lead.id} lead={lead} onMove={moveLead} onDelete={l => { setError(""); setDeleteTarget(l); }} onEdit={openEdit} />
                      ))
                  }
                  {!isLoading && colLeads.length === 0 && (
                    <div className="border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl p-6 text-center text-neutral-400 dark:text-neutral-600 text-xs cursor-pointer hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors"
                      onClick={() => openCreate(status)}>
                      + Lid qo'shish
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
