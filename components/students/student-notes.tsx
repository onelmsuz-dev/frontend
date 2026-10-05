"use client";

/**
 * O'QUVCHI IZOHLARI — BIR NECHTA.
 *
 * Ilgari izoh bitta matn maydoni edi (`Student.note`): yangi gap yozish
 * avvalgisini o'chirib yuborardi. Bu yerda har izoh alohida yozuv —
 * muallifi va vaqti bilan; yangisi ro'yxat tepasiga qo'shiladi, eskilari
 * qoladi. Backend: `GET/POST/PATCH/DELETE /api/students/:id/notes`.
 *
 * YOZISHNI BEKOR QILISH har doim mumkin: "Bekor" tugmasi va `Esc`. Saqlash —
 * tugma yoki `Ctrl/⌘ + Enter` (oddiy `Enter` yangi qator: izoh ko'p qatorli
 * bo'lishi mumkin).
 *
 * IKKI KO'RINISH:
 *   · to'liq (`limit` berilmagan) — "Ma'lumot" bo'limida, hamma izoh;
 *   · ixcham (`limit={n}`) — "Umumiy"da: so'nggi n tasi, qolgani `onMore` bilan.
 * Ikkalasi bitta SWR kalitini o'qiydi — birida qo'shilgan izoh ikkinchisida
 * ham darhol ko'rinadi.
 */

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { AlertCircle, ArrowRight, Check, MessageSquareText, Pencil, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetcher } from "@/lib/fetcher";
import { fmtDateTime, fmtRelative } from "@/lib/date-uz";

type Note = { id: string; text: string; authorName: string; createdAt: string; updatedAt: string };

/** Yozish maydoni — yangi izoh va tahrirlash uchun bitta shakl. */
function Yozish({
  boshlangich = "", saqlanmoqda, xato, onSave, onCancel,
}: {
  boshlangich?: string; saqlanmoqda: boolean; xato: string;
  onSave: (matn: string) => void; onCancel: () => void;
}) {
  const [matn, setMatn] = useState(boshlangich);
  const ref = useRef<HTMLTextAreaElement>(null);
  // Fokus va kursor matn oxirida (tahrirlashda boshiga tushib qolmasin).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);
  const toza = matn.trim();
  const saqlasa = toza.length > 0 && toza !== boshlangich.trim() && !saqlanmoqda;

  return (
    <div className="@container rounded-2xl border border-indigo-200 bg-white p-2.5 shadow-[0_8px_24px_-16px_rgba(79,70,229,0.5)] dark:border-indigo-400/30 dark:bg-neutral-900">
      <textarea
        ref={ref} value={matn} rows={3} maxLength={2000}
        onChange={(e) => setMatn(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") { e.preventDefault(); onCancel(); }
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && saqlasa) { e.preventDefault(); onSave(toza); }
        }}
        placeholder="Masalan: onasi bilan gaplashildi, to'lovni 10-sanaga va'da qildi"
        className="block w-full resize-y bg-transparent px-1.5 py-1 text-[13.5px] leading-relaxed text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-neutral-100"
      />
      {xato && (
        <p className="mx-1.5 mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-red-600 dark:text-red-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />{xato}
        </p>
      )}
      <div className="flex items-center gap-2 border-t border-neutral-100 pt-2 dark:border-white/10">
        <button type="button" disabled={!saqlasa} onClick={() => onSave(toza)}
          className="flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl bg-indigo-600 px-3 text-[12.5px] font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-40">
          <Check className="h-3.5 w-3.5" />{saqlanmoqda ? "Saqlanmoqda…" : "Saqlash"}
        </button>
        <button type="button" disabled={saqlanmoqda} onClick={onCancel}
          className="flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-[12.5px] font-semibold text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800 disabled:opacity-40 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-neutral-100">
          <X className="h-3.5 w-3.5" />Bekor qilish
        </button>
        {/* Yordamchi yozuv faqat maydon keng bo'lganda — tor ustunda tugmalarni siqmasin. */}
        <span className="ml-auto hidden whitespace-nowrap text-[11px] text-neutral-400 @md:block">Esc — bekor · Ctrl+Enter — saqlash</span>
      </div>
    </div>
  );
}

