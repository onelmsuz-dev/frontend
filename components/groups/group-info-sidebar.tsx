"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MoreVertical, UserX, UserCheck, Snowflake, UserRound, ArrowRight,
  Flag, CalendarClock, RotateCcw, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import useSWR from "swr";
import { formatUzDate, davrYorligi } from "@/lib/date-uz";
import { fetcher } from "@/lib/fetcher";
import { useFeature } from "@/lib/hooks/useFeatures";
import { formatCurrency } from "@/lib/money";
import { WEEKDAYS, todayStr } from "@/lib/form-constants";
import { useRooms } from "@/lib/hooks/useRooms";
import { activeFreeze, type FreezeLike } from "@/lib/freeze";
import { payStatusFromBalance, PAY_STATUS_CFG } from "@/lib/payment-status";
import { Modal, ConfirmDeleteModal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Portal faqat brauzerda — effektda setState o'rniga (loyiha lint qoidasi). */
const bosh = () => () => {};
function useMounted() {
  return useSyncExternalStore(bosh, () => true, () => false);
}

/**
 * QATOR HOLATI — 5 xil holat bor va hammasi bir qarashda ajralib
 * turishi kerak edi (egasining talabi, 2026-09-28): avval faqat Sinov
 * rangli pill bo'lardi, qolganlari kulrang nuqta bilan deyarli
 * bir xil ko'rinardi — muzlagan va arxivlangan esa umuman ko'rinmasdi.
 */
const STATUS_CFG: Record<string, { label: string; cls: string; icon?: typeof Snowflake }> = {
  FAOL:          { label: "Faol",          cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  SINOV:         { label: "Sinov",         cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  MUZLAGAN:      { label: "Muzlagan",      cls: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400", icon: Snowflake },
  ARXIV:         { label: "Arxivlangan",   cls: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" },
  CHIQIB_KETGAN: { label: "Chiqib ketgan", cls: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500" },
};

/**
 * Qatorning KO'RSATILADIGAN holati — bir nechta signal (arxiv,
 * muzlatish, a'zolik holati) ichidan ENG KUCHLISI tanlanadi.
 * Arxiv — o'quvchi butunlay markazni tark etgan, bu guruhdagi holatidan
 * qat'i nazar eng "og'ir" holat. Guruhdan chiqarilgan bo'lsa, muzlatish
 * endi ahamiyatsiz. Aks holda muzlatish sinov/faolni bosib ko'rsatiladi
 * — ular baribir FAOL hisoblanadi, lekin darsga kelmayapti.
 */
function rowStatus(sg: any): keyof typeof STATUS_CFG {
  if (sg.student?.archivedAt) return "ARXIV";
  if (sg.enrollmentStatus === "CHIQIB_KETGAN") return "CHIQIB_KETGAN";
  if (activeFreeze(sg.freezes as FreezeLike[] | undefined)) return "MUZLAGAN";
  return sg.enrollmentStatus === "SINOV" ? "SINOV" : "FAOL";
}

const SORTS = [
  { v: "az", l: "A-Z bo'yicha" },
  { v: "status", l: "Holat bo'yicha" },
  { v: "balance", l: "Qarz bo'yicha" },
];

interface Props {
  students: any[];
  canUpdate: boolean;
  onChanged: () => void;
}

/**
 * GURUH SAHIFASI — O'NG USTUNDAGI O'QUVCHILAR RO'YXATI.
 *
 * Guruh ma'lumoti, tahrirlash, yakunlash va o'chirish tepadagi
 * `GroupHero` da (2026-10-14). Bu yerda faqat ro'yxat: saralash,
 * holat belgilari, tezkor kartochka va "guruhdan chiqarish".
 */
export function GroupInfoSidebar({ students, canUpdate, onChanged }: Props) {
  const router = useRouter();
  const mounted = useMounted();

  // O'QUVCHI USTIGA BORGANDA — tezkor ma'lumot kartochkasi (telefon,
  // balans, qarz holati, qo'shilgan/faollashtirilgan sana, eslatma).
  // Ilgari bu faqat profilni ochib ko'rilardi (egasining talabi,
  // 2026-09-30). Ro'yxatning o'zi (ism, holat belgisi) o'zgarmaydi —
  // shu ustiga QO'SHILADI.
  const [hover, setHover] = useState<{ sg: any; rect: DOMRect } | null>(null);

  const [sort, setSort] = useState("az");
  const [removeTarget, setRemoveTarget] = useState<any>(null);
  const [removing, setRemoving] = useState(false);
  // Server rad etgan amal sababi.
  // Ilgari javob tekshirilmasdi — bosilgan tugma hech narsa qilmagandek edi.
  const [amalXato, setAmalXato] = useState("");

  async function xatoMatni(res: Response, zaxira: string) {
    const d = await res.json().catch(() => ({}));
    return (d as { error?: string })?.error ?? zaxira;
  }

  const ketganSoni = students.filter(x => x.enrollmentStatus === "CHIQIB_KETGAN").length;

  const sorted = useMemo(() => {
    const list = [...students];
    if (sort === "az") list.sort((a, b) => (a.student?.name ?? "").localeCompare(b.student?.name ?? ""));
    if (sort === "status") list.sort((a, b) => rowStatus(a).localeCompare(rowStatus(b)));
    if (sort === "balance") list.sort((a, b) => (a.groupNet ?? 0) - (b.groupNet ?? 0));
    return list;
  }, [students, sort]);

  async function removeFromGroup() {
    if (!removeTarget) return;
    setRemoving(true); setAmalXato("");
    try {
      const res = await fetch(`/api/student-groups/${removeTarget.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentStatus: "CHIQIB_KETGAN" }),
      });
      if (!res.ok) setAmalXato(await xatoMatni(res, "Guruhdan chiqarib bo'lmadi"));
      onChanged();
    } catch {
      setAmalXato("Serverga ulanib bo'lmadi");
    } finally {
      setRemoving(false);
      setRemoveTarget(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Sarlavha + son chapda, saralash o'ngda. Guruh javobi chiqib
          ketganlarni ham qaytaradi (eski davomat tarixi uchun) — son faqat
          HOZIRGI a'zolarni sanaydi, ketganlar alohida. */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[14px] font-bold text-neutral-800 dark:text-neutral-100">O&apos;quvchilar</p>
          <p className="text-[11.5px] text-neutral-400">
            {`${students.filter(x => x.enrollmentStatus !== "CHIQIB_KETGAN").length} ta`}
            {ketganSoni > 0 && ` · ${ketganSoni} ketgan`}
          </p>
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)} aria-label="Saralash"
          className="h-9 px-3 text-[12.5px] rounded-xl border border-white/60 dark:border-white/10
            bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 outline-none">
          {SORTS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
        </select>
      </div>

      {amalXato && (
        <p className="text-[12px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">
          {amalXato}
        </p>
      )}

      {/* Numbered roster */}
      <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
        {sorted.length === 0 ? (
          <p className="text-[12px] text-neutral-400 px-5 py-8 text-center">Guruhda hali o&apos;quvchi yo&apos;q</p>
        ) : (
          <ol className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {sorted.map((sg, i) => {
              const s = sg.student;
              const cfg = STATUS_CFG[rowStatus(sg)];
              const StatusIcon = cfg.icon;
              return (
                <li key={sg.id} className="flex items-center gap-2.5 px-4 py-2 hover:bg-white/60 dark:hover:bg-white/10 transition-colors"
                  onMouseEnter={(e) => setHover({ sg, rect: e.currentTarget.getBoundingClientRect() })}
                  onMouseLeave={() => setHover(h => (h?.sg === sg ? null : h))}>
                  <span className="text-[11px] text-neutral-400 w-4 text-right shrink-0">{i + 1}.</span>
                  {/* Ism O'Z QATORIDA, to'liq eni bilan — belgi va telefon
                      pastki kichik qatorga tushirilgan. Ilgari hammasi bitta
                      qatorda turardi va belgi (shrink-0) doim joy talab qilib,
                      ismga truncate uchun tor joy qolardi — 5 xil rangli
                      belgi qo'shilgach ism deyarli ko'rinmay qolgan edi
                      (egasining talabi, 2026-09-28). */}
                  <div className="min-w-0 flex-1">
                    <Link href={`/students/${s?.id}`}
                      className="block text-[12.5px] font-medium text-neutral-800 dark:text-neutral-200 truncate hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      {s?.name}
                    </Link>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={cn("inline-flex items-center gap-1 shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full", cfg.cls)}>
                        {StatusIcon && <StatusIcon className="w-2.5 h-2.5" />}
                        {cfg.label}
                      </span>
                      {s?.phone && (
                        <span className="text-[10.5px] text-neutral-400 truncate hidden sm:inline">{s.phone}</span>
                      )}
                    </div>
                  </div>
                  {canUpdate && (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        aria-label="Boshqa amallar"
                        className="w-6 h-6 flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-white/70 dark:hover:bg-white/10 outline-none shrink-0">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-[190px]">
                        <DropdownMenuItem onClick={() => router.push(`/students/${s?.id}`)}>
                          <UserRound className="w-3.5 h-3.5" /> Profilni ochish
                        </DropdownMenuItem>
                        {sg.enrollmentStatus === "SINOV" && (
                          <DropdownMenuItem onClick={async () => {
                            setAmalXato("");
                            try {
                              const res = await fetch(`/api/student-groups/${sg.id}`, {
                                method: "PATCH", headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ enrollmentStatus: "FAOL" }),
                              });
                              if (!res.ok) setAmalXato(await xatoMatni(res, "Faollashtirib bo'lmadi"));
                            } catch { setAmalXato("Serverga ulanib bo'lmadi"); }
                            onChanged();
                          }}>
                            <UserCheck className="w-3.5 h-3.5" /> Faollashtirish
                          </DropdownMenuItem>
                        )}
                        {sg.enrollmentStatus !== "CHIQIB_KETGAN" && (
                          <DropdownMenuItem onClick={() => setRemoveTarget(sg)} className="text-red-600 dark:text-red-400">
                            <UserX className="w-3.5 h-3.5" /> Guruhdan chiqarish
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {hover && mounted && createPortal(<StudentHoverCard sg={hover.sg} rect={hover.rect} />, document.body)}

      <ConfirmDeleteModal
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={removeFromGroup}
        loading={removing}
        title="Guruhdan chiqarish"
        description={<>
          <span className="font-semibold text-neutral-700 dark:text-neutral-300">{removeTarget?.student?.name}</span> shu guruhdan chiqariladi.
        </>}
      />
    </div>
  );
}

const HOVER_CARD_W = 288; // w-72

/** Ekran chetidan chiqib ketmaydigan `position: fixed` koordinata. */
function hoverCardPos(rect: DOMRect, heightEst: number) {
  const showAbove = rect.bottom + heightEst > window.innerHeight && rect.top - heightEst > 8;
  const top = showAbove ? Math.max(8, rect.top - heightEst - 6) : Math.min(rect.bottom + 6, window.innerHeight - heightEst - 8);
  const left = Math.min(rect.right + 10, window.innerWidth - HOVER_CARD_W - 8);
  return { top, left };
}

/**
 * O'QUVCHI TEZKOR KARTOCHKASI — ro'yxatdagi qatorga sichqoncha borganda.
 * Profilga kirmasdan turib eng ko'p so'raladigan narsalar: aloqa, qarz,
 * qachon qo'shilgan/faollashgan, so'nggi eslatma.
 */
function StudentHoverCard({ sg, rect }: { sg: any; rect: DOMRect }) {
  const s = sg.student ?? {};
  const cfg = STATUS_CFG[rowStatus(sg)];
  const StatusIcon = cfg.icon;
  const payKey = payStatusFromBalance(s.balance, sg.enrollmentStatus);
  const pay = PAY_STATUS_CFG[payKey];
  const heightEst = 190 + (s.note ? 60 : 0) + (sg.activatedAt ? 22 : 0);

  return (
    <div style={{ position: "fixed", zIndex: 130, width: HOVER_CARD_W, ...hoverCardPos(rect, heightEst) }}
      className="rounded-2xl glass-strong border border-white/60 dark:border-white/10 shadow-xl p-4 pointer-events-none">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[14px] font-bold text-neutral-900 dark:text-neutral-100 truncate">{s.name}</p>
        {s.studentNumber != null && (
          <span className="text-[10px] text-neutral-400 shrink-0">id: {s.studentNumber}</span>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
        <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full", cfg.cls)}>
          {StatusIcon && <StatusIcon className="w-2.5 h-2.5" />}
          {cfg.label}
        </span>
        <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", pay.cls)}>{pay.label}</span>
      </div>

      <dl className="space-y-1 mt-3 text-[12px]">
        {s.phone && (
          <div className="flex items-center justify-between gap-2">
            <dt className="text-neutral-400">Telefon</dt>
            <dd className="text-neutral-700 dark:text-neutral-300 font-medium">{s.phone}</dd>
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <dt className="text-neutral-400">Balans</dt>
          <dd className={cn("font-semibold", (s.balance ?? 0) < 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400")}>
            {formatCurrency(s.balance ?? 0)}
          </dd>
        </div>
        {s.joinedAt && (
          <div className="flex items-center justify-between gap-2">
            <dt className="text-neutral-400">Qo&apos;shilgan sana</dt>
            <dd className="text-neutral-700 dark:text-neutral-300">{formatUzDate(s.joinedAt)}</dd>
          </div>
        )}
        {sg.activatedAt && (
          <div className="flex items-center justify-between gap-2">
            <dt className="text-neutral-400">Faollashtirilgan</dt>
            <dd className="text-neutral-700 dark:text-neutral-300">{formatUzDate(sg.activatedAt)}</dd>
          </div>
        )}
      </dl>

      {s.note && (
        <div className="mt-3 pt-2.5 border-t border-white/50 dark:border-white/10">
          <p className="text-[10px] text-neutral-400 uppercase tracking-wider mb-0.5">Izoh</p>
          <p className="text-[12px] text-neutral-700 dark:text-neutral-200 leading-snug">{s.note}</p>
          {(s.noteByName || s.noteAt) && (
            <p className="text-[10.5px] text-neutral-400 mt-0.5">
              {s.noteByName}{s.noteByName && s.noteAt ? " · " : ""}{s.noteAt ? formatUzDate(s.noteAt) : ""}
            </p>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-end gap-1 text-[12px] font-semibold text-indigo-600 dark:text-indigo-400">
        Profilga o&apos;tish <ArrowRight className="w-3 h-3" />
      </div>
    </div>
  );
}

export function EditGroupModal({ group, groupId, onClose, onSaved }: { group: any; groupId: string; onClose: () => void; onSaved: () => void }) {
  const { data: roomsRaw } = useRooms();
  const rooms = Array.isArray(roomsRaw) ? roomsRaw : [];
  const [form, setForm] = useState({
    name: group.name ?? "",
    maxStudents: String(group.maxStudents ?? 15),
    roomId: group.roomId ?? "",
    status: group.status ?? "ACTIVE",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    if (!form.name.trim()) { setErr("Guruh nomi majburiy"); return; }
    setSaving(true); setErr("");
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, maxStudents: Number(form.maxStudents) || 15, roomId: form.roomId || null,
          // Holat faqat O'ZGARTIRILGANDA yuboriladi — aks holda backend
          // sanalardan o'zi hal qilgan holat ustiga eskisi yozilib qolardi.
          ...(form.status !== group.status ? { status: form.status } : {}),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErr((d as { error?: string })?.error ?? "Saqlab bo'lmadi");
        return;
      }
      onSaved();
    } catch { setErr("Serverga ulanib bo'lmadi"); }
    finally { setSaving(false); }
  }

  return (
    <Modal open onClose={onClose} title="Guruhni tahrirlash"
      footer={
        <>
          <Button onClick={save} disabled={saving}
            className="flex-1 h-9 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 text-white text-[13px]">
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
          <Button variant="outline" className="h-9 px-4 text-[13px]" onClick={onClose}>Bekor</Button>
        </>
      }>
      <FormField label="Guruh nomi" required>
        <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="h-10" />
      </FormField>
      <FormField label="Maksimal o'quvchilar soni">
        <Input type="number" value={form.maxStudents} onChange={e => setForm(p => ({ ...p, maxStudents: e.target.value }))} className="h-10" />
      </FormField>
      <FormField label="Xona">
        <select value={form.roomId} onChange={e => setForm(p => ({ ...p, roomId: e.target.value }))}
          className="w-full h-10 px-3 text-[13px] rounded-xl border border-white/60 dark:border-white/10 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none">
          <option value="">Biriktirilmagan</option>
          {rooms.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </FormField>
      {/* "Yakunlangan" bu yerda yo'q — guruh kartasidagi "Guruhni yakunlash"
          orqali, aniq sana bilan qilinadi (yakunlangan guruhda maydon ham yo'q:
          "Qayta ochish" o'sha kartada). */}
      {group.status !== "COMPLETED" && (
        <FormField label="Holat">
          <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
            className="w-full h-10 px-3 text-[13px] rounded-xl border border-white/60 dark:border-white/10 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none">
            <option value="ACTIVE">Faol</option>
            <option value="UPCOMING">Keladigan</option>
          </select>
        </FormField>
      )}
      {err && <p className="text-[12px] text-red-600 dark:text-red-400">{err}</p>}
    </Modal>
  );
}

/* ── GURUH MUDDATI ─────────────────────────────────────────────────────── */

/** Yakunlash bloki uchun kerakli guruh maydonlari. */
type GuruhMuddat = { name?: string; status?: string; startDate?: string; endDate?: string | null; scheduleDays?: string[] };

/** `Group.startDate/endDate` → "YYYY-MM-DD" (bazada kun boshi, UTC). */
const isoKun = (v: string | null | undefined) => (v ? String(v).slice(0, 10) : null);

/** Ikki "YYYY-MM-DD" orasidagi kunlar (b − a). */
function kunFarqi(a: string, b: string) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

/** Bugundan (o'zi ham) orqaga — guruhning eng so'nggi dars kuni (7 kun ichida). */
function oxirgiDarsKuni(scheduleDays: string[] | undefined, minIso: string | null): string | null {
  if (!scheduleDays?.length) return null;
  const d = new Date();
  for (let i = 0; i < 7; i++) {
    // JS: 0 = yakshanba; WEEKDAYS: 0 = dushanba.
    const kalit = WEEKDAYS[(d.getDay() + 6) % 7].value;
    const iso = todayStr(d);
    if (minIso && iso < minIso) return null;
    if (scheduleDays.includes(kalit)) return iso;
    d.setDate(d.getDate() - 1);
  }
  return null;
}

async function patchGroup(groupId: string, body: Record<string, unknown>): Promise<string | null> {
  try {
    const res = await fetch(`/api/groups/${groupId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) return null;
    const d = await res.json().catch(() => ({}));
    return (d as { error?: string })?.error ?? "Saqlab bo'lmadi";
  } catch { return "Serverga ulanib bo'lmadi"; }
}

/**
 * Kartaning pastki qismi — guruh qachon tugashi. Uch holat:
 *   · yakunlangan  → kulrang belgi, oxirgi dars sanasi va "Qayta ochish";
 *   · tugash sanasi oldinda → sariq belgi, "N kun qoldi" va "O'zgartirish";
 *   · muddatsiz    → "Guruhni yakunlash" tugmasi.
 *
 * Sana — OXIRGI DARS KUNI (`Group.endDate`). Backend qoidasi: sana o'tgach
 * guruh o'zi "Yakunlangan" bo'ladi, undan keyingi davr uchun oylik hisob
 * yozilmaydi (`billing-periods`, `group-lifecycle`).
 */
export function GroupEndSection({ group, groupId, canUpdate, onFinish, onChanged }: {
  group: GuruhMuddat; groupId: string; canUpdate: boolean; onFinish: () => void; onChanged: () => void;
}) {
  const [qaytaOchish, setQaytaOchish] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const bugun = todayStr();
  const end = isoKun(group.endDate);
  const yakunlangan = group.status === "COMPLETED";
  const yakunHisobi = useFeature("group-end-settlement") === true;

  async function reopen() {
    setSaving(true); setErr("");
    // `endDate: ""` — backendda tugash sanasini olib tashlaydi (null).
    const e = await patchGroup(groupId, { status: "ACTIVE", endDate: "" });
    setSaving(false);
    if (e) { setErr(e); return; }
    setQaytaOchish(false);
    onChanged();
  }

  if (yakunlangan) {
    return (
      <div className="mt-4 border-t border-white/50 pt-4 dark:border-white/10">
        <div className="flex items-center gap-3 rounded-xl bg-neutral-100/80 px-3.5 py-3 dark:bg-white/5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-200/80 text-neutral-600 dark:bg-white/10 dark:text-neutral-300">
            <Flag className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-neutral-800 dark:text-neutral-100">Guruh yakunlangan</p>
            <p className="text-[12px] text-neutral-500 dark:text-neutral-400">
              {end ? <>Oxirgi dars: <span className="font-medium tabular-nums">{formatUzDate(end)}</span></> : "Sana belgilanmagan"}
            </p>
          </div>
          {canUpdate && !qaytaOchish && (
            <button type="button" onClick={() => { setErr(""); setQaytaOchish(true); }}
              className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-semibold text-indigo-600 transition-colors hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30">
              <RotateCcw className="h-3.5 w-3.5" />Qayta ochish
            </button>
          )}
        </div>
        {qaytaOchish && (
          <div className="mt-2.5 rounded-xl border border-indigo-200 bg-indigo-50/60 px-3.5 py-3 dark:border-indigo-400/20 dark:bg-indigo-400/[0.06]">
            <p className="text-[12.5px] text-neutral-700 dark:text-neutral-200">
              Guruh yana faol bo&apos;ladi va o&apos;quvchilarga oylik hisob qayta yoziladi.
              {yakunHisobi && " Yakunlashda o'quvchilarga qaytarilgan pul bekor qilinadi."}
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <button type="button" onClick={reopen} disabled={saving}
                className="flex h-8 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-[12px] font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60">
                {saving ? "Ochilmoqda…" : "Ha, qayta ochish"}
              </button>
              <button type="button" onClick={() => setQaytaOchish(false)} disabled={saving}
                className="h-8 rounded-lg px-3 text-[12px] font-semibold text-neutral-500 transition-colors hover:bg-black/5 dark:text-neutral-400 dark:hover:bg-white/10">
                Bekor
              </button>
            </div>
          </div>
        )}
        {err && <p className="mt-2 text-[12px] text-red-600 dark:text-red-400">{err}</p>}
      </div>
    );
  }

  if (end) {
    const qoldi = kunFarqi(bugun, end);
    return (
      <div className="mt-4 border-t border-white/50 pt-4 dark:border-white/10">
        <div className="flex items-center gap-3 rounded-xl bg-amber-50 px-3.5 py-3 dark:bg-amber-400/[0.08]">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">
            <CalendarClock className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-neutral-800 dark:text-neutral-100">
              Yakunlanadi: <span className="tabular-nums">{formatUzDate(end)}</span>
            </p>
            <p className="text-[12px] text-amber-700 dark:text-amber-300">
              {qoldi <= 0 ? "Bugun oxirgi dars kuni" : `${qoldi} kun qoldi`}
            </p>
          </div>
          {canUpdate && (
            <button type="button" onClick={onFinish}
              className="flex h-8 shrink-0 items-center rounded-lg px-2.5 text-[12px] font-semibold text-amber-800 transition-colors hover:bg-amber-100 dark:text-amber-200 dark:hover:bg-amber-400/15">
              O&apos;zgartirish
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!canUpdate) return null;
  return (
    <div className="mt-4 border-t border-white/50 pt-4 dark:border-white/10">
      <button type="button" onClick={onFinish}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white/60 text-[13px] font-semibold text-neutral-700
          transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600
          dark:border-white/10 dark:bg-white/5 dark:text-neutral-200 dark:hover:border-red-400/30 dark:hover:bg-red-400/10 dark:hover:text-red-300">
        <Flag className="h-4 w-4" />Guruhni yakunlash
      </button>
    </div>
  );
}

/** `GET /api/groups/:id/end-preview` javobi. */
type YakunHisobi = {
  enabled: boolean;
  money?: boolean;
  items?: { studentName: string; periodStart: string; periodEnd: string; totalLessons: number;
            usedLessons: number; refundLessons: number; charged?: number; keep?: number; refund?: number }[];
  skipped?: { studentName: string; reason: string }[];
  totalRefund?: number;
  teacherCut?: number | null;
  paidSalaryMonths?: string[];
};

/**
 * YAKUN HISOB-KITOBI — tanlangan kun oxirgi dars bo'lsa kimga qancha qaytadi.
 *
 * Server hisoblaydi (`common/group-end-settlement.ts`), oyna faqat ko'rsatadi:
 * o'tilmagan darslar puli o'quvchi balansiga qaytadi, o'qituvchi faqat
 * o'tilgan darslardan ulush oladi. Bayroq o'chiq markazda blok chiqmaydi.
 */
function GroupEndPreview({ groupId, sana, otgan }: { groupId: string; sana: string; otgan: boolean }) {
  const { data, isLoading } = useSWR<YakunHisobi>(
    `/api/groups/${groupId}/end-preview?date=${sana}`, fetcher);
  if (isLoading) return <p className="text-[12px] text-neutral-400">Hisob-kitob tayyorlanmoqda…</p>;
  if (!data?.enabled) return null;
  const items = data.items ?? [];
  const skipped = data.skipped ?? [];
  const pul = data.money === true;

  return (
    <div className="rounded-xl border border-neutral-200 px-3.5 py-3 text-[12.5px] dark:border-white/10" data-yakun-hisobi>
      <p className="font-semibold text-neutral-800 dark:text-neutral-100">O&apos;tilmagan darslar hisob-kitobi</p>
      {items.length === 0 ? (
        <p className="mt-1 text-neutral-500 dark:text-neutral-400">
          Qaytariladigan pul yo&apos;q — yozilgan davrlar shu kungacha tugaydi.
        </p>
      ) : (
        <>
          <p className="mt-1 text-neutral-500 dark:text-neutral-400">
            {`${formatUzDate(sana)} dan keyingi darslar puli o'quvchi balansiga qaytadi. O'qituvchi faqat o'tilgan darslardan ulush oladi.`}
          </p>
          <ul className="mt-2 space-y-1.5">
            {items.map((i, k) => (
              <li key={k} className="flex items-baseline gap-2">
                <span className="min-w-0 flex-1 truncate text-neutral-800 dark:text-neutral-100">
                  {i.studentName}
                  <span className="ml-1.5 text-[11px] text-neutral-400">
                    {`${davrYorligi(i.periodStart, i.periodEnd)} · ${i.usedLessons}/${i.totalLessons} dars o'tdi`}
                  </span>
                </span>
                {pul && i.refund != null && (
                  <span className="shrink-0 tabular-nums font-semibold text-green-600 dark:text-green-400">
                    +{formatCurrency(i.refund)}
                  </span>
                )}
              </li>
            ))}
          </ul>
          {pul && (
            <div className="mt-2 border-t border-neutral-200 pt-2 dark:border-white/10">
              <p className="flex justify-between font-semibold text-neutral-800 dark:text-neutral-100">
                <span>Jami qaytadi</span>
                <span className="tabular-nums">{formatCurrency(data.totalRefund ?? 0)}</span>
              </p>
              {data.teacherCut != null && data.teacherCut > 0 && (
                <p className="mt-0.5 flex justify-between text-neutral-500 dark:text-neutral-400">
                  <span title="O'quvchilar to'liq to'laganda. To'lanmagan qarzdan o'qituvchi baribir ulush olmaydi.">
                    O&apos;qituvchi ulushi kamayadi
                  </span>
                  <span className="tabular-nums">−{formatCurrency(data.teacherCut)} gacha</span>
                </p>
              )}
            </div>
          )}
          {(data.paidSalaryMonths?.length ?? 0) > 0 && (
            <p className="mt-2 text-amber-700 dark:text-amber-300">
              {`O'qituvchi oyligi ${data.paidSalaryMonths!.join(", ")} uchun allaqachon to'langan — u qayta hisoblanmaydi, farqni qo'lda hal qiling.`}
            </p>
          )}
        </>
      )}
      {skipped.length > 0 && (
        <p className="mt-2 text-amber-700 dark:text-amber-300">
          Hisoblanmadi: {skipped.map((x) => `${x.studentName} (${x.reason})`).join("; ")}
        </p>
      )}
      <p className="mt-2 text-[11px] text-neutral-400">
        {otgan
          ? "Hisob-kitob yakunlash bilan birga yoziladi."
          : "Hisob-kitob guruh yakunlanganda yoziladi — shu orada yoziladigan davrlar ham hisobga olinadi."}
      </p>
    </div>
  );
}

/**
 * GURUHNI YAKUNLASH — oxirgi dars kunini tanlash.
 *   · o'tgan sana → guruh darhol "Yakunlangan" (backend o'zi qo'yadi);
 *   · bugun       → bugungi dars oxirgisi, ertaga o'zi yopiladi
 *                   (bugun davomat belgilash ochiq qoladi);
 *   · kelajak     → shu sanagacha davom etadi, keyin o'zi yopiladi.
 * Shuning uchun faqat `endDate` yuboriladi — holatni backend sanadan hal qiladi.
 */
export function FinishGroupModal({ group, groupId, activeCount, onClose, onSaved }: {
  group: GuruhMuddat; groupId: string; activeCount: number; onClose: () => void; onSaved: () => void;
}) {
  const bugun = todayStr();
  const boshi = isoKun(group.startDate);
  const avvalgi = isoKun(group.endDate);
  const oxirgiDars = oxirgiDarsKuni(group.scheduleDays, boshi);
  const [sana, setSana] = useState(avvalgi ?? oxirgiDars ?? bugun);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const otgan = sana < bugun;
  const bugunmi = sana === bugun;

  async function save(endDate: string) {
    setSaving(true); setErr("");
    const e = await patchGroup(groupId, { endDate });
    setSaving(false);
    if (e) { setErr(e); return; }
    onSaved();
  }

  const chip = (label: string, v: string) => (
    <button key={label} type="button" onClick={() => setSana(v)}
      className={cn("h-8 rounded-lg px-3 text-[12px] font-semibold transition-colors",
        sana === v
          ? "bg-indigo-600 text-white"
          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-white/5 dark:text-neutral-300 dark:hover:bg-white/10")}>
      {label}
    </button>
  );

  return (
    <Modal open onClose={onClose} title={avvalgi ? "Tugash sanasini o'zgartirish" : "Guruhni yakunlash"} subtitle={group.name}
      footer={
        <>
          <Button onClick={() => save(sana)} disabled={saving || !sana}
            className="flex-1 h-9 bg-red-600 hover:bg-red-700 text-white text-[13px]">
            {saving ? "Saqlanmoqda..." : otgan ? "Hozir yakunlash" : "Sanani belgilash"}
          </Button>
          <Button variant="outline" className="h-9 px-4 text-[13px]" onClick={onClose} disabled={saving}>Bekor</Button>
        </>
      }>
      <FormField label="Oxirgi dars kuni" required>
        <DatePicker value={sana} onChange={setSana} min={boshi ?? undefined} />
      </FormField>
      <div className="-mt-1 flex flex-wrap gap-1.5">
        {oxirgiDars && oxirgiDars !== bugun && chip(`Oxirgi dars · ${formatUzDate(oxirgiDars).slice(0, 5)}`, oxirgiDars)}
        {chip("Bugun", bugun)}
      </div>

      <div className={cn("flex gap-2.5 rounded-xl px-3.5 py-3 text-[12.5px] leading-relaxed",
        otgan ? "bg-red-50 text-red-800 dark:bg-red-400/10 dark:text-red-200" : "bg-amber-50 text-amber-900 dark:bg-amber-400/10 dark:text-amber-100")}>
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-semibold">
            {otgan ? "Guruh darhol yakunlanadi."
              : bugunmi ? "Bugungi dars oxirgisi — guruh ertaga o'zi yakunlanadi."
              : `Guruh ${formatUzDate(sana)} gacha davom etadi, keyin o'zi yakunlanadi.`}
          </p>
          <p className="mt-0.5 opacity-90">
            Shu sanadan keyin oylik hisob yozilmaydi va davomat ochilmaydi.
            {activeCount > 0 && ` ${activeCount} ta o'quvchining to'lov va davomat tarixi saqlanadi.`}
          </p>
        </div>
      </div>

      {sana && <GroupEndPreview groupId={groupId} sana={sana} otgan={otgan} />}

      {avvalgi && (
        <button type="button" onClick={() => save("")} disabled={saving}
          className="text-[12px] font-semibold text-indigo-600 hover:underline disabled:opacity-60 dark:text-indigo-400">
          Tugash sanasini olib tashlash (muddatsiz davom etsin)
        </button>
      )}
      {err && <p className="text-[12px] text-red-600 dark:text-red-400">{err}</p>}
    </Modal>
  );
}
