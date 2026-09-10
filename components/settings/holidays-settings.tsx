"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { CalendarOff, Plus, Trash2, Download, Loader2, Info } from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import { formatUzDate } from "@/lib/date-uz";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * BAYRAM KUNLARI — "bu kuni dars yo'q".
 *
 * Jadval va uni o'qiydigan mantiq allaqachon bor edi, lekin KIRITISH yo'li
 * hech qachon qurilmagan: prodda 0 ta yozuv turardi. Natijada bayram kuni
 * oddiy dars deb sanalardi.
 *
 * Bu pulga tegadi: dars soni "faqat qatnashgan darslar uchun" hisobining
 * maxraji. 240 000 so'mlik kursda bir dars ~18 500 so'm, o'quv yilida esa
 * 2-3 ta bayram dars kuniga tushadi.
 */

const NOM = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];

interface Holiday {
  id: string;
  date: string;
  name: string;
  groupId: string | null;
  group?: { id: string; name: string } | null;
}

export function HolidaysSettings({ canManage }: { canManage: boolean }) {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const { data, isLoading, mutate } = useSWR<Holiday[]>(
    `/api/holidays?from=${year}-01-01&to=${year}-12-31`, fetcher);

  const [form, setForm] = useState({ date: "", name: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const holidays = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  async function add() {
    if (!form.date || form.name.trim().length < 2) {
      setErr("Sana va nomni to'ldiring"); return;
    }
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: form.date, name: form.name.trim() }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setErr(d?.error ?? "Qo'shib bo'lmadi"); return; }
      setForm({ date: "", name: "" });
      mutate();
    } catch { setErr("Serverga ulanib bo'lmadi"); }
    finally { setBusy(false); }
  }

  async function seed() {
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/holidays/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setErr(d?.error ?? "Yuklab bo'lmadi"); return; }
      mutate();
    } catch { setErr("Serverga ulanib bo'lmadi"); }
    finally { setBusy(false); }
  }

  async function remove(id: string) {
    setBusy(true); setErr("");
    try {
      const r = await fetch(`/api/holidays/${id}`, { method: "DELETE" });
      if (!r.ok) { const d = await r.json().catch(() => ({})); setErr(d?.error ?? "O'chirib bo'lmadi"); return; }
      mutate();
    } catch { setErr("Serverga ulanib bo'lmadi"); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-4">
      <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center shrink-0">
            <CalendarOff className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="flex-1">
            <p className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100">
              Bayram kunlari
            </p>
            <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5">
              Bu kunlarda dars o&apos;tilmaydi. Oyning dars soni shunga qarab
              kamayadi — o&apos;quvchi chiqarilganda &quot;necha darsga
              kelgan&quot; hisobi ham shundan chiqadi.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <Button size="sm" variant="outline" className="h-8 text-xs"
            onClick={() => setYear((y) => y - 1)}>←</Button>
          <span className="text-[15px] font-bold tabular-nums px-2">{year}</span>
          <Button size="sm" variant="outline" className="h-8 text-xs"
            onClick={() => setYear((y) => y + 1)}>→</Button>
          <span className="text-[12px] text-neutral-400 ml-2">
            {isLoading ? "Yuklanmoqda..." : `${holidays.length} ta kun`}
          </span>
          {canManage && (
            <Button size="sm" disabled={busy} onClick={seed}
              className="ml-auto h-8 text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700">
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              O&apos;zbekiston bayramlari
            </Button>
          )}
        </div>

        {canManage && (
          <div className="flex flex-col sm:flex-row gap-2 mt-3">
            <Input type="date" value={form.date}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              className="h-9 text-sm sm:w-44" />
            <Input placeholder="Nomi (masalan: Ta'til)" value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="h-9 text-sm flex-1" />
            <Button size="sm" disabled={busy} onClick={add} className="h-9 text-xs gap-1.5">
              <Plus className="w-3.5 h-3.5" />{" "}Qo&apos;shish
            </Button>
          </div>
        )}

        {err && <p className="text-[12px] text-red-600 dark:text-red-400 mt-2">{err}</p>}

        <p className="text-[11px] text-neutral-400 mt-3 flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 shrink-0 mt-px" />
          Ramazon va Qurbon hayiti oy taqvimiga bog&apos;liq — har yili
          siljiydi, shuning uchun avtomatik yuklanmaydi. Ularni qo&apos;lda
          qo&apos;shing.
        </p>
      </div>

      <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl divide-y divide-white/60 dark:divide-white/10">
        {holidays.length === 0 && !isLoading && (
          <p className="text-[13px] text-neutral-400 p-5 text-center">
            {year}-yil uchun bayram kiritilmagan
          </p>
        )}
        {holidays.map((h) => {
          const d = new Date(h.date);
          return (
            <div key={h.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-neutral-800 dark:text-neutral-200 truncate">
                  {h.name}
                </p>
                <p className="text-[11px] text-neutral-400">
                  {formatUzDate(h.date)} · {NOM[d.getUTCDay()]}
                  {h.group && <>{" "}· faqat {h.group.name}</>}
                </p>
              </div>
              {canManage && (
                <button onClick={() => remove(h.id)} disabled={busy}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400
                    hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
