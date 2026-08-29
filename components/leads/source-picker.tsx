"use client";

import { useState } from "react";
import { mutate } from "swr";
import { cn } from "@/lib/utils";
import { useLeadSources } from "@/lib/hooks/useLeads";
import { Plus, Check, X, Loader2 } from "lucide-react";

/**
 * LID MANBASINI TANLASH.
 *
 * Ilgari ro'yxat kodda qattiq yozilgan edi: Instagram, Telegram,
 * Do'st orqali, Website, Boshqa. Markaz maktablarga borib lid yig'sa,
 * uni "Boshqa" ga yozishdan boshqa iloji yo'q edi — va oy oxirida
 * "qaysi kanal ishlayapti?" degan savolga javob topilmasdi, chunki
 * lidlarning yarmi "Boshqa" da turardi.
 *
 * Endi ro'yxat markazniki. "+" tugmasi bilan yangi manba qo'shiladi va
 * u darhol tanlanadi — odam yozib, saqlab, keyin qaytib tanlab
 * o'tirmasligi uchun.
 */

const COLORS: Record<string, string> = {
  "Instagram":       "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  "Telegram":        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "Tanish orqali":   "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  "Do'st orqali":    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  "Maktab tashrifi": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  "Veb-sayt":        "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  "Website":         "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  "Banner":          "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
};

/** Manba rangi — ro'yxat markazniki, shuning uchun nomdan hosil qilinadi. */
const FALLBACK = [
  "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  "bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300",
];

export function sourceColor(name: string): string {
  if (COLORS[name]) return COLORS[name];
  // Nomdan barqaror raqam — sahifa qayta yuklansa ham rang o'zgarmaydi.
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return FALLBACK[h % FALLBACK.length];
}

export function SourcePicker({
  value, onChange, disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const { data: sources, isLoading } = useLeadSources();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const list = sources ?? [];
  // Lid eski manba bilan yozilgan va u ro'yxatdan olib tashlangan
  // bo'lishi mumkin — shunda ham tanlangani ko'rinib tursin.
  const names = list.map((s) => s.name);
  const all = value && !names.includes(value) ? [...names, value] : names;

  async function add() {
    const name = draft.trim();
    if (!name) return;
    // Allaqachon bor bo'lsa — yangi so'rov yubormaymiz, shunchaki tanlaymiz.
    const exists = all.find((n) => n.toLowerCase() === name.toLowerCase());
    if (exists) { onChange(exists); setAdding(false); setDraft(""); return; }

    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/leads/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error ?? "Qo'shib bo'lmadi");
      await mutate("/api/leads/sources");
      onChange(name);
      setAdding(false); setDraft("");
    } catch (e) {
      setErr((e as Error).message);
    } finally { setBusy(false); }
  }

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-24 rounded-xl bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {all.map((name) => (
          <button key={name} type="button" disabled={disabled}
            onClick={() => onChange(name)}
            className={cn(
              "h-8 px-3 rounded-xl text-[12px] font-semibold transition-all disabled:opacity-50",
              value === name
                ? cn(sourceColor(name), "ring-2 ring-offset-1 ring-neutral-900/20 dark:ring-white/30 dark:ring-offset-neutral-900")
                : "glass-soft text-neutral-600 dark:text-neutral-300 hover:bg-white/70 dark:hover:bg-white/10",
            )}>
            {name}
          </button>
        ))}

        {!adding && (
          <button type="button" disabled={disabled}
            onClick={() => { setAdding(true); setErr(""); }}
            title="Yangi manba qo'shish"
            className="h-8 px-2.5 rounded-xl text-[12px] font-semibold inline-flex items-center gap-1
                       border border-dashed border-neutral-300 dark:border-neutral-600
                       text-neutral-500 dark:text-neutral-400
                       hover:border-indigo-400 hover:text-indigo-600 transition-colors disabled:opacity-50">
            <Plus className="w-3.5 h-3.5" /> Yangi
          </button>
        )}
      </div>

      {adding && (
        <div className="flex items-center gap-1.5">
          <input autoFocus value={draft} maxLength={60}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); add(); }
              if (e.key === "Escape") { setAdding(false); setDraft(""); setErr(""); }
            }}
            placeholder="Masalan: 12-maktab tashrifi"
            className="flex-1 h-9 px-3 text-[13px] rounded-xl border border-indigo-400
                       bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100
                       outline-none placeholder:text-neutral-400" />
          <button type="button" onClick={add} disabled={busy || !draft.trim()}
            className="h-9 w-9 grid place-items-center rounded-xl bg-indigo-600 text-white
                       disabled:opacity-40 hover:bg-indigo-700 transition-colors">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          </button>
          <button type="button"
            onClick={() => { setAdding(false); setDraft(""); setErr(""); }}
            className="h-9 w-9 grid place-items-center rounded-xl glass-soft
                       text-neutral-500 hover:text-neutral-700 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {err && <p className="text-[11px] text-red-600 dark:text-red-400">{err}</p>}
    </div>
  );
}
