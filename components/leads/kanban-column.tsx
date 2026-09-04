"use client";

import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { stageHue } from "@/lib/lead-stages";
import { type LeadStage } from "@/lib/hooks/useLeads";
import { LeadCard, type Lead } from "@/components/leads/lead-card";

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded-xl", className)} />;
}

export function KanbanColumn({
  stage, stages, leads, isLoading, onAdd, onDelete, onEdit, onOpen, onConvert, onRefresh,
}: {
  stage: LeadStage;
  /** To'liq, tartiblangan ro'yxat — kartalarga oldinga/orqaga navigatsiya uchun kerak. */
  stages: LeadStage[];
  leads: Lead[];
  isLoading: boolean;
  onAdd: () => void;
  onDelete: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  onOpen: (lead: Lead) => void;
  onConvert: (lead: Lead) => void;
  onRefresh: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id, data: { stageId: stage.id } });
  const hue = stageHue(stage.color);

  return (
    <div className="flex-shrink-0 w-[260px] flex flex-col">
      <div className={cn("flex items-center justify-between px-3 py-2.5 rounded-xl mb-2", hue.headerBg)}>
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn("w-2 h-2 rounded-full shrink-0", hue.dot)} />
          <span className={cn("text-[12px] font-bold truncate", hue.text)}>{stage.name}</span>
          <span className="bg-white/60 dark:bg-black/20 text-[11px] font-black px-1.5 py-0.5 rounded-full text-neutral-700 dark:text-neutral-300 shrink-0">
            {leads.length}
          </span>
        </div>
        <button onClick={onAdd}
          className={cn("w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/40 dark:hover:bg-black/20 transition-colors shrink-0", hue.text)}>
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div ref={setNodeRef}
        className={cn(
          "flex flex-col gap-2 min-h-24 flex-1 rounded-xl transition-colors",
          isOver && "bg-indigo-50/60 dark:bg-indigo-900/20 ring-2 ring-indigo-300 dark:ring-indigo-700",
        )}>
        {isLoading
          ? Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="glass-panel rounded-xl border border-white/60 dark:border-white/10 p-3 space-y-2">
                <div className="flex gap-2"><Skeleton className="w-8 h-8 shrink-0" /><div className="space-y-1 flex-1"><Skeleton className="h-3 w-24" /><Skeleton className="h-2.5 w-16" /></div></div>
                <Skeleton className="h-7 w-full rounded-lg" />
              </div>
            ))
          : leads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} stage={stage} stages={stages}
                onDelete={onDelete} onEdit={onEdit} onOpen={onOpen}
                onConvert={onConvert} onRefresh={onRefresh} />
            ))
        }
        {!isLoading && leads.length === 0 && (
          <div onClick={onAdd}
            className="border-2 border-dashed border-white/60 dark:border-white/10 rounded-xl p-6 text-center text-neutral-400 dark:text-neutral-600 text-xs cursor-pointer hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors">
            + Lid qo&apos;shish
          </div>
        )}
      </div>
    </div>
  );
}
