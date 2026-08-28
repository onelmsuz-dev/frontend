"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { fetcher } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import { fmtRelative } from "@/lib/date-uz";
import { useMe, hasPerm } from "@/lib/hooks/useMe";
import {
  Trash2, RotateCcw, Loader2, AlertCircle, ShieldCheck,
  GraduationCap, Users, BookOpen, DoorOpen, MapPin, Phone, UserCog,
} from "lucide-react";

/**
 * SOZLAMALAR → KORZINKA.
 *
 * O'chirilgan yozuv butunlay yo'qolmaydi — nusxasi shu yerda turadi va
 * to'liq tiklanadi: o'quvchi a'zoliklari, davomati va qarz jurnali bilan,
 * guruh esa darslari va o'qituvchi tarixi bilan.
 *
 * Tiklashdan OLDIN nima qaytishi ko'rsatiladi. "Tikla" tugmasini bosgan
 * odam nima bo'lishini oldindan bilishi kerak — ayniqsa boshqa yozuvlar
 * ham birga qaytadigan bo'lsa.
 */

interface TrashRow {
  id: string; entity: string; entityLabel: string; entityId: string;
  title: string; subtitle: string; rowCount: number;
  actorName: string; deletedAt: string;
}

const ICON: Record<string, typeof Users> = {
  Student: GraduationCap, Group: Users, Course: BookOpen,
  Teacher: UserCog, Room: DoorOpen, Branch: MapPin, Lead: Phone,
};

const FILTERS = [
  { v: "",         l: "Hammasi" },
  { v: "Student",  l: "O'quvchilar" },
  { v: "Group",    l: "Guruhlar" },
  { v: "Course",   l: "Kurslar" },
  { v: "Teacher",  l: "O'qituvchilar" },
  { v: "Room",     l: "Xonalar" },
  { v: "Branch",   l: "Filiallar" },
  { v: "Lead",     l: "Lidlar" },
];

