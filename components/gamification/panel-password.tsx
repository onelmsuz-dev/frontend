"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Lock, Eye, EyeOff, Check, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";

/**
 * O'quvchi o'z parolini o'zgartirishi.
 *
 * `/api/me/password` har qanday rol uchun ishlaydi (AuthService STUDENT
 * holatini alohida qayta ishlaydi) — panelda shu imkoniyat yo'q edi, ya'ni
 * markaz bergan boshlang'ich parol bilan qolib ketilardi.
 */
export function PasswordCard() {
  const [open, setOpen] = useState(false);
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (next.length < 6) { setMsg({ type: "err", text: "Yangi parol kamida 6 ta belgi bo'lishi kerak" }); return; }
    if (next !== confirm) { setMsg({ type: "err", text: "Yangi parollar mos emas" }); return; }

    setBusy(true);
    try {
      const res = await fetch("/api/me/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: cur, newPassword: next }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setMsg({ type: "err", text: d?.error ?? "Parolni o'zgartirib bo'lmadi" }); return; }
      setMsg({ type: "ok", text: "Parol o'zgartirildi" });
      setCur(""); setNext(""); setConfirm("");
      setTimeout(() => { setOpen(false); setMsg(null); }, 1600);
    } catch {
      setMsg({ type: "err", text: "Serverga ulanib bo'lmadi" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-5 py-3.5 hover:bg-white/60 dark:hover:bg-white/10 transition-colors">
        <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
          <Lock className="w-3.5 h-3.5 text-neutral-500" />
        </div>
        <h3 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100 flex-1 text-left">
          Parolni o&apos;zgartirish
        </h3>
        <span className="text-[12px] text-neutral-400">{open ? "Yopish" : "Ochish"}</span>
      </button>

      {open && (
        <form onSubmit={submit} className="p-4 pt-0 space-y-3 border-t border-white/50 dark:border-white/10">
          <FormField label="Joriy parol" required>
            <Input type={show ? "text" : "password"} value={cur} autoComplete="current-password"
              onChange={e => setCur(e.target.value)} className="h-10" />
          </FormField>

          <FormField label="Yangi parol" required hint="Kamida 6 ta belgi">
            <div className="relative">
              <Input type={show ? "text" : "password"} value={next} autoComplete="new-password"
                onChange={e => setNext(e.target.value)} className="h-10 pr-9" />
              <button type="button" onClick={() => setShow(s => !s)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </FormField>

          <FormField label="Yangi parolni takrorlang" required>
            <Input type={show ? "text" : "password"} value={confirm} autoComplete="new-password"
              onChange={e => setConfirm(e.target.value)} className="h-10" />
          </FormField>

          {msg && (
            <div className={cn("flex items-center gap-2 text-[12px] px-3 py-2 rounded-lg",
              msg.type === "ok"
                ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300")}>
              {msg.type === "ok" ? <Check className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
              {msg.text}
            </div>
          )}

          <button type="submit" disabled={busy}
            className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-[13px] font-semibold transition-colors">
            {busy ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </form>
      )}
    </div>
  );
}
