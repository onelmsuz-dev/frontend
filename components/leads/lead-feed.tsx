"use client";

import { useState } from "react";
import { mutate } from "swr";
import { fmtRelative, fmtDateTime } from "@/lib/date-uz";
import { useLeadFeed, type FeedItem } from "@/lib/hooks/useLeads";
import {
  MessageSquare, History, Send, Pencil, Trash2, X, Check,
  Loader2, AlertCircle,
} from "lucide-react";

/**
 * LID TASMASI — "bu lid bilan nima bo'ldi?" degan savolning javobi.
 *
 * Bitta ro'yxatda ikki xil narsa turadi va ular ATAYLAB boshqacha
 * ko'rinadi:
 *
 *   • TIZIM HODISASI (kulrang) — "Holat: Yangi → To'ladi". O'zgarmas,
 *     tegib bo'lmaydi.
 *   • ODAM IZOHI (oq kartochka) — "qo'ng'iroq qildim, javob bermadi".
 *     Muallif tuzatishi mumkin.
 *
 * Farq muhim: xodim o'zi yozgan gapni tizim yozgan hodisadan darhol
 * ajrata olishi kerak, aks holda "buni kim yozdi?" degan savol
 * tug'ilardi.
 */

function Composer({ leadId, onDone }: { leadId: string; onDone: () => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function send() {
    const body = text.trim();
    if (!body) return;
    setBusy(true); setErr("");
    try {
      const r = await fetch(`/api/leads/${leadId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error ?? "Saqlab bo'lmadi");
      setText("");
      onDone();
    } catch (e) {
      setErr((e as Error).message);
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setErr(""); }}
          onKeyDown={(e) => {
            // Ctrl/⌘+Enter — yuborish. Oddiy Enter yangi qator qoldiradi:
            // izoh ko'pincha bir necha jumla bo'ladi.
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); }
          }}
          rows={2}
          maxLength={2000}
          placeholder="Masalan: qo'ng'iroq qildim, payshanba kuni qayta bog'lanishni so'radi"
          className="flex-1 resize-none rounded-xl border border-neutral-200 dark:border-neutral-700
                     bg-white dark:bg-neutral-900 px-3 py-2 text-[13px]
                     text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400
                     outline-none focus:border-indigo-500 transition-colors" />
        <button onClick={send} disabled={busy || !text.trim()}
          title="Yuborish (Ctrl+Enter)"
          className="h-9 w-9 shrink-0 grid place-items-center rounded-xl bg-indigo-600
                     text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
      {err && <p className="text-[11px] text-red-600 dark:text-red-400">{err}</p>}
    </div>
  );
}

function CommentRow({
  leadId, item, onDone,
}: { leadId: string; item: FeedItem; onDone: () => void }) {
  const [mode, setMode] = useState<null | "edit" | "delete">(null);
  const [draft, setDraft] = useState(item.text);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    const body = draft.trim();
    if (!body) return;
    setBusy(true); setErr("");
    try {
      const r = await fetch(`/api/leads/${leadId}/comments/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error ?? "Saqlab bo'lmadi");
      setMode(null); onDone();
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  }

  async function remove() {
    setBusy(true); setErr("");
    try {
      const r = await fetch(`/api/leads/${leadId}/comments/${item.id}`, { method: "DELETE" });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.error ?? "O'chirib bo'lmadi");
      }
      setMode(null); onDone();
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <li className="flex gap-2.5">
      <div className="mt-0.5 h-7 w-7 shrink-0 grid place-items-center rounded-lg
                      bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
        <MessageSquare className="h-3.5 w-3.5" />
      </div>

      <div className="min-w-0 flex-1 rounded-xl border border-neutral-200 dark:border-neutral-700
                      bg-white dark:bg-neutral-900 px-3 py-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-100">
            {item.actorName || "—"}
          </span>
          <span className="text-[11px] text-neutral-400" title={fmtDateTime(item.at)}>
            {fmtRelative(item.at)}
          </span>
          {item.editedAt && (
            <span className="text-[10px] text-neutral-400" title={fmtDateTime(item.editedAt)}>
              · tahrirlangan
            </span>
          )}

          <div className="ml-auto flex items-center gap-0.5">
            {item.canEdit && mode === null && (
              <button onClick={() => { setDraft(item.text); setMode("edit"); setErr(""); }}
                title="Tahrirlash"
                className="rounded-md p-1 text-neutral-300 hover:text-blue-600
                           hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                <Pencil className="h-3 w-3" />
              </button>
            )}
            {item.canDelete && mode === null && (
              <button onClick={() => { setMode("delete"); setErr(""); }}
                title="O'chirish"
                className="rounded-md p-1 text-neutral-300 hover:text-red-600
                           hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {mode === "edit" ? (
          <div className="mt-1.5 space-y-1.5">
            <textarea autoFocus value={draft} rows={3} maxLength={2000}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full resize-none rounded-lg border border-indigo-400
                         bg-white dark:bg-neutral-800 px-2.5 py-1.5 text-[13px]
                         text-neutral-900 dark:text-neutral-100 outline-none" />
            <div className="flex gap-1.5">
              <button onClick={save} disabled={busy || !draft.trim()}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1
                           text-[11px] font-semibold text-white disabled:opacity-40">
                {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                Saqlash
              </button>
              <button onClick={() => { setMode(null); setErr(""); }}
                className="inline-flex items-center gap-1 rounded-lg glass-soft px-2.5 py-1
                           text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">
                <X className="h-3 w-3" /> Bekor
              </button>
            </div>
          </div>
        ) : mode === "delete" ? (
          <div className="mt-1.5 space-y-1.5">
            <p className="text-[12px] text-neutral-700 dark:text-neutral-300">
              Shu izoh o&apos;chirilsinmi? Qaytarib bo&apos;lmaydi.
            </p>
            <div className="flex gap-1.5">
              <button onClick={remove} disabled={busy}
                className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1
                           text-[11px] font-semibold text-white disabled:opacity-40">
                {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                O&apos;chirish
              </button>
              <button onClick={() => { setMode(null); setErr(""); }}
                className="rounded-lg glass-soft px-2.5 py-1 text-[11px] font-semibold
                           text-neutral-600 dark:text-neutral-300">
                Bekor
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-0.5 whitespace-pre-wrap break-words text-[13px]
                        text-neutral-700 dark:text-neutral-300">
            {item.text}
          </p>
        )}

        {err && <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">{err}</p>}
      </div>
    </li>
  );
}

function EventRow({ item }: { item: FeedItem }) {
  return (
    <li className="flex gap-2.5">
      <div className="mt-0.5 h-7 w-7 shrink-0 grid place-items-center rounded-lg
                      bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
        <History className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1 py-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[12px] text-neutral-600 dark:text-neutral-300">{item.text}</span>
          <span className="text-[11px] text-neutral-400" title={fmtDateTime(item.at)}>
            {fmtRelative(item.at)}
          </span>
          {item.actorName && (
            <span className="text-[11px] text-neutral-400">· {item.actorName}</span>
          )}
        </div>
        {item.changes.length > 0 && (
          <ul className="mt-0.5 space-y-0.5">
            {item.changes.map((c, i) => (
              <li key={i} className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {c}
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

export function LeadFeedPanel({ leadId }: { leadId: string }) {
  const { data, isLoading, error } = useLeadFeed(leadId);
  const refresh = () => mutate(`/api/leads/${leadId}/feed`);

  return (
    <div className="space-y-3">
      <Composer leadId={leadId} onDone={refresh} />

      {isLoading ? (
        <ul className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
          ))}
        </ul>
      ) : error ? (
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 px-3 py-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-px" />
          <p className="text-[12px] text-neutral-700 dark:text-neutral-300">
            Tarixni yuklab bo&apos;lmadi
          </p>
        </div>
      ) : !data || data.items.length === 0 ? (
        <p className="py-6 text-center text-[12px] text-neutral-400 dark:text-neutral-500">
          Hali hech narsa yozilmagan — birinchi izohni qoldiring
        </p>
      ) : (
        <>
          {data.truncated && (
            <p className="rounded-xl bg-neutral-50 dark:bg-neutral-800/50 px-3 py-2
                          text-[11px] text-neutral-500 dark:text-neutral-400">
              Eng so&apos;nggi {data.items.length}{" "}ta yozuv ko&apos;rsatilmoqda — bundan
              oldingilari bu ro&apos;yxatga sig&apos;madi.
            </p>
          )}
          <ul className="space-y-2">
            {data.items.map((it) =>
              it.kind === "comment" ? (
                <CommentRow key={it.id} leadId={leadId} item={it} onDone={refresh} />
              ) : (
                <EventRow key={it.id} item={it} />
              ),
            )}
          </ul>
          {/* Lid qachon yaratilgani — tasmaning oxiri. Sun'iy qator emas,
              lidning o'z sanasidan o'qiladi, shuning uchun har doim rost. */}
          <p className="pt-1 text-center text-[11px] text-neutral-400 dark:text-neutral-500">
            Lid {fmtRelative(data.lead.createdAt)}{" "}qo&apos;shilgan
          </p>
        </>
      )}
    </div>
  );
}
