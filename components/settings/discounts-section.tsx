"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { fetcher } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import { formatUzDate } from "@/lib/date-uz";
import { useMe, hasPerm } from "@/lib/hooks/useMe";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Percent, Plus, X, Loader2, Users, BookOpen, UserCheck, Globe,
  Power, Trash2, Info, AlertCircle, Gift,
} from "lucide-react";

/**
 * SOZLAMALAR → CHEGIRMALAR.
 *
 * Markaz egasi chegirma qoidalarini shu yerda yaratadi. Ikki xil narsa bor
 * va ular ATAYLAB ajratilgan:
 *
 *   • QOIDA — kelajakdagi hisoblarga ta'sir qiladi ("bundan buyon hammaga 10%")
 *   • BIR MARTALIK — mavjud qarzni kamaytiradi ("shu o'quvchidan 100 000 tushiring")
 *
 * Ikkalasini bir tugmaga qo'shish eng ko'p uchraydigan chalkashlik bo'lardi:
 * markaz "chegirma berdim" deb o'ylab, o'tgan oyning qarzi o'zgarmaganini
 * ko'rib hayron bo'lardi.
 */

interface Discount {
  id: string; name: string; type: "FOIZ" | "SUMMA"; value: number;
  scope: "HAMMA" | "GURUH" | "KURS" | "TANLANGAN";
  groupId: string | null; courseId: string | null;
  groupName: string | null; courseName: string | null;
  startsAt: string | null; endsAt: string | null;
  isActive: boolean; liveNow: boolean; note: string;
  studentCount: number; createdByName: string; createdAt: string;
}

const SCOPE_UI: Record<string, { label: string; icon: typeof Globe }> = {
  HAMMA:     { label: "Barcha o'quvchilar", icon: Globe },
  GURUH:     { label: "Guruh",              icon: Users },
  KURS:      { label: "Kurs",               icon: BookOpen },
  TANLANGAN: { label: "Tanlangan",          icon: UserCheck },
};

const fmt = (v: number) => new Intl.NumberFormat("uz-UZ").format(v);

