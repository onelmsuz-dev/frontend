"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Pencil, Trash2, UserPlus, Clock, MapPin, Wallet, GraduationCap,
  MoreVertical, UserX, UserCheck, Snowflake, UserRound, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mutate } from "swr";
import { formatUzDate } from "@/lib/date-uz";
import { formatCurrency } from "@/lib/money";
import { WEEKDAY_SHORT } from "@/lib/form-constants";
import { useRooms } from "@/lib/hooks/useRooms";
import { activeFreeze, type FreezeLike } from "@/lib/freeze";
import { payStatusFromBalance, PAY_STATUS_CFG } from "@/lib/payment-status";
import { Modal, ConfirmDeleteModal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
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
  group: any;
  students: any[];
  groupId: string;
  canUpdate: boolean;
  canDelete: boolean;
  status: { label: string; cls: string };
  onAddStudent: () => void;
  onChanged: () => void;
}

export function GroupInfoSidebar({ group, students, groupId, canUpdate, canDelete, status, onAddStudent, onChanged }: Props) {
  const router = useRouter();
  const teacher = group.teacher?.user;
  const mounted = useMounted();

  // O'QUVCHI USTIGA BORGANDA — tezkor ma'lumot kartochkasi (telefon,
  // balans, qarz holati, qo'shilgan/faollashtirilgan sana, eslatma).
  // Ilgari bu faqat profilni ochib ko'rilardi (egasining talabi,
  // 2026-09-30). Ro'yxatning o'zi (ism, holat belgisi) o'zgarmaydi —
  // shu ustiga QO'SHILADI.
  const [hover, setHover] = useState<{ sg: any; rect: DOMRect } | null>(null);

  const [sort, setSort] = useState("az");
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<any>(null);
  const [removing, setRemoving] = useState(false);
  // Server rad etgan amal sababi (masalan pul tarixi bor guruh o'chmaydi).
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

  async function deleteGroup() {
    setDeleting(true); setAmalXato("");
    try {
      const res = await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
      if (!res.ok) {
        setAmalXato(await xatoMatni(res, "Guruhni o'chirib bo'lmadi"));
        setShowDelete(false);
        return;
      }
      mutate((k: string) => typeof k === "string" && k.startsWith("/api/groups"), undefined, { revalidate: true });
      router.push("/groups");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Info card */}
      <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-5 flex items-start justify-between gap-3">
        <dl className="space-y-2.5 min-w-0 flex-1">
          <span className={cn("inline-block text-[11px] px-2 py-0.5 rounded-full font-semibold mb-1", status.cls)}>{status.label}</span>
          <Row icon={GraduationCap} label="Kurs" value={group.course?.name ?? "—"} />
          <Row icon={GraduationCap} label="O'qituvchi" value={teacher?.name ?? "Biriktirilmagan"} />
          {group.course?.price != null && (
            <Row icon={Wallet} label="Narx" value={formatCurrency(group.course.price)} />
          )}
          <Row icon={Clock} label="Vaqt"
            value={`${(group.scheduleDays ?? []).map((d: string) => WEEKDAY_SHORT[d] ?? d).join(", ")} · ${group.startTime}`} />
          {group.room?.name && <Row icon={MapPin} label="Xona" value={group.room.name} />}
          {group.room?.capacity != null && <Row icon={MapPin} label="Xona sig'imi" value={String(group.room.capacity)} />}
          <Row label="Mashg'ulotlar sanalari"
            value={`${formatUzDate(group.startDate)} — ${group.endDate ? formatUzDate(group.endDate) : "hozircha cheksiz"}`} />
          <p className="text-[10.5px] text-neutral-400 pt-1">(id: {group.groupNumber ?? group.id})</p>
        </dl>

        {(canUpdate || canDelete) && (
          <div className="flex flex-col gap-1.5 shrink-0">
            {canUpdate && (
              <button onClick={() => setShowEdit(true)} title="Tahrirlash"
                className="w-8 h-8 flex items-center justify-center rounded-xl text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">
                <Pencil className="w-4 h-4" />
              </button>
            )}
            {canUpdate && (
              <button onClick={onAddStudent} title="O'quvchi qo'shish"
                className="w-8 h-8 flex items-center justify-center rounded-xl text-neutral-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors">
                <UserPlus className="w-4 h-4" />
              </button>
            )}
            {canDelete && (
              <button onClick={() => setShowDelete(true)} title="O'chirish"
                className="w-8 h-8 flex items-center justify-center rounded-xl text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sort */}
      <div className="flex items-center justify-between gap-2">
        <select value={sort} onChange={e => setSort(e.target.value)}
          className="h-9 px-3 text-[12.5px] rounded-xl border border-white/60 dark:border-white/10
            bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 outline-none">
          {SORTS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
        </select>
        {/* Guruh javobi endi chiqib ketganlarni ham qaytaradi (eski davomat
            tarixi uchun) — son faqat HOZIRGI a'zolarni sanasin, ketganlar
            alohida. Aks holda "15 ta" deb turib, 3 tasi allaqachon ketgan bo'lardi. */}
        <span className="text-[11px] text-neutral-400">
          {`${students.filter(x => x.enrollmentStatus !== "CHIQIB_KETGAN").length} ta`}
          {ketganSoni > 0 && ` · ${ketganSoni} ketgan`}
        </span>
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

      {showEdit && (
        <EditGroupModal group={group} groupId={groupId} onClose={() => setShowEdit(false)} onSaved={() => { setShowEdit(false); onChanged(); }} />
      )}

      <ConfirmDeleteModal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={deleteGroup}
        loading={deleting}
        title="Guruhni o'chirish"
        description={<>
          <span className="font-semibold text-neutral-700 dark:text-neutral-300">{group.name}</span>
          {" guruhi butunlay o'chiriladi. Bu amalni ortga qaytarib bo'lmaydi."}
        </>}
      />

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

function Row({ icon: Icon, label, value }: { icon?: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 text-[12.5px]">
      {Icon && <Icon className="w-3.5 h-3.5 text-neutral-400 mt-0.5 shrink-0" />}
      <dt className="font-semibold text-neutral-700 dark:text-neutral-300 shrink-0">{label}:</dt>
      <dd className="text-neutral-500 dark:text-neutral-400 min-w-0 truncate">{value}</dd>
    </div>
  );
}

function EditGroupModal({ group, groupId, onClose, onSaved }: { group: any; groupId: string; onClose: () => void; onSaved: () => void }) {
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
        body: JSON.stringify({ name: form.name, maxStudents: Number(form.maxStudents) || 15, roomId: form.roomId || null, status: form.status }),
      });
      if (!res.ok) { setErr("Saqlab bo'lmadi"); return; }
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
      <FormField label="Holat">
        <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
          className="w-full h-10 px-3 text-[13px] rounded-xl border border-white/60 dark:border-white/10 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none">
          <option value="ACTIVE">Faol</option>
          <option value="UPCOMING">Keladigan</option>
          <option value="COMPLETED">Yakunlangan</option>
        </select>
      </FormField>
      {err && <p className="text-[12px] text-red-600 dark:text-red-400">{err}</p>}
    </Modal>
  );
}
