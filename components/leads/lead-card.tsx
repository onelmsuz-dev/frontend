"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Phone, Trash2, Pencil, MessageSquare, UserPlus, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { sourceColor } from "@/components/leads/source-picker";
import { CallOutcome, StepBack } from "@/components/leads/call-outcome";
import { LOST_REASON_UZ, type LeadStage } from "@/lib/hooks/useLeads";
import { resolvePrevStage, defaultStage } from "@/lib/lead-stages";
import { fmtRelative } from "@/lib/date-uz";

export interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string;
  stageId: string;
  course?: string | null;
  courseId?: string | null;
  /** TO'LIQ ro'yxat — bir nechta fanga bir vaqtda yozilgan bo'lishi mumkin. */
  courses?: { courseId: string }[];
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

/**
 * BITTA LID KARTOCHKASI.
 *
 * `stage`/`stages` — bu kartaning USTUNI (ya'ni `lead.stageId`ga mos
 * bosqich) va MARKAZNING TO'LIQ, tartiblangan ro'yxati. Ikkalasi ham
 * kerak: birinchisi "qaysi turdaman" (kind), ikkinchisi "oldinga/orqaga
 * qaysi bosqich" (sortOrder bo'yicha navigatsiya, backend bilan bir
 * xil algoritm — `lib/lead-stages.ts`).
 */
export function LeadCard({ lead, stage, stages, onDelete, onEdit, onOpen, onConvert, onRefresh }: {
  lead: Lead;
  stage: LeadStage;
  stages: LeadStage[];
  onDelete: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  onOpen: (lead: Lead) => void;
  onConvert: (lead: Lead) => void;
  onRefresh: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: lead.id, data: { lead, stageId: stage.id } });

  const canAdvance = stage.kind === "NORMAL";
  /** "Yo'qotilgan"dan har doim standart bosqichga qaytish mumkin; boshqasida — oldingi bosqich bo'lsa. */
  const canBack = stage.kind === "LOST" ? !!defaultStage(stages) : !!resolvePrevStage(stages, stage);
  const yopiq = stage.kind !== "NORMAL";

  // Haqiqiy suriladigan nusxa `DragOverlay`da (page.tsx) chiziladi —
  // bu yerdagi asl karta faqat joy egallab, xiralashib turadi. Aks
  // holda ustunlar qatoridagi `overflow-x-auto` suriladigan kartani
  // kesib qo'yardi.
  const style = transform
    ? { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 }
    : undefined;

  return (
    <div ref={setNodeRef} style={style}
      className="glass-panel rounded-xl border border-white/60 dark:border-white/10 p-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-2.5 mb-2.5">
        <button {...attributes} {...listeners} title="Ushlab boshqa bosqichga o'tkazish"
          className="w-4 h-8 -ml-1 flex items-center justify-center text-neutral-300 dark:text-neutral-600
                     hover:text-neutral-500 cursor-grab active:cursor-grabbing shrink-0 touch-none">
          <GripVertical className="w-3.5 h-3.5" />
        </button>
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

          {/* «G'olib» turidagi bosqichda asosiy amal — o'quvchiga aylantirish. */}
          {stage.kind === "WON" && !lead.convertedStudentId && (
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
        <CallOutcome leadId={lead.id} canAdvance={canAdvance} stageId={stage.id}
          hasCourse={!!lead.courseId} onDone={onRefresh} />
      )}

      {/* Nega yo'qotdik — "yo'qotilgan" turidagi ustunda ko'rinib tursin. */}
      {stage.kind === "LOST" && lead.lostReason && (
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

/**
 * `DragOverlay` uchun YENGIL nusxa — asl karta EMAS.
 *
 * `DragOverlay` bolasi qo'l bilan sudralmaydi (`@dnd-kit`ning o'zi
 * pozitsiyasini boshqaradi), shuning uchun bu yerda `useDraggable`
 * chaqirilmaydi va tugmalar yo'q — faqat "qaysi karta ko'tarilgani"ni
 * ko'rsatish uchun kichik vizual aks.
 */
export function LeadCardPreview({ lead }: { lead: Lead }) {
  return (
    <div className="glass-panel rounded-xl border border-indigo-300 dark:border-indigo-700 p-3 shadow-xl w-[228px] rotate-2 cursor-grabbing">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-[12px] shrink-0">
          {lead.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 leading-tight truncate">
            {lead.name}
          </p>
          <p className="text-[11px] text-neutral-400 dark:text-neutral-500 truncate">
            {lead.phone || "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