export function TrashSection() {
  const { me } = useMe();
  const [entity, setEntity] = useState("");
  const url = `/api/trash?limit=50${entity ? `&entity=${entity}` : ""}`;
  const { data, error, isLoading } = useSWR<{ items: TrashRow[] }>(url, fetcher);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");

  const canRestore = hasPerm(me?.permissions, "trash.restore");
  const canPurge   = hasPerm(me?.permissions, "trash.purge");
  const items = data?.items ?? [];

  async function restore(row: TrashRow) {
    setBusy(row.id); setMsg(null);
    try {
      // Avval nima qaytishini so'raymiz — boshqa yozuvlar birga qaytsa
      // foydalanuvchi buni tasdiqlashi kerak.
      const pre = await fetcher(`/api/trash/${row.id}/preflight`);
      if (pre.chain?.length > 0) {
        const names = pre.chain.map((c: any) => `${c.entityLabel}: ${c.title}`).join(", ");
        if (!confirm(
          `"${row.title}" bilan birga quyidagilar ham tiklanadi:\n\n${names}\n\n` +
          `Ular bu yozuv uchun zarur. Davom etamizmi?`)) {
          setBusy(null); return;
        }
      }
      const r = await fetch(`/api/trash/${row.id}/restore`, { method: "POST" });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error ?? "Tiklab bo'lmadi");
      setMsg({ ok: true, text: `"${row.title}" tiklandi — ${j.restored} ta yozuv qaytdi` });
      mutate(url);
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally { setBusy(null); }
  }

  async function purge(row: TrashRow) {
    setBusy(row.id); setMsg(null);
    try {
      const r = await fetch(`/api/trash/${row.id}`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirm: confirmText }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error ?? "O'chirib bo'lmadi");
      setMsg({ ok: true, text: `"${row.title}" butunlay o'chirildi` });
      setConfirmId(null); setConfirmText("");
      mutate(url);
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally { setBusy(null); }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <header className="flex items-center gap-3 px-4 sm:px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="h-9 w-9 shrink-0 rounded-xl bg-neutral-100 dark:bg-neutral-800 grid place-items-center">
            <Trash2 className="h-4.5 w-4.5 text-neutral-600 dark:text-neutral-300" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Korzinka</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
              O&apos;chirilganlar 30 kun saqlanadi
            </p>
          </div>
        </header>

        <div className="px-4 sm:px-5 pt-3 -mx-0 overflow-x-auto">
          <div className="flex gap-1.5 pb-2 w-max">
            {FILTERS.map((f) => (
              <button key={f.v} onClick={() => setEntity(f.v)}
                className={cn("shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  entity === f.v
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700")}>
                {f.l}
              </button>
            ))}
          </div>
        </div>

        {msg && (
          <div className={cn("mx-4 sm:mx-5 mb-2 rounded-xl px-3 py-2 text-xs",
            msg.ok ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                   : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300")}>
            {msg.text}
          </div>
        )}

        <div className="px-4 sm:px-5 pb-3">
          {isLoading ? (
            <ul className="space-y-2 py-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="h-14 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
              ))}
            </ul>
          ) : error ? (
            <div className="flex items-start gap-2.5 py-6 text-sm text-neutral-600 dark:text-neutral-300">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 text-amber-500 mt-px" />
              <p>Korzinkani yuklab bo&apos;lmadi</p>
            </div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center">
              <div className="mx-auto h-11 w-11 rounded-2xl bg-neutral-100 dark:bg-neutral-800 grid place-items-center">
                <Trash2 className="h-5 w-5 text-neutral-400" />
              </div>
              <p className="mt-3 text-sm font-medium text-neutral-700 dark:text-neutral-200">
                Korzinka bo&apos;sh
              </p>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                O&apos;chirilgan yozuvlar shu yerda 30 kun turadi.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {items.map((row) => {
                const Icon = ICON[row.entity] ?? Trash2;
                const confirming = confirmId === row.id;
                return (
                  <li key={row.id} className="py-3">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 shrink-0 rounded-xl bg-neutral-100 dark:bg-neutral-800 grid place-items-center">
                        <Icon className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                          {row.title}
                        </p>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                          {row.entityLabel}
                          {row.subtitle && ` · ${row.subtitle}`}
                          {` · ${row.rowCount} ta yozuv`}
                        </p>
                        <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
                          {row.actorName || "Noma'lum"} · {fmtRelative(row.deletedAt)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {canRestore && (
                          <button onClick={() => restore(row)} disabled={busy === row.id}
                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium
                                       bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200
                                       hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors
                                       disabled:opacity-50">
                            {busy === row.id
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : <RotateCcw className="h-3 w-3" />}
                            Tikla
                          </button>
                        )}
                        {canPurge && !confirming && (
                          <button onClick={() => { setConfirmId(row.id); setConfirmText(""); }}
                            className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                            title="Butunlay o'chirish">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Butunlay o'chirish — nomni QO'LDA yozib tasdiqlash.
                        Bitta noto'g'ri bosish ma'lumotni abadiy yo'qotmasin. */}
                    {confirming && (
                      <div className="mt-2 ml-12 rounded-xl bg-red-50 dark:bg-red-900/20 p-3">
                        <p className="text-[11px] text-red-700 dark:text-red-300 mb-2">
                          Bu amalni <strong>qaytarib bo&apos;lmaydi</strong>. Tasdiqlash uchun
                          nomni aynan yozing: <strong>{row.title}</strong>
                        </p>
                        <div className="flex gap-1.5">
                          <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)}
                            placeholder={row.title}
                            className="flex-1 min-w-0 rounded-lg border border-red-200 dark:border-red-800
                                       bg-white dark:bg-neutral-900 px-2.5 py-1.5 text-xs
                                       text-neutral-900 dark:text-neutral-100 focus:outline-none" />
                          <button onClick={() => purge(row)}
                            disabled={busy === row.id || confirmText.trim() !== row.title.trim()}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white
                                       hover:bg-red-700 disabled:opacity-40 transition-colors">
                            O&apos;chirish
                          </button>
                          <button onClick={() => { setConfirmId(null); setConfirmText(""); }}
                            className="rounded-lg px-2.5 py-1.5 text-xs text-neutral-600 dark:text-neutral-300
                                       hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                            Bekor
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="flex items-start gap-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 px-4 py-3">
        <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-px" />
        <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
          Tiklanganda yozuv{" "}
          <span className="font-medium text-neutral-700 dark:text-neutral-300">to&apos;liq</span>{" "}
          qaytadi —
          o&apos;quvchi guruh a&apos;zoliklari, davomati va qarz jurnali bilan; guruh esa darslari va
          o&apos;qituvchi tarixi bilan. Agar tiklash uchun boshqa yozuv ham kerak bo&apos;lsa
          (masalan guruhning kursi), u avtomatik birga qaytariladi.
        </p>
      </div>
    </div>
  );
}
