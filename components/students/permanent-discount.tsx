"use client";

import { useState } from "react";
import useSWR from "swr";
import { BadgePercent, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { DatePicker } from "@/components/ui/date-picker";
import { fetcher } from "@/lib/fetcher";
import { formatUzDate } from "@/lib/date-uz";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/money";

/**
 * DOIMIY CHEGIRMA — o'quvchi kartochkasidan (2026-10-03).
 *
 * Sozlamalardagi qoidaning o'zi (`POST /api/discounts`, qamrov TANLANGAN),
 * faqat yo'li qisqa: markazlar ijtimoiy chegirmani shu paytgacha "bir
 * martalik" bilan har oy qo'lda berib kelgan, bola esa oy davomida
 * qarzdorlar ro'yxatida turardi. Qoida kelajakdagi hisoblarga o'zi
 * qo'llanadi, mavjud qarzga tegmaydi (buning uchun bir martalik bor).
 *
 * SABAB TURI "Ijtimoiy" — hech kim foyda ko'rmaydi: o'qituvchi foiz
 * asosidan ayiriladi (savol so'ralmaydi), o'quvchi boshiga maoshlarda
 * sanalmaydi, hisobotda alohida ma'lumot qatori. Boshqa turlarda
 * sozlamalardagi savol shu yerda ham so'raladi.
 */
export type DiscountKind = "IJTIMOIY" | "KELISHUV" | "AKSIYA" | "BOSHQA";
export const KIND_LABEL: Record<DiscountKind, string> = {
  IJTIMOIY: "Ijtimoiy", KELISHUV: "Kelishuv", AKSIYA: "Aksiya", BOSHQA: "Boshqa",
};
const KIND_OPTS = (Object.keys(KIND_LABEL) as DiscountKind[]).map((k) => ({ value: k, label: KIND_LABEL[k] }));

interface Rule {
  id: string; name: string; kind: DiscountKind; type: "FOIZ" | "SUMMA"; value: number;
  startsAt: string | null; endsAt: string | null; isActive: boolean; liveNow: boolean;
  groupIds: string[]; affectsTeacherSalary: boolean; note: string;
}

const fmt = (v: number) => formatNumber(v);
const inputCls = "w-full h-9 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 text-[13px] outline-none focus:border-indigo-400";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">{label}</p>
      {children}
      {hint && <p className="text-[11px] text-neutral-400 mt-1">{hint}</p>}
    </div>
  );
}

