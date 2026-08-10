"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Archive, Trash2 } from "lucide-react";
import { ModalOverlay } from "@/components/ui/modal-overlay";
import { cn } from "@/lib/utils";

/**
 * O'quvchini o'chirish oynasi.
 *
 * Oddiy `ConfirmDeleteModal` yetarli emas edi: backend to'lovi bor o'quvchini
 * o'chirishni rad etadi (409) va buning o'rniga arxivlashni taklif qiladi —
 * shu javobni ko'rsatib, darhol arxivlash tugmasini berish kerak.
 * Ilgari esa xato umuman tekshirilmasdi va "o'chdi" ko'rinardi.
 */
export function StudentDeleteModal({
  student, onClose, onDone,
}: {
  student: { id: string; name: string } | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [canArchive, setCanArchive] = useState(false);

  useEffect(() => {
    if (student) { setErr(""); setCanArchive(false); }
  }, [student]);

  async function remove() {
    if (!student) return;
    setBusy(true); setErr("");
    try {
      const res = await fetch(`/api/students/${student.id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErr(d.error ?? `O'chirib bo'lmadi (${res.status})`);
        // 409 = to'lov tarixi bor, arxivlash mumkin
        setCanArchive(res.status === 409);
        return;
      }
      onDone();
      onClose();
    } catch { setErr("Serverga ulanib bo'lmadi"); }
    finally { setBusy(false); }
  }

  async function archive() {
    if (!student) return;
    setBusy(true); setErr("");
    try {
      const res = await fetch(`/api/students/${student.id}/archive`, { method: "POST" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErr(d.error ?? "Arxivlab bo'lmadi");
        return;
      }
      onDone();
      onClose();
    } catch { setErr("Serverga ulanib bo'lmadi"); }
    finally { setBusy(false); }
  }

  return (
    <ModalOverlay open={!!student} onClose={onClose} panelClassName="sm:max-w-sm">
      <div className="glass-strong rounded-2xl shadow-2xl w-full border border-white/60 dark:border-white/10 p-5 sm:p-6 space-y-5">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center mx-auto",
          canArchive
            ? "bg-amber-100 dark:bg-amber-900/30"
            : "bg-red-100 dark:bg-red-900/30",
        )}>
          {canArchive
            ? <Archive className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            : <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />}
        </div>

        <div className="text-center">
          <h3 className="font-bold text-[15px] text-neutral-900 dark:text-neutral-100 mb-1">
            {canArchive ? "O'chirib bo'lmaydi" : "O'quvchini o'chirish"}
          </h3>
          {!err && (
            <p className="text-[13px] text-neutral-500 dark:text-neutral-400">
              <span className="font-semibold">{student?.name}</span> o&apos;chirilsinmi?
              Davomat va guruh yozuvlari ham o&apos;chadi.
            </p>
          )}
        </div>

        {err && (
          <div className={cn(
            "flex items-start gap-2.5 px-3.5 py-3 rounded-xl border",
            canArchive
              ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
              : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
          )}>
            <AlertTriangle className={cn("w-4 h-4 shrink-0 mt-0.5",
              canArchive ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400")} />
            <p className={cn("text-[12px] leading-relaxed",
              canArchive ? "text-amber-700 dark:text-amber-300" : "text-red-700 dark:text-red-300")}>
              {err}
            </p>
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-2">
          {canArchive ? (
            <button type="button" onClick={archive} disabled={busy}
              className="flex-1 h-10 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[13px] font-semibold transition-colors disabled:opacity-60">
              {busy ? "Arxivlanmoqda..." : "Arxivlash"}
            </button>
          ) : (
            <button type="button" onClick={remove} disabled={busy}
              className="flex-1 h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[13px] font-semibold transition-colors disabled:opacity-60">
              {busy ? "O'chirilmoqda..." : "O'chirish"}
            </button>
          )}
          <button type="button" onClick={onClose} disabled={busy}
            className="flex-1 h-10 rounded-xl border border-white/60 dark:border-white/10 text-[13px] font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-white/60 dark:hover:bg-white/10 transition-colors">
            Bekor
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}
