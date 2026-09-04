"use client";

import { useState } from "react";
import { mutate } from "swr";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { Modal, ConfirmDeleteModal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { GripVertical, Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
import { useLeadStages, type LeadStage } from "@/lib/hooks/useLeads";
import { STAGE_COLORS, stageHue, type StageColor } from "@/lib/lead-stages";

const KIND_LABELS: Record<string, string> = { NORMAL: "Oddiy", WON: "G'olib", LOST: "Yo'qotilgan" };
const KIND_HINTS: Record<string, string> = {
  NORMAL: "Oddiy oraliq bosqich — maxsus qoida yo'q",
  WON: "Kursni MAJBURIY qiladi, hisobotda konversiyaga qo'shiladi",
  LOST: "Sabab yozish mumkin, \"bugun qo'ng'iroq\" ro'yxatidan chiqadi",
};

/**
 * BOSQICHLARNI BOSHQARISH.
 *
 * Ilgari voronka qattiq 5 qiymatli edi. Endi markaz o'zi bosqich
 * qo'shadi/tahrirlaydi/o'chiradi va tartibini surib o'zgartiradi.
 * Tartib — HAQIQIY holat (`sortOrder`), shuning uchun bu yerda (Kanban
 * kartalaridan farqli) tortib qo'yish DARHOL mahalliy ko'rinadi va orqa
 * fonda saqlanadi — noto'g'ri bo'lsa serverdan qayta yuklab tuzatiladi.
 */
export function StageManagerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data } = useLeadStages();
  const [items, setItems] = useState<LeadStage[]>([]);
  const [openedOnce, setOpenedOnce] = useState(false);
  if (open && !openedOnce && data) { setOpenedOnce(true); setItems(data); }
  if (!open && openedOnce) setOpenedOnce(false);

  const [editing, setEditing] = useState<LeadStage | null | "new">(null);
  const [deleteTarget, setDeleteTarget] = useState<LeadStage | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [err, setErr] = useState("");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  async function persistOrder(order: string[]) {
    try {
      const r = await fetch("/api/leads/stages/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order }),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({})))?.error ?? "Tartibni saqlab bo'lmadi");
      mutate("/api/leads/stages");
    } catch (e) {
      // Server rad etsa — mahalliy holatni haqiqiy holatga qaytaramiz.
      const fresh = await mutate("/api/leads/stages");
      if (fresh) setItems(fresh as LeadStage[]);
      setErr((e as Error).message);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((s) => s.id === active.id);
    const newIndex = items.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    persistOrder(next.map((s) => s.id));
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true); setErr("");
    try {
      const res = await fetch(`/api/leads/stages/${deleteTarget.id}`, { method: "DELETE" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(d.error ?? "O'chirib bo'lmadi"); return; }
      mutate("/api/leads/stages");
      setItems((p) => p.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch { setErr("Serverga ulanib bo'lmadi"); }
    finally { setDeleting(false); }
  }

  function onSaved(saved: LeadStage) {
    mutate("/api/leads/stages");
    setItems((p) => {
      const i = p.findIndex((s) => s.id === saved.id);
      return i === -1 ? [...p, saved] : p.map((s) => (s.id === saved.id ? saved : s));
    });
  }

  return (
    <>
      <Modal open={open} onClose={onClose} size="lg"
        title="Lid bosqichlari" subtitle="Voronka ustunlarini qo'shing, tahrirlang yoki tortib tartibini o'zgartiring"
        footer={
          <Button variant="outline" className="h-9 px-4 text-[13px] w-full" onClick={onClose}>Yopish</Button>
        }>
        <div className="flex items-center justify-between mb-1">
          <button onClick={() => setEditing("new")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
            <Plus className="w-3.5 h-3.5" />{" "}Yangi bosqich
          </button>
          <span className="text-xs text-neutral-400">{items.length} ta bosqich</span>
        </div>

        {err && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-xl px-3 py-2.5">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <p className="text-[12px] font-medium text-red-600 dark:text-red-400 flex-1">{err}</p>
            <button onClick={() => setErr("")} className="text-[11px] font-semibold text-red-600 hover:underline shrink-0">Yopish</button>
          </div>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1.5">
              {items.map((stage) => (
                <SortableStageRow key={stage.id} stage={stage}
                  onEdit={() => setEditing(stage)}
                  onDelete={() => { setErr(""); setDeleteTarget(stage); }} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </Modal>

      <StageFormModal
        open={editing !== null}
        stage={editing === "new" ? null : editing}
        onClose={() => setEditing(null)}
        onSaved={onSaved}
      />

      <ConfirmDeleteModal
        open={!!deleteTarget}
        onClose={() => { setDeleteTarget(null); setErr(""); }}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Bosqichni o'chirish"
        description={<>
          <span className="font-semibold text-neutral-700 dark:text-neutral-300">{deleteTarget?.name}</span>{" "}o&apos;chirilsinmi?
          {err && <span className="block mt-2 text-[13px] text-red-600 dark:text-red-400 font-medium">{err}</span>}
        </>}
      />
    </>
  );
}

function SortableStageRow({ stage, onEdit, onDelete }: {
  stage: LeadStage; onEdit: () => void; onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: stage.id });
  const hue = stageHue(stage.color);
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style}
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl glass-soft border border-white/60 dark:border-white/10">
      <button {...attributes} {...listeners} title="Tartibni o'zgartirish"
        className="text-neutral-300 dark:text-neutral-600 hover:text-neutral-500 cursor-grab active:cursor-grabbing shrink-0 touch-none">
        <GripVertical className="w-4 h-4" />
      </button>
      <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", hue.dot)} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 truncate">{stage.name}</p>
        <p className="text-[10px] text-neutral-400">{KIND_LABELS[stage.kind] ?? stage.kind}</p>
      </div>
      <button onClick={onEdit}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors shrink-0">
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button onClick={onDelete}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Bosqich formasi ──────────────────────────────────────────────────────────

interface StageForm { name: string; kind: "NORMAL" | "WON" | "LOST"; color: StageColor }
const EMPTY: StageForm = { name: "", kind: "NORMAL", color: "blue" };

function StageFormModal({ open, stage, onClose, onSaved }: {
  open: boolean; stage: LeadStage | null; onClose: () => void; onSaved: (s: LeadStage) => void;
}) {
  const [form, setForm] = useState<StageForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [loadedId, setLoadedId] = useState<string | null>(null);

  const targetId = stage?.id ?? "new";
  if (open && loadedId !== targetId) {
    setLoadedId(targetId);
    setForm(stage ? { name: stage.name, kind: stage.kind, color: (stage.color as StageColor) ?? "blue" } : EMPTY);
    setErr("");
  }
  if (!open && loadedId !== null) setLoadedId(null);

  function set<K extends keyof StageForm>(k: K, v: StageForm[K]) {
    setForm((p) => ({ ...p, [k]: v })); setErr("");
  }

  async function submit() {
    if (!form.name.trim()) { setErr("Bosqich nomini kiriting"); return; }
    setSaving(true); setErr("");
    try {
      const res = await fetch(stage ? `/api/leads/stages/${stage.id}` : "/api/leads/stages", {
        method: stage ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), kind: form.kind, color: form.color }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(d.error ?? "Saqlab bo'lmadi"); return; }
      onSaved(d);
      onClose();
    } catch { setErr("Serverga ulanib bo'lmadi"); }
    finally { setSaving(false); }
  }

  return (
    <Modal
      open={open} onClose={onClose}
      title={stage ? "Bosqichni tahrirlash" : "Yangi bosqich"}
      subtitle={stage ? stage.name : "Voronkaga yangi ustun qo'shiladi"}
      footer={
        <>
          <Button onClick={submit} disabled={saving}
            className="flex-1 h-9 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 text-white text-[13px]">
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
          <Button variant="outline" className="h-9 px-4 text-[13px]" onClick={onClose}>Bekor</Button>
        </>
      }
    >
      <FormField label="Nomi" required>
        <Input placeholder="Masalan: Shartnoma imzolandi" value={form.name}
          onChange={(e) => set("name", e.target.value)} className="h-10" />
      </FormField>

      <FormField label="Turi" hint={KIND_HINTS[form.kind]}>
        <div className="grid grid-cols-3 gap-1.5">
          {(["NORMAL", "WON", "LOST"] as const).map((k) => (
            <button key={k} type="button" onClick={() => set("kind", k)}
              className={cn("py-2.5 rounded-xl border text-[12px] font-semibold transition-all",
                form.kind === k
                  ? "bg-indigo-600 text-white border-neutral-900 dark:bg-indigo-500"
                  : "glass-soft text-neutral-600 dark:text-neutral-400 border-white/60 dark:border-white/10 hover:border-neutral-400")}>
              {KIND_LABELS[k]}
            </button>
          ))}
        </div>
      </FormField>

      <FormField label="Rang">
        <div className="flex flex-wrap gap-1.5">
          {STAGE_COLORS.map((c) => {
            const hue = stageHue(c);
            return (
              <button key={c} type="button" onClick={() => set("color", c)} title={c}
                className={cn("w-8 h-8 rounded-xl transition-all shrink-0", hue.dot,
                  form.color === c
                    ? "ring-2 ring-offset-2 ring-neutral-900/40 dark:ring-white/40 dark:ring-offset-neutral-900"
                    : "opacity-60 hover:opacity-100")} />
            );
          })}
        </div>
      </FormField>

      {err && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-xl px-3 py-2.5">
          <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
          <p className="text-[12px] font-medium text-red-600 dark:text-red-400">{err}</p>
        </div>
      )}
    </Modal>
  );
}