export function PermanentDiscount({ studentId, studentName, groups = [], onDone }: {
  studentId: string; studentName: string;
  /** O'quvchining faol guruhlari — bittadan ko'p bo'lsa tanlov chiqadi. */
  groups?: { groupId: string; name: string }[];
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { data: rules, mutate } = useSWR<Rule[]>(
    open ? `/api/discounts/for-student/${studentId}/rules` : null, fetcher);

  const [kind, setKind] = useState<DiscountKind>("IJTIMOIY");
  const [type, setType] = useState<"FOIZ" | "SUMMA">("FOIZ");
  const [value, setValue] = useState("100");
  const [groupId, setGroupId] = useState("");       // "" — barcha guruhlariga
  const [endsAt, setEndsAt] = useState("");
  const [maoshgaTasir, setMaoshgaTasir] = useState(true);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [qollandi, setQollandi] = useState<string | null>(null);

  const n = Number(value) || 0;
  const valid = n > 0 && (type !== "FOIZ" || n <= 100);
  const groupNames = new Map(groups.map((g) => [g.groupId, g.name]));

  function close() {
    setOpen(false); setErr(""); setQollandi(null); setKind("IJTIMOIY"); setType("FOIZ"); setValue("100");
    setGroupId(""); setEndsAt(""); setMaoshgaTasir(true); setNote("");
  }

  async function save() {
    setSaving(true); setErr("");
    try {
      const r = await fetch("/api/discounts", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: `${KIND_LABEL[kind]} — ${studentName}`,
          type, value: n, scope: "TANLANGAN", kind,
          studentIds: [studentId],
          groupIds: groupId ? [groupId] : [],
          ...(endsAt ? { endsAt } : {}),
          note: note.trim(),
          affectsTeacherSalary: kind === "IJTIMOIY" ? true : maoshgaTasir,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error ?? "Saqlab bo'lmadi");
      const a = j?.applied;
      setQollandi(a?.periods
        ? `Mavjud qarzga ham qo'llandi: ${Number(a.amount).toLocaleString("uz-UZ")} so'm (${a.periods} davr)`
        : a?.kelishilgan
          ? "Kelishilgan alohida narxi bor a'zolikka qoida qo'llanmaydi"
          : a?.xato
            ? `Qoida saqlandi, mavjud davrga qo'llashda xato: ${a.xato}`
            : "Mavjud davrga qo'shimcha farq topilmadi (qarz yo'q yoki chegirma allaqachon shundan kam emas) — keyingi hisoblardan qo'llanadi");
      await mutate();
      onDone();
      setValue(kind === "IJTIMOIY" ? "100" : ""); setNote(""); setEndsAt(""); setGroupId("");
    } catch (e) { setErr((e as Error).message); }
    finally { setSaving(false); }
  }

  async function toggle(r: Rule) {
    setBusyId(r.id); setErr("");
    try {
      const res = await fetch(`/api/discounts/${r.id}`, {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({ isActive: !r.isActive }),
      });
      if (!res.ok) throw new Error((await res.json())?.error ?? "Saqlab bo'lmadi");
      await mutate();
      onDone();
    } catch (e) { setErr((e as Error).message); }
    finally { setBusyId(null); }
  }

  return (
    <>
      <button type="button" onClick={() => { setErr(""); setOpen(true); }}
        className="flex items-center gap-1 text-[11px] font-semibold
                   text-indigo-600 dark:text-indigo-400 hover:underline">
        <BadgePercent className="w-3 h-3" /> Doimiy chegirma
      </button>

      <Modal
        open={open}
        onClose={close}
        title="Doimiy chegirma"
        subtitle={studentName}
        footer={
          <>
            <Button onClick={save} disabled={!valid || saving} className="flex-1 h-9 text-[13px]">
              {saving && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Qo&apos;shish
            </Button>
            <Button variant="outline" className="h-9 px-4 text-[13px]" onClick={close}>Yopish</Button>
          </>
        }>
        <div className="space-y-4">
          {/* MAVJUD QOIDALAR — shu o'quvchiga tegishli */}
          {rules && rules.length > 0 && (
            <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/50 px-3 py-2.5 space-y-2" data-mavjud>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Amaldagi chegirmalari</p>
              {rules.map((r) => (
                <div key={r.id} className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-[12.5px] font-semibold truncate",
                      r.isActive ? "text-neutral-800 dark:text-neutral-200" : "text-neutral-400 line-through")}>
                      {KIND_LABEL[r.kind] ?? r.kind} · {r.type === "FOIZ" ? `${r.value}%` : `${fmt(r.value)} so'm`}
                    </p>
                    <p className="text-[11px] text-neutral-400">
                      {r.groupIds.length ? r.groupIds.map((g) => groupNames.get(g) ?? "guruh").join(", ") : "barcha guruhlari"}
                      {r.endsAt ? ` · ${formatUzDate(r.endsAt)} gacha` : " · muddatsiz"}
                      {r.isActive && !r.liveNow ? " · muddatdan tashqarida" : ""}
                    </p>
                  </div>
                  <button type="button" onClick={() => toggle(r)} disabled={busyId === r.id}
                    className="text-[11px] font-semibold text-neutral-500 hover:text-red-600 dark:hover:text-red-400 shrink-0">
                    {busyId === r.id ? "…" : r.isActive ? "To'xtatish" : "Yoqish"}
                  </button>
                </div>
              ))}
            </div>
          )}

          <Field label="Sabab turi">
            <Segmented options={KIND_OPTS} value={kind}
              onChange={(v) => { setKind(v); if (v === "IJTIMOIY") { setMaoshgaTasir(true); if (!value) setValue("100"); } }} grid />
            {kind === "IJTIMOIY" ? (
              <p className="text-[11px] leading-relaxed text-emerald-700 dark:text-emerald-300 mt-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-2">
                Kam ta&apos;minlangan oila uchun. Bu chegirmadan hech kim foyda ko&apos;rmaydi:
                o&apos;qituvchi foizidan ayiriladi, o&apos;quvchi boshiga maoshlarda sanalmaydi,
                hisobotda alohida ko&apos;rinadi, sof foydaga ta&apos;sir qilmaydi.
              </p>
            ) : (
              <p className="text-[11px] text-neutral-400 mt-1">Joriy davrning yozilgan qarziga ham, keyingi hisoblarga ham o&apos;zi qo&apos;llanadi. O&apos;tgan oylar uchun &quot;Bir martalik chegirma&quot;.</p>
            )}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Turi">
              <Segmented options={[{ value: "FOIZ", label: "Foiz %" }, { value: "SUMMA", label: "So'm" }]}
                value={type} onChange={(v) => { setType(v); setValue(v === "FOIZ" && kind === "IJTIMOIY" ? "100" : ""); }} grid />
            </Field>
            <Field label={type === "FOIZ" ? "Necha foiz" : "Oyiga necha so'm"}>
              <input value={value} onChange={(e) => setValue(e.target.value.replace(/[^\d]/g, ""))}
                inputMode="numeric" placeholder={type === "FOIZ" ? "100" : "100000"} className={inputCls} />
            </Field>
          </div>

          {groups.length > 1 && (
            <Field label="Qaysi guruhga">
              <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className={inputCls}>
                <option value="">Barcha guruhlariga</option>
                {groups.map((g) => <option key={g.groupId} value={g.groupId}>{g.name}</option>)}
              </select>
            </Field>
          )}

          <Field label="Tugashi" hint="Bo'sh qolsa muddatsiz">
            <DatePicker value={endsAt} onChange={setEndsAt} clearable />
          </Field>

          {kind !== "IJTIMOIY" && (
            <button type="button" onClick={() => setMaoshgaTasir((v) => !v)}
              className={cn("w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-colors",
                maoshgaTasir
                  ? "border-neutral-200 dark:border-neutral-700"
                  : "border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20")}>
              <span className={cn("h-4 w-4 shrink-0 mt-0.5 rounded border grid place-items-center",
                !maoshgaTasir ? "bg-amber-600 border-amber-600" : "border-neutral-300 dark:border-neutral-600")}>
                {!maoshgaTasir && <span className="text-white text-[9px]">✓</span>}
              </span>
              <span className="min-w-0">
                <span className="block text-[12.5px] font-semibold text-neutral-800 dark:text-neutral-200">
                  Chegirma o&apos;qituvchi oyligidan ayirilmasin
                </span>
                <span className="block text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {maoshgaTasir
                    ? "Hozir: chegirma foizli o'qituvchining tushumini ham kamaytiradi."
                    : "Belgilandi: o'qituvchi to'liq narxdan foiz oladi, chegirmani markaz o'z zimmasiga oladi."}
                </span>
              </span>
            </button>
          )}

          <Field label="Izoh">
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ixtiyoriy" className={inputCls} />
          </Field>

          {qollandi && <p className="text-[12px] text-emerald-700 dark:text-emerald-300" data-qollandi>{qollandi}</p>}
          {err && <p className="text-[12px] text-red-600 dark:text-red-400">{err}</p>}
        </div>
      </Modal>
    </>
  );
}
