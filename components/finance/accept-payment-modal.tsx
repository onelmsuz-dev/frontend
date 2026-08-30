"use client";

import { useState, useEffect } from "react";
import { mutate } from "swr";
import { CreditCard, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModalOverlay } from "@/components/ui/modal-overlay";
import { useStudents } from "@/lib/hooks/useStudents";
import { cn } from "@/lib/utils";
import { SELECTABLE_METHODS, methodGridCls } from "@/lib/payment-methods";

function formatCurrency(v: number) {
  return new Intl.NumberFormat("uz-UZ", {
    style: "currency",
    currency: "UZS",
    maximumFractionDigits: 0,
  }).format(v);
}



type Membership = {
  groupId: string;
  enrollmentStatus?: string;
  group?: { name?: string };
};

type PayForm = {
  studentId: string;
  groupId: string;
  amount: string;
  method: string;
  note: string;
};

const EMPTY_FORM: PayForm = { studentId: "", groupId: "", amount: "", method: "NAQD", note: "" };

type AcceptPaymentModalProps = {
  open: boolean;
  onClose: () => void;
  defaultStudentId?: string;
};

export function AcceptPaymentModal({
  open,
  onClose,
  defaultStudentId,
}: AcceptPaymentModalProps) {
  const { data: studentsRaw } = useStudents();

  const [payForm, setPayForm] = useState<PayForm>(EMPTY_FORM);
  const [payFormErr, setPayFormErr] = useState("");
  const [saving, setSaving] = useState(false);

  const allStudents: any[] = Array.isArray(studentsRaw) ? studentsRaw : [];

  // Filial bo'yicha filtr SERVERDA bajariladi (`useStudents` branchId yuboradi).
  // Bu yerda takroran filtrlash kerak emas edi va zarar ham qilardi: filtr
  // `group.branchId` / `room.branchId` maydonlariga qarardi, ular esa
  // o'quvchilar ro'yxati javobida umuman yo'q — natijada filial tanlanganda
  // modalda BITTA HAM o'quvchi ko'rinmasdi.
  const students = allStudents;

  useEffect(() => {
    if (!open) return;
    setPayForm({
      ...EMPTY_FORM,
      studentId: defaultStudentId ?? "",
    });
    setPayFormErr("");
  }, [open, defaultStudentId]);

  const selectedStudent = students.find(s => s.id === payForm.studentId);

  // To'lov QAYSI guruh uchun ekani — foizli o'qituvchi maoshi va kurs kesimidagi
  // tushum shunga qarab hisoblanadi. Ilgari `groups[0]` olinardi: o'quvchi
  // chiqib ketgan guruhga ham tushib ketishi mumkin edi.
  const payableGroups: Membership[] = (selectedStudent?.groups ?? []).filter(
    (sg: Membership) => sg.enrollmentStatus !== "CHIQIB_KETGAN",
  );

  // Tanlangan guruh — o'quvchi almashsa eski tanlov o'z-o'zidan bekor bo'ladi,
  // bitta a'zolik bo'lsa avtomatik o'sha tanlanadi (effekt kerak emas).
  const selectedGroupId =
    payableGroups.some(g => g.groupId === payForm.groupId)
      ? payForm.groupId
      : payableGroups.length === 1
        ? payableGroups[0].groupId
        : "";

  function handleClose() {
    setPayForm(EMPTY_FORM);
    setPayFormErr("");
    onClose();
  }

  async function submitPayment() {
    if (!payForm.studentId) { setPayFormErr("O'quvchini tanlang"); return; }
    if (!payForm.amount || Number(payForm.amount) <= 0) { setPayFormErr("Summani kiriting"); return; }
    if (payableGroups.length > 1 && !selectedGroupId) {
      setPayFormErr("Qaysi guruh uchun to'lov ekanini tanlang"); return;
    }
    setPayFormErr("");
    setSaving(true);
    try {
      const groupId = selectedGroupId || payableGroups[0]?.groupId;
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: payForm.studentId,
          amount: Number(payForm.amount),
          method: payForm.method,
          note: payForm.note || undefined,
          ...(groupId ? { groupId } : {}),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setPayFormErr(data.error ?? "Xatolik yuz berdi");
        return;
      }
      void mutate(key => typeof key === "string" && key.startsWith("/api/payments"));
      void mutate("/api/students");
      void mutate(key => typeof key === "string" && key.startsWith("/api/dashboard"));
      void mutate(key => typeof key === "string" && key.startsWith("/api/reports"));
      handleClose();
    } catch {
      setPayFormErr("Serverga ulanib bo'lmadi");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalOverlay open={open} onClose={handleClose}>
      <div className="glass-strong rounded-2xl shadow-2xl w-full h-full flex flex-col overflow-hidden border border-white/60 dark:border-white/10">
        <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-white/50 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <CreditCard className="w-5 h-5 text-neutral-500 shrink-0" />
            <h2 className="font-bold text-[15px] text-neutral-900 dark:text-neutral-100 truncate">
              To&apos;lov qabul qilish
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/60 dark:hover:bg-white/10 text-neutral-400 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 min-h-0">
          <div>
            <Label className="text-xs font-medium text-neutral-500 mb-1.5 block">O&apos;quvchi</Label>
            <select
              value={payForm.studentId}
              onChange={e => setPayForm(p => ({ ...p, studentId: e.target.value }))}
              className="w-full h-10 sm:h-9 px-3 text-sm rounded-lg border border-white/60 dark:border-white/10 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none"
            >
              <option value="">O&apos;quvchini tanlang...</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.groups?.[0]?.group?.name ?? "guruhsiz"}
                </option>
              ))}
            </select>
          </div>

          {selectedStudent && (
            <div
              className={cn(
                "rounded-xl p-3 text-sm",
                selectedStudent.balance < 0
                  ? "bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40"
                  : "glass-soft",
              )}
            >
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {selectedStudent.groups?.[0]?.group?.name ?? ""}
              </p>
              <p
                className={cn(
                  "font-bold mt-0.5",
                  selectedStudent.balance < 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-emerald-600 dark:text-emerald-400",
                )}
              >
                Balans: {formatCurrency(selectedStudent.balance)}
              </p>
            </div>
          )}

          {payableGroups.length > 1 && (
            <div>
              <Label className="text-xs font-medium text-neutral-500 mb-1.5 block">
                Qaysi guruh uchun
              </Label>
              <select
                value={selectedGroupId}
                onChange={e => setPayForm(p => ({ ...p, groupId: e.target.value }))}
                className="w-full h-10 sm:h-9 px-3 text-sm rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
              >
                <option value="">Tanlang…</option>
                {payableGroups.map(sg => (
                  <option key={sg.groupId} value={sg.groupId}>
                    {sg.group?.name ?? sg.groupId}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <Label className="text-xs font-medium text-neutral-500 mb-1.5 block">Summa (so&apos;m)</Label>
            <Input
              type="number"
              inputMode="numeric"
              placeholder="400000"
              value={payForm.amount}
              onChange={e => setPayForm(p => ({ ...p, amount: e.target.value }))}
              className="h-10 sm:h-9 text-sm"
            />
          </div>

          <div>
            <Label className="text-xs font-medium text-neutral-500 mb-2 block">To&apos;lov usuli</Label>
            {/* Ustunlar soni ro'yxat uzunligidan hisoblanadi — ilgari
                `grid-cols-4` qattiq yozilgan va aynan to'rtta usulga
                moslangandi. */}
            <div className={cn("grid gap-2", methodGridCls(SELECTABLE_METHODS.length))}>
              {SELECTABLE_METHODS.map(({ value: m, label }) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPayForm(p => ({ ...p, method: m }))}
                  className={cn(
                    "py-2.5 sm:py-2 rounded-xl text-[12px] font-semibold border transition-colors",
                    payForm.method === m
                      ? "bg-indigo-600 text-white dark:bg-indigo-500 border-neutral-900 dark:border-neutral-100"
                      : "border-white/60 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:bg-white/60 dark:hover:bg-white/10",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium text-neutral-500 mb-1.5 block">Izoh (ixtiyoriy)</Label>
            <Input
              placeholder="Masalan: Iyun oyi to'lovi"
              value={payForm.note}
              onChange={e => setPayForm(p => ({ ...p, note: e.target.value }))}
              className="h-10 sm:h-9 text-sm"
            />
          </div>

          {payFormErr && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-100 rounded-xl px-3 py-2.5">
              <X className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <p className="text-[12px] font-medium text-red-600 dark:text-red-400">{payFormErr}</p>
            </div>
          )}
        </div>

        <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-3 border-t border-white/50 dark:border-white/10 shrink-0 flex flex-col-reverse sm:flex-row gap-2">
          <Button
 className="flex-1 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 h-10"
            disabled={saving}
            onClick={submitPayment}
          >
            {saving ? "Saqlanmoqda..." : "To'lovni qabul qilish"}
          </Button>
          <Button variant="outline" className="h-10 sm:px-4" onClick={handleClose}>
            Bekor
          </Button>
        </div>
      </div>
    </ModalOverlay>
  );
}
