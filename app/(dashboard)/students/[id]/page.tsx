"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useStudent } from "@/lib/hooks/useStudents";
import { useGroups } from "@/lib/hooks/useGroups";
import { TopHeader } from "@/components/layout/top-header";
import { Modal } from "@/components/ui/modal";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { todayStr } from "@/lib/form-constants";
import { DatePicker } from "@/components/ui/date-picker";
import { formatUzDate } from "@/lib/date-uz";
import { TOUR_TARGETS } from "@/lib/onboarding/steps";
import {
  useGamificationSettings, useStudentPointHistory,
  REASON_LABELS, REASON_COLORS,
} from "@/lib/hooks/useGamification";
import { levelFromXp } from "@/lib/levels";
import { useMe, hasPerm } from "@/lib/hooks/useMe";
import { mutate } from "swr";
import {
  Phone, Calendar, DollarSign, ArrowLeft, AlertCircle,
  Plus, LogOut, Shuffle, UserCheck, Trophy, CalendarDays,
} from "lucide-react";

function fmt(v: number) {
  return new Intl.NumberFormat("uz-UZ", { style: "currency", currency: "UZS", maximumFractionDigits: 0 }).format(v);
}
function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded-xl", className)} />;
}

const ATTEND_CFG: Record<string, { label: string; cls: string; dot: string }> = {
  KELDI:      { label: "Keldi",      cls: "bg-green-100 text-green-700",   dot: "bg-green-500" },
  KELMADI:    { label: "Kelmadi",    cls: "bg-red-100 text-red-700",       dot: "bg-red-500" },
  KECH_KELDI: { label: "Kech keldi", cls: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-500" },
  SABABLI:    { label: "Sababli",    cls: "bg-blue-100 text-blue-700",     dot: "bg-blue-500" },
  SINOV_DARSI:{ label: "Sinov",      cls: "bg-amber-100 text-amber-700",   dot: "bg-amber-500" },
};
const ENROLL_CFG: Record<string, { label: string; cls: string }> = {
  YANGI:         { label: "Yangi",       cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  SINOV:         { label: "Sinov darsi", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  FAOL:          { label: "Faol",        cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  CHIQIB_KETGAN: { label: "Ketgan",      cls: "bg-neutral-100 text-neutral-500" },
};
const METHODS = ["NAQD", "KARTA", "CLICK", "PAYME"] as const;
const METHOD_LABELS: Record<string, string> = { NAQD: "Naqd pul", KARTA: "Karta", CLICK: "Click", PAYME: "Payme" };

/** O'quvchining guruhdagi a'zoligi. */
type Membership = {
  id?: string;
  groupId: string;
  enrollmentStatus?: string;
  group?: { name?: string };
};

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: student, isLoading, error, mutate: revalidate } = useStudent(id);
  const { data: groupsRaw } = useGroups({ status: "ACTIVE,UPCOMING" });
  const allGroups: any[] = Array.isArray(groupsRaw) ? groupsRaw : [];

  // Payment modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [payForm,      setPayForm]      = useState({ amount: "", method: "NAQD", note: "", groupId: "" });
  const [payErr,       setPayErr]       = useState("");
  const [paying,       setPaying]       = useState(false);

  // Guruh amallari. `targetSg` — AYNAN qaysi a'zolik ustida ish ketayotgani.
  // Ilgari bu yerda faqat "birinchi faol guruh" olinardi: ikki fanga
  // qatnashadigan o'quvchida chiqarish/almashtirish har doim tasodifiy
  // guruhga tegardi va ikkinchisiga umuman yetib bo'lmasdi.
  const [exitTarget,   setExitTarget]   = useState<any>(null);
  const [exiting,      setExiting]      = useState(false);

  /** null → yopiq; { sg: null } → yangi guruhga QO'SHISH; { sg } → SHU guruhni almashtirish. */
  const [groupModal,      setGroupModal]      = useState<{ sg: any | null } | null>(null);
  const [transferGroupId, setTransferGroupId] = useState("");
  const [transferErr,     setTransferErr]     = useState("");
  /** Guruhga qanday holatda qo'shilsin — xodim ataylab tanlaydi. */
  const [enrollAs,        setEnrollAs]        = useState<"SINOV" | "FAOL">("SINOV");
  /** Guruhga qo'shilgan sana — standarti bugun, lekin o'zgartirsa bo'ladi. */
  const [enrollDate,      setEnrollDate]      = useState(todayStr());
  const [transferring,    setTransferring]    = useState(false);

  const [activating,      setActivating]      = useState<string | null>(null);
  const [groupActionErr,  setGroupActionErr]  = useState("");

  function revalidateAll() {
    revalidate();
    mutate((k: string) => typeof k === "string" && k.startsWith("/api/students"), undefined, { revalidate: true });
  }

  // ── Faollashtirish — AYNAN bitta a'zolikni sinovdan faolga o'tkazadi ────────
  //
  // Har bir guruh alohida faollashtiriladi: o'quvchi ingliz tiliga to'lab,
  // matematikada hali sinovda bo'lishi mumkin. Ilgari bitta tugma "birinchi"
  // a'zolikni faollashtirardi va ikkinchisiga yo'l yo'q edi.
  async function activateMembership(sg: any) {
    if (!sg) return;
    setActivating(sg.id);
    try {
      const res = await fetch(`/api/student-groups/${sg.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentStatus: "FAOL" }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setGroupActionErr(d.error ?? "Faollashtirib bo'lmadi");
        return;
      }
      setGroupActionErr("");
      revalidateAll();
    } catch { setGroupActionErr("Serverga ulanib bo'lmadi"); }
    finally { setActivating(null); }
  }

  // ── Payment ──────────────────────────────────────────────────────────────────
  const { me } = useMe();
  const [archiving, setArchiving] = useState(false);
  const [archiveErr, setArchiveErr] = useState("");
  const [confirmArchive, setConfirmArchive] = useState(false);
  // Moliya (qarz va to'lov) — faqat to'lov huquqi borlarga. "To'lov qabul
  // qilmaydi" deb belgilangan o'qituvchida bu huquq yo'q, server ham
  // balansni bermaydi.
  const canSeeMoney = hasPerm(me?.permissions, "payments.view");
  // Guruhni almashtirish/chiqarish — o'quvchini tahrirlash huquqi bilan.
  // O'qituvchida bu huquq yo'q: tugma bosilsa server 403 berardi.
  const canManageGroups = hasPerm(me?.permissions, "students.update");

  // To'lov uchun mos a'zoliklar (guruhni tashlab ketganlar chiqarib tashlanadi)
  const payableGroups: Membership[] = (student?.groups ?? []).filter(
    (sg: Membership) => sg.enrollmentStatus !== "CHIQIB_KETGAN",
  );
  const selectedPayGroupId =
    payableGroups.some((g: Membership) => g.groupId === payForm.groupId)
      ? payForm.groupId
      : payableGroups.length === 1
        ? payableGroups[0].groupId
        : "";

  async function setArchived(archived: boolean) {
    setArchiving(true); setArchiveErr("");
    try {
      const res = await fetch(`/api/students/${id}/${archived ? "archive" : "unarchive"}`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      // Javob tekshirilmasa (filial doirasi, obuna, tarmoq) amal bajarilmagani
      // bilinmas va tugma ishlamayotgandek tuyulardi.
      if (!res.ok) { setArchiveErr(data?.error ?? "Xatolik"); return; }
      revalidateAll();
      setConfirmArchive(false);
    } catch { setArchiveErr("Serverga ulanib bo'lmadi"); }
    finally { setArchiving(false); }
  }
  const unarchiveStudent = () => setArchived(false);

  async function submitPayment() {
    const amount = parseFloat(payForm.amount.replace(/\s/g, ""));
    if (!amount || amount <= 0) { setPayErr("Summa to'g'ri kiriting"); return; }
    if (payableGroups.length > 1 && !selectedPayGroupId) {
      setPayErr("Qaysi guruh uchun to'lov ekanini tanlang"); return;
    }
    setPaying(true); setPayErr("");
    try {
      // To'lov QAYSI guruh uchun ekani — foizli o'qituvchi maoshi shunga
      // qarab hisoblanadi. Bir nechta faol a'zolik bo'lsa foydalanuvchi
      // o'zi tanlaydi; ilgari birinchi qaytgan a'zolik olinardi va pul
      // tasodifiy o'qituvchiga yozilardi.
      const sg = payableGroups.find((g: Membership) => g.groupId === selectedPayGroupId)
        ?? payableGroups[0]
        ?? student?.groups?.[0];
      const res = await fetch("/api/payments", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: id, groupId: sg?.groupId ?? undefined,
          amount, method: payForm.method, note: payForm.note || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setPayErr(data.error ?? "Xatolik"); return; }
      revalidateAll();
      setShowPayModal(false);
      setPayForm({ amount: "", method: "NAQD", note: "", groupId: "" });
    } catch { setPayErr("Serverga ulanib bo'lmadi"); }
    finally { setPaying(false); }
  }

  // ── Guruhdan chiqarish — faqat TANLANGAN a'zolik ────────────────────────────
  async function exitGroup() {
    const sg = exitTarget;
    if (!sg) return;
    setExiting(true);
    try {
      await fetch(`/api/student-groups/${sg.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentStatus: "CHIQIB_KETGAN" }),
      });
      // O'quvchi faqat BOSHQA guruhi qolmagan bo'lsa nofaol bo'ladi.
      // Ilgari bu shartsiz bajarilardi: ikki fanga qatnashadigan o'quvchi
      // bittasidan chiqarilganda butunlay nofaol bo'lib, ro'yxatdan
      // yo'qolib qolardi.
      const others = (student?.groups ?? []).filter(
        (g: any) => g.id !== sg.id && g.enrollmentStatus !== "CHIQIB_KETGAN",
      );
      if (others.length === 0) {
        await fetch(`/api/students/${id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: false }),
        });
      }
      revalidateAll();
      setExitTarget(null);
    } finally { setExiting(false); }
  }

  // ── Guruhga qo'shish / guruhni almashtirish ─────────────────────────────────
  //
  // Ikkalasi bitta oyna: `groupModal.sg` bor bo'lsa — AYNAN o'sha a'zolik
  // yangisiga almashtiriladi; `null` bo'lsa — mavjudlariga qo'shimcha
  // guruh qo'shiladi. Ilgari faqat "almashtirish" bor edi va u har doim
  // eski guruhdan chiqarib yuborardi, ya'ni ikkinchi fanni qo'shishning
  // umuman iloji yo'q edi.
  async function submitGroupModal() {
    if (!transferGroupId) { setTransferErr("Guruhni tanlang"); return; }
    const replacing = groupModal?.sg ?? null;
    setTransferring(true); setTransferErr("");
    try {
      // 1) Yangi guruhga qo'shamiz. AVVAL shu — muvaffaqiyatsiz bo'lsa
      //    (guruh to'lgan, boshqa markazniki) o'quvchi eski guruhida
      //    o'zgarishsiz qoladi, ya'ni guruhsiz osilib qolmaydi.
      const res = await fetch("/api/student-groups", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: id, groupId: transferGroupId,
          enrollmentStatus: enrollAs,
          ...(enrollDate ? { joinedAt: enrollDate } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setTransferErr(data.error ?? "Xatolik"); return; }

      // 2) Almashtirish bo'lsa — eskisini yopamiz.
      if (replacing) {
        await fetch(`/api/student-groups/${replacing.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enrollmentStatus: "CHIQIB_KETGAN" }),
        });
      }
      revalidateAll();
      setGroupModal(null);
      setTransferGroupId("");
    } catch { setTransferErr("Serverga ulanib bo'lmadi"); }
    finally { setTransferring(false); }
  }

  // ── Loading / Not found ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-5 space-y-5">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-40" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }
  if (error || !student) {
    const status = (error as Error & { status?: number })?.status;
    return (
      <div className="p-5 flex flex-col items-center py-20 text-neutral-400">
        <AlertCircle className="w-10 h-10 mb-2 opacity-40" />
        <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">
          {status === 403 ? "Bu o'quvchini ko'rishga ruxsatingiz yo'q" : "O'quvchi topilmadi"}
        </p>
        {status === 403 && (
          <p className="text-[12px] mt-1 max-w-sm text-center">
            O&apos;qituvchi faqat o&apos;z guruhidagi o&apos;quvchilarni ko&apos;ra oladi.
          </p>
        )}
        {error && status !== 403 && status !== 404 && (
          <p className="text-[12px] mt-1">{(error as Error).message}</p>
        )}
        <Link href="/students" className="mt-3 text-sm text-blue-500 hover:underline">Orqaga</Link>
      </div>
    );
  }

  // BARCHA faol a'zoliklar. Ilgari `.find()` bilan faqat BIRINCHISI olinardi —
  // ikki guruhda o'qiydigan o'quvchining ikkinchi guruhi va kursi umuman
  // ko'rinmasdi ("guruhlari, kurslari to'g'ri ishlamayapti").
  const activeSgs: any[] = (student.groups ?? []).filter(
    (g: any) => g.enrollmentStatus !== "CHIQIB_KETGAN",
  );
  // Umumiy holat: kamida bitta FAOL a'zolik bo'lsa — faol, aks holda sinov.
  // "Ketgan" — faqat ATAYLAB belgilangan bo'lsa. Guruhga hali biriktirilmagan
  // yangi o'quvchi "Yangi" bo'ladi (ilgari u ham "Ketgan" ko'rinardi).
  const overallEnroll =
    student.archivedAt ? "CHIQIB_KETGAN"
    : activeSgs.length === 0 ? "YANGI"
    : activeSgs.some((g: any) => g.enrollmentStatus === "FAOL") ? "FAOL"
    : "SINOV";
  const enroll    = ENROLL_CFG[overallEnroll];
  const attended  = student.attendance?.filter((a: any) => a.status === "KELDI").length ?? 0;
  const total     = student.attendance?.filter((a: any) => a.status !== "SINOV_DARSI").length ?? 0;
  const rate      = total > 0 ? Math.round((attended / total) * 100) : 0;

  // Tanlash mumkin bo'lgan guruhlar — o'quvchi ALLAQACHON a'zo bo'lganlari
  // chiqarib tashlanadi (backend baribir "allaqachon ro'yxatda" deb rad
  // etardi). Almashtirishda esa almashtirilayotgan guruhning o'zi ham
  // ro'yxatda turishi keraksiz.
  const memberGroupIds = new Set(activeSgs.map((sg: any) => sg.groupId));
  const availableGroups = allGroups.filter(g => !memberGroupIds.has(g.id));

  return (
    <div>
      <TopHeader
        title={student.name}
        subtitle={
          <Link href="/students" className="flex items-center gap-1 text-neutral-400 hover:text-neutral-600 text-sm transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            O'quvchilar
          </Link>
        }
        action={canSeeMoney
          ? { label: "To'lov qo'shish", onClick: () => { setPayErr(""); setShowPayModal(true); } }
          : undefined}
      />

      {/* Payment modal */}
      <Modal open={showPayModal} onClose={() => setShowPayModal(false)}
        title="To'lov qabul qilish" subtitle={student.name}
        footer={
          <>
            <Button onClick={submitPayment} disabled={paying}
 className="flex-1 h-9 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 text-white text-[13px]">
              {paying ? "Saqlanmoqda..." : "Qabul qilish"}
            </Button>
            <Button variant="outline" className="h-9 px-4 text-[13px]" onClick={() => setShowPayModal(false)}>Bekor</Button>
          </>
        }>
        {payableGroups.length > 1 && (
          <FormField label="Qaysi guruh uchun" required>
            <select
              value={selectedPayGroupId}
              onChange={e => { setPayForm(p => ({ ...p, groupId: e.target.value })); setPayErr(""); }}
              className="w-full h-10 px-3 text-[13px] rounded-xl glass-panel border border-white/60 dark:border-white/10 outline-none"
            >
              <option value="">Tanlang…</option>
              {payableGroups.map((sg: Membership) => (
                <option key={sg.groupId} value={sg.groupId}>
                  {sg.group?.name ?? sg.groupId}
                </option>
              ))}
            </select>
          </FormField>
        )}
        <FormField label="Summa (UZS)" required>
          <Input placeholder="500 000" value={payForm.amount} type="number" min="0"
            onChange={e => { setPayForm(p => ({...p, amount: e.target.value})); setPayErr(""); }}
            className="h-10 text-[14px] font-semibold" />
        </FormField>
        <FormField label="To'lov usuli">
          <div className="grid grid-cols-2 gap-2">
            {METHODS.map(m => (
              <button key={m} type="button" onClick={() => setPayForm(p => ({...p, method: m}))}
                className={cn("h-10 rounded-xl border text-[13px] font-semibold transition-all",
                  payForm.method === m
                    ? "bg-indigo-600 text-white dark:bg-indigo-500 border-neutral-900"
                    : "glass-panel text-neutral-600 dark:text-neutral-300 border-white/60 dark:border-white/10 hover:border-neutral-400")}>
                {METHOD_LABELS[m]}
              </button>
            ))}
          </div>
        </FormField>
        <FormField label="Izoh" hint="Ixtiyoriy">
          <Input placeholder="Iyul oyi uchun..." value={payForm.note}
            onChange={e => setPayForm(p => ({...p, note: e.target.value}))} className="h-10" />
        </FormField>
        <div className="flex items-center justify-between glass-soft rounded-xl px-4 py-2.5">
          <span className="text-[12px] text-neutral-500">Joriy balans</span>
          <span className={cn("text-[13px] font-bold", student.balance >= 0 ? "text-green-600" : "text-red-600")}>
            {fmt(student.balance)}
          </span>
        </div>
        {payErr && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-100 rounded-xl px-3 py-2.5">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <p className="text-[12px] font-medium text-red-600 dark:text-red-400">{payErr}</p>
          </div>
        )}
      </Modal>

      {/* Guruhdan chiqarish — aynan tanlangan a'zolik */}
      <Modal open={!!exitTarget} onClose={() => setExitTarget(null)}
        title="Guruhdan chiqarish"
        subtitle={`${student.name} — ${exitTarget?.group?.name ?? "guruh"}`}
        footer={
          <>
            <Button onClick={exitGroup} disabled={exiting}
              className="flex-1 h-9 bg-red-600 hover:bg-red-700 text-white text-[13px]">
              {exiting ? "Chiqarilmoqda..." : "Ha, chiqarish"}
            </Button>
            <Button variant="outline" className="h-9 px-4 text-[13px]" onClick={() => setExitTarget(null)}>Bekor</Button>
          </>
        }>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-xl px-4 py-3">
          <p className="text-[13px] text-red-700 dark:text-red-400">
            <strong>{student.name}</strong> <strong>{exitTarget?.group?.name}</strong> guruhidan chiqariladi.
          </p>
          {(() => {
            const others = activeSgs.filter((g: any) => g.id !== exitTarget?.id);
            return others.length > 0 ? (
              <p className="text-[12px] text-red-600/80 dark:text-red-400/80 mt-1.5">
                Qolgan {others.length} ta guruhi ({others.map((g: any) => g.group?.name).join(", ")})
                saqlanadi — o&apos;quvchi faol bo&apos;lib qoladi.
              </p>
            ) : (
              <p className="text-[12px] text-red-600/80 dark:text-red-400/80 mt-1.5">
                Bu uning yagona guruhi — o&apos;quvchi nofaol holatga o&apos;tkaziladi.
              </p>
            );
          })()}
        </div>
      </Modal>

      {/* "Ketgan" — qaytarib bo'lmaydigan amal: o'quvchi BARCHA guruhlaridan
          chiqariladi va belgini olib tashlash ularni QAYTARMAYDI. Shuning
          uchun tasdiq oynasi va aniq ogohlantirish. */}
      <Modal
        open={confirmArchive}
        onClose={() => setConfirmArchive(false)}
        title="Ketgan deb belgilansinmi?"
        subtitle={student.name}
        footer={
          <>
            <Button onClick={() => setArchived(true)} disabled={archiving}
              className="flex-1 h-9 bg-red-600 hover:bg-red-700 text-white text-[13px]">
              {archiving ? "Belgilanmoqda..." : "Ha, ketgan"}
            </Button>
            <Button variant="outline" className="h-9 px-4 text-[13px]"
              onClick={() => setConfirmArchive(false)}>Bekor</Button>
          </>
        }>
        <p className="text-[13px] text-neutral-600 dark:text-neutral-300">
          O&apos;quvchi ro&apos;yxatda &quot;Ketgan&quot; bo&apos;lib qoladi
          {activeSgs.length > 0 && (
            <> va <b>{activeSgs.length} ta guruhdan</b> chiqariladi</>
          )}.
        </p>
        <p className="text-[12px] text-amber-600 dark:text-amber-400 mt-2">
          Diqqat: keyinroq belgini olib tashlasangiz, guruhlar avtomatik
          qaytmaydi — ularni qayta biriktirish kerak bo&apos;ladi.
        </p>
        <p className="text-[12px] text-neutral-400 mt-2">
          To&apos;lovlar va davomat tarixi saqlanadi.
        </p>
        {/* Xato AYNAN shu yerda: modal ochiq qolgani uchun profil
            kartochkasidagi xabar ko'rinmasdi va tugma ishlamayotgandek
            tuyulardi. */}
        {archiveErr && (
          <p className="text-[12px] text-red-600 dark:text-red-400 mt-3">{archiveErr}</p>
        )}
      </Modal>

      {/* Guruhga qo'shish / almashtirish — bitta oyna, ikki rejim */}
      <Modal open={!!groupModal} onClose={() => { setGroupModal(null); setTransferGroupId(""); setTransferErr(""); }}
        title={groupModal?.sg ? "Guruh almashtirish" : "Guruhga qo'shish"}
        subtitle={groupModal?.sg
          ? `Hozir: ${groupModal.sg.group?.name}`
          : activeSgs.length > 0
            ? `Hozirgi ${activeSgs.length} ta guruhi saqlanadi`
            : "O'quvchi hali guruhga biriktirilmagan"}
        footer={
          <>
            <Button onClick={submitGroupModal} disabled={transferring || availableGroups.length === 0}
              data-tour={TOUR_TARGETS.studentEnrollSubmit}
              className="flex-1 h-9 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 text-white text-[13px]">
              {transferring ? "Saqlanmoqda..." : groupModal?.sg ? "O'tkazish" : "Qo'shish"}
            </Button>
            <Button variant="outline" className="h-9 px-4 text-[13px]"
              onClick={() => { setGroupModal(null); setTransferGroupId(""); setTransferErr(""); }}>Bekor</Button>
          </>
        }>
        {availableGroups.length === 0 ? (
          <p className="text-[13px] text-neutral-500 dark:text-neutral-400 text-center py-4">
            Qo&apos;shish uchun boshqa guruh yo&apos;q — o&apos;quvchi mavjud guruhlarning hammasida.
          </p>
        ) : (
          <>
            <FormField label={groupModal?.sg ? "Yangi guruh" : "Guruh"} required
              error={transferErr.includes("guruh") || transferErr.includes("Guruh") ? transferErr : ""}>
              <select value={transferGroupId} onChange={e => { setTransferGroupId(e.target.value); setTransferErr(""); }}
                data-tour={TOUR_TARGETS.studentEnrollSelect}
                className="w-full h-10 px-3 text-[13px] rounded-xl border border-white/60 dark:border-white/10 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none">
                <option value="">Guruhni tanlang...</option>
                {availableGroups.map((g: any) => (
                  <option key={g.id} value={g.id}>{g.name} — {g.course?.name}</option>
                ))}
              </select>
            </FormField>
            {/* HOLAT TANLOVI — ro'yxatdagi ommaviy oyna bilan bir xil.
                Ilgari bu yerda tanlov yo'q edi va o'quvchi HAR DOIM darhol
                "Faol" bo'lib, kurs to'lovi yechilardi. */}
            <FormField label="Qaysi holatda qo'shilsin" required>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { v: "SINOV" as const, l: "Sinov darsi", d: "Pul yechilmaydi" },
                  { v: "FAOL"  as const, l: "Faol",        d: "Kurs to'lovi yechiladi" },
                ]).map(o => (
                  <button key={o.v} type="button" onClick={() => setEnrollAs(o.v)}
                    className={cn(
                      "px-3 py-2.5 rounded-xl border-2 text-left transition-all",
                      enrollAs === o.v
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-400"
                        : "border-white/60 dark:border-white/10 hover:border-neutral-400",
                    )}>
                    <p className={cn("text-[13px] font-semibold",
                      enrollAs === o.v
                        ? "text-indigo-700 dark:text-indigo-300"
                        : "text-neutral-700 dark:text-neutral-300")}>
                      {o.l}
                    </p>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">{o.d}</p>
                  </button>
                ))}
              </div>
            </FormField>

            {/* QO'SHILGAN SANA — ilgari doim "bugun" edi va o'zgartirib
                bo'lmasdi. Markazlar ma'lumotni ko'pincha keyin kiritadi. */}
            <FormField label="Guruhga qo'shilgan sana"
              hint="Haqiqiy sanani kiriting — hisob shundan yuritiladi">
              <DatePicker value={enrollDate} max={todayStr()} onChange={setEnrollDate} />
            </FormField>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-xl px-4 py-3">
              <p className="text-[12px] text-amber-700 dark:text-amber-400">
                {groupModal?.sg
                  ? <><strong>{groupModal.sg.group?.name}</strong> dan chiqarilib, tanlangan guruhga qo&apos;shiladi.</>
                  : <>Mavjud guruhlariga <strong>qo&apos;shimcha</strong> qilib biriktiriladi (hech qaysisidan chiqarilmaydi).</>}
                {enrollAs === "FAOL"
                  ? " Kurs to'lovi shu oy uchun balansdan yechiladi."
                  : " Sinov darsida pul yechilmaydi — keyin faollashtirasiz."}
              </p>
            </div>
          </>
        )}
        {transferErr && !transferErr.includes("guruh") && !transferErr.includes("Guruh") && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-100 rounded-xl px-3 py-2.5">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <p className="text-[12px] font-medium text-red-600 dark:text-red-400">{transferErr}</p>
          </div>
        )}
      </Modal>

      <div className="p-5 space-y-5">
        {/* Yuqori kartochkalar — profil va moliya. Guruhlar pastda, to'liq
            kenglikda: bir o'quvchida 3-4 ta guruh bo'lishi mumkin va ular
            tor ustunga sig'masdi. */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Profile */}
          <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black",
                student.isActive
                  ? "bg-gradient-to-br from-blue-400 to-indigo-500"
                  : "bg-gradient-to-br from-amber-400 to-orange-400")}>
                {student.name[0]}
              </div>
              <div>
                <h2 className="font-bold text-neutral-900 dark:text-neutral-100">{student.name}</h2>
                <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-semibold", enroll?.cls)}>
                  {enroll?.label}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <a href={`tel:${student.phone}`}
                className="flex items-center gap-2 text-[13px] text-neutral-600 dark:text-neutral-300 hover:text-blue-600 transition-colors">
                <Phone className="w-3.5 h-3.5 text-neutral-400" />
                {student.phone}
              </a>
              {student.parentPhone && (
                <a href={`tel:${student.parentPhone}`}
                  className="flex items-center gap-2 text-[13px] text-neutral-500 dark:text-neutral-400">
                  <Phone className="w-3.5 h-3.5 text-neutral-400" />
                  Ota-ona: {student.parentPhone}
                </a>
              )}
              <div className="flex items-center gap-2 text-[13px] text-neutral-500 dark:text-neutral-400">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                {formatUzDate(student.joinedAt ?? student.createdAt)} dan beri
              </div>

              {/* "Ketgan" holati ATAYLAB belgilanadi — avval u guruhi
                  yo'qligidan chiqarilar va yangi o'quvchi ham ketgan
                  bo'lib ko'rinardi. */}
              {canManageGroups && (
                student.archivedAt ? (
                  <button onClick={unarchiveStudent} disabled={archiving}
                    className="mt-1 flex items-center gap-1.5 w-fit text-[12px] px-3 h-8 rounded-lg font-semibold
                      bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-60">
                    <UserCheck className="w-3.5 h-3.5" />
                    {archiving ? "..." : "Ketgan belgisini olib tashlash"}
                  </button>
                ) : (
                  <button onClick={() => { setArchiveErr(""); setConfirmArchive(true); }} disabled={archiving}
                    className="mt-1 flex items-center gap-1.5 w-fit text-[12px] px-3 h-8 rounded-lg font-semibold
                      text-neutral-500 dark:text-neutral-400 border border-white/60 dark:border-white/10
                      hover:text-red-600 hover:border-red-300 dark:hover:text-red-400 transition-colors disabled:opacity-60">
                    <LogOut className="w-3.5 h-3.5" />
                    {archiving ? "..." : "Ketgan deb belgilash"}
                  </button>
                )
              )}
              {archiveErr && (
                <p className="text-[12px] text-red-600 dark:text-red-400">{archiveErr}</p>
              )}
            </div>
          </div>

          {/* Finance */}
          <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                {canSeeMoney ? "Moliya" : "Davomat"}
              </h3>
              {canSeeMoney && (
                <button onClick={() => { setPayErr(""); setShowPayModal(true); }}
                  className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                  <Plus className="w-3 h-3" /> To'lov
                </button>
              )}
            </div>
            <div className="space-y-3">
              {canSeeMoney && (
                <div>
                  <p className="text-[11px] text-neutral-400 mb-0.5">Balans</p>
                  <p className={cn("text-[22px] font-black leading-none",
                    (student.balance ?? 0) >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400")}>
                    {fmt(student.balance ?? 0)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-[11px] text-neutral-400 mb-0.5">Davomiylik</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 glass-soft rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${rate}%` }} />
                  </div>
                  <span className="text-[12px] font-bold text-neutral-700 dark:text-neutral-300">{rate}%</span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5">{attended}/{total} dars</p>
              </div>
            </div>
          </div>
        </div>

          {/* Guruhlar — har biri mustaqil kartochka, o'z amallari bilan.
              Ilgari bu yerda bitta "Guruh almashtirish" va bitta "Chiqarish"
              tugmasi bo'lib, ikkalasi ham HAR DOIM birinchi guruhga tegardi:
              ikki fanga qatnashadigan o'quvchining ikkinchi guruhini boshqarish
              mumkin emas edi. */}
          <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                {activeSgs.length > 1 ? `Guruhlari (${activeSgs.length})` : "Guruh"}
              </h3>
              {canManageGroups && availableGroups.length > 0 && (
                <button data-tour={TOUR_TARGETS.studentEnrollBtn}
                  onClick={() => { setTransferGroupId(""); setTransferErr(""); setGroupModal({ sg: null }); }}
                  className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                  <Plus className="w-3 h-3" /> Guruhga qo&apos;shish
                </button>
              )}
            </div>

            {activeSgs.length === 0 ? (
              <div className="space-y-2.5 py-2">
                <p className="text-[13px] text-neutral-400">Guruhga biriktirilmagan</p>
                {canManageGroups && (
                  <button data-tour={TOUR_TARGETS.studentEnrollBtn}
                    onClick={() => { setTransferGroupId(""); setTransferErr(""); setGroupModal({ sg: null }); }}
                    className="flex items-center gap-1.5 text-[12px] px-3 py-2 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Guruhga qo&apos;shish
                  </button>
                )}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-2.5">
                {activeSgs.map((sg: any) => {
                  const g = sg.group;
                  const t = g?.teacher?.user;
                  const isTrial = sg.enrollmentStatus === "SINOV";
                  return (
                    <div key={sg.id}
                      className={cn("rounded-xl border p-3 space-y-2",
                        isTrial
                          ? "border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-900/10"
                          : "border-white/60 dark:border-white/10 glass-soft")}>
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/groups/${g.id}`}
                          className="text-[13px] font-bold text-blue-600 hover:underline leading-tight">
                          {g.name}
                        </Link>
                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0",
                          ENROLL_CFG[sg.enrollmentStatus]?.cls ?? "bg-neutral-100 text-neutral-500")}>
                          {ENROLL_CFG[sg.enrollmentStatus]?.label ?? sg.enrollmentStatus}
                        </span>
                      </div>

                      <p className="text-[12px] text-neutral-500">{g.course?.name}</p>

                      {/* QO'SHILGAN SANA — foydalanuvchi kiritgan sana shu
                          yerda ko'rinadi. Ilgari u hech qayerda
                          ko'rsatilmasdi va to'g'ri saqlanganini bilib
                          bo'lmasdi. */}
                      {sg.joinedAt && (
                        <p className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                          <CalendarDays className="w-3 h-3 shrink-0" />
                          {formatUzDate(sg.joinedAt)} dan
                        </p>
                      )}

                      {t && (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-[9px] font-bold">
                            {t.name[0]}
                          </div>
                          <Link href={`/teachers/${g.teacher?.id}`}
                            className="text-[12px] text-neutral-600 dark:text-neutral-300 hover:text-blue-600 transition-colors truncate">
                            {t.name}
                          </Link>
                        </div>
                      )}

                      <p className="text-[11px] text-neutral-400">
                        {g.scheduleDays?.join(", ").toUpperCase()} · {g.startTime}–{g.endTime}
                      </p>

                      {isTrial && (
                        <button onClick={() => activateMembership(sg)} disabled={activating === sg.id}
                          className="w-full flex items-center justify-center gap-1.5 h-8 rounded-lg text-[12px] font-semibold bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-60">
                          <UserCheck className="w-3.5 h-3.5" />
                          {activating === sg.id ? "Faollashtirilmoqda..." : "Faollashtirish"}
                        </button>
                      )}

                      {canManageGroups && (
                        <div className="flex gap-1.5 pt-0.5">
                          <button onClick={() => { setTransferGroupId(""); setTransferErr(""); setGroupModal({ sg }); }}
                            className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                            <Shuffle className="w-3 h-3" /> Almashtirish
                          </button>
                          <button onClick={() => setExitTarget(sg)}
                            className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                            <LogOut className="w-3 h-3" /> Chiqarish
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {groupActionErr && (
              <div className="flex items-center gap-2 mt-3 bg-red-50 dark:bg-red-900/20 border border-red-100 rounded-xl px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <p className="text-[12px] font-medium text-red-600 dark:text-red-400">{groupActionErr}</p>
              </div>
            )}
          </div>

        {/* Gamifikatsiya — API allaqachon qaytarardi, lekin sahifa ko'rsatmasdi */}
        <StudentPointsCard student={student} />

        <div className={cn("grid gap-5", canSeeMoney ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1")}>
          {/* Payments — faqat to'lov huquqi bo'lganda */}
          {canSeeMoney && (
          <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/50 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-neutral-400" />
                <h3 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">So'nggi to'lovlar</h3>
              </div>
              <button onClick={() => { setPayErr(""); setShowPayModal(true); }}
                className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                <Plus className="w-3 h-3" /> Yangi to'lov
              </button>
            </div>
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {student.payments?.length === 0 && (
                <p className="text-[12px] text-neutral-400 p-4 text-center">To'lovlar yo'q</p>
              )}
              {student.payments?.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-[13px] font-semibold text-green-600 dark:text-green-400">{fmt(p.amount)}</p>
                    <p className="text-[11px] text-neutral-400">
                      {new Date(p.date).toLocaleDateString("uz-UZ")} · {METHOD_LABELS[p.method] ?? p.method}
                    </p>
                  </div>
                  {p.note && <p className="text-[11px] text-neutral-400 max-w-[120px] text-right">{p.note}</p>}
                </div>
              ))}
            </div>
          </div>

          )}

          {/* Attendance */}
          <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/50 dark:border-white/10 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neutral-400" />
              <h3 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">Davomat tarixi</h3>
            </div>
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800 max-h-80 overflow-y-auto">
              {student.attendance?.length === 0 && (
                <p className="text-[12px] text-neutral-400 p-4 text-center">Davomat yo'q</p>
              )}
              {student.attendance?.map((a: any) => {
                const cfg = ATTEND_CFG[a.status];
                return (
                  <div key={a.id} className="flex items-center justify-between px-5 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full shrink-0", cfg?.dot ?? "bg-neutral-300")} />
                      <p className="text-[13px] text-neutral-700 dark:text-neutral-300">
                        {new Date(a.date).toLocaleDateString("uz-UZ")}
                      </p>
                    </div>
                    <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-semibold", cfg?.cls)}>
                      {cfg?.label ?? a.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Gamifikatsiya kartasi ────────────────────────────────────────────────────

/**
 * O'quvchining ball holati.
 *
 * `GET /api/students/:id` javobida `xpTotal`, `coinBalance`, `streak`,
 * `referralCode` allaqachon bor edi — sahifa ularni umuman chizmasdi.
 * Gamifikatsiya markazda o'chiq bo'lsa blok ko'rsatilmaydi.
 */
function StudentPointsCard({ student }: { student: any }) {
  const { data: cfg } = useGamificationSettings();
  const { data: history } = useStudentPointHistory(cfg?.active ? student.id : undefined);

  if (!cfg?.active) return null;

  const level = levelFromXp(student.xpTotal ?? 0);

  return (
    <div className="glass-panel border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/50 dark:border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center">
            <Trophy className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">Gamifikatsiya</h3>
        </div>
        {student.referralCode && (
          <span className="text-[11px] font-black tracking-widest text-neutral-500 dark:text-neutral-400">
            {student.referralCode}
          </span>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <PointStat value={`${level.level}`} label={level.name} cls="text-indigo-600 dark:text-indigo-400" />
          <PointStat value={String(student.xpTotal ?? 0)} label="Jami XP" cls="text-neutral-900 dark:text-neutral-100" />
          <PointStat value={`${cfg.coinIcon} ${student.coinBalance ?? 0}`} label={`${cfg.coinName} balansi`} cls="text-amber-600 dark:text-amber-400" />
          <PointStat value={String(student.streak ?? 0)} label="Ketma-ket dars" cls="text-orange-500" />
        </div>

        {level.nextXp != null && (
          <div>
            <div className="h-1.5 rounded-full bg-neutral-200/70 dark:bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                style={{ width: `${level.progress}%` }} />
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              Keyingi darajagacha {level.nextXp - (student.xpTotal ?? 0)} XP
            </p>
          </div>
        )}

        {(history ?? []).length > 0 && (
          <div className="pt-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">So&apos;nggi ballar</p>
            <div className="space-y-1">
              {(history ?? []).slice(0, 5).map(t => (
                <div key={t.id} className="flex items-center gap-2.5 text-[12px]">
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-lg font-semibold shrink-0",
                    REASON_COLORS[t.reason] ?? "bg-neutral-100 text-neutral-600")}>
                    {REASON_LABELS[t.reason] ?? t.reason}
                  </span>
                  <span className="text-neutral-400 flex-1 truncate">{t.note}</span>
                  <span className="text-neutral-400 shrink-0">{new Date(t.createdAt).toLocaleDateString("uz-UZ")}</span>
                  {t.coin !== 0 && (
                    <span className={cn("font-bold shrink-0 w-14 text-right",
                      t.coin > 0 ? "text-amber-600 dark:text-amber-400" : "text-red-500")}>
                      {t.coin > 0 ? "+" : ""}{t.coin} {cfg.coinIcon}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PointStat({ value, label, cls }: { value: string; label: string; cls: string }) {
  return (
    <div className="glass-soft rounded-xl p-3">
      <p className={cn("text-[16px] font-black leading-none", cls)}>{value}</p>
      <p className="text-[11px] text-neutral-400 mt-1 truncate">{label}</p>
    </div>
  );
}
