"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { MessageSquare, Send } from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import { fmtRelative } from "@/lib/date-uz";

interface Note {
  id: string;
  text: string;
  authorName: string;
  createdAt: string;
}

const KEY = (groupId: string) => `/api/groups/${groupId}/notes`;

/**
 * IZOHLAR — xodimlar guruh haqida qoldiradigan erkin matnli eslatmalar
 * ("ota-onalar yig'ilishi", "xona o'zgardi" va h.k.). Rasmiy jurnal emas —
 * shuning uchun `GroupHistorySection`dan ALOHIDA: u avtomatik yoziladi va
 * o'zgarmas, bu yerdagi esa har kim o'z so'zi bilan yozadi.
 */
export function GroupNotesSection({ groupId, canUpdate }: { groupId: string; canUpdate: boolean }) {
  const { data, isLoading } = useSWR<Note[]>(KEY(groupId), fetcher);
  const notes = Array.isArray(data) ? data : [];

  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    if (!text.trim()) return;
    setSaving(true); setErr("");
    try {
      const res = await fetch(KEY(groupId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      if (!res.ok) { setErr("Saqlab bo'lmadi"); return; }
      setText("");
      mutate(KEY(groupId));
    } catch { setErr("Serverga ulanib bo'lmadi"); }
    finally { setSaving(false); }
  }

  return (
    <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
      <div className="px-5 py-3 border-b border-white/50 dark:border-white/10 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-neutral-400" />
        <h3 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">Izohlar</h3>
        <span className="text-[11px] text-neutral-400">{notes.length} ta</span>
      </div>

      {canUpdate && (
        <div className="px-5 py-3 border-b border-white/50 dark:border-white/10 space-y-2">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Guruh haqida izoh qoldiring..."
            rows={2}
            className="w-full px-3 py-2 text-[13px] rounded-xl border border-white/60 dark:border-white/10
              bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400
              outline-none focus:border-indigo-400 transition-colors resize-none"
          />
          <div className="flex items-center justify-between">
            {err && <span className="text-[11px] text-red-500">{err}</span>}
            <button onClick={submit} disabled={saving || !text.trim()}
              className="ml-auto flex items-center gap-1.5 px-3 h-8 rounded-xl text-[12px] font-semibold transition-colors
                bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-200 disabled:dark:bg-neutral-800
                disabled:text-neutral-400 disabled:cursor-not-allowed text-white">
              <Send className="w-3.5 h-3.5" />
              {saving ? "Yuborilmoqda..." : "Qo'shish"}
            </button>
          </div>
        </div>
      )}

      <div className="px-5 py-2">
        {isLoading ? (
          <div className="animate-pulse space-y-3 py-3">
            {[1, 2].map(i => <div key={i} className="h-10 w-full bg-neutral-200 dark:bg-neutral-700 rounded-lg" />)}
          </div>
        ) : notes.length === 0 ? (
          <p className="text-[12px] text-neutral-400 py-6 text-center">Hali izoh yo&apos;q</p>
        ) : (
          <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {notes.map(n => (
              <li key={n.id} className="flex gap-2.5 py-3 first:pt-0 last:pb-0">
                <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0 text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                  {n.authorName?.[0] ?? "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[12px] font-semibold text-neutral-800 dark:text-neutral-200">{n.authorName}</span>
                    <time className="shrink-0 text-[10.5px] text-neutral-400">{fmtRelative(n.createdAt)}</time>
                  </div>
                  <p className="text-[12.5px] text-neutral-600 dark:text-neutral-300 mt-0.5 leading-snug whitespace-pre-wrap">{n.text}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
