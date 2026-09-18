"use client";

import { useState } from "react";
import { StickyNote, Pencil, Trash2, Check, X, Plus, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtDateTime } from "@/lib/date-uz";

/**
 * O'QUVCHI IZOHI — O'QUVCHI SAHIFASIDA, JOYIDA TAHRIRLANADI.
 *
 * Izoh maydoni allaqachon bor edi, lekin o'quvchi sahifasida HECH
 * QAYERDA ko'rinmasdi: uni o'qish ham, yozish ham faqat "Tahrirlash"
 * oynasini ochib, formani aylanib chiqish orqali mumkin edi. Amalda bu
 * izohni o'lik maydonga aylantirgandi — xodim uni yozmasdi ham,
 * o'qimasdi ham (egasining talabi, 2026-09-18).
 *
 * MUALLIF VA SANA backenddan keladi (`noteByName`, `noteAt`) va FAQAT
 * izoh matni haqiqatan o'zgarganda yangilanadi — ismni tahrirlash
 * izohning "kim yozgani" ni almashtirib yubormaydi.
 *
 * O'chirish = bo'sh matn saqlash. Alohida endpoint yasalmadi: izoh
 * `Student` ning maydoni, ya'ni "o'chirish" uni tozalash degani, va
 * shu yo'l muallif maydonlarini ham birga tozalaydi.
 */
export function StudentNoteCard({
  studentId, note, authorName, noteAt, canEdit, onSaved,
}: {
  studentId: string;
  note: string | null | undefined;
  authorName: string | null | undefined;
  noteAt: string | null | undefined;
  canEdit: boolean;
  onSaved: () => void;
}) {
  const matn = (note ?? "").trim();
  const [tahrir, setTahrir] = useState(false);
  const [qoralama, setQoralama] = useState(matn);
  const [saqlanmoqda, setSaqlanmoqda] = useState(false);
  const [xato, setXato] = useState("");
  const [ochirilsinmi, setOchirilsinmi] = useState(false);

  async function saqla(yangi: string) {
    setSaqlanmoqda(true); setXato("");
    try {
      const r = await fetch(`/api/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: yangi }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setXato(d?.error ?? "Saqlanmadi"); return; }
      setTahrir(false);
      setOchirilsinmi(false);
      onSaved();
    } catch { setXato("Serverga ulanib bo'lmadi"); }
    finally { setSaqlanmoqda(false); }
  }

  function tahrirBoshla() {
    setQoralama(matn);
    setXato("");
    setTahrir(true);
  }

  return (
    <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-500
          dark:text-neutral-400 uppercase tracking-wider">
          <StickyNote className="w-3.5 h-3.5" />
          Izoh
        </h3>

        {canEdit && !tahrir && matn && (
          <div className="flex items-center gap-1">
            <button onClick={tahrirBoshla} title="Tahrirlash"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400
                hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => { setOchirilsinmi(true); setXato(""); }} title="O'chirish"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400
                hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {xato && (
        <div className="flex items-start gap-2 mb-2 px-3 py-2 rounded-xl
          bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40">
          <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-[12px] font-medium text-red-600 dark:text-red-400">{xato}</p>
        </div>
      )}

      {/* ─── TAHRIRLASH ─────────────────────────────────────────────── */}
      {tahrir ? (
        <div className="space-y-2">
          <textarea
            value={qoralama}
            onChange={(e) => setQoralama(e.target.value)}
            rows={3}
            autoFocus
            placeholder="Masalan: onasi kechqurun qo'ng'iroq qilsin"
            className="w-full px-3 py-2 text-[13px] rounded-xl resize-y
              border border-white/60 dark:border-white/10
              bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100
              outline-none focus:border-indigo-500 transition-colors"
          />
          <div className="flex items-center gap-2">
            <button onClick={() => saqla(qoralama)}
              disabled={saqlanmoqda || qoralama.trim() === matn}
              className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-[12px] font-semibold
                bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50">
              <Check className="w-3.5 h-3.5" />
              {saqlanmoqda ? "Saqlanmoqda..." : "Saqlash"}
            </button>
            <button onClick={() => { setTahrir(false); setXato(""); }} disabled={saqlanmoqda}
              className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-[12px] font-semibold
                text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100
                dark:hover:bg-white/5 transition-colors disabled:opacity-50">
              <X className="w-3.5 h-3.5" />
              Bekor
            </button>
          </div>
        </div>

      /* ─── O'CHIRISHNI TASDIQLASH ──────────────────────────────────
         Alohida oyna emas, joyidagi ikki tugma: izoh bir qatorlik
         matn, uni o'chirish uchun butun ekranni to'sish ortiqcha. */
      ) : ochirilsinmi ? (
        <div className="space-y-2">
          <p className="text-[12.5px] text-neutral-600 dark:text-neutral-300">
            Izoh o&apos;chirilsinmi? Matn ham, kim yozgani ham o&apos;chadi.
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => saqla("")} disabled={saqlanmoqda}
              className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-[12px] font-semibold
                bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50">
              <Trash2 className="w-3.5 h-3.5" />
              {saqlanmoqda ? "..." : "O'chirish"}
            </button>
            <button onClick={() => setOchirilsinmi(false)} disabled={saqlanmoqda}
              className="h-8 px-3 rounded-xl text-[12px] font-semibold
                text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100
                dark:hover:bg-white/5 transition-colors disabled:opacity-50">
              Bekor
            </button>
          </div>
        </div>

      /* ─── BO'SH ──────────────────────────────────────────────────── */
      ) : !matn ? (
        canEdit ? (
          <button onClick={tahrirBoshla}
            className="flex items-center gap-1.5 text-[12.5px] font-semibold
              text-indigo-600 dark:text-indigo-400 hover:underline">
            <Plus className="w-3.5 h-3.5" />
            Izoh qo&apos;shish
          </button>
        ) : (
          <p className="text-[12.5px] text-neutral-400">Izoh yo&apos;q</p>
        )

      /* ─── KO'RSATISH ─────────────────────────────────────────────── */
      ) : (
        <>
          <p className="text-[13px] text-neutral-700 dark:text-neutral-200
            whitespace-pre-line break-words">{matn}</p>
          <p className={cn("text-[11px] mt-2",
            authorName ? "text-neutral-400" : "text-neutral-400 italic")}>
            {/* Eski izohlarda muallif saqlanmagan — buni YASHIRMAYMIZ,
                aks holda bo'sh joy xatolikdek ko'rinardi. */}
            {authorName
              ? `${authorName}${noteAt ? ` · ${fmtDateTime(noteAt)}` : ""}`
              : "kim yozgani saqlanmagan"}
          </p>
        </>
      )}
    </div>
  );
}