/** Qisqartirishga arziydigan uzunlik: ~6 qatordan oshadigan matn. */
const uzun = (t: string) => t.length > 420 || t.split("\n").length > 6;

export function StudentNotes({
  studentId, canEdit, limit, onMore, onChanged, className,
}: {
  studentId: string; canEdit: boolean;
  /** Ixcham ko'rinish: faqat so'nggi `limit` ta izoh. */
  limit?: number;
  /** Ixcham ko'rinishda "hammasi" bosilganda. */
  onMore?: () => void;
  /** Izoh o'zgargach — sahifa o'quvchi ma'lumotini yangilashi uchun. */
  onChanged?: () => void;
  className?: string;
}) {
  const kalit = `/api/students/${studentId}/notes`;
  const { data, isLoading, mutate } = useSWR<Note[]>(kalit, fetcher);
  const izohlar = Array.isArray(data) ? data : [];
  const korinadigan = limit ? izohlar.slice(0, limit) : izohlar;
  const qolgan = izohlar.length - korinadigan.length;

  // "yangi" | izoh id (tahrirlash) | null
  const [yozilmoqda, setYozilmoqda] = useState<string | null>(null);
  const [ochirish, setOchirish] = useState<string | null>(null);
  const [saqlanmoqda, setSaqlanmoqda] = useState(false);
  const [xato, setXato] = useState("");
  /** To'liq ochilgan uzun izohlar (id). */
  const [ochiq, setOchiq] = useState<Set<string>>(new Set());

  const yop = () => { setYozilmoqda(null); setOchirish(null); setXato(""); };

  async function sorov(method: "POST" | "PATCH" | "DELETE", id: string | null, text?: string) {
    setSaqlanmoqda(true); setXato("");
    try {
      const r = await fetch(id ? `${kalit}/${id}` : kalit, {
        method,
        headers: { "Content-Type": "application/json" },
        ...(text !== undefined ? { body: JSON.stringify({ text }) } : {}),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setXato(d?.error ?? "Saqlanmadi"); return; }
      yop();
      await mutate();
      onChanged?.();
    } catch { setXato("Serverga ulanib bo'lmadi"); }
    finally { setSaqlanmoqda(false); }
  }

  return (
    // `flex-col` + ro'yxat `flex-1 overflow-y-auto`: blokka balandlik berilsa
    // (`className`), sarlavha joyida qoladi va faqat ro'yxat aylanadi.
    <div className={cn("glass-panel flex flex-col rounded-2xl border border-white/60 p-5 dark:border-white/10", className)}>
      <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          <MessageSquareText className="h-3.5 w-3.5" />
          Izohlar
          {izohlar.length > 0 && (
            <span className="rounded-full bg-neutral-200/70 px-1.5 py-px text-[10.5px] font-bold text-neutral-600 dark:bg-white/10 dark:text-neutral-300">
              {izohlar.length}
            </span>
          )}
        </p>
        {canEdit && yozilmoqda !== "yangi" && (
          <button type="button" onClick={() => { yop(); setYozilmoqda("yangi"); }}
            className="flex h-8 items-center gap-1.5 rounded-xl bg-indigo-50 px-3 text-[12.5px] font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 dark:bg-indigo-400/15 dark:text-indigo-200 dark:hover:bg-indigo-400/25">
            <Plus className="h-3.5 w-3.5" />Izoh qo&apos;shish
          </button>
        )}
      </div>

      <div className="-mr-2 min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-2 [scrollbar-width:thin]">
        {yozilmoqda === "yangi" && (
          <Yozish saqlanmoqda={saqlanmoqda} xato={xato} onCancel={yop} onSave={(t) => sorov("POST", null, t)} />
        )}

        {isLoading && <div className="h-14 animate-pulse rounded-2xl bg-neutral-200/60 dark:bg-white/5" />}

        {!isLoading && izohlar.length === 0 && yozilmoqda !== "yangi" && (
          <p className="py-2 text-[13px] text-neutral-400">
            Hali izoh yo&apos;q{canEdit ? " — muhim gaplarni shu yerga yozib qo'ying." : "."}
          </p>
        )}

        {korinadigan.map((n) => (
          yozilmoqda === n.id ? (
            <Yozish key={n.id} boshlangich={n.text} saqlanmoqda={saqlanmoqda} xato={xato}
              onCancel={yop} onSave={(t) => sorov("PATCH", n.id, t)} />
          ) : (
            <div key={n.id} className="group/izoh rounded-2xl border border-amber-200/60 bg-amber-50/60 px-3.5 py-3 dark:border-amber-400/15 dark:bg-amber-400/[0.06]">
              {/* UZUN IZOH — qisqartirib ko'rsatiladi (ixchamda 3, to'liqda 6 qator):
                  bitta uzun matn butun ustunni egallab, qolgan izohlarni pastga
                  surib yubormasin. O'qish eni ~70 belgi — keng ustunda ham qator
                  ko'z yugurtirib bo'ladigan uzunlikda qoladi. */}
              <p className={cn("max-w-[70ch] whitespace-pre-line break-words text-[13.5px] leading-relaxed text-neutral-800 dark:text-neutral-100",
                !ochiq.has(n.id) && (limit ? "line-clamp-3" : uzun(n.text) && "line-clamp-6"))}>{n.text}</p>
              {!limit && uzun(n.text) && (
                <button type="button" onClick={() => setOchiq((p) => { const y = new Set(p); if (y.has(n.id)) y.delete(n.id); else y.add(n.id); return y; })}
                  className="mt-1 text-[12px] font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
                  {ochiq.has(n.id) ? "Yig'ish" : "To'liq o'qish"}
                </button>
              )}

              {ochirish === n.id ? (
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <span className="text-[12.5px] font-medium text-neutral-700 dark:text-neutral-200">Bu izoh o&apos;chirilsinmi?</span>
                  <button type="button" disabled={saqlanmoqda} onClick={() => sorov("DELETE", n.id)}
                    className="flex h-7 items-center gap-1.5 rounded-lg bg-red-600 px-2.5 text-[12px] font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                    <Trash2 className="h-3 w-3" />{saqlanmoqda ? "…" : "O'chirish"}
                  </button>
                  <button type="button" disabled={saqlanmoqda} onClick={yop}
                    className="h-7 rounded-lg px-2.5 text-[12px] font-semibold text-neutral-500 hover:bg-black/5 dark:text-neutral-400 dark:hover:bg-white/10">
                    Bekor
                  </button>
                  {xato && <span className="text-[12px] font-medium text-red-600">{xato}</span>}
                </div>
              ) : (
                <div className="mt-2 flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200/80 text-[10px] font-bold text-amber-800 dark:bg-amber-400/20 dark:text-amber-200">
                    {(n.authorName?.[0] ?? "?").toUpperCase()}
                  </span>
                  <p className="min-w-0 flex-1 truncate text-[11.5px] text-neutral-500 dark:text-neutral-400" title={fmtDateTime(n.createdAt)}>
                    {/* Eski izohlarda muallif saqlanmagan bo'lishi mumkin — yashirmaymiz. */}
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">{n.authorName || "Muallifi saqlanmagan"}</span>
                    {" · "}{fmtRelative(n.createdAt)}
                    {/* 2 soniyadan katta farq — haqiqiy tahrir (yaratishdagi millisekund farqi emas). */}
                    {Math.abs(new Date(n.updatedAt).getTime() - new Date(n.createdAt).getTime()) > 2000 && " · tahrirlangan"}
                  </p>
                  {canEdit && (
                    // Sichqonchali qurilmada — ustiga borilganda; sensorli ekranda doim ko'rinadi.
                    <div className="flex items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover/izoh:opacity-100 [@media(hover:none)]:opacity-100">
                      <button type="button" title="Tahrirlash" aria-label="Izohni tahrirlash"
                        onClick={() => { yop(); setYozilmoqda(n.id); }}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-500 hover:bg-black/5 hover:text-indigo-600 dark:text-neutral-400 dark:hover:bg-white/10">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" title="O'chirish" aria-label="Izohni o'chirish"
                        onClick={() => { yop(); setOchirish(n.id); }}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-500 hover:bg-red-500/10 hover:text-red-600 dark:text-neutral-400">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        ))}

        {qolgan > 0 && onMore && (
          <button type="button" onClick={onMore}
            className="flex items-center gap-1 text-[12.5px] font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
            Yana {qolgan}{" "}ta izoh<ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
