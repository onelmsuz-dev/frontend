"use client";

import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X, AlertTriangle, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";

/**
 * XARAJAT KATEGORIYALARINI BOSHQARISH.
 *
 * Ilgari ro'yxat frontendda qattiq yozilgan sakkiz qatordan iborat edi va
 * markaz o'zinikini qo'sha olmasdi — "Transport" ham, "Tanlov sovg'alari"
 * ham "Boshqa" ga tushardi, keyin esa "Boshqa" ning ichida nima borligini
 * hech kim ajrata olmasdi.
 *
 * O'CHIRISH XARAJATNI YO'Q QILMAYDI: `Expense.category` — matn, FK emas.
 * Eski yozuvlar o'z nomini saqlaydi va filtrda ko'rinishda davom etadi.
 * Oynada shu ochiq aytilgan — aks holda "o'chirsam pul tarixi ketadimi?"
 * degan qo'rquv tugmani bosishga to'sqinlik qilardi.
 */

interface Cat { id: string; name: string }

export function ExpenseCategoriesModal({
  open, onClose, categories, onChanged,
}: {
  open: boolean;
  onClose: () => void;
  categories: Cat[];
  onChanged: () => void;
}) {
  const [yangi, setYangi] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editNom, setEditNom] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [tasdiq, setTasdiq] = useState<string | null>(null);

  async function so_rov(method: string, path: string, body?: { name: string }, kalit = "x") {
    setBusy(kalit); setErr("");
    try {
      const res = await fetch(`/api/expenses/categories${path}`, {
        method,
        ...(body
          ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
          : {}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(data?.error ?? "Bajarilmadi"); return false; }
      onChanged();
      return true;
    } catch {
      setErr("Serverga ulanib bo'lmadi"); return false;
    } finally { setBusy(null); }
  }

  async function qoshish() {
    const nom = yangi.trim();
    if (!nom) return;
    if (await so_rov("POST", "", { name: nom }, "add")) setYangi("");
  }

  async function saqlash(id: string) {
    const nom = editNom.trim();
    if (!nom) return;
    if (await so_rov("PATCH", `/${id}`, { name: nom }, id)) setEditId(null);
  }

  async function ochirish(id: string) {
    if (await so_rov("DELETE", `/${id}`, undefined, id)) setTasdiq(null);
  }

  return (
    <Modal open={open} onClose={onClose} title="Xarajat kategoriyalari"
      subtitle="Ro'yxatni markaz o'zi boshqaradi"
      footer={
        <button onClick={onClose}
          className="flex-1 h-9 text-[13px] font-semibold rounded-xl
            border border-neutral-200 dark:border-neutral-700
            text-neutral-600 dark:text-neutral-300
            hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
          Yopish
        </button>
      }>
      <div className="space-y-3">
        {/* Qo'shish TEPADA — oyna aynan shu uchun ochiladi. */}
        <div className="flex items-center gap-2">
          <Input value={yangi} placeholder="Yangi kategoriya nomi"
            onChange={(e) => { setYangi(e.target.value); setErr(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") qoshish(); }}
            className="h-9 text-sm" />
          <button onClick={qoshish} disabled={!yangi.trim() || busy !== null}
            className="flex items-center gap-1.5 shrink-0 text-[12.5px] font-semibold px-3 h-9 rounded-xl
              bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors">
            {busy === "add" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Qo&apos;shish
          </button>
        </div>

        {err && (
          <p className="text-[12px] text-red-600 dark:text-red-400 flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />{err}
          </p>
        )}

        <ul className="divide-y divide-neutral-100 dark:divide-neutral-800 rounded-xl
          border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center gap-2 px-3 py-2">
              {editId === c.id ? (
                <>
                  <Input value={editNom} autoFocus
                    onChange={(e) => setEditNom(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") saqlash(c.id); }}
                    className="h-8 text-[13px]" />
                  <button onClick={() => saqlash(c.id)} disabled={busy !== null}
                    className="shrink-0 p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30">
                    {busy === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button onClick={() => setEditId(null)}
                    className="shrink-0 p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : tasdiq === c.id ? (
                <>
                  <span className="flex-1 text-[12px] text-neutral-600 dark:text-neutral-300">
                    O&apos;chirilsinmi? Yozilgan xarajatlar joyida qoladi.
                  </span>
                  <button onClick={() => ochirish(c.id)} disabled={busy !== null}
                    className="shrink-0 text-[12px] font-semibold px-2.5 h-8 rounded-lg bg-red-600 hover:bg-red-700 text-white">
                    {busy === c.id ? "..." : "Ha"}
                  </button>
                  <button onClick={() => setTasdiq(null)}
                    className="shrink-0 text-[12px] font-semibold px-2.5 h-8 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                    Yo&apos;q
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-[13px] text-neutral-800 dark:text-neutral-200 truncate">
                    {c.name}
                  </span>
                  <button onClick={() => { setEditId(c.id); setEditNom(c.name); setErr(""); }}
                    title="Nomini o'zgartirish"
                    className="shrink-0 p-1.5 rounded-lg text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => { setTasdiq(c.id); setErr(""); }} title="O'chirish"
                    className="shrink-0 p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>

        <p className="text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
          Nomini o&apos;zgartirsangiz — shu kategoriyadagi eski xarajatlar ham
          yangi nomga o&apos;tadi. O&apos;chirsangiz — xarajatlar
          o&apos;chmaydi, faqat ro&apos;yxatdan chiqadi va filtrda
          ko&apos;rinishda davom etadi.
        </p>
      </div>
    </Modal>
  );
}