export function DiscountsSection() {
  const { me } = useMe();
  const { data, error, isLoading } = useSWR<Discount[]>("/api/discounts", fetcher);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const canManage = hasPerm(me?.permissions, "discounts.manage");
  const items = data ?? [];

  async function toggle(d: Discount) {
    setBusy(d.id); setMsg(null);
    try {
      const r = await fetch(`/api/discounts/${d.id}`, {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({ isActive: !d.isActive }),
      });
      if (!r.ok) throw new Error((await r.json())?.error ?? "Saqlab bo'lmadi");
      mutate("/api/discounts");
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
    finally { setBusy(null); }
  }

  async function remove(d: Discount) {
    if (!confirm(`"${d.name}" chegirmasi o'chirilsinmi?\n\n` +
                 `Allaqachon yozilgan qarzlar o'zgarmaydi — faqat bundan ` +
                 `keyingi hisoblarga ta'sir qilmay qo'yadi.`)) return;
    setBusy(d.id); setMsg(null);
    try {
      const r = await fetch(`/api/discounts/${d.id}`, { method: "DELETE" });
      if (!r.ok) throw new Error((await r.json())?.error ?? "O'chirib bo'lmadi");
      setMsg({ ok: true, text: `"${d.name}" o'chirildi` });
      mutate("/api/discounts");
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
    finally { setBusy(null); }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <header className="flex items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 shrink-0 rounded-xl bg-neutral-100 dark:bg-neutral-800 grid place-items-center">
              <Percent className="h-4.5 w-4.5 text-neutral-600 dark:text-neutral-300" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Chegirmalar
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                Bundan keyingi hisoblarga qo&apos;llanadi
              </p>
            </div>
          </div>
          {canManage && (
            <button onClick={() => setOpen(true)}
              className="inline-flex items-center gap-1 shrink-0 rounded-xl bg-neutral-900 dark:bg-white
                         px-3 py-2 text-xs font-medium text-white dark:text-neutral-900
                         hover:opacity-90 transition-opacity">
              <Plus className="h-3.5 w-3.5" /> Yangi
            </button>
          )}
        </header>

        {msg && (
          <div className={cn("mx-4 sm:mx-5 mt-3 rounded-xl px-3 py-2 text-xs",
            msg.ok ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                   : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300")}>
            {msg.text}
          </div>
        )}

        <div className="px-4 sm:px-5 py-3">
          {isLoading ? (
            <ul className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <li key={i} className="h-16 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
              ))}
            </ul>
          ) : error ? (
            <div className="flex items-start gap-2.5 py-6 text-sm text-neutral-600 dark:text-neutral-300">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 text-amber-500 mt-px" />
              <p>Chegirmalarni yuklab bo&apos;lmadi</p>
            </div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center">
              <div className="mx-auto h-11 w-11 rounded-2xl bg-neutral-100 dark:bg-neutral-800 grid place-items-center">
                <Percent className="h-5 w-5 text-neutral-400" />
              </div>
              <p className="mt-3 text-sm font-medium text-neutral-700 dark:text-neutral-200">
                Chegirma yo&apos;q
              </p>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                Barcha o&apos;quvchilarga, bitta guruhga yoki tanlanganlarga
                foiz yoki aniq summa chegirma bering.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {items.map((d) => {
                const S = SCOPE_UI[d.scope] ?? SCOPE_UI.HAMMA;
                const Icon = S.icon;
                const target = d.scope === "GURUH" ? d.groupName
                  : d.scope === "KURS" ? d.courseName
                  : d.scope === "TANLANGAN" ? `${d.studentCount} ta o'quvchi`
                  : S.label;
                return (
                  <li key={d.id} className="py-3 flex items-start gap-3">
                    <div className={cn(
                      "h-9 w-9 shrink-0 rounded-xl grid place-items-center",
                      d.liveNow
                        ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400",
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {d.name}
                        </span>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {d.type === "FOIZ" ? `−${d.value}%` : `−${fmt(d.value)} so'm`}
                        </span>
                        {!d.isActive && (
                          <span className="rounded-md bg-neutral-100 dark:bg-neutral-800 px-1.5 py-px
                                           text-[10px] font-medium text-neutral-500 dark:text-neutral-400">
                            O&apos;chiq
                          </span>
                        )}
                        {d.isActive && !d.liveNow && (
                          <span className="rounded-md bg-amber-50 dark:bg-amber-900/30 px-1.5 py-px
                                           text-[10px] font-medium text-amber-700 dark:text-amber-300">
                            Muddatdan tashqarida
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {target}
                        {(d.startsAt || d.endsAt) && (
                          <> · {d.startsAt ? formatUzDate(d.startsAt) : "boshidan"}
                            {" — "}{d.endsAt ? formatUzDate(d.endsAt) : "muddatsiz"}</>
                        )}
                      </p>
                      {d.note && (
                        <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5 truncate">
                          {d.note}
                        </p>
                      )}
                    </div>

                    {canManage && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => toggle(d)} disabled={busy === d.id}
                          title={d.isActive ? "O'chirish" : "Yoqish"}
                          className={cn("rounded-lg p-1.5 transition-colors",
                            d.isActive
                              ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                              : "text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800")}>
                          {busy === d.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Power className="h-3.5 w-3.5" />}
                        </button>
                        <button onClick={() => remove(d)} disabled={busy === d.id}
                          title="O'chirish"
                          className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Ikki eng ko'p uchraydigan chalkashlik oldindan aytiladi. */}
      <div className="flex items-start gap-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 px-4 py-3">
        <Info className="h-4 w-4 shrink-0 text-neutral-400 mt-px" />
        <div className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400 space-y-1">
          <p>
            Chegirma <span className="font-medium text-neutral-700 dark:text-neutral-300">
            bundan keyingi</span> hisoblarga qo&apos;llanadi — allaqachon yozilgan
            qarzlar o&apos;zgarmaydi. Mavjud qarzni kamaytirish uchun o&apos;quvchi
            sahifasidagi <span className="font-medium">«Bir martalik chegirma»</span> dan
            foydalaning.
          </p>
          <p>
            Bir o&apos;quvchiga bir nechta chegirma to&apos;g&apos;ri kelsa —{" "}
            <span className="font-medium text-neutral-700 dark:text-neutral-300">
            eng kattasi</span> qo&apos;llanadi, ular qo&apos;shilmaydi.
          </p>
        </div>
      </div>

      {open && <CreateModal onClose={() => setOpen(false)}
        onDone={(name) => { setMsg({ ok: true, text: `"${name}" yaratildi` }); mutate("/api/discounts"); }} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function CreateModal({ onClose, onDone }: { onClose: () => void; onDone: (n: string) => void }) {
  const { data: groups }  = useSWR<any[]>("/api/groups", fetcher);
  const { data: courses } = useSWR<any[]>("/api/courses", fetcher);
  const { data: students } = useSWR<any>("/api/students?limit=1000", fetcher);

  const [name, setName]   = useState("");
  const [type, setType]   = useState<"FOIZ" | "SUMMA">("FOIZ");
  const [value, setValue] = useState("");
  const [scope, setScope] = useState<"HAMMA" | "GURUH" | "KURS" | "TANLANGAN">("HAMMA");
  const [groupId, setGroupId]   = useState("");
  const [courseId, setCourseId] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt]     = useState("");
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const list = Array.isArray(students) ? students : (students?.items ?? []);
  const filtered = q.trim()
    ? list.filter((s: any) => s.name?.toLowerCase().includes(q.trim().toLowerCase()))
    : list.slice(0, 40);

  async function save() {
    setSaving(true); setErr("");
    try {
      const r = await fetch("/api/discounts", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name, type, value: Number(value), scope,
          ...(scope === "GURUH" ? { groupId } : {}),
          ...(scope === "KURS"  ? { courseId } : {}),
          ...(scope === "TANLANGAN" ? { studentIds: picked } : {}),
          ...(startsAt ? { startsAt } : {}),
          ...(endsAt   ? { endsAt }   : {}),
          ...(noteText ? { note: noteText } : {}),
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error ?? "Saqlab bo'lmadi");
      onDone(name); onClose();
    } catch (e) { setErr((e as Error).message); }
    finally { setSaving(false); }
  }

  const valid = name.trim() && Number(value) > 0
    && (scope !== "GURUH" || groupId) && (scope !== "KURS" || courseId)
    && (scope !== "TANLANGAN" || picked.length > 0);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
         onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl
                   bg-white dark:bg-neutral-900 shadow-xl">
        <header className="sticky top-0 flex items-center justify-between gap-3 px-5 py-4
                           border-b border-neutral-100 dark:border-neutral-800
                           bg-white dark:bg-neutral-900">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Yangi chegirma
          </h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800">
            <X className="h-4 w-4 text-neutral-500" />
          </button>
        </header>

        <div className="p-5 space-y-4">
          <Field label="Nomi" required>
            <input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Aka-uka chegirmasi"
              className={inputCls} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Turi">
              <div className="flex gap-1.5">
                {(["FOIZ", "SUMMA"] as const).map((t) => (
                  <button key={t} onClick={() => setType(t)}
                    className={cn("flex-1 rounded-xl px-3 py-2 text-xs font-medium transition-colors",
                      type === t
                        ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300")}>
                    {t === "FOIZ" ? "Foiz %" : "So'm"}
                  </button>
                ))}
              </div>
            </Field>
            <Field label={type === "FOIZ" ? "Necha foiz" : "Necha so'm"} required>
              <input value={value} onChange={(e) => setValue(e.target.value.replace(/[^\d]/g, ""))}
                inputMode="numeric" placeholder={type === "FOIZ" ? "15" : "100000"}
                className={inputCls} />
            </Field>
          </div>

          <Field label="Kimga">
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(SCOPE_UI) as (keyof typeof SCOPE_UI)[]).map((s) => {
                const Icon = SCOPE_UI[s].icon;
                return (
                  <button key={s} onClick={() => setScope(s as any)}
                    className={cn("flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors",
                      scope === s
                        ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300")}>
                    <Icon className="h-3.5 w-3.5" /> {SCOPE_UI[s].label}
                  </button>
                );
              })}
            </div>
          </Field>

          {scope === "GURUH" && (
            <Field label="Guruh" required>
              <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className={inputCls}>
                <option value="">Tanlang…</option>
                {(groups ?? []).map((g: any) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </Field>
          )}

          {scope === "KURS" && (
            <Field label="Kurs" required>
              <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className={inputCls}>
                <option value="">Tanlang…</option>
                {(courses ?? []).map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
          )}

          {scope === "TANLANGAN" && (
            <Field label={`O'quvchilar${picked.length ? ` — ${picked.length} ta tanlandi` : ""}`} required>
              <input value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="Ism bo'yicha qidiring…" className={cn(inputCls, "mb-2")} />
              <div className="max-h-52 overflow-y-auto rounded-xl border border-neutral-200 dark:border-neutral-700">
                {filtered.length === 0 ? (
                  <p className="p-3 text-xs text-neutral-400">Topilmadi</p>
                ) : filtered.map((s: any) => {
                  const on = picked.includes(s.id);
                  return (
                    <button key={s.id}
                      onClick={() => setPicked((p) =>
                        on ? p.filter((x) => x !== s.id) : [...p, s.id])}
                      className={cn("w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition-colors",
                        on ? "bg-neutral-100 dark:bg-neutral-800"
                           : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50")}>
                      <span className={cn("h-4 w-4 shrink-0 rounded border grid place-items-center",
                        on ? "bg-neutral-900 border-neutral-900 dark:bg-white dark:border-white"
                           : "border-neutral-300 dark:border-neutral-600")}>
                        {on && <span className="text-white dark:text-neutral-900 text-[9px]">✓</span>}
                      </span>
                      <span className="truncate text-neutral-700 dark:text-neutral-200">{s.name}</span>
                    </button>
                  );
                })}
              </div>
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Boshlanishi">
              <DatePicker value={startsAt} onChange={setStartsAt} placeholder="Darhol" />
            </Field>
            <Field label="Tugashi">
              <DatePicker value={endsAt} onChange={setEndsAt} placeholder="Muddatsiz" />
            </Field>
          </div>

          <Field label="Izoh">
            <input value={noteText} onChange={(e) => setNoteText(e.target.value)}
              placeholder="Nima uchun berilgani" className={inputCls} />
          </Field>

          {err && (
            <p className="rounded-xl bg-red-50 dark:bg-red-900/30 px-3 py-2 text-xs
                          text-red-700 dark:text-red-300">{err}</p>
          )}

          <div className="flex items-start gap-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 px-3 py-2.5">
            <Gift className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400 mt-px" />
            <p className="text-[11px] leading-relaxed text-neutral-700 dark:text-neutral-300">
              Chegirma <span className="font-medium">bundan keyingi</span> hisoblarga
              qo&apos;llanadi. Bugungacha yozilgan qarzlar o&apos;zgarmaydi.
            </p>
          </div>
        </div>

        <footer className="sticky bottom-0 flex gap-2 px-5 py-4 border-t
                           border-neutral-100 dark:border-neutral-800
                           bg-white dark:bg-neutral-900">
          <button onClick={onClose}
            className="flex-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 px-4 py-2.5
                       text-sm font-medium text-neutral-700 dark:text-neutral-200">
            Bekor
          </button>
          <button onClick={save} disabled={!valid || saving}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl
                       bg-neutral-900 dark:bg-white px-4 py-2.5 text-sm font-medium
                       text-white dark:text-neutral-900 disabled:opacity-40">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Saqlash
          </button>
        </footer>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-neutral-200 dark:border-neutral-700 " +
  "bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 " +
  "placeholder:text-neutral-400 focus:outline-none focus:ring-2 " +
  "focus:ring-neutral-900/10 dark:focus:ring-white/10";

function Field({ label, required, children }:
  { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400
                        mb-1.5 uppercase tracking-wide">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
