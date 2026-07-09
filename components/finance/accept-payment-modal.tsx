"use client";

import { useState, useEffect, useMemo } from "react";
import { mutate } from "swr";
import { CreditCard, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModalOverlay } from "@/components/ui/modal-overlay";
import { useStudents } from "@/lib/hooks/useStudents";
import { useBranch } from "@/lib/contexts/branch-context";
import { cn } from "@/lib/utils";

function formatCurrency(v: number) {
  return new Intl.NumberFormat("uz-UZ", {
    style: "currency",
    currency: "UZS",
    maximumFractionDigits: 0,
  }).format(v);
}

const METHOD_LABELS: Record<string, string> = {
  NAQD: "Naqd",
  KARTA: "Karta",
  CLICK: "Click",
  PAYME: "Payme",
};

type PayForm = {
  studentId: string;
  amount: string;
  method: string;
  note: string;
};

const EMPTY_FORM: PayForm = { studentId: "", amount: "", method: "NAQD", note: "" };

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
  const { activeBranchId } = useBranch();
  const { data: studentsRaw } = useStudents();

  const [payForm, setPayForm] = useState<PayForm>(EMPTY_FORM);
  const [payFormErr, setPayFormErr] = useState("");
  const [saving, setSaving] = useState(false);

  const allStudents: any[] = Array.isArray(studentsRaw) ? studentsRaw : [];

  const students = useMemo(() => {
    if (!activeBranchId) return allStudents;
    return allStudents.filter(s =>
      s.groups?.some((sg: any) => {
        const g = sg.group;
        if (!g) return false;
        if (g.branchId === activeBranchId) return true;
        if (!g.branchId && g.room?.branchId === activeBranchId) return true;
        return false;
      }),
    );
  }, [allStudents, activeBranchId]);

  useEffect(() => {
    if (!open) return;
    setPayForm({
      ...EMPTY_FORM,
      studentId: defaultStudentId ?? "",
    });
    setPayFormErr("");
  }, [open, defaultStudentId]);

  const selectedStudent = students.find(s => s.id === payForm.studentId);

  function handleClose() {
    setPayForm(EMPTY_FORM);
    setPayFormErr("");
    onClose();
  }

  async function submitPayment() {
    if (!payForm.studentId) { setPayFormErr("O'quvchini tanlang"); return; }
    if (!payForm.amount || Number(payForm.amount) <= 0) { setPayFormErr("Summani kiriting"); return; }
    setPayFormErr("");
    setSaving(true);
    try {
      const student = students.find(s => s.id === payForm.studentId) ?? selectedStudent;
      const groupId = student?.groups?.[0]?.groupId;
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
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full h-full flex flex-col overflow-hidden border border-neutral-200/60 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <CreditCard className="w-5 h-5 text-neutral-500 shrink-0" />
            <h2 className="font-bold text-[15px] text-neutral-900 dark:text-neutral-100 truncate">
              To&apos;lov qabul qilish
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors shrink-0"
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
              className="w-full h-10 sm:h-9 px-3 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none"
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
                  : "bg-neutral-50 dark:bg-neutral-800",
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(["NAQD", "KARTA", "CLICK", "PAYME"] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPayForm(p => ({ ...p, method: m }))}
                  className={cn(
                    "py-2.5 sm:py-2 rounded-xl text-[12px] font-semibold border transition-colors",
                    payForm.method === m
                      ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900 dark:border-neutral-100"
                      : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800",
                  )}
                >
                  {METHOD_LABELS[m]}
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

        <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-3 border-t border-neutral-100 dark:border-neutral-800 shrink-0 flex flex-col-reverse sm:flex-row gap-2">
          <Button
            className="flex-1 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 h-10"
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
